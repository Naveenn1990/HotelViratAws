const express = require('express');
const router = express.Router();

// Basic helpsupport routes - add your helpsupport controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Helpsupport routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create helpsupport endpoint' });
});

module.exports = router;