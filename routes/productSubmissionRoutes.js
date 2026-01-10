const express = require('express');
const router = express.Router();
const productSubmissionController = require('../controller/productSubmissionController');
const upload = require('../middleware/multerConfig');

// Get all submissions (admin function)
router.get('/', productSubmissionController.getAllSubmissions);

// Get submission statistics
router.get('/stats', productSubmissionController.getSubmissionStats);

// Get submissions by user phone
router.get('/user/:userPhone', productSubmissionController.getUserSubmissions);

// Get approved submissions for QR upload
router.get('/approved/:userPhone', productSubmissionController.getApprovedSubmissions);

// Get payment uploaded submissions for bill upload
router.get('/payment-uploaded/:userPhone', productSubmissionController.getPaymentUploadedSubmissions);

// Get single submission by ID
router.get('/:submissionId', productSubmissionController.getSubmissionById);

// Create new submission
router.post('/', productSubmissionController.createSubmission);

// Approve submission
router.put('/:submissionId/approve', productSubmissionController.approveSubmission);

// Reject submission
router.put('/:submissionId/reject', productSubmissionController.rejectSubmission);

// Update submission status
router.put('/:submissionId/status', productSubmissionController.updateSubmissionStatus);

// Upload QR code
router.post('/:submissionId/upload-qr', upload.single('qrCode'), productSubmissionController.uploadQRCode);

// Upload payment image
router.post('/:submissionId/upload-payment-image', upload.single('paymentImage'), productSubmissionController.uploadPaymentImage);

// Upload bill image
router.post('/:submissionId/upload-bill-image', upload.single('billImage'), productSubmissionController.uploadBillImage);

// Mark submission as completed
router.put('/:submissionId/complete', productSubmissionController.completeSubmission);

// Delete submission
router.delete('/:submissionId', productSubmissionController.deleteSubmission);

module.exports = router;