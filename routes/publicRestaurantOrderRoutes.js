const express = require('express');
const router = express.Router();
const publicRestaurantOrderController = require('../controller/publicRestaurantOrderController');

// Public routes (no authentication required for customer orders)
router.post('/create', publicRestaurantOrderController.createPublicOrder);
router.get('/order/:orderId', publicRestaurantOrderController.getOrderById);
router.get('/customer/:mobile', publicRestaurantOrderController.getOrdersByMobile);

// Admin/Staff routes (add authentication middleware if needed)
router.get('/all', publicRestaurantOrderController.getAllPublicOrders);
router.patch('/update/:orderId', publicRestaurantOrderController.updateOrderStatus);

module.exports = router;
