const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    profile: {
      firstName: {
        type: String,
        required: [true, 'Please add a first name'],
        trim: true,
      },
      lastName: {
        type: String,
        required: [true, 'Please add a last name'],
        trim: true,
      },
      householdSize: {
        type: Number,
        default: 1,
      },
      dietaryPreferences: {
        type: [String],
        default: [],
      },
      budgetRange: {
        min: {
          type: Number,
          default: 0,
        },
        max: {
          type: Number,
          default: 0,
        },
      },
      primaryStores: {
        type: [String],
        default: [],
      },
    },
    preferences: {
      notifications: {
        lowStock: {
          type: Boolean,
          default: true,
        },
        expiry: {
          type: Boolean,
          default: true,
        },
        deals: {
          type: Boolean,
          default: true,
        },
      },
      measurementUnit: {
        type: String,
        enum: ['metric', 'imperial'],
        default: 'metric',
      },
    },
    loyaltyPrograms: [
      {
        storeId: String,
        programId: String,
        accountNumber: String,
        encryptedCredentials: String,
      },
    ],
    refreshTokens: [
      {
        tokenId: String,
        createdAt: Date,
      },
    ],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);