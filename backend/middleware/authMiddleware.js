const asyncHandler = require('express-async-handler');

// Simplified middleware that always authorizes with a default user
const protect = asyncHandler(async (req, res, next) => {
  // Set a default user for all requests
  req.user = {
    _id: '1',
    name: 'Default User',
    email: 'user@example.com',
    isActive: true,
    role: 'user'
  };

      next();
});

// Simplified admin middleware that always authorizes
const admin = (req, res, next) => {
  // Set admin role for the default user
  req.user.role = 'admin';
  next();
};

module.exports = { protect, admin };