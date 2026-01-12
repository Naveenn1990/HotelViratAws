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
    required: false,
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
  guestGstNumber: {
    type: String,
    trim: true,
  },
  aadhaarNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Optional field, but if provided, should be 12 digits
        return !v || /^\d{12}$/.test(v);
      },
      message: 'Aadhaar number must be 12 digits'
    }
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        // Optional field, but if provided, should match PAN format
        return !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
      },
      message: 'PAN number must be in format: ABCDE1234F'
    }
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
  actualCheckInTime: {
    type: Date,
    default: null,
  },
  actualCheckOutTime: {
    type: Date,
    default: null,
  },
  restaurantBills: [{
    date: {
      type: Date,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    addedBy: {
      type: String,
      default: 'Receptionist',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    }
  }],
  restaurantTotal: {
    type: Number,
    default: 0,
  },
  nights: {
    type: Number,
    default: 1,
  },
  baseAmount: {
    type: Number,
    required: true,
  },
  gstOption: {
    type: String,
    enum: ['withoutGST', 'withGST', 'withIGST'],
    default: 'withGST',
  },
  gstType: {
    type: String,
    enum: ['none', 'gst', 'igst'], // none = without GST, gst = CGST+SGST (within state), igst = IGST (out of state)
    default: 'none',
  },
  gstAmount: {
    type: Number,
    default: 0,
  },
  cgst: {
    type: Number,
    default: 0,
  },
  sgst: {
    type: Number,
    default: 0,
  },
  igst: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  cashAmount: {
    type: Number,
    default: 0,
  },
  onlineAmount: {
    type: Number,
    default: 0,
  },
  payments: [{
    amount: { type: Number, required: true },
    method: { type: String, enum: ['cash', 'online'], required: true },
    date: { type: Date, default: Date.now },
    note: { type: String }
  }],
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
