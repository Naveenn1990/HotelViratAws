const mongoose = require('mongoose');

const roomBookingSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: false, // Made optional for walk-in bookings
  },
  guestName: {
    type: String,
    required: true,
    trim: true,
  },
  guestEmail: {
    type: String,
    required: false, // Made optional
    trim: true,
    lowercase: true,
  },
  guestPhone: {
    type: String,
    required: true,
    trim: true,
  },
  guestGstNumber: {
    type: String,
    trim: true,
    default: '',
  },
  aadhaarNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        return !v || /^\d{12}$/.test(v); // 12 digits if provided
      },
      message: 'Aadhaar number must be 12 digits'
    }
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    validate: {
      validator: function (v) {
        return !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v); // PAN format if provided
      },
      message: 'Invalid PAN number format'
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
    default: '12:00',
  },
  checkOutTime: {
    type: String,
    default: '11:00',
  },
  actualCheckInTime: {
    type: String,
  },
  actualCheckOutTime: {
    type: String,
  },
  restaurantTotal: {
    type: Number,
  },
  nights: {
    type: Number,
    required: true,
    min: 1,
  },
  adults: {
    type: Number,
    min: 1,
    default: 1,
  },
  children: {
    type: Number,
    default: 0,
    min: 0,
  },
  baseAmount: {
    type: Number,
    required: true,
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  gstType: {
    type: String,
    enum: ['none', 'cgst_sgst', 'igst'],
    default: 'none',
  },
  cgst: {
    type: Number,
    default: 0,
    min: 0,
  },
  sgst: {
    type: Number,
    default: 0,
    min: 0,
  },
  igst: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0,
  },
  cashAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  onlineAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'checked-in', 'checked-out'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending',
  },
  specialRequests: {
    type: String,
    trim: true,
  },
  bookingDate: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
  },
  payments: [{
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ['cash', 'online', 'card', 'upi', 'bank_transfer'],
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
roomBookingSchema.index({ roomId: 1, checkInDate: 1, checkOutDate: 1 });
roomBookingSchema.index({ guestEmail: 1 });
roomBookingSchema.index({ guestPhone: 1 });
roomBookingSchema.index({ status: 1 });
roomBookingSchema.index({ paymentStatus: 1 });
roomBookingSchema.index({ bookingDate: -1 });
roomBookingSchema.index({ checkInDate: 1 });
roomBookingSchema.index({ checkOutDate: 1 });

// Virtual for remaining balance
roomBookingSchema.virtual('remainingBalance').get(function () {
  return this.totalAmount - this.amountPaid;
});

// Method to add payment
roomBookingSchema.methods.addPayment = function (paymentData) {
  this.payments.push(paymentData);
  this.amountPaid += paymentData.amount;

  if (paymentData.method === 'cash') {
    this.cashAmount += paymentData.amount;
  } else {
    this.onlineAmount += paymentData.amount;
  }

  // Update payment status
  if (this.amountPaid >= this.totalAmount) {
    this.paymentStatus = 'paid';
  } else if (this.amountPaid > 0) {
    this.paymentStatus = 'partial';
  }

  return this.save();
};

// Method to calculate GST amounts
roomBookingSchema.methods.calculateGST = function (gstRate = 18) {
  const taxableAmount = this.baseAmount - this.discountAmount;
  const gstAmount = (taxableAmount * gstRate) / 100;

  if (this.gstType === 'cgst_sgst') {
    this.cgst = gstAmount / 2;
    this.sgst = gstAmount / 2;
    this.igst = 0;
  } else if (this.gstType === 'igst') {
    this.igst = gstAmount;
    this.cgst = 0;
    this.sgst = 0;
  } else {
    this.cgst = 0;
    this.sgst = 0;
    this.igst = 0;
  }

  this.totalAmount = taxableAmount + this.cgst + this.sgst + this.igst;
};

// Pre-save middleware to calculate nights
roomBookingSchema.pre('save', function (next) {
  if (this.checkInDate && this.checkOutDate) {
    const timeDiff = this.checkOutDate.getTime() - this.checkInDate.getTime();
    this.nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  next();
});

module.exports = mongoose.model('RoomBooking', roomBookingSchema);