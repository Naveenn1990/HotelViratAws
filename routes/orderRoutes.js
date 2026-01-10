const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');

// Order routes
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);

// Category-specific orders
router.get('/category/:categoryId', orderController.getOrdersByCategory);

module.exports = router;