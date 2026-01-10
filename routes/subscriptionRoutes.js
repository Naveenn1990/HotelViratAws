const express = require('express');
const router = express.Router();

// Basic subscription routes - add your subscription controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Subscription routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create subscription endpoint' });
});

module.exports = router;