const express = require('express');
const router = express.Router();
const roomController = require('../controller/roomController');
const upload = require('../middleware/multerConfig');

// Room CRUD routes
router.post('/', upload.array('images', 5), roomController.createRoom);
router.get('/', roomController.getRooms);
router.get('/:id', roomController.getRoomById);
router.put('/:id', upload.array('images', 5), roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);

module.exports = router;