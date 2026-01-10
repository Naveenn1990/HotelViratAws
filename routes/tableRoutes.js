const express = require('express');
const router = express.Router();

// Basic table routes - add your table controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Table routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create table endpoint' });
});

module.exports = router;