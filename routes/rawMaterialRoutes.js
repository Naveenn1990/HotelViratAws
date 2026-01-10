const express = require('express');
const router = express.Router();
const rawMaterialController = require('../controller/rawMaterialController');

// Raw material routes
router.get('/', rawMaterialController.getAllRawMaterials);
router.get('/low-stock', rawMaterialController.getLowStockItems);
router.get('/category/:category', rawMaterialController.getMaterialsByCategory);
router.get('/:id', rawMaterialController.getRawMaterialById);
router.post('/', rawMaterialController.createRawMaterial);
router.put('/:id', rawMaterialController.updateRawMaterial);
router.put('/:id/stock', rawMaterialController.updateStock);
router.delete('/:id', rawMaterialController.deleteRawMaterial);

module.exports = router;