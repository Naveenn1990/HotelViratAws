const express = require('express');
const router = express.Router();

// Basic reservation routes - add your reservation controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Reservation routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create reservation endpoint' });
});

module.exports = router;