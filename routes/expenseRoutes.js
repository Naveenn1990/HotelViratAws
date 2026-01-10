const express = require('express');
const router = express.Router();

// Basic expense routes - add your expense controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Expense routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create expense endpoint' });
});

module.exports = router;