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

    // With time slot system, rooms remain available for other time slots
    // Don't automatically set room as unavailable

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
    const { 
      roomId, branchId, userId, userName, userPhone, userEmail, guestGstNumber,
      checkInDate, checkOutDate, checkInTime, checkOutTime, 
      gstOption, totalPrice, nights, baseAmount, cgst, sgst, igst, gstAmount 
    } = req.body;

    if (!roomId || !branchId || !userId || !userName || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check for time slot conflicts instead of full date conflicts
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const checkInHour = parseInt(checkInTime?.split(':')[0] || '12');
    const checkOutHour = parseInt(checkOutTime?.split(':')[0] || '11');

    // Find overlapping bookings
    const conflictingBookings = await RoomBooking.find({
      roomId,
      status: { $nin: ['cancelled', 'checked-out'] },
      $or: [
        // Same day bookings with time conflicts
        {
          checkInDate: { $eq: checkIn },
          checkOutDate: { $eq: checkOut },
          $or: [
            // New booking starts during existing booking
            { 
              checkInTime: { $lte: checkInTime },
              checkOutTime: { $gt: checkInTime }
            },
            // New booking ends during existing booking
            { 
              checkInTime: { $lt: checkOutTime },
              checkOutTime: { $gte: checkOutTime }
            },
            // Existing booking is within new booking
            { 
              checkInTime: { $gte: checkInTime },
              checkOutTime: { $lte: checkOutTime }
            }
          ]
        },
        // Multi-day bookings
        { 
          checkInDate: { $lt: checkOut }, 
          checkOutDate: { $gt: checkIn }
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({ 
        message: "Room has conflicting bookings for the selected time slots",
        conflicts: conflictingBookings.map(b => ({
          checkInDate: b.checkInDate,
          checkOutDate: b.checkOutDate,
          checkInTime: b.checkInTime,
          checkOutTime: b.checkOutTime
        }))
      });
    }

    const booking = new RoomBooking({
      roomId,
      branchId,
      userId,
      userName,
      userPhone,
      userEmail,
      guestGstNumber: guestGstNumber || '',
      checkInDate: checkIn,
      checkOutDate: checkOut,
      checkInTime: checkInTime || '12:00',
      checkOutTime: checkOutTime || '11:00',
      gstOption: gstOption || 'withGST',
      nights: nights || 1,
      baseAmount: baseAmount || totalPrice,
      cgst: cgst || 0,
      sgst: sgst || 0,
      igst: igst || 0,
      gstAmount: gstAmount || 0,
      totalPrice,
      status: 'confirmed',
    });

    const createdBooking = await booking.save();

    // Don't automatically set room as unavailable - it can still be booked for other time slots
    // Room availability is now managed by time slots

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

    const oldStatus = booking.status;
    booking.status = status;

    // Capture actual check-in/check-out times when status changes
    if (status === 'checked-in' && oldStatus !== 'checked-in') {
      booking.actualCheckInTime = new Date();
    } else if (status === 'checked-out' && oldStatus !== 'checked-out') {
      booking.actualCheckOutTime = new Date();
    }

    await booking.save();

    // With time slot system, we don't automatically change room availability
    // Rooms remain available for other time slots even when some slots are booked
    // Only set room as unavailable if it's a maintenance/system issue, not booking-related

    const populatedBooking = await RoomBooking.findById(booking._id)
      .populate('roomId')
      .populate('branchId', 'name');

    res.json(populatedBooking);
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

    // With time slot system, rooms remain available for other time slots
    // No need to change room availability status

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

    // With time slot system, rooms remain available for other time slots
    // No need to change room availability status

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

// Get booked time slots for a room on a specific date
const getRoomBookedTimeSlots = asyncHandler(async (req, res) => {
  try {
    const { roomId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date parameter is required" });
    }

    // Parse the date and create start/end of day
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all bookings for this room that overlap with the target date
    const bookings = await RoomBooking.find({
      roomId,
      status: { $nin: ['cancelled', 'checked-out'] },
      $or: [
        // Booking starts on this date
        { 
          checkInDate: { $gte: startOfDay, $lte: endOfDay }
        },
        // Booking ends on this date
        { 
          checkOutDate: { $gte: startOfDay, $lte: endOfDay }
        },
        // Booking spans across this date
        { 
          checkInDate: { $lt: startOfDay },
          checkOutDate: { $gt: endOfDay }
        }
      ]
    });

    // Generate booked time slots
    const bookedSlots = [];
    
    bookings.forEach(booking => {
      const checkInDate = new Date(booking.checkInDate);
      const checkOutDate = new Date(booking.checkOutDate);
      
      // If booking starts on target date, block from check-in time onwards
      if (checkInDate.toDateString() === targetDate.toDateString()) {
        const checkInHour = parseInt(booking.checkInTime?.split(':')[0] || '12');
        for (let hour = checkInHour; hour < 24; hour++) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
          if (!bookedSlots.includes(timeSlot)) {
            bookedSlots.push(timeSlot);
          }
        }
      }
      
      // If booking ends on target date, block until check-out time
      if (checkOutDate.toDateString() === targetDate.toDateString()) {
        const checkOutHour = parseInt(booking.checkOutTime?.split(':')[0] || '11');
        for (let hour = 0; hour <= checkOutHour; hour++) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
          if (!bookedSlots.includes(timeSlot)) {
            bookedSlots.push(timeSlot);
          }
        }
      }
      
      // If booking spans across this date (multi-day booking), block entire day
      if (checkInDate < startOfDay && checkOutDate > endOfDay) {
        for (let hour = 0; hour < 24; hour++) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
          if (!bookedSlots.includes(timeSlot)) {
            bookedSlots.push(timeSlot);
          }
        }
      }
    });

    res.json({
      roomId,
      date,
      bookedSlots: bookedSlots.sort(),
      availableSlots: 24 - bookedSlots.length
    });
  } catch (error) {
    console.error("Error getting booked time slots:", error);
    res.status(500).json({ message: error.message });
  }
});

// Add restaurant bill to booking
const addRestaurantBill = asyncHandler(async (req, res) => {
  try {
    const { amount, description } = req.body;
    const booking = await RoomBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== 'checked-in') {
      return res.status(400).json({ message: "Can only add restaurant bills for checked-in guests" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: "Description is required" });
    }

    // Add restaurant bill
    booking.restaurantBills.push({
      amount: parseFloat(amount),
      description: description.trim(),
      date: new Date(),
      addedBy: 'Receptionist'
    });

    // Update restaurant total
    booking.restaurantTotal = booking.restaurantBills.reduce((sum, bill) => sum + bill.amount, 0);

    await booking.save();

    const populatedBooking = await RoomBooking.findById(booking._id)
      .populate('roomId')
      .populate('branchId', 'name');

    res.json(populatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove restaurant bill from booking
const removeRestaurantBill = asyncHandler(async (req, res) => {
  try {
    const { billId } = req.params;
    const booking = await RoomBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== 'checked-in') {
      return res.status(400).json({ message: "Can only modify restaurant bills for checked-in guests" });
    }

    // Remove the bill
    booking.restaurantBills = booking.restaurantBills.filter(bill => bill._id.toString() !== billId);

    // Update restaurant total
    booking.restaurantTotal = booking.restaurantBills.reduce((sum, bill) => sum + bill.amount, 0);

    await booking.save();

    const populatedBooking = await RoomBooking.findById(booking._id)
      .populate('roomId')
      .populate('branchId', 'name');

    res.json(populatedBooking);
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
};
