const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Validate environment variables
const validateEnv = require('./src/config/validateEnv');
validateEnv();

// Import security middleware
const { rateLimiters, severeAbuseLimiter } = require('./src/middleware/rateLimiter');
const logger = require('./src/utils/logger');

// Create Express app
const app = express();

// Trust proxy (for Railway/production)
app.set('trust proxy', 1);

// Security middleware - MUST be first
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // For PDF generation
}));

// Apply severe abuse limiter to all routes
app.use(severeAbuseLimiter);

// Compression
app.use(compression());

// Health check BEFORE any async operations
app.get('/api/health', (req, res) => {
  const health = {
    status: 'OK',
    message: 'Smart Quote Generator API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  };
  res.json(health);
});

// Root path
app.get('/', (req, res) => {
  res.json({ 
    message: 'Smart Quote Generator Backend', 
    health: '/api/health',
    version: '1.0.0'
  });
});

// Import routes
const customerAuthRoutes = require('./routes/customerAuth');
const customerApiRoutes = require('./routes/customerApi');
const adminQuotesRoutes = require('./routes/adminQuotes');
const packageQuotesRoutes = require('./routes/packageQuotes');

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
      process.env.PRODUCTION_FRONTEND_URL,
      /^https:\/\/.*\.amplifyapp\.com$/
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // Cache preflight for 24 hours
};

// Apply CORS
app.use(cors(corsOptions));

// Body parsing middleware with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB query sanitization
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn(`Sanitized potentially malicious data in ${key}`);
  }
}));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Apply rate limiting to routes
app.use('/api/auth', rateLimiters.auth);
app.use('/api/quotes/calculate', rateLimiters.quoteCalculation);
app.use('/api/quotes/analyze-dxf', rateLimiters.fileUpload);
app.use('/api/quotes/:id/send-email', rateLimiters.email);
app.use('/api/quotes/:id/pdf', rateLimiters.pdfGeneration);
app.use('/api', rateLimiters.general); // General rate limit for all other routes

// Routes
app.use('/api/auth/customer', customerAuthRoutes);
app.use('/api/customer', customerApiRoutes);
app.use('/api/quotes', adminQuotesRoutes);
app.use('/api/package-quotes', packageQuotesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(400).json({
      status: 'error',
      message: 'Duplicate entry'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database connection with retry logic
const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
      });
      logger.info('Connected to MongoDB');
      break;
    } catch (err) {
      retries++;
      logger.error(`MongoDB connection attempt ${retries} failed:`, err.message);
      
      if (retries === maxRetries) {
        logger.error('Max retries reached. Could not connect to MongoDB');
        // Don't exit - let the app run for health checks
      } else {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
};

// Start server
const PORT = process.env.PORT || 3002;
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Health check: http://localhost:${PORT}/api/health`);
  
  // Connect to MongoDB after server starts
  connectDB();
});

// MongoDB event handlers
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});