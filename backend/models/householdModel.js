const mongoose = require('mongoose');

const householdSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a household name'],
      trim: true,
    },
    adminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['member', 'co-admin'],
          default: 'member',
        },
        permissions: {
          type: [String],
          enum: [
            'edit_lists',
            'view_lists',
            'edit_inventory',
            'view_inventory',
            'invite_members',
            'remove_members',
          ],
          default: ['edit_lists', 'view_lists', 'view_inventory'],
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    settings: {
      defaultGroceryStore: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
      },
      budgetLimit: {
        type: Number,
        default: 0,
      },
      budgetPeriod: {
        type: String,
        enum: ['weekly', 'monthly'],
        default: 'monthly',
      },
      dietaryRestrictions: {
        type: [String],
        default: [],
      },
      lowStockThreshold: {
        type: Number,
        default: 2,
      },
    },
    invitations: [
      {
        email: String,
        token: String,
        expiresAt: Date,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
householdSchema.index({ adminUserId: 1 });
householdSchema.index({ 'members.userId': 1 });

module.exports = mongoose.model('Household', householdSchema);