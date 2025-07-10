const rateLimit = require('express-rate-limit');

// Create different rate limiters for different endpoints
const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes default
    max: options.max || 100,
    message: options.message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Store in memory (use Redis for production)
    // store: new RedisStore({ client: redis })
  });
};

// Different rate limits for different operations
const rateLimiters = {
  // General API limit - 100 requests per 15 minutes
  general: createRateLimiter({
    max: 100,
    message: 'Too many API requests, please try again later.'
  }),

  // Quote calculation - 30 per 15 minutes (prevent abuse of expensive calculations)
  quoteCalculation: createRateLimiter({
    max: 30,
    message: 'Too many quote calculations, please try again later.'
  }),

  // DXF upload - 10 per 15 minutes (file processing is expensive)
  fileUpload: createRateLimiter({
    max: 10,
    message: 'Too many file uploads, please try again later.'
  }),

  // Authentication - 5 attempts per 15 minutes
  auth: createRateLimiter({
    max: 5,
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true // Don't count successful logins
  }),

  // Email sending - 5 per hour
  email: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Too many email requests, please try again later.'
  }),

  // PDF generation - 20 per hour
  pdfGeneration: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: 'Too many PDF generation requests, please try again later.'
  })
};

// IP-based blocking for severe abuse
const severeAbuseLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1000, // 1000 requests per day max
  message: 'Your IP has been temporarily blocked due to excessive requests.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // Log severe abuse
    console.error(`Severe abuse detected from IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      message: 'Your IP has been temporarily blocked due to excessive requests. Please contact support if you believe this is an error.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

module.exports = {
  rateLimiters,
  severeAbuseLimiter
};