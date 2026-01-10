const mongoose = require("mongoose")

const counterPaymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CounterOrder",
    required: [true, "Order ID is required"],
  },
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CounterBill",
    required: [true, "Bill ID is required"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Counter",
    required: [true, "User ID is required"],
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: [true, "Branch ID is required"],
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0, "Amount cannot be negative"],
  },
  paymentMethod: {
    type: String,
    required: [true, "Payment method is required"],
    enum: ["cash", "card", "upi", "qr"],
  },
  amountReceived: {
    type: Number,
    required: [true, "Amount received is required"],
    min: [0, "Amount received cannot be negative"],
  },
  change: {
    type: Number,
    default: 0,
    min: [0, "Change cannot be negative"],
  },
  status: {
    type: String,
    required: [true, "Payment status is required"],
    enum: ["pending", "completed", "failed", "refunded"],
    default: "completed",
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  transactionId: {
    type: String,
    trim: true,
    default: null,
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, "Remarks cannot exceed 500 characters"],
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Add index for better query performance
counterPaymentSchema.index({ orderId: 1 })
counterPaymentSchema.index({ billId: 1 })
counterPaymentSchema.index({ userId: 1, createdAt: -1 })
counterPaymentSchema.index({ status: 1 })

module.exports = mongoose.model("CounterPayment", counterPaymentSchema)