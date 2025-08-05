const mongoose = require('mongoose');

const recipeIngredientSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
    substitutes: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        name: String,
      },
    ],
    notes: String,
  },
  { _id: true }
);

const recipeStepSchema = new mongoose.Schema(
  {
    stepNumber: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    time: {
      value: Number,
      unit: {
        type: String,
        enum: ['seconds', 'minutes', 'hours'],
        default: 'minutes',
      },
    },
    image: String,
    tips: String,
  },
  { _id: true }
);

const recipeReviewSchema = new mongoose.Schema(
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
    comment: String,
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    images: [String],
    mainImage: String,
    prepTime: {
      value: Number,
      unit: {
        type: String,
        enum: ['minutes', 'hours'],
        default: 'minutes',
      },
    },
    cookTime: {
      value: Number,
      unit: {
        type: String,
        enum: ['minutes', 'hours'],
        default: 'minutes',
      },
    },
    totalTime: {
      value: Number,
      unit: {
        type: String,
        enum: ['minutes', 'hours'],
        default: 'minutes',
      },
    },
    servings: {
      type: Number,
      required: true,
      min: 1,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    ingredients: [recipeIngredientSchema],
    steps: [recipeStepSchema],
    nutritionalInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
      sugar: Number,
      sodium: Number,
    },
    cuisine: {
      type: String,
      trim: true,
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer', 'drink', 'other'],
    },
    dietaryInfo: [{
      type: String,
      enum: [
        'vegetarian',
        'vegan',
        'gluten-free',
        'dairy-free',
        'nut-free',
        'low-carb',
        'keto',
        'paleo',
        'low-fat',
        'low-sodium',
        'high-protein',
        'pescatarian',
        'halal',
        'kosher',
      ],
    }],
    allergens: [String],
    tags: [String],
    estimatedCost: {
      value: Number,
      currency: {
        type: String,
        default: 'USD',
      },
      costPerServing: Number,
    },
    reviews: [recipeReviewSchema],
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
    popularity: {
      type: Number,
      default: 0,
    },
    relatedRecipes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
      },
    ],
    tips: [String],
    videoUrl: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for search functionality
recipeSchema.index(
  {
    title: 'text',
    description: 'text',
    'ingredients.name': 'text',
    cuisine: 'text',
    tags: 'text',
  },
  {
    weights: {
      title: 10,
      'ingredients.name': 5,
      cuisine: 3,
      tags: 2,
      description: 1,
    },
    name: 'recipe_text_index',
  }
);

// Add compound indexes for common queries
recipeSchema.index({ mealType: 1, cuisine: 1 });
recipeSchema.index({ dietaryInfo: 1 });
recipeSchema.index({ difficulty: 1, totalTime: 1 });
recipeSchema.index({ averageRating: -1, popularity: -1 });
recipeSchema.index({ createdBy: 1, isPublic: 1 });

// Calculate total time before saving
recipeSchema.pre('save', function (next) {
  // Update the updatedAt timestamp
  this.updatedAt = Date.now();
  
  // Calculate total time if not manually set
  if (!this.totalTime.value) {
    const prepTimeValue = this.prepTime.value || 0;
    const cookTimeValue = this.cookTime.value || 0;
    
    // Convert to minutes if needed
    const prepTimeMinutes = this.prepTime.unit === 'hours' ? prepTimeValue * 60 : prepTimeValue;
    const cookTimeMinutes = this.cookTime.unit === 'hours' ? cookTimeValue * 60 : cookTimeValue;
    
    const totalMinutes = prepTimeMinutes + cookTimeMinutes;
    
    // Convert back to hours if total is >= 60 minutes
    if (totalMinutes >= 60) {
      this.totalTime.value = totalMinutes / 60;
      this.totalTime.unit = 'hours';
    } else {
      this.totalTime.value = totalMinutes;
      this.totalTime.unit = 'minutes';
    }
  }
  
  next();
});

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;