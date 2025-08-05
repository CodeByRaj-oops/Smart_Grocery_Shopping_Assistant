const asyncHandler = require('express-async-handler');
const Recipe = require('../models/recipeModel');
const User = require('../models/userModel');
const GroceryList = require('../models/groceryListModel');
const mongoose = require('mongoose');

// @desc    Get all recipes with filtering
// @route   GET /api/recipes
// @access  Public
const getRecipes = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  
  // Build filter criteria
  const filterCriteria = { isActive: true };
  
  // Add filters based on query parameters
  if (req.query.cuisine) {
    filterCriteria.cuisine = { $regex: req.query.cuisine, $options: 'i' };
  }
  
  if (req.query.mealType) {
    filterCriteria.mealType = req.query.mealType;
  }
  
  if (req.query.difficulty) {
    filterCriteria.difficulty = req.query.difficulty;
  }
  
  if (req.query.dietary) {
    const dietaryPreferences = req.query.dietary.split(',');
    filterCriteria.dietaryInfo = { $in: dietaryPreferences };
  }
  
  if (req.query.maxTime) {
    const maxTimeMinutes = Number(req.query.maxTime);
    filterCriteria.$or = [
      { 'totalTime.value': { $lte: maxTimeMinutes }, 'totalTime.unit': 'minutes' },
      { 'totalTime.value': { $lte: maxTimeMinutes / 60 }, 'totalTime.unit': 'hours' },
    ];
  }
  
  // Search by text if provided
  if (req.query.search) {
    filterCriteria.$text = { $search: req.query.search };
  }
  
  // Public recipes or user's own private recipes
  if (req.user) {
    filterCriteria.$or = [
      { isPublic: true },
      { createdBy: req.user._id, isPublic: false },
    ];
  } else {
    filterCriteria.isPublic = true;
  }
  
  // Build sort criteria
  let sortCriteria = {};
  
  switch (req.query.sort) {
    case 'rating':
      sortCriteria = { averageRating: -1 };
      break;
    case 'time_asc':
      sortCriteria = { 'totalTime.value': 1 };
      break;
    case 'time_desc':
      sortCriteria = { 'totalTime.value': -1 };
      break;
    case 'newest':
      sortCriteria = { createdAt: -1 };
      break;
    case 'popularity':
      sortCriteria = { popularity: -1 };
      break;
    default:
      sortCriteria = { popularity: -1, averageRating: -1 };
  }
  
  // Count total matching recipes
  const count = await Recipe.countDocuments(filterCriteria);
  
  // Get recipes with pagination
  const recipes = await Recipe.find(filterCriteria)
    .sort(sortCriteria)
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate('createdBy', 'profile.firstName profile.lastName')
    .select('-steps -ingredients.substitutes -reviews');
  
  res.json({
    recipes,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
    filters: {
      cuisine: req.query.cuisine || '',
      mealType: req.query.mealType || '',
      difficulty: req.query.difficulty || '',
      dietary: req.query.dietary || '',
      maxTime: req.query.maxTime || '',
      search: req.query.search || '',
    },
  });
});

// @desc    Get recipe by ID
// @route   GET /api/recipes/:id
// @access  Public
const getRecipeById = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id)
    .populate('createdBy', 'profile.firstName profile.lastName')
    .populate('reviews.userId', 'profile.firstName profile.lastName');
  
  if (!recipe || !recipe.isActive) {
    res.status(404);
    throw new Error('Recipe not found');
  }
  
  // Check if private recipe is accessible by the user
  if (!recipe.isPublic && (!req.user || recipe.createdBy._id.toString() !== req.user._id.toString())) {
    res.status(403);
    throw new Error('Not authorized to access this recipe');
  }
  
  // Increment popularity
  recipe.popularity += 1;
  await recipe.save();
  
  res.json(recipe);
});

// @desc    Create a new recipe
// @route   POST /api/recipes
// @access  Private
const createRecipe = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    images,
    mainImage,
    prepTime,
    cookTime,
    servings,
    difficulty,
    ingredients,
    steps,
    nutritionalInfo,
    cuisine,
    mealType,
    dietaryInfo,
    allergens,
    tags,
    estimatedCost,
    tips,
    videoUrl,
    isPublic,
  } = req.body;
  
  // Validate required fields
  if (!title || !description || !servings || !ingredients || !steps) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }
  
  // Create recipe
  const recipe = await Recipe.create({
    title,
    description,
    createdBy: req.user._id,
    images: images || [],
    mainImage,
    prepTime: prepTime || { value: 0, unit: 'minutes' },
    cookTime: cookTime || { value: 0, unit: 'minutes' },
    servings,
    difficulty: difficulty || 'medium',
    ingredients,
    steps,
    nutritionalInfo: nutritionalInfo || {},
    cuisine,
    mealType,
    dietaryInfo: dietaryInfo || [],
    allergens: allergens || [],
    tags: tags || [],
    estimatedCost: estimatedCost || {},
    tips: tips || [],
    videoUrl,
    isPublic: isPublic !== undefined ? isPublic : true,
  });
  
  res.status(201).json(recipe);
});

// @desc    Update a recipe
// @route   PUT /api/recipes/:id
// @access  Private
const updateRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  
  if (!recipe) {
    res.status(404);
    throw new Error('Recipe not found');
  }
  
  // Check if user is authorized to update the recipe
  if (recipe.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this recipe');
  }
  
  const {
    title,
    description,
    images,
    mainImage,
    prepTime,
    cookTime,
    servings,
    difficulty,
    ingredients,
    steps,
    nutritionalInfo,
    cuisine,
    mealType,
    dietaryInfo,
    allergens,
    tags,
    estimatedCost,
    tips,
    videoUrl,
    isPublic,
    isActive,
  } = req.body;
  
  // Update recipe fields
  recipe.title = title || recipe.title;
  recipe.description = description || recipe.description;
  if (images) recipe.images = images;
  if (mainImage !== undefined) recipe.mainImage = mainImage;
  if (prepTime) recipe.prepTime = prepTime;
  if (cookTime) recipe.cookTime = cookTime;
  if (servings) recipe.servings = servings;
  if (difficulty) recipe.difficulty = difficulty;
  if (ingredients) recipe.ingredients = ingredients;
  if (steps) recipe.steps = steps;
  if (nutritionalInfo) recipe.nutritionalInfo = nutritionalInfo;
  if (cuisine !== undefined) recipe.cuisine = cuisine;
  if (mealType) recipe.mealType = mealType;
  if (dietaryInfo) recipe.dietaryInfo = dietaryInfo;
  if (allergens) recipe.allergens = allergens;
  if (tags) recipe.tags = tags;
  if (estimatedCost) recipe.estimatedCost = estimatedCost;
  if (tips) recipe.tips = tips;
  if (videoUrl !== undefined) recipe.videoUrl = videoUrl;
  if (isPublic !== undefined) recipe.isPublic = isPublic;
  if (isActive !== undefined) recipe.isActive = isActive;
  
  const updatedRecipe = await recipe.save();
  
  res.json(updatedRecipe);
});

// @desc    Delete a recipe
// @route   DELETE /api/recipes/:id
// @access  Private
const deleteRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  
  if (!recipe) {
    res.status(404);
    throw new Error('Recipe not found');
  }
  
  // Check if user is authorized to delete the recipe
  if (recipe.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this recipe');
  }
  
  // Soft delete
  recipe.isActive = false;
  await recipe.save();
  
  res.json({ message: 'Recipe removed' });
});

// @desc    Create recipe review
// @route   POST /api/recipes/:id/reviews
// @access  Private
const createRecipeReview = asyncHandler(async (req, res) => {
  const { rating, comment, images } = req.body;
  
  if (!rating) {
    res.status(400);
    throw new Error('Please add a rating');
  }
  
  const recipe = await Recipe.findById(req.params.id);
  
  if (!recipe) {
    res.status(404);
    throw new Error('Recipe not found');
  }
  
  // Check if user already reviewed this recipe
  const alreadyReviewed = recipe.reviews.find(
    (review) => review.userId.toString() === req.user._id.toString()
  );
  
  if (alreadyReviewed) {
    res.status(400);
    throw new Error('Recipe already reviewed');
  }
  
  // Create review
  const review = {
    userId: req.user._id,
    rating: Number(rating),
    comment,
    images: images || [],
    createdAt: new Date(),
  };
  
  // Add review to recipe
  recipe.reviews.push(review);
  
  // Update recipe rating statistics
  recipe.numReviews = recipe.reviews.length;
  recipe.averageRating =
    recipe.reviews.reduce((acc, item) => item.rating + acc, 0) / recipe.reviews.length;
  
  // Increase recipe popularity
  recipe.popularity += 2;
  
  await recipe.save();
  
  res.status(201).json({ message: 'Review added' });
});

// @desc    Get top rated recipes
// @route   GET /api/recipes/top
// @access  Public
const getTopRecipes = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 5;
  
  const recipes = await Recipe.find({ isActive: true, isPublic: true })
    .sort({ averageRating: -1, popularity: -1 })
    .limit(limit)
    .select('title mainImage averageRating numReviews prepTime cookTime difficulty');
  
  res.json(recipes);
});

// @desc    Get recipes by dietary preference
// @route   GET /api/recipes/dietary/:preference
// @access  Public
const getRecipesByDietaryPreference = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  const preference = req.params.preference;
  
  const count = await Recipe.countDocuments({
    dietaryInfo: preference,
    isActive: true,
    isPublic: true,
  });
  
  const recipes = await Recipe.find({
    dietaryInfo: preference,
    isActive: true,
    isPublic: true,
  })
    .sort({ popularity: -1, averageRating: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .select('title mainImage averageRating numReviews prepTime cookTime difficulty');
  
  res.json({
    recipes,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
    preference,
  });
});

// @desc    Get recipes by cuisine
// @route   GET /api/recipes/cuisine/:cuisine
// @access  Public
const getRecipesByCuisine = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  const cuisine = req.params.cuisine;
  
  const count = await Recipe.countDocuments({
    cuisine: { $regex: cuisine, $options: 'i' },
    isActive: true,
    isPublic: true,
  });
  
  const recipes = await Recipe.find({
    cuisine: { $regex: cuisine, $options: 'i' },
    isActive: true,
    isPublic: true,
  })
    .sort({ popularity: -1, averageRating: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .select('title mainImage averageRating numReviews prepTime cookTime difficulty');
  
  res.json({
    recipes,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
    cuisine,
  });
});

// @desc    Get recipes by meal type
// @route   GET /api/recipes/meal/:mealType
// @access  Public
const getRecipesByMealType = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  const mealType = req.params.mealType;
  
  const count = await Recipe.countDocuments({
    mealType,
    isActive: true,
    isPublic: true,
  });
  
  const recipes = await Recipe.find({
    mealType,
    isActive: true,
    isPublic: true,
  })
    .sort({ popularity: -1, averageRating: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .select('title mainImage averageRating numReviews prepTime cookTime difficulty');
  
  res.json({
    recipes,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
    mealType,
  });
});

// @desc    Get recipes by ingredient
// @route   GET /api/recipes/ingredient/:ingredient
// @access  Public
const getRecipesByIngredient = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  const ingredient = req.params.ingredient;
  
  const count = await Recipe.countDocuments({
    'ingredients.name': { $regex: ingredient, $options: 'i' },
    isActive: true,
    isPublic: true,
  });
  
  const recipes = await Recipe.find({
    'ingredients.name': { $regex: ingredient, $options: 'i' },
    isActive: true,
    isPublic: true,
  })
    .sort({ popularity: -1, averageRating: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .select('title mainImage averageRating numReviews prepTime cookTime difficulty');
  
  res.json({
    recipes,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
    ingredient,
  });
});

// @desc    Get recipes by user
// @route   GET /api/recipes/user/:userId
// @access  Private
const getRecipesByUser = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  const userId = req.params.userId;
  
  // Check if user is requesting their own recipes or public recipes of another user
  const isOwnRecipes = req.user._id.toString() === userId;
  
  let filterCriteria = {
    createdBy: userId,
    isActive: true,
  };
  
  // If not own recipes, only show public recipes
  if (!isOwnRecipes) {
    filterCriteria.isPublic = true;
  }
  
  const count = await Recipe.countDocuments(filterCriteria);
  
  const recipes = await Recipe.find(filterCriteria)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .select('title mainImage averageRating numReviews prepTime cookTime difficulty isPublic');
  
  res.json({
    recipes,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
    userId,
    isOwnRecipes,
  });
});

// @desc    Get recipes by difficulty
// @route   GET /api/recipes/difficulty/:level
// @access  Public
const getRecipesByDifficulty = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  const difficulty = req.params.level;
  
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    res.status(400);
    throw new Error('Invalid difficulty level. Must be easy, medium, or hard');
  }
  
  const count = await Recipe.countDocuments({
    difficulty,
    isActive: true,
    isPublic: true,
  });
  
  const recipes = await Recipe.find({
    difficulty,
    isActive: true,
    isPublic: true,
  })
    .sort({ popularity: -1, averageRating: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .select('title mainImage averageRating numReviews prepTime cookTime');
  
  res.json({
    recipes,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
    difficulty,
  });
});

// @desc    Get recipes by max preparation time
// @route   GET /api/recipes/time/:maxTime
// @access  Public
const getRecipesByTime = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  const maxTimeMinutes = Number(req.params.maxTime);
  
  if (isNaN(maxTimeMinutes) || maxTimeMinutes <= 0) {
    res.status(400);
    throw new Error('Invalid time parameter. Must be a positive number');
  }
  
  const count = await Recipe.countDocuments({
    $or: [
      { 'totalTime.value': { $lte: maxTimeMinutes }, 'totalTime.unit': 'minutes' },
      { 'totalTime.value': { $lte: maxTimeMinutes / 60 }, 'totalTime.unit': 'hours' },
    ],
    isActive: true,
    isPublic: true,
  });
  
  const recipes = await Recipe.find({
    $or: [
      { 'totalTime.value': { $lte: maxTimeMinutes }, 'totalTime.unit': 'minutes' },
      { 'totalTime.value': { $lte: maxTimeMinutes / 60 }, 'totalTime.unit': 'hours' },
    ],
    isActive: true,
    isPublic: true,
  })
    .sort({ 'totalTime.value': 1, popularity: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .select('title mainImage averageRating numReviews prepTime cookTime totalTime difficulty');
  
  res.json({
    recipes,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
    maxTimeMinutes,
  });
});

// @desc    Get personalized recipe recommendations
// @route   GET /api/recipes/recommendations
// @access  Private
const getRecipeRecommendations = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Get user's dietary preferences
  const dietaryPreferences = user.profile.dietaryPreferences || [];
  
  // Build recommendation criteria
  const recommendationCriteria = {
    isActive: true,
    isPublic: true,
  };
  
  // Add dietary preferences if available
  if (dietaryPreferences.length > 0) {
    recommendationCriteria.dietaryInfo = { $in: dietaryPreferences };
  }
  
  // Get recipes based on user preferences
  const recommendedRecipes = await Recipe.find(recommendationCriteria)
    .sort({ popularity: -1, averageRating: -1 })
    .limit(10)
    .select('title mainImage averageRating numReviews prepTime cookTime difficulty');
  
  res.json({
    recommendations: recommendedRecipes,
    basedOn: {
      dietaryPreferences,
    },
  });
});

// @desc    Add recipe to user's favorites
// @route   POST /api/recipes/:id/favorite
// @access  Private
const addRecipeToFavorites = asyncHandler(async (req, res) => {
  const recipeId = req.params.id;
  
  // Check if recipe exists
  const recipe = await Recipe.findById(recipeId);
  
  if (!recipe) {
    res.status(404);
    throw new Error('Recipe not found');
  }
  
  // Update user's favorites
  const user = await User.findById(req.user._id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Check if user already has favorites field
  if (!user.favorites) {
    user.favorites = { recipes: [] };
  }
  
  // Check if recipe is already in favorites
  if (user.favorites.recipes.includes(recipeId)) {
    res.status(400);
    throw new Error('Recipe already in favorites');
  }
  
  // Add to favorites
  user.favorites.recipes.push(recipeId);
  await user.save();
  
  // Increase recipe popularity
  recipe.popularity += 3;
  await recipe.save();
  
  res.status(200).json({ message: 'Recipe added to favorites' });
});

// @desc    Remove recipe from user's favorites
// @route   DELETE /api/recipes/:id/favorite
// @access  Private
const removeRecipeFromFavorites = asyncHandler(async (req, res) => {
  const recipeId = req.params.id;
  
  // Update user's favorites
  const user = await User.findById(req.user._id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Check if user has favorites
  if (!user.favorites || !user.favorites.recipes) {
    res.status(400);
    throw new Error('No favorites found');
  }
  
  // Check if recipe is in favorites
  if (!user.favorites.recipes.includes(recipeId)) {
    res.status(400);
    throw new Error('Recipe not in favorites');
  }
  
  // Remove from favorites
  user.favorites.recipes = user.favorites.recipes.filter(
    (id) => id.toString() !== recipeId
  );
  
  await user.save();
  
  res.status(200).json({ message: 'Recipe removed from favorites' });
});

// @desc    Get user's favorite recipes
// @route   GET /api/recipes/favorites
// @access  Private
const getUserFavoriteRecipes = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Check if user has favorites
  if (!user.favorites || !user.favorites.recipes || user.favorites.recipes.length === 0) {
    return res.json({ recipes: [] });
  }
  
  // Get favorite recipes
  const favoriteRecipes = await Recipe.find({
    _id: { $in: user.favorites.recipes },
    isActive: true,
  })
    .select('title mainImage averageRating numReviews prepTime cookTime difficulty')
    .sort({ title: 1 });
  
  res.json({ recipes: favoriteRecipes });
});

// @desc    Convert recipe to grocery list
// @route   POST /api/recipes/:id/convert-to-list
// @access  Private
const convertRecipeToGroceryList = asyncHandler(async (req, res) => {
  const { listName, servings, householdId, scheduledDate } = req.body;
  
  // Get recipe
  const recipe = await Recipe.findById(req.params.id);
  
  if (!recipe) {
    res.status(404);
    throw new Error('Recipe not found');
  }
  
  // Calculate ingredient quantities based on servings
  const servingMultiplier = servings ? servings / recipe.servings : 1;
  
  // Create grocery list items from recipe ingredients
  const groceryListItems = recipe.ingredients.map((ingredient) => {
    return {
      productId: ingredient.productId,
      name: ingredient.name,
      quantity: ingredient.quantity * servingMultiplier,
      unit: ingredient.unit,
      isChecked: false,
      notes: ingredient.isOptional ? 'Optional ingredient' : '',
      addedBy: req.user._id,
      addedAt: new Date(),
      priority: 'medium',
    };
  });
  
  // Create new grocery list
  const groceryList = await GroceryList.create({
    name: listName || `${recipe.title} Ingredients`,
    description: `Ingredients for ${recipe.title}`,
    userId: req.user._id,
    householdId: householdId || null,
    items: groceryListItems,
    listType: 'recipe',
    status: 'active',
    budget: recipe.estimatedCost ? recipe.estimatedCost.value : 0,
    scheduledDate: scheduledDate || null,
    recipeIds: [recipe._id],
    isActive: true,
    tags: ['recipe', ...recipe.tags],
  });
  
  // Increase recipe popularity
  recipe.popularity += 2;
  await recipe.save();
  
  res.status(201).json({
    message: 'Grocery list created from recipe',
    groceryList: {
      _id: groceryList._id,
      name: groceryList.name,
      itemCount: groceryList.items.length,
    },
  });
});

module.exports = {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  createRecipeReview,
  getTopRecipes,
  getRecipesByDietaryPreference,
  getRecipesByCuisine,
  getRecipesByMealType,
  getRecipesByIngredient,
  getRecipesByUser,
  getRecipesByDifficulty,
  getRecipesByTime,
  getRecipeRecommendations,
  addRecipeToFavorites,
  removeRecipeFromFavorites,
  getUserFavoriteRecipes,
  convertRecipeToGroceryList,
};