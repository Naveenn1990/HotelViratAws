const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'],
    default: null,
  },
  password: {
    type: String,
    default: null, // Optional for OTP-based auth
  },
  image: {
    type: String,
    default: null,
  },
  otp: {
    type: String,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for phone field (maps to mobile for backward compatibility)
userSchema.virtual('phone').get(function() {
  return this.mobile;
});

module.exports = mongoose.model('User', userSchema);