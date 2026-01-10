const express = require('express');
const router = express.Router();
const menuController = require('../controller/menuController');
const upload = require('../middleware/multerConfig');

// Menu CRUD routes
router.post('/', upload.single('image'), menuController.createMenuItem);
router.get('/', menuController.getAllMenuItems);
router.get('/:id', menuController.getMenuItemById);
router.put('/:id', upload.single('image'), menuController.updateMenuItem);
router.delete('/:id', menuController.deleteMenuItem);

// Get menu items by category
router.get('/category/:categoryId', menuController.getMenuItemsByCategory);

// New route for getting menu item by number
router.get('/number/:number', menuController.getMenuItemByNumber);

module.exports = router;