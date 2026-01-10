const express = require('express');
const router = express.Router();

// Basic customerdetails routes - add your customerdetails controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Customerdetails routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create customerdetails endpoint' });
});

module.exports = router;