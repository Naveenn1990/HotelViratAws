const express = require('express');
const router = express.Router();
const {
  createCounterBill,
  getCounterBillById,
  listCounterBills
} = require('../controller/counterBillController');

// Counter bill routes
router.post('/', createCounterBill);
router.get('/', listCounterBills);
router.get('/:id', getCounterBillById);

module.exports = router;