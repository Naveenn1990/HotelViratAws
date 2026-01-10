const express = require('express');
const router = express.Router();

// Basic mealoftheday routes - add your mealoftheday controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Mealoftheday routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create mealoftheday endpoint' });
});

module.exports = router;