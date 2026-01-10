const express = require('express');
const router = express.Router();

// Basic recipe routes - add your recipe controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Recipe routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create recipe endpoint' });
});

module.exports = router;