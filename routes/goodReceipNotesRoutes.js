const express = require('express');
const router = express.Router();

// Basic goodreceipnotes routes - add your goodreceipnotes controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Goodreceipnotes routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create goodreceipnotes endpoint' });
});

module.exports = router;