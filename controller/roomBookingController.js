const RoomBooking = require("../model/RoomBooking");
const Room = require("../model/Room");
const asyncHandler = require("express-async-handler");

// Create Room Booking
const createRoomBooking = asyncHandler(async (req, res) => {
  try {
    console.log("=== CREATE ROOM BOOKING ===");
    console.log("Request body:", req.body);

    const {
      roomId,
      guestName,
      guestEmail,
      guestPhone,
      checkInDate,
      checkOutDate,
      adults,
      children,
      specialRequests,
      totalAmount,
      status
    } = req.body;

    // Validate required fields
    if (!roomId || !guestName || !guestEmail || !checkInDate || !checkOutDate || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Room ID, guest name, email, check-in/out dates, and total amount are required"
      });
    }

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      return res.status(400).json({
        success: false,
        message: "Check-in date cannot be in the past"
      });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date"
      });
    }

    // Check if room exists and is available
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    if (!room.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Room is not available for booking"
      });
    }

    // Check for conflicting bookings
    const conflictingBooking = await RoomBooking.findOne({
      roomId: roomId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          checkInDate: { $lte: checkOut },
          checkOutDate: { $gte: checkIn }
        }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: "Room is already booked for the selected dates"
      });
    }

    // Create booking
    const booking = new RoomBooking({
      roomId,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim().toLowerCase(),
      guestPhone: guestPhone ? guestPhone.trim() : '',
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adults: parseInt(adults) || 1,
      children: parseInt(children) || 0,
      specialRequests: specialRequests ? specialRequests.trim() : '',
      totalAmount: Number(totalAmount),
      status: status || 'pending'
    });

    const createdBooking = await booking.save();
    
    // Populate room details for response
    await createdBooking.populate('roomId', 'roomType floor price roomNumber');

    console.log("Room booking created successfully:", createdBooking._id);

    res.status(201).json({
      success: true,
      message: "Room booking created successfully",
      booking: createdBooking
    });

  } catch (error) {
    console.error("Error creating room booking:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create room booking"
    });
  }
});

// Get all room bookings
const getRoomBookings = asyncHandler(async (req, res) => {
  try {
    const { status, roomId, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (roomId) {
      filter.roomId = roomId;
    }

    const bookings = await RoomBooking.find(filter)
      .populate('roomId', 'roomType floor price roomNumber branchId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RoomBooking.countDocuments(filter);

    res.json({
      success: true,
      bookings: bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total: total
    });

  } catch (error) {
    console.error("Error fetching room bookings:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch room bookings"
    });
  }
});

// Get room booking by ID
const getRoomBookingById = asyncHandler(async (req, res) => {
  try {
    const booking = await RoomBooking.findById(req.params.id)
      .populate('roomId', 'roomType floor price roomNumber branchId images');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Room booking not found"
      });
    }

    res.json({
      success: true,
      booking: booking
    });

  } catch (error) {
    console.error("Error fetching room booking:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch room booking"
    });
  }
});

// Update room booking
const updateRoomBooking = asyncHandler(async (req, res) => {
  try {
    console.log("=== UPDATE ROOM BOOKING ===", req.params.id);
    console.log("Request body:", req.body);

    const { status, notes, guestName, guestEmail, guestPhone, specialRequests } = req.body;

    const booking = await RoomBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Room booking not found"
      });
    }

    const updateData = {};
    
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (guestName) updateData.guestName = guestName.trim();
    if (guestEmail) updateData.guestEmail = guestEmail.trim().toLowerCase();
    if (guestPhone !== undefined) updateData.guestPhone = guestPhone.trim();
    if (specialRequests !== undefined) updateData.specialRequests = specialRequests.trim();

    const updatedBooking = await RoomBooking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('roomId', 'roomType floor price roomNumber');

    console.log("Room booking updated successfully:", req.params.id);

    res.json({
      success: true,
      message: "Room booking updated successfully",
      booking: updatedBooking
    });

  } catch (error) {
    console.error("Error updating room booking:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update room booking"
    });
  }
});

// Delete room booking
const deleteRoomBooking = asyncHandler(async (req, res) => {
  try {
    console.log("=== DELETE ROOM BOOKING ===", req.params.id);

    const booking = await RoomBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Room booking not found"
      });
    }

    await RoomBooking.deleteOne({ _id: req.params.id });

    console.log("Room booking deleted successfully:", req.params.id);

    res.json({
      success: true,
      message: "Room booking deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting room booking:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete room booking"
    });
  }
});

// Get booking statistics
const getBookingStats = asyncHandler(async (req, res) => {
  try {
    const totalBookings = await RoomBooking.countDocuments();
    const pendingBookings = await RoomBooking.countDocuments({ status: 'pending' });
    const confirmedBookings = await RoomBooking.countDocuments({ status: 'confirmed' });
    const completedBookings = await RoomBooking.countDocuments({ status: 'completed' });
    const cancelledBookings = await RoomBooking.countDocuments({ status: 'cancelled' });

    // Get recent bookings
    const recentBookings = await RoomBooking.find()
      .populate('roomId', 'roomType floor price')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings
      },
      recentBookings: recentBookings
    });

  } catch (error) {
    console.error("Error fetching booking stats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch booking statistics"
    });
  }
});

// Create Walk-in Booking (same as regular booking but for walk-in customers)
const createWalkInBooking = asyncHandler(async (req, res) => {
  try {
    console.log("=== CREATE WALK-IN BOOKING ===");
    console.log("Request body:", req.body);

    const {
      roomId,
      guestName,
      guestEmail,
      guestPhone,
      checkInDate,
      checkOutDate,
      adults,
      children,
      specialRequests,
      totalAmount,
      status = "confirmed" // Walk-in bookings are typically confirmed immediately
    } = req.body;

    // Validate required fields
    if (!roomId || !guestName || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: "Room ID, guest name, email, check-in/out dates, and total amount are required"
      });
    }

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date"
      });
    }

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Check for conflicting bookings
    const conflictingBookings = await RoomBooking.find({
      roomId: roomId,
      status: { $in: ["confirmed", "checked-in"] },
      $or: [
        {
          checkInDate: { $lt: checkOut },
          checkOutDate: { $gt: checkIn }
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Room is not available for the selected dates",
        conflictingBookings: conflictingBookings.map(booking => ({
          id: booking._id,
          checkIn: booking.checkInDate,
          checkOut: booking.checkOutDate,
          guestName: booking.guestName
        }))
      });
    }

    // Create the walk-in booking
    const booking = new RoomBooking({
      roomId,
      guestName,
      guestEmail: guestEmail || `walkin_${Date.now()}@hotel.com`, // Default email for walk-ins
      guestPhone: guestPhone || "N/A",
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adults: adults || 1,
      children: children || 0,
      specialRequests: specialRequests || "",
      totalAmount,
      status,
      bookingType: "walk-in", // Mark as walk-in booking
      createdAt: new Date()
    });

    const savedBooking = await booking.save();
    
    // Populate room details
    await savedBooking.populate('roomId');

    console.log("Walk-in booking created successfully:", savedBooking._id);

    res.status(201).json({
      success: true,
      message: "Walk-in booking created successfully",
      booking: savedBooking
    });

  } catch (error) {
    console.error("Error creating walk-in booking:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create walk-in booking"
    });
  }
});

module.exports = {
  createRoomBooking,
  getRoomBookings,
  getRoomBookingById,
  updateRoomBooking,
  deleteRoomBooking,
  getBookingStats,
  createWalkInBooking,
};