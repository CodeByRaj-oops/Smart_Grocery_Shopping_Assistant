const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      trim: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    nutritionalInfo: {
      calories: Number,
      fat: Number,
      carbs: Number,
      protein: Number,
      sodium: Number,
      sugar: Number,
      fiber: Number,
      servingSize: String,
    },
    allergens: [
      {
        type: String,
        trim: true,
      },
    ],
    dietaryInfo: [
      {
        type: String,
        trim: true,
      },
    ],
    ingredients: {
      type: String,
      trim: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    stores: [
      {
        storeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Store',
          required: true,
        },
        price: {
          type: Number,
          default: 0,
        },
        inStock: {
          type: Boolean,
          default: true,
        },
        aisle: {
          type: String,
          trim: true,
        },
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    alternatives: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    isOrganic: {
      type: Boolean,
      default: false,
    },
    isVegan: {
      type: Boolean,
      default: false,
    },
    isGlutenFree: {
      type: Boolean,
      default: false,
    },
    popularity: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      enum: ['admin', 'user', 'system'],
      default: 'system',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
productSchema.index({ name: 'text', description: 'text', brand: 'text', category: 'text' });
productSchema.index({ barcode: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isOrganic: 1 });
productSchema.index({ isVegan: 1 });
productSchema.index({ isGlutenFree: 1 });
productSchema.index({ popularity: -1 });
productSchema.index({ 'stores.storeId': 1 });

module.exports = mongoose.model('Product', productSchema);