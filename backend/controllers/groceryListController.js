const asyncHandler = require('express-async-handler');
const GroceryList = require('../models/groceryListModel');
const User = require('../models/userModel');
const Household = require('../models/householdModel');
const Recipe = require('../models/recipeModel');

// @desc    Get all user's grocery lists
// @route   GET /api/lists
// @access  Private
const getLists = asyncHandler(async (req, res) => {
  const { status, type, household } = req.query;
  
  // Build query
  const query = { userId: req.user._id, isActive: true };
  
  if (status) {
    query.status = status;
  }
  
  if (type) {
    query.type = type;
  }
  
  if (household) {
    query.householdId = household;
  }
  
  const lists = await GroceryList.find(query)
    .sort({ updatedAt: -1 })
    .populate('householdId', 'name')
    .populate('storeId', 'name location');
  
  res.json(lists);
});

// @desc    Get lists shared with the user
// @route   GET /api/lists/shared
// @access  Private
const getSharedLists = asyncHandler(async (req, res) => {
  const lists = await GroceryList.find({
    'sharedWith.userId': req.user._id,
    isActive: true,
  })
    .sort({ updatedAt: -1 })
    .populate('userId', 'profile.firstName profile.lastName')
    .populate('householdId', 'name')
    .populate('storeId', 'name location');
  
  res.json(lists);
});

// @desc    Get list templates
// @route   GET /api/lists/templates
// @access  Private
const getListTemplates = asyncHandler(async (req, res) => {
  const templates = await GroceryList.find({
    userId: req.user._id,
    type: 'template',
    isActive: true,
  }).sort({ name: 1 });
  
  res.json(templates);
});

// @desc    Get a grocery list by ID
// @route   GET /api/lists/:id
// @access  Private
const getListById = asyncHandler(async (req, res) => {
  const list = await GroceryList.findById(req.params.id)
    .populate('householdId', 'name')
    .populate('storeId', 'name location')
    .populate('items.productId', 'name category image price')
    .populate('items.addedBy', 'profile.firstName profile.lastName')
    .populate('items.checkedBy', 'profile.firstName profile.lastName')
    .populate('sharedWith.userId', 'profile.firstName profile.lastName email')
    .populate('recipeIds', 'name servings prepTime cookTime');
  
  if (!list) {
    res.status(404);
    throw new Error('Grocery list not found');
  }
  
  // Check if user has access to this list
  const isOwner = list.userId.toString() === req.user._id.toString();
  const isSharedWithUser = list.sharedWith.some(
    (shared) => shared.userId._id.toString() === req.user._id.toString()
  );
  
  // Check if user is part of the household
  let isHouseholdMember = false;
  if (list.householdId) {
    const household = await Household.findById(list.householdId);
    if (household) {
      isHouseholdMember =
        household.adminUserId.toString() === req.user._id.toString() ||
        household.members.some(
          (member) => member.userId.toString() === req.user._id.toString()
        );
    }
  }
  
  if (!isOwner && !isSharedWithUser && !isHouseholdMember) {
    res.status(403);
    throw new Error('Not authorized to access this list');
  }
  
  res.json(list);
});

// @desc    Create a new grocery list
// @route   POST /api/lists
// @access  Private
const createList = asyncHandler(async (req, res) => {
  const { name, description, householdId, type, storeId, items, totalBudget, scheduledFor, tags } = req.body;
  
  if (!name) {
    res.status(400);
    throw new Error('Please add a list name');
  }
  
  // If householdId is provided, verify user is part of that household
  if (householdId) {
    const household = await Household.findById(householdId);
    
    if (!household) {
      res.status(404);
      throw new Error('Household not found');
    }
    
    const isAdmin = household.adminUserId.toString() === req.user._id.toString();
    const isMember = household.members.some(
      (member) => member.userId.toString() === req.user._id.toString()
    );
    
    if (!isAdmin && !isMember) {
      res.status(403);
      throw new Error('Not authorized to create a list for this household');
    }
  }
  
  const list = await GroceryList.create({
    name,
    description,
    userId: req.user._id,
    householdId,
    type: type || 'regular',
    storeId,
    items: items || [],
    totalBudget: totalBudget || 0,
    scheduledFor,
    tags: tags || [],
  });
  
  res.status(201).json(list);
});

// @desc    Create a list from a template
// @route   POST /api/lists/from-template/:templateId
// @access  Private
const createListFromTemplate = asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const { name, householdId, storeId, scheduledFor } = req.body;
  
  const template = await GroceryList.findById(templateId);
  
  if (!template || template.type !== 'template') {
    res.status(404);
    throw new Error('Template not found');
  }
  
  // Verify user owns the template
  if (template.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to use this template');
  }
  
  // If householdId is provided, verify user is part of that household
  if (householdId) {
    const household = await Household.findById(householdId);
    
    if (!household) {
      res.status(404);
      throw new Error('Household not found');
    }
    
    const isAdmin = household.adminUserId.toString() === req.user._id.toString();
    const isMember = household.members.some(
      (member) => member.userId.toString() === req.user._id.toString()
    );
    
    if (!isAdmin && !isMember) {
      res.status(403);
      throw new Error('Not authorized to create a list for this household');
    }
  }
  
  // Create new list from template
  const newList = await GroceryList.create({
    name: name || `${template.name} (Copy)`,
    description: template.description,
    userId: req.user._id,
    householdId: householdId || template.householdId,
    items: template.items.map(item => ({
      ...item.toObject(),
      checked: false,
      addedBy: req.user._id,
      addedAt: new Date(),
      checkedBy: null,
      checkedAt: null,
    })),
    type: 'regular',
    storeId: storeId || template.storeId,
    totalBudget: template.totalBudget,
    scheduledFor,
    tags: template.tags,
  });
  
  res.status(201).json(newList);
});

// @desc    Create a list from a recipe
// @route   POST /api/lists/from-recipe/:recipeId
// @access  Private
const createListFromRecipe = asyncHandler(async (req, res) => {
  const { recipeId } = req.params;
  const { name, householdId, storeId, servings } = req.body;
  
  const recipe = await Recipe.findById(recipeId);
  
  if (!recipe) {
    res.status(404);
    throw new Error('Recipe not found');
  }
  
  // If householdId is provided, verify user is part of that household
  if (householdId) {
    const household = await Household.findById(householdId);
    
    if (!household) {
      res.status(404);
      throw new Error('Household not found');
    }
    
    const isAdmin = household.adminUserId.toString() === req.user._id.toString();
    const isMember = household.members.some(
      (member) => member.userId.toString() === req.user._id.toString()
    );
    
    if (!isAdmin && !isMember) {
      res.status(403);
      throw new Error('Not authorized to create a list for this household');
    }
  }
  
  // Calculate quantities based on servings
  const servingMultiplier = servings ? servings / recipe.servings : 1;
  
  // Create new list from recipe
  const newList = await GroceryList.create({
    name: name || `${recipe.name} Shopping List`,
    description: `Shopping list for ${recipe.name} recipe`,
    userId: req.user._id,
    householdId,
    items: recipe.ingredients.map(ingredient => ({
      name: ingredient.name,
      quantity: ingredient.quantity * servingMultiplier,
      unit: ingredient.unit,
      category: ingredient.category,
      checked: false,
      addedBy: req.user._id,
      addedAt: new Date(),
    })),
    type: 'recipe-based',
    storeId,
    recipeIds: [recipe._id],
  });
  
  res.status(201).json(newList);
});

// @desc    Update a grocery list
// @route   PUT /api/lists/:id
// @access  Private
const updateList = asyncHandler(async (req, res) => {
  const list = await GroceryList.findById(req.params.id);
  
  if (!list) {
    res.status(404);
    throw new Error('Grocery list not found');
  }
  
  // Check if user has permission to update this list
  if (list.userId.toString() !== req.user._id.toString()) {
    // Check if list is shared with edit permissions
    const sharedWithUser = list.sharedWith.find(
      (shared) => shared.userId.toString() === req.user._id.toString()
    );
    
    if (!sharedWithUser || sharedWithUser.permissions !== 'edit') {
      // Check if user is part of the household with edit permissions
      if (list.householdId) {
        const household = await Household.findById(list.householdId);
        if (household) {
          const isAdmin = household.adminUserId.toString() === req.user._id.toString();
          const memberWithPermission = household.members.find(
            (member) =>
              member.userId.toString() === req.user._id.toString() &&
              member.permissions.includes('edit_lists')
          );
          
          if (!isAdmin && !memberWithPermission) {
            res.status(403);
            throw new Error('Not authorized to update this list');
          }
        }
      } else {
        res.status(403);
        throw new Error('Not authorized to update this list');
      }
    }
  }
  
  // Update list fields
  const { name, description, storeId, totalBudget, scheduledFor, tags } = req.body;
  
  if (name) list.name = name;
  if (description !== undefined) list.description = description;
  if (storeId) list.storeId = storeId;
  if (totalBudget !== undefined) list.totalBudget = totalBudget;
  if (scheduledFor !== undefined) list.scheduledFor = scheduledFor;
  if (tags) list.tags = tags;
  
  const updatedList = await list.save();
  
  res.json(updatedList);
});

// @desc    Delete a grocery list
// @route   DELETE /api/lists/:id
// @access  Private
const deleteList = asyncHandler(async (req, res) => {
  const list = await GroceryList.findById(req.params.id);
  
  if (!list) {
    res.status(404);
    throw new Error('Grocery list not found');
  }
  
  // Check if user has permission to delete this list
  if (list.userId.toString() !== req.user._id.toString()) {
    // Check if user is household admin
    if (list.householdId) {
      const household = await Household.findById(list.householdId);
      if (household && household.adminUserId.toString() === req.user._id.toString()) {
        // User is household admin, allow deletion
      } else {
        res.status(403);
        throw new Error('Not authorized to delete this list');
      }
    } else {
      res.status(403);
      throw new Error('Not authorized to delete this list');
    }
  }
  
  // Soft delete
  list.isActive = false;
  await list.save();
  
  // For hard delete, uncomment the following line
  // await list.remove();
  
  res.json({ message: 'Grocery list removed' });
});

// @desc    Add an item to a grocery list
// @route   POST /api/lists/:id/items
// @access  Private
const addItemToList = asyncHandler(async (req, res) => {
  const list = await GroceryList.findById(req.params.id);
  
  if (!list) {
    res.status(404);
    throw new Error('Grocery list not found');
  }
  
  // Check if user has permission to update this list
  const canEdit = await checkEditPermission(list, req.user._id);
  
  if (!canEdit) {
    res.status(403);
    throw new Error('Not authorized to update this list');
  }
  
  const { name, quantity, unit, category, price, notes, productId, storeId, aisle, priority, isRecurring, recurrencePattern } = req.body;
  
  if (!name) {
    res.status(400);
    throw new Error('Please provide an item name');
  }
  
  const newItem = {
    name,
    quantity: quantity || 1,
    unit,
    category,
    price: price || 0,
    notes,
    productId,
    storeId,
    aisle,
    priority: priority || 'medium',
    isRecurring: isRecurring || false,
    recurrencePattern,
    addedBy: req.user._id,
    addedAt: new Date(),
    checked: false,
  };
  
  list.items.push(newItem);
  
  // Update current total
  if (price) {
    list.currentTotal = list.items.reduce(
      (total, item) => total + (item.price * item.quantity || 0),
      0
    );
  }
  
  await list.save();
  
  res.status(201).json(list.items[list.items.length - 1]);
});

// @desc    Update an item in a grocery list
// @route   PUT /api/lists/:id/items/:itemId
// @access  Private
const updateListItem = asyncHandler(async (req, res) => {
  const list = await GroceryList.findById(req.params.id);
  
  if (!list) {
    res.status(404);
    throw new Error('Grocery list not found');
  }
  
  // Check if user has permission to update this list
  const canEdit = await checkEditPermission(list, req.user._id);
  
  if (!canEdit) {
    res.status(403);
    throw new Error('Not authorized to update this list');
  }
  
  // Find the item
  const itemIndex = list.items.findIndex(
    (item) => item._id.toString() === req.params.itemId
  );
  
  if (itemIndex === -1) {
    res.status(404);
    throw new Error('Item not found in list');
  }
  
  // Update item fields
  const { name, quantity, unit, category, price, notes, checked, productId, storeId, aisle, priority, isRecurring, recurrencePattern } = req.body;
  
  if (name) list.items[itemIndex].name = name;
  if (quantity !== undefined) list.items[itemIndex].quantity = quantity;
  if (unit !== undefined) list.items[itemIndex].unit = unit;
  if (category !== undefined) list.items[itemIndex].category = category;
  if (price !== undefined) list.items[itemIndex].price = price;
  if (notes !== undefined) list.items[itemIndex].notes = notes;
  if (productId !== undefined) list.items[itemIndex].productId = productId;
  if (storeId !== undefined) list.items[itemIndex].storeId = storeId;
  if (aisle !== undefined) list.items[itemIndex].aisle = aisle;
  if (priority !== undefined) list.items[itemIndex].priority = priority;
  if (isRecurring !== undefined) list.items[itemIndex].isRecurring = isRecurring;
  if (recurrencePattern !== undefined) list.items[itemIndex].recurrencePattern = recurrencePattern;
  
  // Handle checked status change
  if (checked !== undefined && list.items[itemIndex].checked !== checked) {
    list.items[itemIndex].checked = checked;
    
    if (checked) {
      list.items[itemIndex].checkedBy = req.user._id;
      list.items[itemIndex].checkedAt = new Date();
    } else {
      list.items[itemIndex].checkedBy = null;
      list.items[itemIndex].checkedAt = null;
    }
  }
  
  // Update current total
  list.currentTotal = list.items.reduce(
    (total, item) => total + (item.price * item.quantity || 0),
    0
  );
  
  await list.save();
  
  res.json(list.items[itemIndex]);
});

// @desc    Remove an item from a grocery list
// @route   DELETE /api/lists/:id/items/:itemId
// @access  Private
const removeItemFromList = asyncHandler(async (req, res) => {
  const list = await GroceryList.findById(req.params.id);
  
  if (!list) {
    res.status(404);
    throw new Error('Grocery list not found');
  }
  
  // Check if user has permission to update this list
  const canEdit = await checkEditPermission(list, req.user._id);
  
  if (!canEdit) {
    res.status(403);
    throw new Error('Not authorized to update this list');
  }
  
  // Find the item
  const itemIndex = list.items.findIndex(
    (item) => item._id.toString() === req.params.itemId
  );
  
  if (itemIndex === -1) {
    res.status(404);
    throw new Error('Item not found in list');
  }
  
  // Remove the item
  list.items.splice(itemIndex, 1);
  
  // Update current total
  list.currentTotal = list.items.reduce(
    (total, item) => total + (item.price * item.quantity || 0),
    0
  );
  
  await list.save();
  
  res.json({ message: 'Item removed from list' });
});

// @desc    Share a grocery list with another user
// @route   POST /api/lists/:id/share
// @access  Private
const shareList = asyncHandler(async (req, res) => {
  const { email, permissions } = req.body;
  
  if (!email) {
    res.status(400);
    throw new Error('Please provide an email address');
  }
  
  const list = await GroceryList.findById(req.params.id);
  
  if (!list) {
    res.status(404);
    throw new Error('Grocery list not found');
  }
  
  // Check if user is the owner of the list
  if (list.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the list owner can share this list');
  }
  
  // Find the user to share with
  const userToShare = await User.findOne({ email });
  
  if (!userToShare) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Check if list is already shared with this user
  const alreadyShared = list.sharedWith.some(
    (shared) => shared.userId.toString() === userToShare._id.toString()
  );
  
  if (alreadyShared) {
    res.status(400);
    throw new Error('List is already shared with this user');
  }
  
  // Add user to sharedWith array
  list.sharedWith.push({
    userId: userToShare._id,
    permissions: permissions || 'view',
    sharedAt: new Date(),
  });
  
  await list.save();
  
  res.status(201).json({
    message: `List shared with ${userToShare.profile.firstName} ${userToShare.profile.lastName}`,
  });
});

// @desc    Update a grocery list status
// @route   PUT /api/lists/:id/status
// @access  Private
const updateListStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!status || !['active', 'shopping', 'completed', 'archived'].includes(status)) {
    res.status(400);
    throw new Error('Please provide a valid status');
  }
  
  const list = await GroceryList.findById(req.params.id);
  
  if (!list) {
    res.status(404);
    throw new Error('Grocery list not found');
  }
  
  // Check if user has permission to update this list
  const canEdit = await checkEditPermission(list, req.user._id);
  
  if (!canEdit) {
    res.status(403);
    throw new Error('Not authorized to update this list');
  }
  
  // Update status
  list.status = status;
  
  // If status is completed, set completedAt
  if (status === 'completed') {
    list.completedAt = new Date();
  }
  
  await list.save();
  
  res.json({ status: list.status });
});

// Helper function to check if a user has edit permission for a list
const checkEditPermission = async (list, userId) => {
  // Check if user is the owner
  if (list.userId.toString() === userId.toString()) {
    return true;
  }
  
  // Check if list is shared with edit permissions
  const sharedWithUser = list.sharedWith.find(
    (shared) => shared.userId.toString() === userId.toString()
  );
  
  if (sharedWithUser && sharedWithUser.permissions === 'edit') {
    return true;
  }
  
  // Check if user is part of the household with edit permissions
  if (list.householdId) {
    const household = await Household.findById(list.householdId);
    if (household) {
      const isAdmin = household.adminUserId.toString() === userId.toString();
      const memberWithPermission = household.members.find(
        (member) =>
          member.userId.toString() === userId.toString() &&
          member.permissions.includes('edit_lists')
      );
      
      if (isAdmin || memberWithPermission) {
        return true;
      }
    }
  }
  
  return false;
};

module.exports = {
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
};