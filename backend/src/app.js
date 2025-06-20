// Smart Quote Generator - Express Server
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Create Express app
const app = express();

// Import utilities
const logger = require('./utils/logger');

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Import and use routes (with error handling for missing files)
try {
  const quoteRoutes = require('./routes/quotes');
  app.use('/api/quotes', quoteRoutes);
} catch (error) {
  logger.warn('Quotes routes not found, using placeholder');
  app.use('/api/quotes', (req, res) => {
    res.json({ message: 'Quotes endpoint placeholder' });
  });
}

try {
  const fileRoutes = require('./routes/files');
  app.use('/api/files', fileRoutes);
} catch (error) {
  logger.warn('Files routes not found, using placeholder');
  app.use('/api/files', (req, res) => {
    res.json({ message: 'Files endpoint placeholder' });
  });
}

try {
  const materialRoutes = require('./routes/materials');
  app.use('/api/materials', materialRoutes);
} catch (error) {
  logger.warn('Materials routes not found, using placeholder');
  app.use('/api/materials', (req, res) => {
    res.json({ message: 'Materials endpoint placeholder' });
  });
}

try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
} catch (error) {
  logger.warn('Auth routes not found, using placeholder');
  app.use('/api/auth', (req, res) => {
    res.json({ message: 'Auth endpoint placeholder' });
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// MongoDB connection
const connectDB = async () => {
  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL !== 'mongodb://localhost:27017/smart-quote') {
      await mongoose.connect(process.env.DATABASE_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      logger.info('MongoDB connected successfully');
    } else {
      logger.warn('MongoDB connection skipped - no DATABASE_URL configured or using default localhost');
    }
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    // Don't exit, just warn
    logger.warn('Server starting without database connection');
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

// Initialize server
startServer();

module.exports = app;