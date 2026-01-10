const express = require('express');
const router = express.Router();

// Basic staffinvoice routes - add your staffinvoice controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Staffinvoice routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create staffinvoice endpoint' });
});

module.exports = router;