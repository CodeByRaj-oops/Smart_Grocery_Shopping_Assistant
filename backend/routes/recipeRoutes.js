const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/recipeController');

// Public routes
router.route('/').get(getRecipes);
router.route('/top').get(getTopRecipes);
router.route('/dietary/:preference').get(getRecipesByDietaryPreference);
router.route('/cuisine/:cuisine').get(getRecipesByCuisine);
router.route('/meal/:mealType').get(getRecipesByMealType);
router.route('/ingredient/:ingredient').get(getRecipesByIngredient);
router.route('/difficulty/:level').get(getRecipesByDifficulty);
router.route('/time/:maxTime').get(getRecipesByTime);
router.route('/recommendations').get(protect, getRecipeRecommendations);
router.route('/:id').get(getRecipeById);

// Protected routes
router.route('/').post(protect, createRecipe);
router.route('/:id').put(protect, updateRecipe);
router.route('/:id').delete(protect, deleteRecipe);
router.route('/:id/reviews').post(protect, createRecipeReview);
router.route('/user/:userId').get(protect, getRecipesByUser);
router.route('/:id/favorite').post(protect, addRecipeToFavorites);
router.route('/:id/favorite').delete(protect, removeRecipeFromFavorites);
router.route('/favorites').get(protect, getUserFavoriteRecipes);
router.route('/:id/convert-to-list').post(protect, convertRecipeToGroceryList);

module.exports = router;