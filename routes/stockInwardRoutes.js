const express = require('express');
const router = express.Router();

// Basic stockinward routes - add your stockinward controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Stockinward routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create stockinward endpoint' });
});

module.exports = router;