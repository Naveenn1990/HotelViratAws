const express = require('express');
const router = express.Router();

// Basic terms routes - add your terms controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Terms routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create terms endpoint' });
});

module.exports = router;