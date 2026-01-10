const express = require('express');
const router = express.Router();

// Basic receptionistaccess routes - add your receptionistaccess controller when available
router.get('/', (req, res) => {
  res.json({ message: 'Receptionistaccess routes working' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create receptionistaccess endpoint' });
});

module.exports = router;