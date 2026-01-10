const express = require('express');
const router = express.Router();
const subcategoryController = require('../controller/subcategoryController');

// Subcategory CRUD routes
router.get('/', subcategoryController.getAllSubcategories);
router.get('/:id', subcategoryController.getSubcategoryById);
router.post('/', subcategoryController.createSubcategory);
router.put('/:id', subcategoryController.updateSubcategory);
router.delete('/:id', subcategoryController.deleteSubcategory);

module.exports = router;