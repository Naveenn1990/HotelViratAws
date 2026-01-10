const express = require('express');
const router = express.Router();
const couponController = require('../controller/couponController');
const upload = require('../middleware/multerConfig');

// Get all coupons
router.get('/', couponController.getAllCoupons);

// Get coupon by ID
router.get('/:id', couponController.getCouponById);

// Create coupon
router.post('/', upload.single('image'), couponController.createCoupon);

// Update coupon
router.put('/:id', upload.single('image'), couponController.updateCoupon);

// Delete coupon
router.delete('/:id', couponController.deleteCoupon);

// Validate coupon
router.post('/validate', couponController.validateCoupon);

// Apply coupon
router.post('/apply', couponController.applyCoupon);

module.exports = router;