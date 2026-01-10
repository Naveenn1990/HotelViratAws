const express = require('express');
const router = express.Router();

// Basic aboutus routes - add your aboutus controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Aboutus routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create aboutus endpoint' });
});

module.exports = router;