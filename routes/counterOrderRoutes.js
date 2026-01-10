const express = require('express');
const router = express.Router();
const {
  createCounterOrder,
  getCounterOrderById,
  getAllCounterOrders,
  getCounterOrdersByUserId,
  updateCounterOrder,
  updateCounterOrderStatus,
  updateCounterPaymentStatus,
  cancelCounterOrder
} = require('../controller/counterOrderController');

// Counter order routes
router.post('/', createCounterOrder);
router.get('/', getAllCounterOrders);
router.get('/:id', getCounterOrderById);
router.get('/user/:userId', getCounterOrdersByUserId);
router.put('/:id', updateCounterOrder);
router.put('/:id/status', updateCounterOrderStatus);
router.put('/:id/payment-status', updateCounterPaymentStatus);
router.put('/:id/cancel', cancelCounterOrder);

module.exports = router;