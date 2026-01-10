const express = require('express');
const router = express.Router();

// Basic address routes - add your address controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Address routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create address endpoint' });
});

module.exports = router;