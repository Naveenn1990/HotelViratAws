const express = require('express');
const router = express.Router();
const counterInvoiceController = require('../controller/counterInvoiceController');

// Counter invoice routes
router.post('/', counterInvoiceController.addInvoice);

module.exports = router;