const express = require('express');
const router = express.Router();
const {
  printThermalReceipt,
  printThermalReceiptUSB,
  discoverThermalPrinters
} = require('../controller/thermalPrintController');

// Thermal printing routes
router.post('/network', printThermalReceipt);
router.post('/usb', printThermalReceiptUSB);
router.get('/discover', discoverThermalPrinters);

module.exports = router;