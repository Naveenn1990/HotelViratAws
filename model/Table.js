const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoryy',
    required: false, // Optional for backward compatibility
  },
  number: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['available', 'reserved'],
    default: 'available',
    required: true,
  },
  image: {
    type: String,
    required: false,
    trim: true,
  },
  qrCode: {
    type: String, // Store QR code data URL or path
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure unique table numbers per branch and category
tableSchema.index({ branchId: 1, categoryId: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);