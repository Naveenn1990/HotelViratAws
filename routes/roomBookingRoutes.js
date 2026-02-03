const express = require("express");
const router = express.Router();
const {
  createRoomBooking,
  getRoomBookings,
  getRoomBookingById,
  updateRoomBooking,
  deleteRoomBooking,
  getBookingStats,
} = require("../controller/roomBookingController");

// Routes
router.route("/")
  .post(createRoomBooking)
  .get(getRoomBookings);

router.route("/stats")
  .get(getBookingStats);

router.route("/:id")
  .get(getRoomBookingById)
  .put(updateRoomBooking)
  .delete(deleteRoomBooking);

module.exports = router;