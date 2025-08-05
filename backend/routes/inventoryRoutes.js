const express = require('express');
const router = express.Router();
const {
  getInventory,
  getInventoryItem,
  addInventoryItem,
  updateInventoryItem,
  removeInventoryItem,
  getLowStockItems,
  getExpiringItems,
  updateInventorySettings,
  getInventoryStats,
  bulkAddInventoryItems,
  scanBarcodeItem,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

// All routes in this file are protected
router.use(protect);

// @route   GET /api/inventory
// @desc    Get user's inventory
// @access  Private
router.get('/', getInventory);

// @route   GET /api/inventory/low-stock
// @desc    Get low stock items
// @access  Private
router.get('/low-stock', getLowStockItems);

// @route   GET /api/inventory/expiring
// @desc    Get expiring items
// @access  Private
router.get('/expiring', getExpiringItems);

// @route   GET /api/inventory/stats
// @desc    Get inventory statistics
// @access  Private
router.get('/stats', getInventoryStats);

// @route   GET /api/inventory/:id
// @desc    Get inventory item by ID
// @access  Private
router.get('/:id', getInventoryItem);

// @route   POST /api/inventory
// @desc    Add item to inventory
// @access  Private
router.post('/', addInventoryItem);

// @route   POST /api/inventory/bulk
// @desc    Bulk add items to inventory
// @access  Private
router.post('/bulk', bulkAddInventoryItems);

// @route   POST /api/inventory/scan
// @desc    Scan barcode to add item
// @access  Private
router.post('/scan', scanBarcodeItem);

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private
router.put('/:id', updateInventoryItem);

// @route   PUT /api/inventory/settings
// @desc    Update inventory settings
// @access  Private
router.put('/settings', updateInventorySettings);

// @route   DELETE /api/inventory/:id
// @desc    Remove item from inventory
// @access  Private
router.delete('/:id', removeInventoryItem);

module.exports = router;