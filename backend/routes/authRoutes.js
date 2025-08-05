const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  refreshToken, 
  logoutUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  googleAuth,
  googleCallback
} = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public (with refresh token)
router.post('/refresh', refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user / clear cookie
// @access  Private
router.post('/logout', logoutUser);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public (with token)
router.post('/reset-password', resetPassword);

// @route   GET /api/auth/verify-email
// @desc    Verify email address
// @access  Public (with token)
router.get('/verify-email', verifyEmail);

// @route   GET /api/auth/google
// @desc    Google OAuth login
// @access  Public
router.get('/google', googleAuth);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', googleCallback);

module.exports = router;