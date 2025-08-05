const express = require('express');
const router = express.Router();
const {
  getLists,
  getListById,
  createList,
  updateList,
  deleteList,
  addItemToList,
  updateListItem,
  removeItemFromList,
  shareList,
  updateListStatus,
  getSharedLists,
  getListTemplates,
  createListFromTemplate,
  createListFromRecipe,
} = require('../controllers/groceryListController');
const { protect } = require('../middleware/authMiddleware');

// All routes in this file are protected
router.use(protect);

// @route   GET /api/lists
// @desc    Get all user's grocery lists
// @access  Private
router.get('/', getLists);

// @route   GET /api/lists/shared
// @desc    Get lists shared with the user
// @access  Private
router.get('/shared', getSharedLists);

// @route   GET /api/lists/templates
// @desc    Get list templates
// @access  Private
router.get('/templates', getListTemplates);

// @route   POST /api/lists
// @desc    Create a new grocery list
// @access  Private
router.post('/', createList);

// @route   POST /api/lists/from-template/:templateId
// @desc    Create a list from a template
// @access  Private
router.post('/from-template/:templateId', createListFromTemplate);

// @route   POST /api/lists/from-recipe/:recipeId
// @desc    Create a list from a recipe
// @access  Private
router.post('/from-recipe/:recipeId', createListFromRecipe);

// @route   GET /api/lists/:id
// @desc    Get a grocery list by ID
// @access  Private
router.get('/:id', getListById);

// @route   PUT /api/lists/:id
// @desc    Update a grocery list
// @access  Private
router.put('/:id', updateList);

// @route   DELETE /api/lists/:id
// @desc    Delete a grocery list
// @access  Private
router.delete('/:id', deleteList);

// @route   POST /api/lists/:id/items
// @desc    Add an item to a grocery list
// @access  Private
router.post('/:id/items', addItemToList);

// @route   PUT /api/lists/:id/items/:itemId
// @desc    Update an item in a grocery list
// @access  Private
router.put('/:id/items/:itemId', updateListItem);

// @route   DELETE /api/lists/:id/items/:itemId
// @desc    Remove an item from a grocery list
// @access  Private
router.delete('/:id/items/:itemId', removeItemFromList);

// @route   POST /api/lists/:id/share
// @desc    Share a grocery list with another user
// @access  Private
router.post('/:id/share', shareList);

// @route   PUT /api/lists/:id/status
// @desc    Update a grocery list status
// @access  Private
router.put('/:id/status', updateListStatus);

module.exports = router;