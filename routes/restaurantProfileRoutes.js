const express = require('express');
const router = express.Router();

// Basic restaurantprofile routes - add your restaurantprofile controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Restaurantprofile routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create restaurantprofile endpoint' });
});

module.exports = router;