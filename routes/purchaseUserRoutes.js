const express = require('express');
const router = express.Router();

// Basic purchaseuser routes - add your purchaseuser controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Purchaseuser routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create purchaseuser endpoint' });
});

module.exports = router;