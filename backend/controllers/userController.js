const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Household = require('../models/householdModel');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -refreshTokens');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // Update basic profile info
    if (req.body.email) {
      // Check if email is already in use by another user
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists && emailExists._id.toString() !== req.user._id.toString()) {
        res.status(400);
        throw new Error('Email already in use');
      }
      user.email = req.body.email;
    }

    // Update profile fields
    if (req.body.profile) {
      user.profile = {
        ...user.profile,
        ...req.body.profile,
      };
    }

    // Update password if provided
    if (req.body.password) {
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      email: updatedUser.email,
      profile: updatedUser.profile,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user preferences
// @route   GET /api/users/preferences
// @access  Private
const getUserPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('preferences');

  if (user) {
    res.json(user.preferences);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
const updateUserPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.preferences = {
      ...user.preferences,
      ...req.body,
    };

    const updatedUser = await user.save();

    res.json(updatedUser.preferences);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
const deleteUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // Check if user is an admin of any household
    const adminHouseholds = await Household.find({ adminUserId: user._id });
    
    if (adminHouseholds.length > 0) {
      res.status(400);
      throw new Error('You are an admin of one or more households. Please transfer ownership or delete the households first.');
    }

    // Remove user from any households they're a member of
    await Household.updateMany(
      { 'members.userId': user._id },
      { $pull: { members: { userId: user._id } } }
    );

    // Soft delete the user (mark as inactive)
    user.isActive = false;
    await user.save();

    // For a hard delete, uncomment the following line
    // await user.remove();

    res.json({ message: 'User account deleted' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get household info
// @route   GET /api/users/household
// @access  Private
const getHouseholdInfo = asyncHandler(async (req, res) => {
  // Find households where user is either admin or member
  const households = await Household.find({
    $or: [
      { adminUserId: req.user._id },
      { 'members.userId': req.user._id }
    ]
  });

  res.json(households);
});

// @desc    Invite household member
// @route   POST /api/users/invite
// @access  Private
const inviteHouseholdMember = asyncHandler(async (req, res) => {
  const { householdId, email, permissions } = req.body;

  if (!householdId || !email) {
    res.status(400);
    throw new Error('Household ID and email are required');
  }

  // Find the household
  const household = await Household.findById(householdId);

  if (!household) {
    res.status(404);
    throw new Error('Household not found');
  }

  // Check if user is admin or has invite permissions
  const isAdmin = household.adminUserId.toString() === req.user._id.toString();
  const isMemberWithPermission = household.members.some(
    (member) =>
      member.userId.toString() === req.user._id.toString() &&
      member.permissions.includes('invite_members')
  );

  if (!isAdmin && !isMemberWithPermission) {
    res.status(403);
    throw new Error('Not authorized to invite members to this household');
  }

  // Check if user with email exists
  const invitedUser = await User.findOne({ email });

  if (!invitedUser) {
    res.status(404);
    throw new Error('User with this email not found');
  }

  // Check if user is already a member
  const isAlreadyMember = household.members.some(
    (member) => member.userId.toString() === invitedUser._id.toString()
  );

  if (isAlreadyMember || household.adminUserId.toString() === invitedUser._id.toString()) {
    res.status(400);
    throw new Error('User is already a member of this household');
  }

  // Add user to household
  household.members.push({
    userId: invitedUser._id,
    role: 'member',
    permissions: permissions || ['edit_lists'],
    joinedAt: new Date(),
  });

  await household.save();

  res.status(201).json({
    message: `${invitedUser.profile.firstName} ${invitedUser.profile.lastName} has been added to the household`,
  });
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  deleteUserAccount,
  getHouseholdInfo,
  inviteHouseholdMember,
};