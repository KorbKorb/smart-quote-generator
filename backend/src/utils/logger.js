// Simple logger utility
const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue'
};

// Create logger instance
const logger = winston.createLogger({
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'smart-quote-backend' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error' 
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log') 
    })
  ]
});

// Add colors to winston
winston.addColors(colors);

// If we're not in production, log to the console with more detail
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...rest }) => {
        return `${timestamp} [${level}]: ${message} ${
          Object.keys(rest).length ? JSON.stringify(rest, null, 2) : ''
        }`;
      })
    )
  }));
}

// Create a simple logger object for easier use
const simpleLogger = {
  error: (message, meta) => logger.error(message, meta),
  warn: (message, meta) => logger.warn(message, meta),
  info: (message, meta) => logger.info(message, meta),
  debug: (message, meta) => logger.debug(message, meta)
};

// Fallback logger if winston is not installed
const fallbackLogger = {
  error: console.error,
  warn: console.warn,
  info: console.log,
  debug: console.debug
};

// Export logger (use fallback if winston is not available)
module.exports = typeof winston !== 'undefined' ? simpleLogger : fallbackLogger;