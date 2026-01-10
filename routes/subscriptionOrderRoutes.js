const express = require('express');
const router = express.Router();

// Basic subscriptionorder routes - add your subscriptionorder controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Subscriptionorder routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create subscriptionorder endpoint' });
});

module.exports = router;