const express = require('express');
const router = express.Router();

// Basic storelocation routes - add your storelocation controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Storelocation routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create storelocation endpoint' });
});

module.exports = router;