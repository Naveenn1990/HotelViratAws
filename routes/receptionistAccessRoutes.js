const express = require('express');
const router = express.Router();
const receptionistAccessController = require('../controller/receptionistAccessController');

// Get all receptionist access users
router.get('/', receptionistAccessController.getAllReceptionistAccess);

// Get receptionist access by ID
router.get('/:id', receptionistAccessController.getReceptionistAccessById);

// Create receptionist access user
router.post('/', receptionistAccessController.createReceptionistAccess);

// Update receptionist access user
router.put('/:id', receptionistAccessController.updateReceptionistAccess);

// Delete receptionist access user
router.delete('/:id', receptionistAccessController.deleteReceptionistAccess);

// Login receptionist
router.post('/login', receptionistAccessController.loginReceptionistAccess);

module.exports = router;