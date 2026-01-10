const express = require('express');
const router = express.Router();
const staffOrderController = require('../controller/staffOrderController');

// Get all staff orders
router.get('/', staffOrderController.getAllStaffOrders);

// Get available statuses
router.get('/available-statuses', staffOrderController.getAvailableStatuses);

// Get order statistics
router.get('/statistics', staffOrderController.getOrderStatistics);

// Get orders by user ID
router.get('/user/:userId', staffOrderController.getOrdersByUserId);

// Get orders by branch
router.get('/branch/:branchId', staffOrderController.getOrdersByBranch);

// Get orders by payment status
router.get('/payment-status/:paymentStatus', staffOrderController.getOrdersByPaymentStatus);

// Get orders by table
router.get('/table/:branchId/:tableId', staffOrderController.getStaffOrdersByTable);

// Get guest orders by mobile
router.get('/guest/mobile/:mobile', staffOrderController.getGuestOrdersByMobile);

// Get order by orderId
router.get('/order/:orderId', staffOrderController.getStaffOrderByOrderId);

// Get order by ID
router.get('/:id', staffOrderController.getStaffOrderById);

// Create staff order after payment
router.post('/staff', staffOrderController.createStaffOrderAfterPayment);

// Create guest order
router.post('/guest', staffOrderController.createGuestOrder);

// Update order status
router.put('/:id', staffOrderController.updateStaffOrderStatus);

// Add items to order
router.put('/:id/add-items', staffOrderController.addItemsToStaffOrder);

// Delete order
router.delete('/:id', staffOrderController.deleteStaffOrder);

// Bulk delete orders
router.delete('/bulk/all', staffOrderController.bulkDeleteStaffOrders);

module.exports = router;