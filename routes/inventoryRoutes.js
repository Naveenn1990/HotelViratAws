const express = require('express');
const router = express.Router();

// Basic inventory routes - add your inventory controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Inventory routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create inventory endpoint' });
});

module.exports = router;