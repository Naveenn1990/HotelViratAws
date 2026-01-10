const express = require('express');
const router = express.Router();

// Basic peopleselection routes - add your peopleselection controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Peopleselection routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create peopleselection endpoint' });
});

module.exports = router;