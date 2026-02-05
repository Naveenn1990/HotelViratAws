const express = require("express");
const router = express.Router();
const {
  createRoomBooking,
  getRoomBookings,
  getRoomBookingById,
  updateRoomBooking,
  deleteRoomBooking,
  getBookingStats,
  createWalkInBooking,
} = require("../controller/roomBookingController");

// Routes
router.route("/")
  .post(createRoomBooking)
  .get(getRoomBookings);

router.route("/walk-in")
  .post(createWalkInBooking);

router.route("/advance")
  .post(createRoomBooking); // Reuse existing createRoomBooking

router.route("/stats")
  .get(getBookingStats);

router.route("/:id")
  .get(getRoomBookingById)
  .put(updateRoomBooking)
  .delete(deleteRoomBooking);

router.route("/:id/payment")
  .put(updateRoomBooking); // Reuse existing updateRoomBooking

router.route("/:id/status")
  .put(updateRoomBooking); // Reuse existing updateRoomBooking

router.route("/:id/extend")
  .put(updateRoomBooking); // Reuse existing updateRoomBooking

router.route("/:id/cancel-extension")
  .put(updateRoomBooking); // Reuse existing updateRoomBooking

router.route("/:id/restaurant-bill")
  .post(updateRoomBooking); // Reuse existing updateRoomBooking

router.route("/:id/restaurant-bill/:billId")
  .delete(updateRoomBooking); // Reuse existing updateRoomBooking

module.exports = router;