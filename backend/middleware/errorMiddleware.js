const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;

  res.status(statusCode);

  res.json({
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message,
      details: err.details || null,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'req_' + Math.random().toString(36).substring(2, 15)
    },
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = { errorHandler };