const express = require('express');
const router = express.Router();

// Basic purchase routes - add your purchase controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Purchase routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create purchase endpoint' });
});

module.exports = router;