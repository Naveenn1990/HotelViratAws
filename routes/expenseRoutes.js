const express = require('express');
const router = express.Router();
const expenseController = require('../controller/expenseController');

// Expense routes
router.get('/', expenseController.getExpenses);
router.post('/', expenseController.createExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;