const express = require('express');
const router = express.Router();
const staffInvoiceController = require('../controller/staffInvoiceController');

// Get all invoices
router.get('/', staffInvoiceController.getAllInvoices);

// Get invoice statistics
router.get('/statistics', staffInvoiceController.getInvoiceStatistics);

// Get daily revenue report
router.get('/daily-revenue', staffInvoiceController.getDailyRevenueReport);

// Get invoices by user ID
router.get('/user/:userId', staffInvoiceController.getInvoicesByUserId);

// Get invoices by order ID
router.get('/order/:orderId', staffInvoiceController.getInvoicesByOrderId);

// Get invoice by invoice ID
router.get('/invoice/:invoiceId', staffInvoiceController.getInvoiceByInvoiceId);

// Get invoice by ID
router.get('/:id', staffInvoiceController.getInvoiceById);

// Create invoice from order
router.post('/from-order', staffInvoiceController.createInvoiceFromOrder);

// Update invoice
router.put('/:id', staffInvoiceController.updateInvoice);

// Delete invoice
router.delete('/:id', staffInvoiceController.deleteInvoice);

module.exports = router;