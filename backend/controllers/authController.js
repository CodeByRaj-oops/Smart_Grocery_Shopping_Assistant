const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const crypto = require('crypto');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    res.status(400);
    throw new Error('Please provide all required fields');
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
      householdSize: 1,
    },
  });

  if (user) {
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Save refresh token to user
    const tokenId = crypto.randomBytes(16).toString('hex');
    user.refreshTokens.push({
      tokenId,
      createdAt: new Date(),
    });
    await user.save();

    res.status(201).json({
      _id: user._id,
      email: user.email,
      profile: user.profile,
      token: accessToken,
      refreshToken: refreshToken,
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

  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    res.status(401);
    throw new Error('Account is deactivated');
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);
  
  // Save refresh token to user
  const tokenId = crypto.randomBytes(16).toString('hex');
  user.refreshTokens.push({
    tokenId,
    createdAt: new Date(),
  });
  
  // Update last login
  user.lastLoginAt = Date.now();
  await user.save();

  res.json({
    _id: user._id,
    email: user.email,
    profile: user.profile,
    token: accessToken,
    refreshToken: refreshToken,
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400);
    throw new Error('Refresh token is required');
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      res.status(401);
      throw new Error('Invalid refresh token');
    }
    
    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(token => token.tokenId === decoded.tokenId);
    
    if (!tokenExists) {
      res.status(401);
      throw new Error('Invalid refresh token');
    }
    
    // Generate new tokens
    const tokens = generateTokens(user._id);
    
    // Remove old refresh token
    user.refreshTokens = user.refreshTokens.filter(token => token.tokenId !== decoded.tokenId);
    
    // Add new refresh token
    const tokenId = crypto.randomBytes(16).toString('hex');
    user.refreshTokens.push({
      tokenId,
      createdAt: new Date(),
    });
    
    await user.save();
    
    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    res.status(401);
    throw new Error('Invalid refresh token');
  }
});

// @desc    Logout user / clear refresh token
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
    
    // Find user
    const user = await User.findById(decoded.id);
    
    if (user) {
      // Remove refresh token
      user.refreshTokens = user.refreshTokens.filter(token => token.tokenId !== decoded.tokenId);
      await user.save();
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    // Even if token is invalid, we consider the logout successful
    res.json({ message: 'Logged out successfully' });
  }
});

// Generate JWT tokens
const generateTokens = (userId) => {
  // Generate token ID for refresh token
  const tokenId = crypto.randomBytes(16).toString('hex');
  
  // Generate access token
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
  
  // Generate refresh token
  const refreshToken = jwt.sign(
    { id: userId, tokenId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
  );
  
  return { accessToken, refreshToken };
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
};