const express = require('express');
const router = express.Router();

// Basic rawmaterial routes - add your rawmaterial controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Rawmaterial routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create rawmaterial endpoint' });
});

module.exports = router;