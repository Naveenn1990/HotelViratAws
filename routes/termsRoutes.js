const express = require('express');
const router = express.Router();
const termsController = require('../controller/termsController');

// Get all terms and policies
router.get('/', termsController.getTerms);

// Get term by ID
router.get('/:id', termsController.getTermById);

// Create term
router.post('/', termsController.createTerm);

// Update term
router.put('/:id', termsController.updateTerm);

// Delete term
router.delete('/:id', termsController.deleteTerm);

module.exports = router;