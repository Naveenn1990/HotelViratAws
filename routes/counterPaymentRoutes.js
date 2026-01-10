const express = require('express');
const router = express.Router();
const {
  processCounterPayment,
  getCounterPaymentById,
  getCounterPaymentsByOrder,
  getAllCounterPayments,
  updateCounterPaymentStatus
} = require('../controller/counterPaymentController');

// Counter payment routes
router.post('/', processCounterPayment);
router.get('/', getAllCounterPayments);
router.get('/:id', getCounterPaymentById);
router.get('/order/:orderId', getCounterPaymentsByOrder);
router.put('/:id/status', updateCounterPaymentStatus);

module.exports = router;