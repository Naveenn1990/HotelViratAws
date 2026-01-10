const express = require('express');
const router = express.Router();
const counterLoginController = require('../controller/counterLoginController');

// Authentication routes
router.post('/login/send-otp', counterLoginController.sendOtpForCounterLogin);
router.post('/login/resend-otp', counterLoginController.resendOtpForCounterLogin);
router.post('/verify-otp', counterLoginController.verifyOtpForCounter);

// Registration routes (for admin use)
router.post('/register/send-otp', counterLoginController.sendOtpForCounterRegistration);
router.post('/register/resend-otp', counterLoginController.resendOtpForCounterRegistration);

// CRUD routes for admin management
router.get('/', counterLoginController.getAllCounters);
router.post('/', counterLoginController.registerCounter);
router.put('/:id', counterLoginController.updateCounter);
router.delete('/:id', counterLoginController.deleteCounter);

module.exports = router;