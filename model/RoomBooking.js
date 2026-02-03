const mongoose = require('mongoose');

const roomBookingSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  guestName: {
    type: String,
    required: true,
    trim: true,
  },
  guestEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  guestPhone: {
    type: String,
    trim: true,
  },
  checkInDate: {
    type: Date,
    required: true,
  },
  checkOutDate: {
    type: Date,
    required: true,
  },
  adults: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  children: {
    type: Number,
    default: 0,
    min: 0,
  },
  specialRequests: {
    type: String,
    trim: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  bookingDate: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true
});

// Index for efficient queries
roomBookingSchema.index({ roomId: 1, checkInDate: 1, checkOutDate: 1 });
roomBookingSchema.index({ guestEmail: 1 });
roomBookingSchema.index({ status: 1 });
roomBookingSchema.index({ bookingDate: -1 });

module.exports = mongoose.model('RoomBooking', roomBookingSchema);