const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
// In production (Railway), environment variables are already set
// Only load .env file in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Create Express app
const app = express();

// IMPORTANT: Health check MUST be before any async operations
// This ensures Railway can check if the app is running
app.get('/api/health', (req, res) => {
  const health = {
    status: 'OK',
    message: 'Smart Quote Generator API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.json(health);
});

// Also respond to root path for Railway
app.get('/', (req, res) => {
  res.json({ 
    message: 'Smart Quote Generator Backend', 
    health: '/api/health',
    docs: 'API documentation coming soon'
  });
});

// Import routes after health check
const customerAuthRoutes = require('./routes/customerAuth');
const customerApiRoutes = require('./routes/customerApi');
const adminQuotesRoutes = require('./routes/adminQuotes');
const packageQuotesRoutes = require('./routes/packageQuotes');

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
      // Add Amplify URL when you get it
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
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/auth/customer', customerAuthRoutes);
app.use('/api/customer', customerApiRoutes);
app.use('/api/quotes', adminQuotesRoutes); // Admin quotes routes
app.use('/api/package-quotes', packageQuotesRoutes); // Package quotes routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server FIRST, then connect to MongoDB
// This ensures Railway can detect the app is running
const PORT = process.env.PORT || 3002;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  
  // Connect to MongoDB AFTER server starts
  console.log('Connecting to MongoDB...');
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Don't exit - let the app run even if DB is down temporarily
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});