const express = require("express");
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBookingById,
  getRoomActiveBooking,
  updateBookingStatus,
  cancelBooking,
  requestCancellation,
  approveCancellation,
  getCancellationRequests,
} = require("../controller/roomBookingController");

router.route("/").post(createBooking).get(getBookings);
router.route("/cancellation-requests").get(getCancellationRequests);
router.route("/room/:roomId/active").get(getRoomActiveBooking);
router.route("/:id").get(getBookingById);
router.route("/:id/status").put(updateBookingStatus);
router.route("/:id/cancel").put(cancelBooking);
router.route("/:id/request-cancel").put(requestCancellation);
router.route("/:id/approve-cancel").put(approveCancellation);

module.exports = router;
