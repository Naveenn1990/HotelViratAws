const express = require('express');
const router = express.Router();
const {
  createMealOfTheDay,
  getAllMealsOfTheDay,
  getMealsByBranch,
  getMealOfTheDayById,
  updateMealOfTheDay,
  deleteMealOfTheDay,
  getTodaysMeal
} = require('../controller/mealOfTheDayController');

// Meal of the day routes
router.get('/', getAllMealsOfTheDay);
router.post('/', createMealOfTheDay);
router.get('/branch/:branchId', getMealsByBranch);
router.get('/today/:branchId', getTodaysMeal);
router.get('/:id', getMealOfTheDayById);
router.put('/:id', updateMealOfTheDay);
router.delete('/:id', deleteMealOfTheDay);

module.exports = router;