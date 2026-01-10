const express = require('express');
const router = express.Router();

// Basic supplier routes - add your supplier controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Supplier routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create supplier endpoint' });
});

module.exports = router;