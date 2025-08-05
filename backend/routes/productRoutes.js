const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', getProducts);

// @route   GET /api/products/search
// @desc    Search products
// @access  Public
router.get('/search', searchProducts);

// @route   GET /api/products/top
// @desc    Get top rated products
// @access  Public
router.get('/top', getTopProducts);

// @route   GET /api/products/category/:category
// @desc    Get products by category
// @access  Public
router.get('/category/:category', getProductsByCategory);

// @route   GET /api/products/dietary/:preference
// @desc    Get products by dietary preference
// @access  Public
router.get('/dietary/:preference', getProductsByDietaryPreference);

// @route   GET /api/products/barcode/:barcode
// @desc    Get product by barcode
// @access  Public
router.get('/barcode/:barcode', getProductByBarcode);

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', getProductById);

// @route   GET /api/products/:id/alternatives
// @desc    Get product alternatives
// @access  Public
router.get('/:id/alternatives', getProductAlternatives);

// Protected routes

// @route   POST /api/products/:id/reviews
// @desc    Create product review
// @access  Private
router.post('/:id/reviews', protect, createProductReview);

// Admin routes

// @route   POST /api/products
// @desc    Create a product
// @access  Private/Admin
router.post('/', protect, admin, createProduct);

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put('/:id', protect, admin, updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;