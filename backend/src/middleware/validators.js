const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Validation failed',
      errors: errors.array() 
    });
  }
  next();
};

// Quote validators
const quoteValidators = {
  // Calculate quote - supports both old and new formats
  calculateQuote: [
    body().custom((value, { req }) => {
      // Check if it's old format (items array)
      if (req.body.items && Array.isArray(req.body.items)) {
        // Validate items array
        if (req.body.items.length === 0) {
          throw new Error('At least one item is required');
        }
        
        // Validate each item
        req.body.items.forEach((item, index) => {
          if (!item.material) {
            throw new Error(`Item ${index + 1}: Material is required`);
          }
          
          // Valid materials in both formats
          const validMaterials = [
            // New format (lowercase with hyphens)
            'cold-rolled-steel', 'stainless-304', 'stainless-316', 'aluminum-6061',
            // Old format (title case)
            'Cold Rolled Steel', 'Stainless Steel 304', 'Stainless Steel 316', 'Aluminum 6061'
          ];
          
          if (!validMaterials.includes(item.material)) {
            throw new Error(`Item ${index + 1}: Invalid material type '${item.material}'`);
          }
          
          if (!item.thickness || item.thickness < 0.0625 || item.thickness > 2) {
            throw new Error(`Item ${index + 1}: Thickness must be between 0.0625 and 2 inches`);
          }
          if (!item.quantity || item.quantity < 1 || item.quantity > 10000) {
            throw new Error(`Item ${index + 1}: Quantity must be between 1 and 10000`);
          }
        });
        
        return true;
      }
      
      // Otherwise, it should be new format - check required fields
      if (!req.body.material || !req.body.thickness || !req.body.quantity) {
        // If none of the required fields exist, it's likely an invalid request
        if (!req.body.items) {
          throw new Error('Invalid request format. Either provide items array or direct quote parameters');
        }
      }
      
      return true;
    }),
    
    // New format validations (only applied if not using items array)
    body('material')
      .if(body('items').not().exists())
      .notEmpty().withMessage('Material is required')
      .isIn(['cold-rolled-steel', 'stainless-304', 'stainless-316', 'aluminum-6061'])
      .withMessage('Invalid material type'),
    
    body('thickness')
      .if(body('items').not().exists())
      .notEmpty().withMessage('Thickness is required')
      .isFloat({ min: 0.0625, max: 2 })
      .withMessage('Thickness must be between 0.0625 and 2 inches'),
    
    body('quantity')
      .if(body('items').not().exists())
      .notEmpty().withMessage('Quantity is required')
      .isInt({ min: 1, max: 10000 })
      .withMessage('Quantity must be between 1 and 10000'),
    
    body('finishType')
      .optional()
      .isIn(['none', 'powder-coat', 'anodize', 'zinc-plate'])
      .withMessage('Invalid finish type'),
    
    body('urgency')
      .optional()
      .isIn(['standard', 'rush', 'emergency'])
      .withMessage('Invalid urgency level'),
    
    body('toleranceLevel')
      .optional()
      .isIn(['standard', 'precision', 'tight'])
      .withMessage('Invalid tolerance level'),
    
    // Manual dimensions (when no DXF)
    body('manualLength')
      .optional()
      .isFloat({ min: 0.1, max: 1000 })
      .withMessage('Length must be between 0.1 and 1000 inches'),
    
    body('manualWidth')
      .optional()
      .isFloat({ min: 0.1, max: 1000 })
      .withMessage('Width must be between 0.1 and 1000 inches'),
    
    body('manualHoles')
      .optional()
      .isInt({ min: 0, max: 1000 })
      .withMessage('Holes must be between 0 and 1000'),
    
    body('manualBends')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Bends must be between 0 and 100')
  ],

  createQuote: [
    body('customer')
      .notEmpty().withMessage('Customer information is required')
      .isObject().withMessage('Customer must be an object'),
    
    body('customer.name')
      .notEmpty().withMessage('Customer name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Customer name must be between 2 and 100 characters'),
    
    body('customer.email')
      .notEmpty().withMessage('Customer email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('customer.phone')
      .optional()
      .matches(/^[\d\s\-\+\(\)]+$/)
      .withMessage('Invalid phone number format'),
    
    body('customer.company')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Company name too long'),
    
    body('items')
      .notEmpty().withMessage('Quote items are required')
      .isArray({ min: 1 }).withMessage('At least one item is required'),
    
    body('items.*.material')
      .notEmpty().withMessage('Item material is required'),
    
    body('items.*.quantity')
      .isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
    
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters')
      .trim()
      .escape() // Sanitize HTML
  ],

  updateQuoteStatus: [
    param('id')
      .isMongoId().withMessage('Invalid quote ID'),
    
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['draft', 'sent', 'accepted', 'rejected', 'expired'])
      .withMessage('Invalid status value')
  ],

  getQuotes: [
    query('status')
      .optional()
      .isIn(['draft', 'sent', 'accepted', 'rejected', 'expired'])
      .withMessage('Invalid status filter'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be positive'),
    
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be positive'),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format')
  ],

  quoteId: [
    param('id')
      .isMongoId().withMessage('Invalid quote ID format')
  ]
};

// File upload validators
const fileValidators = {
  dxfUpload: [
    // File validation is handled by multer, but we can add additional checks
    body('file').custom((value, { req }) => {
      if (!req.file) {
        throw new Error('DXF file is required');
      }
      
      // Check file size (10MB limit)
      if (req.file.size > 10 * 1024 * 1024) {
        throw new Error('File size must not exceed 10MB');
      }
      
      // Check file extension
      if (!req.file.originalname.toLowerCase().endsWith('.dxf')) {
        throw new Error('Only DXF files are allowed');
      }
      
      return true;
    })
  ]
};

// Authentication validators
const authValidators = {
  register: [
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    
    body('name')
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .trim()
  ],

  login: [
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required')
  ]
};

// Sanitization helpers
const sanitizers = {
  // Remove any script tags or dangerous HTML
  sanitizeHTML: (value) => {
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },

  // Sanitize filename
  sanitizeFilename: (filename) => {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .substring(0, 255);
  }
};

module.exports = {
  validate,
  quoteValidators,
  fileValidators,
  authValidators,
  sanitizers
};