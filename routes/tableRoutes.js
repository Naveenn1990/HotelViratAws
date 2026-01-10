const express = require('express');
const router = express.Router();
const {
  createTable,
  getTables,
  getTableById,
  updateTable,
  deleteTable,
} = require('../controller/tableController');

// Table routes
router.get('/', getTables);
router.post('/', createTable);
router.get('/:id', getTableById);
router.put('/:id', updateTable);
router.delete('/:id', deleteTable);

module.exports = router;