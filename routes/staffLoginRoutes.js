const express = require('express');
const router = express.Router();

// Basic stafflogin routes - add your stafflogin controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Stafflogin routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create stafflogin endpoint' });
});

module.exports = router;