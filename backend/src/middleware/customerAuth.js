// backend/src/middleware/customerAuth.js
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
const generateToken = (customerId) => {
  return jwt.sign(
    { id: customerId, type: 'customer' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify JWT token middleware
const authenticateCustomer = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ensure it's a customer token
    if (decoded.type !== 'customer') {
      throw new Error();
    }

    const customer = await Customer.findOne({
      _id: decoded.id,
      status: 'active'
    }).select('-password');

    if (!customer) {
      throw new Error();
    }

    // Check if account is locked
    if (customer.isLocked) {
      return res.status(423).json({
        error: 'Account is locked due to too many failed login attempts'
      });
    }

    req.customer = customer;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded.type === 'customer') {
        const customer = await Customer.findOne({
          _id: decoded.id,
          status: 'active'
        }).select('-password');

        if (customer && !customer.isLocked) {
          req.customer = customer;
          req.token = token;
        }
      }
    }
  } catch (error) {
    // Silent fail - continue without authentication
  }
  
  next();
};

module.exports = {
  generateToken,
  authenticateCustomer,
  optionalAuth,
  JWT_SECRET
};
