const express = require('express');
const router = express.Router();
const roomBookingController = require('../controller/roomBookingController');

// Room booking CRUD routes
router.post('/', roomBookingController.createBooking);
router.post('/walk-in', roomBookingController.createWalkInBooking);
router.get('/', roomBookingController.getBookings);
router.get('/payment-summary', roomBookingController.getPaymentSummary);
router.get('/cancellation-requests', roomBookingController.getCancellationRequests);
router.get('/slots/:roomId', roomBookingController.getRoomBookedTimeSlots);
router.get('/:id', roomBookingController.getBookingById);
router.get('/room/:roomId/active', roomBookingController.getRoomActiveBooking);

// Update routes
router.put('/:id/status', roomBookingController.updateBookingStatus);
router.put('/:id/payment', roomBookingController.updatePayment);
router.put('/:id/cancel', roomBookingController.cancelBooking);
router.put('/:id/request-cancel', roomBookingController.requestCancellation);
router.put('/:id/approve-cancel', roomBookingController.approveCancellation);

module.exports = router;