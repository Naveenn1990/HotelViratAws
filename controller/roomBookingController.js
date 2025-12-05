const RoomBooking = require("../model/RoomBooking");
const Room = require("../model/Room");
const asyncHandler = require("express-async-handler");

// Create walk-in booking (for receptionist - no userId required)
const createWalkInBooking = asyncHandler(async (req, res) => {
  try {
    const { roomId, branchId, userName, userPhone, userEmail, guestGstNumber, checkInDate, checkOutDate, checkInTime, checkOutTime, totalPrice, nights, baseAmount, gstType, cgst, sgst, igst, amountPaid, cashAmount, onlineAmount, payments, status, paymentStatus } = req.body;

    if (!roomId || !userName || !userPhone || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "Missing required fields: roomId, userName, userPhone, checkInDate, checkOutDate" });
    }

    // Check if room is available for the dates
    const existingBooking = await RoomBooking.findOne({
      roomId,
      status: { $nin: ['cancelled', 'checked-out'] },
      $or: [
        { checkInDate: { $lte: new Date(checkOutDate) }, checkOutDate: { $gte: new Date(checkInDate) } }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({ message: "Room is already booked for these dates" });
    }

    // Get room to get branchId if not provided
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const booking = new RoomBooking({
      roomId,
      branchId: branchId || room.branchId,
      userId: null, // Walk-in guest, no user account
      userName,
      userPhone,
      userEmail: userEmail || '',
      guestGstNumber: guestGstNumber || '',
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      checkInTime: checkInTime || '12:00',
      checkOutTime: checkOutTime || '11:00',
      nights: nights || 1,
      baseAmount: baseAmount || totalPrice,
      gstType: gstType || 'none',
      cgst: cgst || 0,
      sgst: sgst || 0,
      igst: igst || 0,
      totalPrice,
      amountPaid: amountPaid || 0,
      cashAmount: cashAmount || 0,
      onlineAmount: onlineAmount || 0,
      payments: payments || [],
      status: status || 'checked-in',
      paymentStatus: paymentStatus || 'pending',
    });

    const createdBooking = await booking.save();

    // Update room availability
    await Room.findByIdAndUpdate(roomId, { isAvailable: false });

    const populatedBooking = await RoomBooking.findById(createdBooking._id)
      .populate('roomId')
      .populate('branchId', 'name');

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error("Error creating walk-in booking:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create booking
const createBooking = asyncHandler(async (req, res) => {
  try {
    const { roomId, branchId, userId, userName, userPhone, userEmail, checkInDate, checkOutDate, checkInTime, checkOutTime, totalPrice, nights, baseAmount, cgst, sgst } = req.body;

    if (!roomId || !branchId || !userId || !userName || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if room is available for the dates
    const existingBooking = await RoomBooking.findOne({
      roomId,
      status: { $nin: ['cancelled', 'checked-out'] },
      $or: [
        { checkInDate: { $lte: new Date(checkOutDate) }, checkOutDate: { $gte: new Date(checkInDate) } }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({ message: "Room is already booked for these dates" });
    }

    const booking = new RoomBooking({
      roomId,
      branchId,
      userId,
      userName,
      userPhone,
      userEmail,
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      checkInTime: checkInTime || '12:00',
      checkOutTime: checkOutTime || '11:00',
      nights: nights || 1,
      baseAmount: baseAmount || totalPrice,
      cgst: cgst || 0,
      sgst: sgst || 0,
      totalPrice,
      status: 'confirmed',
    });

    const createdBooking = await booking.save();

    // Update room availability
    await Room.findByIdAndUpdate(roomId, { isAvailable: false });

    const populatedBooking = await RoomBooking.findById(createdBooking._id)
      .populate('roomId')
      .populate('branchId', 'name');

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get all bookings
const getBookings = asyncHandler(async (req, res) => {
  try {
    const { roomId, userId, branchId } = req.query;
    const filter = {};
    if (roomId) filter.roomId = roomId;
    if (userId) filter.userId = userId;
    if (branchId) filter.branchId = branchId;

    const bookings = await RoomBooking.find(filter)
      .populate('roomId')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get booking by ID
const getBookingById = asyncHandler(async (req, res) => {
  try {
    const booking = await RoomBooking.findById(req.params.id)
      .populate('roomId')
      .populate('branchId', 'name');

    if (booking) {
      res.json(booking);
    } else {
      res.status(404).json({ message: "Booking not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get active booking for a room
const getRoomActiveBooking = asyncHandler(async (req, res) => {
  try {
    const booking = await RoomBooking.findOne({
      roomId: req.params.roomId,
      status: { $nin: ['cancelled', 'checked-out'] }
    }).populate('roomId').populate('branchId', 'name');

    res.json(booking || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update booking status
const updateBookingStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await RoomBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = status;
    await booking.save();

    // If checked-out or cancelled, make room available again
    if (status === 'checked-out' || status === 'cancelled') {
      await Room.findByIdAndUpdate(booking.roomId, { isAvailable: true });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update payment amount
const updatePayment = asyncHandler(async (req, res) => {
  try {
    const { amountPaid, paymentMethod, paymentAmount } = req.body;
    const booking = await RoomBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.amountPaid = amountPaid;
    
    // Track payment by method
    if (paymentMethod && paymentAmount > 0) {
      if (paymentMethod === 'cash') {
        booking.cashAmount = (booking.cashAmount || 0) + paymentAmount;
      } else if (paymentMethod === 'online') {
        booking.onlineAmount = (booking.onlineAmount || 0) + paymentAmount;
      }
      
      // Add to payments array
      if (!booking.payments) {
        booking.payments = [];
      }
      booking.payments.push({
        amount: paymentAmount,
        method: paymentMethod,
        date: new Date()
      });
    }
    
    // Update payment status based on amount paid
    if (amountPaid >= booking.totalPrice) {
      booking.paymentStatus = 'paid';
    } else if (amountPaid > 0) {
      booking.paymentStatus = 'pending';
    }
    
    await booking.save();

    const populatedBooking = await RoomBooking.findById(booking._id)
      .populate('roomId')
      .populate('branchId', 'name');

    res.json(populatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel booking
const cancelBooking = asyncHandler(async (req, res) => {
  try {
    const booking = await RoomBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Make room available again
    await Room.findByIdAndUpdate(booking.roomId, { isAvailable: true });

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request cancellation (user requests, admin approves)
const requestCancellation = asyncHandler(async (req, res) => {
  try {
    const booking = await RoomBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === 'cancelled' || booking.status === 'cancel-requested') {
      return res.status(400).json({ message: "Booking is already cancelled or cancellation is pending" });
    }

    // Calculate 20% cancellation charges
    const cancellationCharges = booking.totalPrice * 0.2;
    const refundAmount = booking.totalPrice * 0.8;

    booking.status = 'cancel-requested';
    booking.cancellationCharges = cancellationCharges;
    booking.refundAmount = refundAmount;
    await booking.save();

    res.json({ 
      message: "Cancellation request submitted successfully",
      cancellationCharges,
      refundAmount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve cancellation (admin only)
const approveCancellation = asyncHandler(async (req, res) => {
  try {
    const booking = await RoomBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== 'cancel-requested') {
      return res.status(400).json({ message: "No cancellation request pending for this booking" });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Make room available again
    await Room.findByIdAndUpdate(booking.roomId, { isAvailable: true });

    res.json({ 
      message: "Cancellation approved successfully",
      refundAmount: booking.refundAmount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all cancellation requests (for admin)
const getCancellationRequests = asyncHandler(async (req, res) => {
  try {
    const bookings = await RoomBooking.find({ status: 'cancel-requested' })
      .populate('roomId')
      .populate('branchId', 'name')
      .sort({ updatedAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get payment summary (for admin dashboard)
const getPaymentSummary = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, branchId } = req.query;
    
    const filter = {};
    
    // Date filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    
    if (branchId) filter.branchId = branchId;

    const bookings = await RoomBooking.find(filter)
      .populate('roomId', 'roomNumber roomType')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    // Calculate totals
    let totalCash = 0;
    let totalOnline = 0;
    let totalAmount = 0;
    let totalPending = 0;

    bookings.forEach(booking => {
      totalCash += booking.cashAmount || 0;
      totalOnline += booking.onlineAmount || 0;
      totalAmount += booking.amountPaid || 0;
      if (booking.paymentStatus === 'pending') {
        totalPending += (booking.totalPrice || 0) - (booking.amountPaid || 0);
      }
    });

    res.json({
      summary: {
        totalCash,
        totalOnline,
        totalCollected: totalAmount,
        totalPending,
        bookingCount: bookings.length
      },
      bookings: bookings.map(b => ({
        _id: b._id,
        roomNumber: b.roomId?.roomNumber || 'N/A',
        roomType: b.roomId?.roomType || 'N/A',
        branchName: b.branchId?.name || 'N/A',
        guestName: b.userName,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        totalPrice: b.totalPrice,
        amountPaid: b.amountPaid,
        cashAmount: b.cashAmount || 0,
        onlineAmount: b.onlineAmount || 0,
        paymentStatus: b.paymentStatus,
        status: b.status,
        payments: b.payments || [],
        createdAt: b.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = {
  createBooking,
  createWalkInBooking,
  getBookings,
  getBookingById,
  getRoomActiveBooking,
  updateBookingStatus,
  updatePayment,
  cancelBooking,
  requestCancellation,
  approveCancellation,
  getCancellationRequests,
  getPaymentSummary,
};
