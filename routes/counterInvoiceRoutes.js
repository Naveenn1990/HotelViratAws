const express = require('express');
const router = express.Router();
const invoiceController = require('../controller/counterInvoiceController');

// POST endpoint to create an invoice
router.post('/invoices', invoiceController.addInvoice);

// GET endpoint to get next bill number for a branch
router.get('/next-bill-number/:branchId', invoiceController.getNextBillNumber);

// GET endpoint to get next KOT number for a branch
router.get('/next-kot-number/:branchId', invoiceController.getNextKOTNumber);

// GET endpoint to get current counters for debugging
router.get('/counters/:branchId', invoiceController.getCurrentCounters);

module.exports = router;