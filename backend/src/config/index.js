// MERGED index.js with security enhancements
// Load and validate environment first
require('dotenv').config();
const config = require('./config'); // This uses our new env.validator.js

const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// ============================================
// SECURITY MIDDLEWARE (New - Add these first!)
// ============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration (Enhanced version)
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting (New)
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP',
});
app.use('/api/', limiter);

// ============================================
// EXISTING MIDDLEWARE (Keep your current ones)
// ============================================
app.use(express.json({ limit: '10mb' })); // Add limit for file uploads
app.use(express.urlencoded({ extended: true }));

// ============================================
// HEALTH CHECK (New - Add before routes)
// ============================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: config.env,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// YOUR EXISTING ROUTES (Keep all of these!)
// ============================================
// Add any middleware that needs to run before routes here
// For example: app.use(authMiddleware) if you have auth

// Your API routes - keep these exactly as they are
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/users', require('./routes/users'));
// Add any other routes you have...

// ============================================
// ERROR HANDLING (New - Add after routes)
// ============================================
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: config.env === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(config.env === 'development' && { stack: err.stack })
  });
});

// ============================================
// DATABASE CONNECTION (Enhanced version)
// ============================================
const connectDB = async () => {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Retry after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// ============================================
// SERVER STARTUP (Enhanced version)
// ======================