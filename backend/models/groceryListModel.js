const mongoose = require('mongoose');

const groceryListSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a list name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Household',
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        category: {
          type: String,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        unit: {
          type: String,
          trim: true,
        },
        price: {
          type: Number,
          default: 0,
        },
        checked: {
          type: Boolean,
          default: false,
        },
        notes: {
          type: String,
          trim: true,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        checkedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        checkedAt: {
          type: Date,
        },
        isRecurring: {
          type: Boolean,
          default: false,
        },
        recurrencePattern: {
          type: String,
          enum: ['weekly', 'biweekly', 'monthly'],
        },
        storeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Store',
        },
        aisle: {
          type: String,
          trim: true,
        },
        priority: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium',
        },
      },
    ],
    type: {
      type: String,
      enum: ['regular', 'template', 'smart', 'recipe-based'],
      default: 'regular',
    },
    status: {
      type: String,
      enum: ['active', 'shopping', 'completed', 'archived'],
      default: 'active',
    },
    sharedWith: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        permissions: {
          type: String,
          enum: ['view', 'edit'],
          default: 'view',
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalBudget: {
      type: Number,
      default: 0,
    },
    currentTotal: {
      type: Number,
      default: 0,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
    },
    scheduledFor: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    recipeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
groceryListSchema.index({ userId: 1 });
groceryListSchema.index({ householdId: 1 });
groceryListSchema.index({ 'sharedWith.userId': 1 });
groceryListSchema.index({ status: 1 });

module.exports = mongoose.model('GroceryList', groceryListSchema);