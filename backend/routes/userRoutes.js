const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  deleteUserAccount,
  getHouseholdInfo,
  inviteHouseholdMember
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// All routes in this file are protected
router.use(protect);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', updateUserProfile);

// @route   GET /api/users/preferences
// @desc    Get user preferences
// @access  Private
router.get('/preferences', getUserPreferences);

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', updateUserPreferences);

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', deleteUserAccount);

// @route   GET /api/users/household
// @desc    Get household info
// @access  Private
router.get('/household', getHouseholdInfo);

// @route   POST /api/users/invite
// @desc    Invite household member
// @access  Private
router.post('/invite', inviteHouseholdMember);

module.exports = router;