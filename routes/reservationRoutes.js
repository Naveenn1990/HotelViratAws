const express = require('express');
const router = express.Router();
const {
  createReservation,
  getReservations,
  getReservationById,
  updateReservation,
  deleteReservation,
  cancelReservation,
} = require('../controller/reservationController');

// Get all reservations
router.get('/', getReservations);

// Create new reservation
router.post('/', createReservation);

// Get reservation by ID
router.get('/:id', getReservationById);

// Update reservation
router.put('/:id', updateReservation);

// Cancel reservation
router.put('/:id/cancel', cancelReservation);

// Delete reservation
router.delete('/:id', deleteReservation);

module.exports = router;