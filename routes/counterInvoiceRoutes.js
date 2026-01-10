const express = require('express');
const router = express.Router();

// Basic counterinvoice routes - add your counterinvoice controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Counterinvoice routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create counterinvoice endpoint' });
});

module.exports = router;