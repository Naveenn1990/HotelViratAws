const express = require('express');
const router = express.Router();

// Basic stafforder routes - add your stafforder controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Stafforder routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create stafforder endpoint' });
});

module.exports = router;