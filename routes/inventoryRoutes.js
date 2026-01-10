const express = require('express');
const router = express.Router();
const inventoryController = require('../controller/inventoryController');

// Inventory routes
router.get('/:branchId', inventoryController.getInventoryByBranch);
router.get('/low-stock/:branchId', inventoryController.getLowStockProducts);
router.get('/history/:productId', inventoryController.getStockHistory);
router.get('/export/:branchId', inventoryController.exportInventory);
router.put('/update/:productId', inventoryController.updateProductStock);
router.put('/bulk-update', inventoryController.bulkUpdateStock);

module.exports = router;