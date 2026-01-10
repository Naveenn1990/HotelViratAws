const express = require('express');
const router = express.Router();

// Basic admin routes - add your admin controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Admin routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create admin endpoint' });
});

module.exports = router;