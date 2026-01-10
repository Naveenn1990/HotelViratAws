const express = require('express');
const router = express.Router();
const {
  getAllStaff,
  getStaffById,
  registerStaffDirect,
  updateStaff,
  deleteStaff,
  sendOtpForStaffRegistration,
  sendOtpForStaffLogin,
  verifyOtpForStaff,
  resendOtpForStaffRegistration,
  resendOtpForStaffLogin
} = require('../controller/staffLoginController');

// Get all staff users
router.get('/', getAllStaff);

// Register staff directly (without OTP)
router.post('/register', registerStaffDirect);

// Send OTP for staff registration
router.post('/send-otp-registration', sendOtpForStaffRegistration);

// Send OTP for staff login
router.post('/send-otp-login', sendOtpForStaffLogin);

// Verify OTP for staff registration or login
router.post('/verify-otp', verifyOtpForStaff);

// Resend OTP for staff registration
router.post('/resend-otp-registration', resendOtpForStaffRegistration);

// Resend OTP for staff login
router.post('/resend-otp-login', resendOtpForStaffLogin);

// Get staff by ID
router.get('/:id', getStaffById);

// Update staff
router.put('/:id', updateStaff);

// Delete staff
router.delete('/:id', deleteStaff);

module.exports = router;