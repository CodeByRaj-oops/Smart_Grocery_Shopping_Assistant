const asyncHandler = require('express-async-handler');
const Inventory = require('../models/inventoryModel');
const Product = require('../models/productModel');
const Household = require('../models/householdModel');
const GroceryList = require('../models/groceryListModel');

// @desc    Get user's inventory
// @route   GET /api/inventory
// @access  Private
const getInventory = asyncHandler(async (req, res) => {
  const { category, location, search, household, sortBy, sortOrder } = req.query;
  
  // Build query
  let query;
  
  if (household) {
    // Check if user has access to this household
    const householdDoc = await Household.findById(household);
    if (!householdDoc) {
      res.status(404);
      throw new Error('Household not found');
    }
    
    const isAdmin = householdDoc.adminUserId.toString() === req.user._id.toString();
    const isMember = householdDoc.members.some(
      (member) => member.userId.toString() === req.user._id.toString()
    );
    
    if (!isAdmin && !isMember) {
      res.status(403);
      throw new Error('Not authorized to access this household inventory');
    }
    
    query = { householdId: household, isActive: true };
  } else {
    query = { userId: req.user._id, householdId: null, isActive: true };
  }
  
  // Find inventory
  let inventory = await Inventory.findOne(query)
    .populate('items.productId', 'name category image price')
    .populate('items.purchasedFrom', 'name location')
    .populate('items.addedBy', 'profile.firstName profile.lastName')
    .populate('items.updatedBy', 'profile.firstName profile.lastName');
  
  // If no inventory found, create one
  if (!inventory) {
    inventory = await Inventory.create({
      userId: req.user._id,
      householdId: household || null,
      items: [],
    });
  }
  
  // Filter items based on query parameters
  let filteredItems = [...inventory.items];
  
  if (category) {
    filteredItems = filteredItems.filter(
      (item) => item.category && item.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  if (location) {
    filteredItems = filteredItems.filter(
      (item) => item.location && item.location.toLowerCase() === location.toLowerCase()
    );
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredItems = filteredItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        (item.category && item.category.toLowerCase().includes(searchLower)) ||
        (item.notes && item.notes.toLowerCase().includes(searchLower))
    );
  }
  
  // Sort items
  if (sortBy) {
    const order = sortOrder === 'desc' ? -1 : 1;
    
    filteredItems.sort((a, b) => {
      if (sortBy === 'name') {
        return order * a.name.localeCompare(b.name);
      } else if (sortBy === 'expirationDate') {
        if (!a.expirationDate) return order;
        if (!b.expirationDate) return -order;
        return order * (new Date(a.expirationDate) - new Date(b.expirationDate));
      } else if (sortBy === 'purchaseDate') {
        return order * (new Date(a.purchaseDate) - new Date(b.purchaseDate));
      } else if (sortBy === 'quantity') {
        return order * (a.quantity - b.quantity);
      } else {
        return 0;
      }
    });
  } else {
    // Default sort by name
    filteredItems.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  // Create response object
  const response = {
    _id: inventory._id,
    userId: inventory.userId,
    householdId: inventory.householdId,
    items: filteredItems,
    settings: inventory.settings,
    itemCount: filteredItems.length,
    categories: [...new Set(inventory.items.map((item) => item.category).filter(Boolean))],
    locations: [...new Set(inventory.items.map((item) => item.location).filter(Boolean))],
  };
  
  res.json(response);
});

// @desc    Get inventory item by ID
// @route   GET /api/inventory/:id
// @access  Private
const getInventoryItem = asyncHandler(async (req, res) => {
  const { household } = req.query;
  
  // Build query
  let query;
  
  if (household) {
    // Check if user has access to this household
    const householdDoc = await Household.findById(household);
    if (!householdDoc) {
      res.status(404);
      throw new Error('Household not found');
    }
    
    const isAdmin = householdDoc.adminUserId.toString() === req.user._id.toString();
    const isMember = householdDoc.members.some(
      (member) => member.userId.toString() === req.user._id.toString()
    );
    
    if (!isAdmin && !isMember) {
      res.status(403);
      throw new Error('Not authorized to access this household inventory');
    }
    
    query = { householdId: household, isActive: true };
  } else {
    query = { userId: req.user._id, householdId: null, isActive: true };
  }
  
  // Find inventory
  const inventory = await Inventory.findOne(query)
    .populate('items.productId', 'name category image price')
    .populate('items.purchasedFrom', 'name location')
    .populate('items.addedBy', 'profile.firstName profile.lastName')
    .populate('items.updatedBy', 'profile.firstName profile.lastName');
  
  if (!inventory) {
    res.status(404);
    throw new Error('Inventory not found');
  }
  
  // Find the specific item
  const item = inventory.items.find(
    (item) => item._id.toString() === req.params.id
  );
  
  if (!item) {
    res.status(404);
    throw new Error('Inventory item not found');
  }
  
  res.json(item);
});

// @desc    Add item to inventory
// @route   POST /api/inventory
// @access  Private
const addInventoryItem = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    quantity,
    unit,
    purchaseDate,
    expirationDate,
    location,
    notes,
    price,
    purchasedFrom,
    barcode,
    image,
    lowStockThreshold,
    productId,
    householdId,
  } = req.body;
  
  if (!name) {
    res.status(400);
    throw new Error('Please add an item name');
  }
  
  // Check if user has access to this household if provided
  if (householdId) {
    const household = await Household.findById(householdId);
    if (!household) {
      res.status(404);
      throw new Error('Household not found');
    }
    
    const isAdmin = household.adminUserId.toString() === req.user._id.toString();
    const memberWithPermission = household.members.find(
      (member) =>
        member.userId.toString() === req.user._id.toString() &&
        member.permissions.includes('edit_inventory')
    );
    
    if (!isAdmin && !memberWithPermission) {
      res.status(403);
      throw new Error('Not authorized to add items to this household inventory');
    }
  }
  
  // Find or create inventory
  let inventory = await Inventory.findOne({
    userId: req.user._id,
    householdId: householdId || null,
    isActive: true,
  });
  
  if (!inventory) {
    inventory = await Inventory.create({
      userId: req.user._id,
      householdId: householdId || null,
      items: [],
    });
  }
  
  // Check if product exists and get details if available
  let productDetails = {};
  if (productId) {
    const product = await Product.findById(productId);
    if (product) {
      productDetails = {
        name: product.name,
        category: product.category,
        image: product.image,
        barcode: product.barcode,
      };
    }
  }
  
  // Create new item
  const newItem = {
    name: name || productDetails.name,
    category: category || productDetails.category,
    quantity: quantity || 1,
    unit,
    purchaseDate: purchaseDate || new Date(),
    expirationDate,
    location: location || 'pantry',
    notes,
    price: price || 0,
    purchasedFrom,
    barcode: barcode || productDetails.barcode,
    image: image || productDetails.image,
    lowStockThreshold: lowStockThreshold || inventory.settings.lowStockThresholdDefault,
    productId,
    addedBy: req.user._id,
    updatedBy: req.user._id,
    lastUpdated: new Date(),
  };
  
  // Check if item is low stock
  newItem.isLowStock = newItem.quantity <= newItem.lowStockThreshold;
  
  // Check if item is expiring soon
  if (expirationDate) {
    const expiryDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    newItem.isExpiringSoon = daysUntilExpiry <= inventory.settings.expiryNotificationDays;
  }
  
  // Add item to inventory
  inventory.items.push(newItem);
  await inventory.save();
  
  // If auto-add to grocery list is enabled and item is low stock, add to grocery list
  if (
    inventory.settings.autoAddToGroceryList &&
    newItem.isLowStock &&
    inventory.settings.defaultGroceryListId
  ) {
    try {
      const groceryList = await GroceryList.findById(
        inventory.settings.defaultGroceryListId
      );
      
      if (groceryList) {
        // Check if item already exists in the list
        const existingItem = groceryList.items.find(
          (item) =>
            (item.name.toLowerCase() === newItem.name.toLowerCase()) ||
            (newItem.productId && item.productId && item.productId.toString() === newItem.productId.toString())
        );
        
        if (!existingItem) {
          groceryList.items.push({
            name: newItem.name,
            category: newItem.category,
            quantity: 1,
            unit: newItem.unit,
            productId: newItem.productId,
            addedBy: req.user._id,
            addedAt: new Date(),
            notes: 'Auto-added from low stock inventory',
          });
          
          await groceryList.save();
        }
      }
    } catch (error) {
      console.error('Error adding low stock item to grocery list:', error);
    }
  }
  
  res.status(201).json(inventory.items[inventory.items.length - 1]);
});

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private
const updateInventoryItem = asyncHandler(async (req, res) => {
  const { householdId } = req.query;
  
  // Build query
  let query;
  
  if (householdId) {
    // Check if user has access to this household
    const household = await Household.findById(householdId);
    if (!household) {
      res.status(404);
      throw new Error('Household not found');
    }
    
    const isAdmin = household.adminUserId.toString() === req.user._id.toString();
    const memberWithPermission = household.members.find(
      (member) =>
        member.userId.toString() === req.user._id.toString() &&
        member.permissions.includes('edit_inventory')
    );
    
    if (!isAdmin && !memberWithPermission) {
      res.status(403);
      throw new Error('Not authorized to update items in this household inventory');
    }
    
    query = { householdId, isActive: true };
  } else {
    query = { userId: req.user._id, householdId: null, isActive: true };
  }
  
  // Find inventory
  const inventory = await Inventory.findOne(query);
  
  if (!inventory) {
    res.status(404);
    throw new Error('Inventory not found');
  }
  
  // Find the specific item
  const itemIndex = inventory.items.findIndex(
    (item) => item._id.toString() === req.params.id
  );
  
  if (itemIndex === -1) {
    res.status(404);
    throw new Error('Inventory item not found');
  }
  
  // Get the current item
  const currentItem = inventory.items[itemIndex];
  
  // Update item fields
  const {
    name,
    category,
    quantity,
    unit,
    purchaseDate,
    expirationDate,
    location,
    notes,
    price,
    purchasedFrom,
    barcode,
    image,
    lowStockThreshold,
    productId,
  } = req.body;
  
  if (name) inventory.items[itemIndex].name = name;
  if (category !== undefined) inventory.items[itemIndex].category = category;
  if (quantity !== undefined) inventory.items[itemIndex].quantity = quantity;
  if (unit !== undefined) inventory.items[itemIndex].unit = unit;
  if (purchaseDate) inventory.items[itemIndex].purchaseDate = purchaseDate;
  if (expirationDate !== undefined) inventory.items[itemIndex].expirationDate = expirationDate;
  if (location) inventory.items[itemIndex].location = location;
  if (notes !== undefined) inventory.items[itemIndex].notes = notes;
  if (price !== undefined) inventory.items[itemIndex].price = price;
  if (purchasedFrom !== undefined) inventory.items[itemIndex].purchasedFrom = purchasedFrom;
  if (barcode !== undefined) inventory.items[itemIndex].barcode = barcode;
  if (image !== undefined) inventory.items[itemIndex].image = image;
  if (lowStockThreshold !== undefined) inventory.items[itemIndex].lowStockThreshold = lowStockThreshold;
  if (productId !== undefined) inventory.items[itemIndex].productId = productId;
  
  // Update metadata
  inventory.items[itemIndex].updatedBy = req.user._id;
  inventory.items[itemIndex].lastUpdated = new Date();
  
  // Check if item is low stock
  inventory.items[itemIndex].isLowStock =
    inventory.items[itemIndex].quantity <= inventory.items[itemIndex].lowStockThreshold;
  
  // Check if item is expiring soon
  if (inventory.items[itemIndex].expirationDate) {
    const expiryDate = new Date(inventory.items[itemIndex].expirationDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    inventory.items[itemIndex].isExpiringSoon =
      daysUntilExpiry <= inventory.settings.expiryNotificationDays;
  } else {
    inventory.items[itemIndex].isExpiringSoon = false;
  }
  
  // If quantity changed, update consumption rate
  if (quantity !== undefined && quantity < currentItem.quantity) {
    const consumed = currentItem.quantity - quantity;
    const daysSinceLastUpdate = Math.max(
      1,
      Math.ceil(
        (new Date() - new Date(currentItem.lastUpdated)) / (1000 * 60 * 60 * 24)
      )
    );
    
    // Calculate daily consumption rate (units per day)
    const dailyRate = consumed / daysSinceLastUpdate;
    
    // Update with exponential moving average (EMA)
    const alpha = 0.3; // Smoothing factor
    inventory.items[itemIndex].consumptionRate =
      alpha * dailyRate + (1 - alpha) * (currentItem.consumptionRate || 0);
  }
  
  await inventory.save();
  
  // If auto-add to grocery list is enabled and item became low stock, add to grocery list
  if (
    inventory.settings.autoAddToGroceryList &&
    inventory.items[itemIndex].isLowStock &&
    !currentItem.isLowStock && // Only if it wasn't low stock before
    inventory.settings.defaultGroceryListId
  ) {
    try {
      const groceryList = await GroceryList.findById(
        inventory.settings.defaultGroceryListId
      );
      
      if (groceryList) {
        // Check if item already exists in the list
        const existingItem = groceryList.items.find(
          (item) =>
            (item.name.toLowerCase() === inventory.items[itemIndex].name.toLowerCase()) ||
            (inventory.items[itemIndex].productId &&
              item.productId &&
              item.productId.toString() === inventory.items[itemIndex].productId.toString())
        );
        
        if (!existingItem) {
          groceryList.items.push({
            name: inventory.items[itemIndex].name,
            category: inventory.items[itemIndex].category,
            quantity: 1,
            unit: inventory.items[itemIndex].unit,
            productId: inventory.items[itemIndex].productId,
            addedBy: req.user._id,
            addedAt: new Date(),
            notes: 'Auto-added from low stock inventory',
          });
          
          await groceryList.save();
        }
      }
    } catch (error) {
      console.error('Error adding low stock item to grocery list:', error);
    }
  }
  
  res.json(inventory.items[itemIndex]);
});

// @desc    Remove item from inventory
// @route   DELETE /api/inventory/:id
// @access  Private
const removeInventoryItem = asyncHandler(async (req, res) => {
  const { householdId } = req.query;
  
  // Build query
  let query;
  
  if (householdId) {
    // Check if user has access to this household
    const household = await Household.findById(householdId);
    if (!household) {
      res.status(404);
      throw new Error('Household not found');
    }
    
    const isAdmin = household.adminUserId.toString() === req.user._id.toString();
    const memberWithPermission = household.members.find(
      (member) =>
        member.userId.toString() === req.user._id.toString() &&
        member.permissions.includes('edit_inventory')
    );
    
    if (!isAdmin && !memberWithPermission) {
      res.status(403);
      throw new Error('Not authorized to remove items from this household inventory');
    }
    
    query = { householdId, isActive: true };
  } else {
    query = { userId: req.user._id, householdId: null, isActive: true };
  }
  
  // Find inventory
  const inventory = await Inventory.findOne(query);
  
  if (!inventory) {
    res.status(404);
    throw new Error('Inventory not found');
  }
  
  // Find the specific item
  const itemIndex = inventory.items.findIndex(
    (item) => item._id.toString() === req.params.id
  );
  
  if (itemIndex === -1) {
    res.status(404);
    throw new Error('Inventory item not found');
  }
  
  // Remove the item
  inventory.items.splice(itemIndex, 1);
  
  await inventory.save();
  
  res.json({ message: 'Item removed from inventory' });
});

// @desc    Get low stock items
// @route   GET /api/inventory/low-stock
// @access  Private
const getLowStockItems = asyncHandler(async (req, res) => {
  const { household } = req.query;
  
  // Build query
  let query;
  
  if (household) {
    // Check if user has access to this household
    const householdDoc = await Household.findById(household);
    if (!householdDoc) {
      res.status(404);
      throw new Error('Household not found');
    }
    
    const isAdmin = householdDoc.adminUserId.toString() === req.user._id.toString();
    const isMember = householdDoc.members.some(
      (member) => member.userId.toString() === req.user._id.toString()
    );
    
    if (!isAdmin && !isMember) {
      res.status(403);
      throw new Error('Not authorized to access this household inventory');
    }
    
    query = { householdId: household, isActive: true };
  } else {
    query = { userId: req.user._id, householdId: null, isActive: true };
  }
  
  // Find inventory
  const inventory = await Inventory.findOne(query)
    .populate('items.productId', 'name category image price')
    .populate('items.purchasedFrom', 'name location');
  
  if (!inventory) {
    return res.json({ items: [] });
  }
  
  // Filter low stock items
  const lowStockItems = inventory.items.filter((item) => item.isLowStock);
  
  // Sort by name
  lowStockItems.sort((a, b) => a.name.localeCompare(b.name));
  
  res.json({ items: lowStockItems });
});

// @desc    Get expiring items
// @route   GET /api/inventory/expiring
// @access  Private
const getExpiringItems = asyncHandler(async (req, res) => {
  const { household, days } = req.query;
  
  // Build query
  let query;
  
  if (household) {
    // Check if user has access to this household
    const householdDoc = await Household.findById(household);
    if (!householdDoc) {
      res.status(404);
      throw new Error('Household not found');
    }
    
    const isAdmin = householdDoc.adminUserId.toString() === req.user._id.toString();
    const isMember = householdDoc.members.some(
      (member) => member.userId.toString() === req.user._id.toString()
    );
    
    if (!isAdmin && !isMember) {
      res.status(403);
      throw new Error('Not authorized to access this household inventory');
    }
    
    query = { householdId: household, isActive: true };
  } else {
    query = { userId: req.user._id, householdId: null, isActive: true };
  }
  
  // Find inventory
  const inventory = await Inventory.findOne(query)
    .populate('items.productId', 'name category image price')
    .populate('items.purchasedFrom', 'name location');
  
  if (!inventory) {
    return res.json({ items: [] });
  }
  
  // Filter expiring items
  const today = new Date();
  const daysToCheck = parseInt(days) || inventory.settings.expiryNotificationDays;
  
  const expiringItems = inventory.items.filter((item) => {
    if (!item.expirationDate) return false;
    
    const expiryDate = new Date(item.expirationDate);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry <= daysToCheck && daysUntilExpiry >= 0;
  });
  
  // Sort by expiration date (ascending)
  expiringItems.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
  
  res.json({ items: expiringItems });
});

// @desc    Update inventory settings
// @route   PUT /api/inventory/settings
// @access  Private
const updateInventorySettings = asyncHandler(async (req, res) => {
  const { household } = req.query;
  
  // Build query
  let query;
  
  if (household) {
    // Check if user has access to this household
    const householdDoc = await Household.findById(household);
    if (!householdDoc) {
      res.status(404);
      throw new Error('Household not found');
    }
    
    const isAdmin = householdDoc.adminUserId.toString() === req.user._id.toString();
    const isMember = householdDoc.members.some(
      (member) => member.userId.toString() === req.user._id.toString()
    );
    
    if (!isAdmin && !isMember) {
      res.status(403);
      throw new Error('Not authorized to update this household inventory settings');
    }
    
    query = { householdId: household, isActive: true };
  } else {
    query = { userId: req.user._id, householdId: null, isActive: true };
  }
  
  // Find inventory
  let inventory = await Inventory.findOne(query);
  
  if (!inventory) {
    inventory = await Inventory.create({
      userId: req.user._id,
      householdId: household || null,
      items: [],
    });
  }
  
  // Update settings
  const { lowStockThresholdDefault, expiryNotificationDays, autoAddToGroceryList, defaultGroceryListId } = req.body;
  
  if (lowStockThresholdDefault !== undefined) {
    inventory.settings.lowStockThresholdDefault = lowStockThresholdDefault;
  }
  
  if (expiryNotificationDays !== undefined) {
    inventory.settings.expiryNotificationDays = expiryNotificationDays;
  }
  
  if (autoAddToGroceryList !== undefined) {
    inventory.settings.autoAddToGroceryList = autoAddToGroceryList;
  }
  
  if (defaultGroceryListId !== undefined) {
    // Verify grocery list exists and user has access to it
    if (defaultGroceryListId) {
      const groceryList = await GroceryList.findById(defaultGroceryListId);
      
      if (!groceryList) {
        res.status(404);
        throw new Error('Grocery list not found');
      }
      
      const isOwner = groceryList.userId.toString() === req.user._id.toString();
      const isSharedWithUser = groceryList.sharedWith.some(
        (shared) => shared.userId.toString() === req.user._id.toString() && shared.permissions === 'edit'
      );
      
      if (!isOwner && !isSharedWithUser) {
        res.status(403);
        throw new Error('Not authorized to use this grocery list for auto-adding items');
      }
    }
    
    inventory.settings.defaultGroceryListId = defaultGroceryListId;
  }
  
  await inventory.save();
  
  res.json(inventory.settings);
});

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats
// @access  Private
const getInventoryStats = asyncHandler(async (req, res) => {
  const { household } = req.query;
  
  // Build query
  let query;
  
  if (household) {
    // Check if user has access to this household
    const householdDoc = await Household.findById(household);
    if (!householdDoc) {
      res.status(404);
      throw new Error('Household not found');
    }
    
    const isAdmin = householdDoc.adminUserId.toString() === req.user._id.toString();
    const isMember = householdDoc.members.some(
      (member) => member.userId.toString() === req.user._id.toString()
    );
    
    if (!isAdmin && !isMember) {
      res.status(403);
      throw new Error('Not authorized to access this household inventory');
    }
    
    query = { householdId: household, isActive: true };
  } else {
    query = { userId: req.user._id, householdId: null, isActive: true };
  }
  
  // Find inventory
  const inventory = await Inventory.findOne(query);
  
  if (!inventory || inventory.items.length === 0) {
    return res.json({
      totalItems: 0,
      totalValue: 0,
      lowStockItems: 0,
      expiringItems: 0,
      categoryBreakdown: [],
      locationBreakdown: [],
    });
  }
  
  // Calculate statistics
  const totalItems = inventory.items.length;
  const totalValue = inventory.items.reduce(
    (sum, item) => sum + (item.price * item.quantity || 0),
    0
  );
  const lowStockItems = inventory.items.filter((item) => item.isLowStock).length;
  
  // Calculate expiring items
  const today = new Date();
  const expiringItems = inventory.items.filter((item) => {
    if (!item.expirationDate) return false;
    
    const expiryDate = new Date(item.expirationDate);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry <= inventory.settings.expiryNotificationDays && daysUntilExpiry >= 0;
  }).length;
  
  // Category breakdown
  const categories = {};
  inventory.items.forEach((item) => {
    const category = item.category || 'Uncategorized';
    if (!categories[category]) {
      categories[category] = 0;
    }
    categories[category]++;
  });
  
  const categoryBreakdown = Object.entries(categories).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / totalItems) * 100),
  }));
  
  // Location breakdown
  const locations = {};
  inventory.items.forEach((item) => {
    const location = item.location || 'Other';
    if (!locations[location]) {
      locations[location] = 0;
    }
    locations[location]++;
  });
  
  const locationBreakdown = Object.entries(locations).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / totalItems) * 100),
  }));
  
  res.json({
    totalItems,
    totalValue,
    lowStockItems,
    expiringItems,
    categoryBreakdown,
    locationBreakdown,
  });
});

// @desc    Bulk add items to inventory
// @route   POST /api/inventory/bulk
// @access  Private
const bulkAddInventoryItems = asyncHandler(async (req, res) => {
  const { items, householdId } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of items');
  }
  
  // Check if user has access to this household if provided
  if (householdId) {
    const household = await Household.findById(householdId);
    if (!household) {
      res.status(404);
      throw new Error('Household not found');
    }
    
    const isAdmin = household.adminUserId.toString() === req.user._id.toString();
    const memberWithPermission = household.members.find(
      (member) =>
        member.userId.toString() === req.user._id.toString() &&
        member.permissions.includes('edit_inventory')
    );
    
    if (!isAdmin && !memberWithPermission) {
      res.status(403);
      throw new Error('Not authorized to add items to this household inventory');
    }
  }
  
  // Find or create inventory
  let inventory = await Inventory.findOne({
    userId: req.user._id,
    householdId: householdId || null,
    isActive: true,
  });
  
  if (!inventory) {
    inventory = await Inventory.create({
      userId: req.user._id,
      householdId: householdId || null,
      items: [],
    });
  }
  
  // Process each item
  const addedItems = [];
  const errors = [];
  
  for (const item of items) {
    try {
      if (!item.name) {
        errors.push({ item, error: 'Item name is required' });
        continue;
      }
      
      // Check if product exists and get details if available
      let productDetails = {};
      if (item.productId) {
        const product = await Product.findById(item.productId);
        if (product) {
          productDetails = {
            name: product.name,
            category: product.category,
            image: product.image,
            barcode: product.barcode,
          };
        }
      }
      
      // Create new item
      const newItem = {
        name: item.name || productDetails.name,
        category: item.category || productDetails.category,
        quantity: item.quantity || 1,
        unit: item.unit,
        purchaseDate: item.purchaseDate || new Date(),
        expirationDate: item.expirationDate,
        location: item.location || 'pantry',
        notes: item.notes,
        price: item.price || 0,
        purchasedFrom: item.purchasedFrom,
        barcode: item.barcode || productDetails.barcode,
        image: item.image || productDetails.image,
        lowStockThreshold: item.lowStockThreshold || inventory.settings.lowStockThresholdDefault,
        productId: item.productId,
        addedBy: req.user._id,
        updatedBy: req.user._id,
        lastUpdated: new Date(),
      };
      
      // Check if item is low stock
      newItem.isLowStock = newItem.quantity <= newItem.lowStockThreshold;
      
      // Check if item is expiring soon
      if (newItem.expirationDate) {
        const expiryDate = new Date(newItem.expirationDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        newItem.isExpiringSoon = daysUntilExpiry <= inventory.settings.expiryNotificationDays;
      }
      
      // Add item to inventory
      inventory.items.push(newItem);
      addedItems.push(newItem);
    } catch (error) {
      errors.push({ item, error: error.message });
    }
  }
  
  if (addedItems.length > 0) {
    await inventory.save();
  }
  
  res.status(201).json({
    success: true,
    addedItems,
    errors,
    message: `Added ${addedItems.length} items to inventory${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
  });
});

// @desc    Scan barcode to add item
// @route   POST /api/inventory/scan
// @access  Private
const scanBarcodeItem = asyncHandler(async (req, res) => {
  const { barcode, householdId } = req.body;
  
  if (!barcode) {
    res.status(400);
    throw new Error('Please provide a barcode');
  }
  
  // Check if user has access to this household if provided
  if (householdId) {
    const household = await Household.findById(householdId);
    if (!household) {
      res.status(404);
      throw new Error('Household not found');
    }
    
    const isAdmin = household.adminUserId.toString() === req.user._id.toString();
    const memberWithPermission = household.members.find(
      (member) =>
        member.userId.toString() === req.user._id.toString() &&
        member.permissions.includes('edit_inventory')
    );
    
    if (!isAdmin && !memberWithPermission) {
      res.status(403);
      throw new Error('Not authorized to add items to this household inventory');
    }
  }
  
  // Find product by barcode
  const product = await Product.findOne({ barcode });
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found with this barcode');
  }
  
  // Find or create inventory
  let inventory = await Inventory.findOne({
    userId: req.user._id,
    householdId: householdId || null,
    isActive: true,
  });
  
  if (!inventory) {
    inventory = await Inventory.create({
      userId: req.user._id,
      householdId: householdId || null,
      items: [],
    });
  }
  
  // Check if item already exists in inventory
  const existingItemIndex = inventory.items.findIndex(
    (item) => item.productId && item.productId.toString() === product._id.toString()
  );
  
  if (existingItemIndex !== -1) {
    // Update existing item
    inventory.items[existingItemIndex].quantity += 1;
    inventory.items[existingItemIndex].updatedBy = req.user._id;
    inventory.items[existingItemIndex].lastUpdated = new Date();
    
    // Check if item is still low stock after update
    inventory.items[existingItemIndex].isLowStock =
      inventory.items[existingItemIndex].quantity <=
      inventory.items[existingItemIndex].lowStockThreshold;
    
    await inventory.save();
    
    res.json({
      message: 'Item quantity updated in inventory',
      item: inventory.items[existingItemIndex],
    });
  } else {
    // Create new item
    const newItem = {
      name: product.name,
      category: product.category,
      quantity: 1,
      unit: product.unit,
      purchaseDate: new Date(),
      location: 'pantry',
      price: product.price || 0,
      barcode: product.barcode,
      image: product.image,
      lowStockThreshold: inventory.settings.lowStockThresholdDefault,
      productId: product._id,
      addedBy: req.user._id,
      updatedBy: req.user._id,
      lastUpdated: new Date(),
      isLowStock: 1 <= inventory.settings.lowStockThresholdDefault,
    };
    
    inventory.items.push(newItem);
    await inventory.save();
    
    res.status(201).json({
      message: 'Item added to inventory',
      item: inventory.items[inventory.items.length - 1],
    });
  }
});

module.exports = {
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
};