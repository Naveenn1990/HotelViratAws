const express = require('express');
const router = express.Router();

// Basic coupon routes - add your coupon controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Coupon routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create coupon endpoint' });
});

module.exports = router;