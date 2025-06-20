// Simple error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;