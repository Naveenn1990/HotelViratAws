const express = require("express");
const router = express.Router();
const {
  createBooking,
  createWalkInBooking,
  getBookings,
  getBookingById,
  getRoomActiveBooking,
  getRoomBookedTimeSlots,
  updateBookingStatus,
  updatePayment,
  cancelBooking,
  requestCancellation,
  approveCancellation,
  getCancellationRequests,
  getPaymentSummary,
  addRestaurantBill,
  removeRestaurantBill,
} = require("../controller/roomBookingController");

router.route("/").post(createBooking).get(getBookings);
router.route("/walk-in").post(createWalkInBooking);
router.route("/payment-summary").get(getPaymentSummary);
router.route("/cancellation-requests").get(getCancellationRequests);
router.route("/room/:roomId/active").get(getRoomActiveBooking);
router.route("/slots/:roomId").get(getRoomBookedTimeSlots);
router.route("/:id").get(getBookingById);
router.route("/:id/status").put(updateBookingStatus);
router.route("/:id/payment").put(updatePayment);
router.route("/:id/restaurant-bill").post(addRestaurantBill);
router.route("/:id/restaurant-bill/:billId").delete(removeRestaurantBill);
router.route("/:id/cancel").put(cancelBooking);
router.route("/:id/request-cancel").put(requestCancellation);
router.route("/:id/approve-cancel").put(approveCancellation);

module.exports = router;
