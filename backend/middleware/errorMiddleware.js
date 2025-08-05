const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode ? res.statusCode : 500;
  let errorCode = 'SERVER_ERROR';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
  } else if (err.code === 11000) { // MongoDB duplicate key error
    statusCode = 409;
    errorCode = 'DUPLICATE_ERROR';
  }

  res.status(statusCode);

  res.json({
    error: {
      code: err.code || errorCode,
      message: err.message,
      details: err.details || null,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'req_' + Math.random().toString(36).substring(2, 15)
    },
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = { errorHandler };