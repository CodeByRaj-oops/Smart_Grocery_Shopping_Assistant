const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const User = require('../models/userModel');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  
  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { brand: { $regex: req.query.keyword, $options: 'i' } },
          { category: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};
  
  const count = await Product.countDocuments({ ...keyword, isActive: true });
  const products = await Product.find({ ...keyword, isActive: true })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ popularity: -1 });
  
  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('reviews.userId', 'profile.firstName profile.lastName')
    .populate('stores.storeId', 'name location');
  
  if (product && product.isActive) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get product by barcode
// @route   GET /api/products/barcode/:barcode
// @access  Public
const getProductByBarcode = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ barcode: req.params.barcode, isActive: true })
    .populate('reviews.userId', 'profile.firstName profile.lastName')
    .populate('stores.storeId', 'name location');
  
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
const searchProducts = asyncHandler(async (req, res) => {
  const { query, category, brand, dietary, price_min, price_max, sort, limit } = req.query;
  
  // Build search criteria
  const searchCriteria = { isActive: true };
  
  if (query) {
    searchCriteria.$text = { $search: query };
  }
  
  if (category) {
    searchCriteria.category = { $regex: category, $options: 'i' };
  }
  
  if (brand) {
    searchCriteria.brand = { $regex: brand, $options: 'i' };
  }
  
  if (dietary) {
    const dietaryPreferences = dietary.split(',');
    const dietaryConditions = [];
    
    dietaryPreferences.forEach((pref) => {
      switch (pref.toLowerCase()) {
        case 'organic':
          dietaryConditions.push({ isOrganic: true });
          break;
        case 'vegan':
          dietaryConditions.push({ isVegan: true });
          break;
        case 'gluten-free':
          dietaryConditions.push({ isGlutenFree: true });
          break;
        default:
          dietaryConditions.push({ dietaryInfo: pref });
      }
    });
    
    if (dietaryConditions.length > 0) {
      searchCriteria.$or = dietaryConditions;
    }
  }
  
  if (price_min !== undefined || price_max !== undefined) {
    searchCriteria.price = {};
    if (price_min !== undefined) {
      searchCriteria.price.$gte = Number(price_min);
    }
    if (price_max !== undefined) {
      searchCriteria.price.$lte = Number(price_max);
    }
  }
  
  // Build sort criteria
  let sortCriteria = {};
  
  if (sort) {
    switch (sort) {
      case 'price_asc':
        sortCriteria = { price: 1 };
        break;
      case 'price_desc':
        sortCriteria = { price: -1 };
        break;
      case 'name_asc':
        sortCriteria = { name: 1 };
        break;
      case 'name_desc':
        sortCriteria = { name: -1 };
        break;
      case 'rating':
        sortCriteria = { averageRating: -1 };
        break;
      case 'popularity':
        sortCriteria = { popularity: -1 };
        break;
      default:
        sortCriteria = { popularity: -1 };
    }
  } else {
    sortCriteria = { popularity: -1 };
  }
  
  // Set limit
  const limitValue = limit ? Number(limit) : 20;
  
  // Execute search
  const products = await Product.find(searchCriteria)
    .sort(sortCriteria)
    .limit(limitValue);
  
  res.json({
    products,
    count: products.length,
    query: {
      search: query || '',
      category: category || '',
      brand: brand || '',
      dietary: dietary || '',
      price_range: price_min || price_max ? `${price_min || 0} - ${price_max || 'max'}` : '',
      sort: sort || 'popularity',
    },
  });
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    category,
    subcategory,
    brand,
    price,
    unit,
    image,
    barcode,
    nutritionalInfo,
    allergens,
    dietaryInfo,
    ingredients,
    isOrganic,
    isVegan,
    isGlutenFree,
    stores,
  } = req.body;
  
  // Check if product with barcode already exists
  if (barcode) {
    const existingProduct = await Product.findOne({ barcode });
    if (existingProduct) {
      res.status(400);
      throw new Error('Product with this barcode already exists');
    }
  }
  
  const product = await Product.create({
    name,
    description,
    category,
    subcategory,
    brand,
    price,
    unit,
    image,
    barcode,
    nutritionalInfo,
    allergens: allergens || [],
    dietaryInfo: dietaryInfo || [],
    ingredients,
    isOrganic: isOrganic || false,
    isVegan: isVegan || false,
    isGlutenFree: isGlutenFree || false,
    stores: stores || [],
    createdBy: 'admin',
  });
  
  res.status(201).json(product);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    category,
    subcategory,
    brand,
    price,
    unit,
    image,
    barcode,
    nutritionalInfo,
    allergens,
    dietaryInfo,
    ingredients,
    isOrganic,
    isVegan,
    isGlutenFree,
    stores,
    alternatives,
    isActive,
  } = req.body;
  
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  // Check if barcode is being changed and if it already exists
  if (barcode && barcode !== product.barcode) {
    const existingProduct = await Product.findOne({ barcode });
    if (existingProduct) {
      res.status(400);
      throw new Error('Product with this barcode already exists');
    }
  }
  
  // Update product fields
  product.name = name || product.name;
  product.description = description !== undefined ? description : product.description;
  product.category = category || product.category;
  product.subcategory = subcategory !== undefined ? subcategory : product.subcategory;
  product.brand = brand !== undefined ? brand : product.brand;
  product.price = price !== undefined ? price : product.price;
  product.unit = unit !== undefined ? unit : product.unit;
  product.image = image !== undefined ? image : product.image;
  product.barcode = barcode !== undefined ? barcode : product.barcode;
  
  if (nutritionalInfo) {
    product.nutritionalInfo = {
      ...product.nutritionalInfo,
      ...nutritionalInfo,
    };
  }
  
  if (allergens) product.allergens = allergens;
  if (dietaryInfo) product.dietaryInfo = dietaryInfo;
  product.ingredients = ingredients !== undefined ? ingredients : product.ingredients;
  product.isOrganic = isOrganic !== undefined ? isOrganic : product.isOrganic;
  product.isVegan = isVegan !== undefined ? isVegan : product.isVegan;
  product.isGlutenFree = isGlutenFree !== undefined ? isGlutenFree : product.isGlutenFree;
  
  if (stores) {
    // Update existing stores or add new ones
    stores.forEach((storeData) => {
      const storeIndex = product.stores.findIndex(
        (s) => s.storeId.toString() === storeData.storeId.toString()
      );
      
      if (storeIndex >= 0) {
        // Update existing store
        product.stores[storeIndex] = {
          ...product.stores[storeIndex].toObject(),
          ...storeData,
          lastUpdated: new Date(),
        };
      } else {
        // Add new store
        product.stores.push({
          ...storeData,
          lastUpdated: new Date(),
        });
      }
    });
  }
  
  if (alternatives) product.alternatives = alternatives;
  if (isActive !== undefined) product.isActive = isActive;
  
  const updatedProduct = await product.save();
  
  res.json(updatedProduct);
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  // Soft delete
  product.isActive = false;
  await product.save();
  
  // For hard delete, uncomment the following line
  // await product.remove();
  
  res.json({ message: 'Product removed' });
});

// @desc    Create product review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  
  if (!rating) {
    res.status(400);
    throw new Error('Please add a rating');
  }
  
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  // Check if user already reviewed this product
  const alreadyReviewed = product.reviews.find(
    (review) => review.userId.toString() === req.user._id.toString()
  );
  
  if (alreadyReviewed) {
    res.status(400);
    throw new Error('Product already reviewed');
  }
  
  // Create review
  const review = {
    userId: req.user._id,
    rating: Number(rating),
    comment,
    createdAt: new Date(),
  };
  
  // Add review to product
  product.reviews.push(review);
  
  // Update product rating statistics
  product.numReviews = product.reviews.length;
  product.averageRating =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
  
  // Increase product popularity
  product.popularity += 1;
  
  await product.save();
  
  res.status(201).json({ message: 'Review added' });
});

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 5;
  
  const products = await Product.find({ isActive: true })
    .sort({ averageRating: -1, popularity: -1 })
    .limit(limit);
  
  res.json(products);
});

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
const getProductsByCategory = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  
  const category = req.params.category;
  const subcategory = req.query.subcategory;
  
  let query = { category: { $regex: category, $options: 'i' }, isActive: true };
  
  if (subcategory) {
    query.subcategory = { $regex: subcategory, $options: 'i' };
  }
  
  const count = await Product.countDocuments(query);
  const products = await Product.find(query)
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ popularity: -1 });
  
  // Get all subcategories for this category
  const subcategories = await Product.distinct('subcategory', {
    category: { $regex: category, $options: 'i' },
    subcategory: { $ne: null },
    isActive: true,
  });
  
  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
    category,
    subcategory: subcategory || '',
    subcategories,
  });
});

// @desc    Get product alternatives
// @route   GET /api/products/:id/alternatives
// @access  Public
const getProductAlternatives = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  // Get explicitly defined alternatives
  let alternatives = [];
  
  if (product.alternatives && product.alternatives.length > 0) {
    alternatives = await Product.find({
      _id: { $in: product.alternatives },
      isActive: true,
    });
  }
  
  // If not enough alternatives, find similar products
  if (alternatives.length < 5) {
    const similarProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true,
    })
      .sort({ popularity: -1 })
      .limit(10);
    
    // Filter out products already in alternatives
    const alternativeIds = alternatives.map((alt) => alt._id.toString());
    const filteredSimilarProducts = similarProducts.filter(
      (p) => !alternativeIds.includes(p._id.toString())
    );
    
    // Add similar products to alternatives
    alternatives = [...alternatives, ...filteredSimilarProducts.slice(0, 5 - alternatives.length)];
  }
  
  res.json(alternatives);
});

// @desc    Get products by dietary preference
// @route   GET /api/products/dietary/:preference
// @access  Public
const getProductsByDietaryPreference = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  const preference = req.params.preference.toLowerCase();
  
  let query = { isActive: true };
  
  switch (preference) {
    case 'organic':
      query.isOrganic = true;
      break;
    case 'vegan':
      query.isVegan = true;
      break;
    case 'gluten-free':
      query.isGlutenFree = true;
      break;
    default:
      query.dietaryInfo = preference;
  }
  
  const count = await Product.countDocuments(query);
  const products = await Product.find(query)
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ popularity: -1 });
  
  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
    preference,
  });
});

module.exports = {
  getProducts,
  getProductById,
  getProductByBarcode,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
  getProductsByCategory,
  getProductAlternatives,
  getProductsByDietaryPreference,
};