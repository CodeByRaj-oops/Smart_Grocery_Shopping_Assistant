const mongoose = require('mongoose');

const storeHoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    open: {
      type: String,
      required: true,
    },
    close: {
      type: String,
      required: true,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const storeAisleSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    categories: [{
      type: String,
      required: true,
    }],
    location: {
      x: Number, // Horizontal position in store layout
      y: Number, // Vertical position in store layout
    },
  },
  { _id: true }
);

const storePriceSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    onSale: {
      type: Boolean,
      default: false,
    },
    salePrice: {
      type: Number,
    },
    saleEndDate: {
      type: Date,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockLevel: {
      type: String,
      enum: ['high', 'medium', 'low', 'out_of_stock'],
    },
    aisle: {
      type: String,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: String,
      enum: ['system', 'admin', 'user', 'api'],
      default: 'system',
    },
  },
  { _id: true }
);

const storeDealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: ['discount', 'bogo', 'percent_off', 'fixed_amount', 'loyalty_points'],
      required: true,
    },
    value: {
      type: Number, // Percentage or fixed amount
      required: true,
    },
    minPurchase: {
      type: Number,
      default: 0,
    },
    applicableProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    }],
    applicableCategories: [{
      type: String,
    }],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    couponCode: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
    },
  },
  { _id: true }
);

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    chain: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
        default: 'USA',
      },
      coordinates: {
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
      },
      formattedAddress: String,
    },
    contact: {
      phone: String,
      email: String,
      website: String,
    },
    hours: [storeHoursSchema],
    layout: {
      aisles: [storeAisleSchema],
      entranceLocation: {
        x: Number,
        y: Number,
      },
      checkoutLocation: {
        x: Number,
        y: Number,
      },
      width: Number, // Store width in arbitrary units
      height: Number, // Store height in arbitrary units
      layoutImage: String, // URL to store layout image
      lastUpdated: Date,
    },
    services: [{
      type: String,
      enum: [
        'pickup',
        'delivery',
        'pharmacy',
        'deli',
        'bakery',
        'butcher',
        'seafood',
        'floral',
        'alcohol',
        'banking',
        'cafe',
        'gas',
        'organic',
      ],
    }],
    loyaltyProgram: {
      name: String,
      description: String,
      apiEndpoint: String,
      supported: {
        type: Boolean,
        default: false,
      },
      pointsSystem: {
        enabled: Boolean,
        pointsPerDollar: Number,
        redemptionRate: Number, // How many points for $1 discount
      },
    },
    prices: [storePriceSchema],
    deals: [storeDealSchema],
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
      categories: {
        priceLevel: {
          type: Number,
          default: 0,
          min: 0,
          max: 5,
        },
        cleanliness: {
          type: Number,
          default: 0,
          min: 0,
          max: 5,
        },
        service: {
          type: Number,
          default: 0,
          min: 0,
          max: 5,
        },
        selection: {
          type: Number,
          default: 0,
          min: 0,
          max: 5,
        },
      },
    },
    popularity: {
      type: Number,
      default: 0,
    },
    photos: [String],
    mainImage: String,
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

// Create geospatial index for location-based queries
storeSchema.index({ 'address.coordinates': '2dsphere' });

// Create text index for search
storeSchema.index(
  {
    name: 'text',
    chain: 'text',
    'address.city': 'text',
    'address.state': 'text',
  },
  {
    weights: {
      name: 10,
      chain: 5,
      'address.city': 3,
      'address.state': 1,
    },
    name: 'store_text_index',
  }
);

// Create compound indexes for common queries
storeSchema.index({ chain: 1, 'address.state': 1, 'address.city': 1 });
storeSchema.index({ services: 1 });
storeSchema.index({ isActive: 1 });
storeSchema.index({ 'ratings.average': -1 });
storeSchema.index({ popularity: -1 });

// Update timestamp before saving
storeSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;