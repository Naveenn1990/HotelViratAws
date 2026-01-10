const express = require('express');
const router = express.Router();
const {
  getAllCategoryAccess,
  getCategoryAccessById,
  createCategoryAccess,
  updateCategoryAccess,
  deleteCategoryAccess,
  loginCategoryAccess
} = require('../controller/categoryAccessController');

// Get all category access users
router.get('/', getAllCategoryAccess);

// Login category access user
router.post('/login', loginCategoryAccess);

// Create category access user
router.post('/', createCategoryAccess);

// Get category access by ID
router.get('/:id', getCategoryAccessById);

// Update category access user
router.put('/:id', updateCategoryAccess);

// Delete category access user
router.delete('/:id', deleteCategoryAccess);

module.exports = router;