const mongoose = require('mongoose');

const inventorySchema = mongoose.Schema(
  {
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
        purchaseDate: {
          type: Date,
          default: Date.now,
        },
        expirationDate: {
          type: Date,
        },
        location: {
          type: String,
          enum: ['pantry', 'refrigerator', 'freezer', 'other'],
          default: 'pantry',
        },
        notes: {
          type: String,
          trim: true,
        },
        price: {
          type: Number,
          default: 0,
        },
        purchasedFrom: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Store',
        },
        barcode: {
          type: String,
          trim: true,
        },
        image: {
          type: String,
          trim: true,
        },
        lowStockThreshold: {
          type: Number,
          default: 1,
        },
        isLowStock: {
          type: Boolean,
          default: false,
        },
        isExpiringSoon: {
          type: Boolean,
          default: false,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        consumptionRate: {
          type: Number,
          default: 0,
        },
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    settings: {
      lowStockThresholdDefault: {
        type: Number,
        default: 1,
      },
      expiryNotificationDays: {
        type: Number,
        default: 3,
      },
      autoAddToGroceryList: {
        type: Boolean,
        default: false,
      },
      defaultGroceryListId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GroceryList',
      },
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

// Indexes for faster queries
inventorySchema.index({ userId: 1 });
inventorySchema.index({ householdId: 1 });
inventorySchema.index({ 'items.productId': 1 });
inventorySchema.index({ 'items.category': 1 });
inventorySchema.index({ 'items.expirationDate': 1 });
inventorySchema.index({ 'items.isLowStock': 1 });
inventorySchema.index({ 'items.isExpiringSoon': 1 });

module.exports = mongoose.model('Inventory', inventorySchema);