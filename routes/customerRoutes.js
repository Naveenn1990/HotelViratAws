const express = require('express');
const router = express.Router();

// Basic customer routes - add your customer controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Customer routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create customer endpoint' });
});

module.exports = router;