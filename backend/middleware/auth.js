const jwt = require('jsonwebtoken');

// Customer authentication middleware
const customerAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_CUSTOMER || 'customer-secret-key'
    );

    // Ensure this is a customer token
    if (decoded.type !== 'customer') {
      throw new Error();
    }

    req.customerId = decoded.id;
    req.token = token;
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Please authenticate as a customer',
    });
  }
};

// Admin authentication middleware (for existing admin panel)
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'admin-secret-key'
    );

    // Ensure this is an admin token
    if (decoded.type !== 'admin') {
      throw new Error();
    }

    req.adminId = decoded.id;
    req.token = token;
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Please authenticate as an admin',
    });
  }
};

module.exports = {
  customerAuth,
  adminAuth,
};