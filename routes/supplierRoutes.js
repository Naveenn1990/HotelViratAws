const express = require('express');
const router = express.Router();
const supplierController = require('../controller/supplierController');

// Supplier routes
router.get('/', supplierController.getAll);
router.get('/:id', supplierController.getOne);
router.post('/', supplierController.create);
router.put('/:id', supplierController.update);
router.delete('/:id', supplierController.remove);

module.exports = router;