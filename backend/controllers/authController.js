const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  const tokenId = Math.random().toString(36).substring(2, 15);
  return {
    token: jwt.sign({ id, tokenId }, process.env.JWT_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
    }),
    tokenId,
  };
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    email,
    password: hashedPassword,
    profile: {
      firstName,
      lastName,
    },
  });

  if (user) {
    // Generate tokens
    const accessToken = generateToken(user._id);
    const { token: refreshToken, tokenId } = generateRefreshToken(user._id);

    // Save refresh token ID to user
    user.refreshTokens = [{ tokenId, createdAt: new Date() }];
    await user.save();

    res.status(201).json({
      _id: user._id,
      email: user.email,
      profile: user.profile,
      accessToken,
      refreshToken,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    // Generate tokens
    const accessToken = generateToken(user._id);
    const { token: refreshToken, tokenId } = generateRefreshToken(user._id);

    // Save refresh token ID to user
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({ tokenId, createdAt: new Date() });
    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      _id: user._id,
      email: user.email,
      profile: user.profile,
      accessToken,
      refreshToken,
    });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (with refresh token)
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400);
    throw new Error('Refresh token is required');
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const { id, tokenId } = decoded;

    // Find user
    const user = await User.findById(id);

    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    // Check if refresh token is valid
    const validToken = user.refreshTokens.find(
      (token) => token.tokenId === tokenId
    );

    if (!validToken) {
      res.status(401);
      throw new Error('Invalid refresh token');
    }

    // Generate new access token
    const accessToken = generateToken(user._id);

    res.json({
      accessToken,
    });
  } catch (error) {
    res.status(401);
    throw new Error('Invalid refresh token');
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400);
    throw new Error('Refresh token is required');
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const { id, tokenId } = decoded;

    // Find user
    const user = await User.findById(id);

    if (!user) {
      res.status(200).json({ message: 'Logged out successfully' });
      return;
    }

    // Remove refresh token
    user.refreshTokens = user.refreshTokens.filter(
      (token) => token.tokenId !== tokenId
    );
    await user.save();

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    // Even if token is invalid, we consider it a successful logout
    res.status(200).json({ message: 'Logged out successfully' });
  }
});

// @desc    Send password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  // Find user
  const user = await User.findOne({ email });

  if (!user) {
    // For security reasons, don't reveal that the user doesn't exist
    res.status(200).json({
      message: 'If your email is registered, you will receive a password reset link',
    });
    return;
  }

  // Generate reset token
  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  // In a real application, send email with reset link
  // For now, just return the token
  res.status(200).json({
    message: 'If your email is registered, you will receive a password reset link',
    // Only for development
    resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public (with token)
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400);
    throw new Error('Token and password are required');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = decoded;

    // Find user
    const user = await User.findById(id);

    if (!user) {
      res.status(400);
      throw new Error('Invalid token');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password
    user.password = hashedPassword;
    // Clear refresh tokens for security
    user.refreshTokens = [];
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(400);
    throw new Error('Invalid or expired token');
  }
});

// @desc    Verify email address
// @route   GET /api/auth/verify-email
// @access  Public (with token)
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    res.status(400);
    throw new Error('Token is required');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = decoded;

    // Find user
    const user = await User.findById(id);

    if (!user) {
      res.status(400);
      throw new Error('Invalid token');
    }

    // Mark email as verified
    user.isEmailVerified = true;
    await user.save();

    // In a real application, redirect to frontend
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(400);
    throw new Error('Invalid or expired token');
  }
});

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
};