const express = require('express');
const router = express.Router();
const {
  sendOtp,
  verifyOtp,
  registerUser,
  getUserProfile,
  getAllUsers,
  updateUserStatus,
  deleteUser
} = require('../controller/purchaseUserController');

// Get all users (admin function)
router.get('/', getAllUsers);

// Send OTP
router.post('/send-otp', sendOtp);

// Verify OTP and login
router.post('/verify-otp', verifyOtp);

// Register user
router.post('/register', registerUser);

// Get user profile
router.get('/profile/:phoneNumber', getUserProfile);

// Update user status
router.put('/status/:phoneNumber', updateUserStatus);

// Delete user
router.delete('/:phoneNumber', deleteUser);

module.exports = router;