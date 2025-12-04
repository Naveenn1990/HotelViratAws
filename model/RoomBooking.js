const mongoose = require('mongoose');

const roomBookingSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for walk-in guests
  },
  userName: {
    type: String,
    required: true,
  },
  userPhone: {
    type: String,
  },
  userEmail: {
    type: String,
  },
  checkInDate: {
    type: Date,
    required: true,
  },
  checkOutDate: {
    type: Date,
    required: true,
  },
  checkInTime: {
    type: String,
    required: true,
    default: '12:00',
  },
  checkOutTime: {
    type: String,
    required: true,
    default: '11:00',
  },
  nights: {
    type: Number,
    default: 1,
  },
  baseAmount: {
    type: Number,
    required: true,
  },
  cgst: {
    type: Number,
    default: 0,
  },
  sgst: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'cancel-requested'],
    default: 'confirmed',
  },
  cancellationReason: {
    type: String,
  },
  refundAmount: {
    type: Number,
  },
  cancellationCharges: {
    type: Number,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('RoomBooking', roomBookingSchema);
