const express = require('express');
const router = express.Router();

// Basic categoryaccess routes - add your categoryaccess controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Categoryaccess routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create categoryaccess endpoint' });
});

module.exports = router;