const CounterPayment = require("../model/counterPaymentModel")
const CounterOrder = require("../model/counterOrderModel")
const CounterBill = require("../model/counterBillModel")
const Counter = require("../model/counterLoginModel")
const Branch = require("../model/Branch")
const asyncHandler = require("express-async-handler")

exports.processCounterPayment = asyncHandler(async (req, res) => {
  const {
    orderId,
    billId,
    amount,
    paymentMethod,
    amountReceived,
    change,
    status,
    transactionId,
    remarks,
  } = req.body

  // Input validation
  if (!orderId || !billId || !amount || !paymentMethod || amountReceived === undefined) {
    res.status(400)
    throw new Error("Order ID, Bill ID, amount, payment method, and amount received are required")
  }

  if (!["cash", "card", "upi", "qr"].includes(paymentMethod)) {
    res.status(400)
    throw new Error("Invalid payment method. Must be one of: cash, card, upi, qr")
  }

  if (amount <= 0 || amountReceived < 0) {
    res.status(400)
    throw new Error("Amount must be greater than zero and amount received cannot be negative")
  }

  if (paymentMethod === "cash" && amountReceived < amount) {
    res.status(400)
    throw new Error("Amount received is less than the total amount")
  }

  // Validate ObjectId formats
  if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400)
    throw new Error("Invalid order ID format")
  }

  if (!billId.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400)
    throw new Error("Invalid bill ID format")
  }

  // Verify order and bill exist
  const [counterOrder, counterBill] = await Promise.all([
    CounterOrder.findById(orderId),
    CounterBill.findById(billId),
  ])

  if (!counterOrder) {
    res.status(404)
    throw new Error("Counter order not found")
  }

  if (!counterBill) {
    res.status(404)
    throw new Error("Counter bill not found")
  }

  // Verify bill belongs to order
  if (counterBill.order.toString() !== orderId) {
    res.status(400)
    throw new Error("Bill does not belong to the specified order")
  }

  // Check if payment already exists for this order
  const existingPayment = await CounterPayment.findOne({ orderId })
  if (existingPayment) {
    res.status(400)
    throw new Error("Payment already exists for this order")
  }

  // Verify amount matches order total
  if (Math.abs(amount - counterOrder.grandTotal) > 0.01) {
    res.status(400)
    throw new Error(`Amount mismatch: provided ₹${amount}, expected ₹${counterOrder.grandTotal}`)
  }

  // Calculate change for cash payments
  let calculatedChange = 0
  if (paymentMethod === "cash") {
    calculatedChange = Math.max(0, amountReceived - amount)
  }

  // Validate provided change if given
  if (change !== undefined && Math.abs(change - calculatedChange) > 0.01) {
    res.status(400)
    throw new Error(`Change mismatch: provided ₹${change}, calculated ₹${calculatedChange}`)
  }

  // Create payment record
  const counterPayment = new CounterPayment({
    orderId,
    billId,
    userId: counterOrder.userId,
    branchId: counterOrder.branch,
    amount,
    paymentMethod,
    amountReceived,
    change: calculatedChange,
    status: status || "completed",
    transactionId: transactionId || null,
    remarks: remarks || null,
  })

  await counterPayment.save()

  // Update order payment status
  counterOrder.paymentStatus = "completed"
  await counterOrder.save()

  // Populate the payment with related data (with error handling)
  const populatedPayment = await CounterPayment.findById(counterPayment._id)
    .populate("orderId", "customerName phoneNumber grandTotal orderStatus")
    .populate("billId", "date time")
    .populate("userId", "name mobile")
    .populate("branchId", "name address")

  // Handle cases where population might fail
  const responsePayment = {
    id: populatedPayment._id,
    order: populatedPayment.orderId ? {
      id: populatedPayment.orderId._id,
      customerName: populatedPayment.orderId.customerName,
      phoneNumber: populatedPayment.orderId.phoneNumber,
      grandTotal: populatedPayment.orderId.grandTotal,
      orderStatus: populatedPayment.orderId.orderStatus,
    } : { id: counterPayment.orderId },
    bill: populatedPayment.billId ? {
      id: populatedPayment.billId._id,
      date: populatedPayment.billId.date,
      time: populatedPayment.billId.time,
    } : { id: counterPayment.billId },
    user: populatedPayment.userId ? {
      id: populatedPayment.userId._id,
      name: populatedPayment.userId.name,
      mobile: populatedPayment.userId.mobile,
    } : { id: counterPayment.userId },
    branch: populatedPayment.branchId ? {
      id: populatedPayment.branchId._id,
      name: populatedPayment.branchId.name,
      location: populatedPayment.branchId.address,
    } : { id: counterPayment.branchId },
    amount: populatedPayment.amount,
    paymentMethod: populatedPayment.paymentMethod,
    amountReceived: populatedPayment.amountReceived,
    change: populatedPayment.change,
    status: populatedPayment.status,
    paymentDate: populatedPayment.paymentDate,
    transactionId: populatedPayment.transactionId,
    remarks: populatedPayment.remarks,
    createdAt: populatedPayment.createdAt,
  }

  res.status(201).json({
    message: "Payment processed successfully",
    payment: responsePayment,
  })
})

exports.getCounterPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400)
    throw new Error("Invalid payment ID format")
  }

  const counterPayment = await CounterPayment.findById(id)
    .populate("orderId", "customerName phoneNumber grandTotal orderStatus")
    .populate("billId", "date time")
    .populate("userId", "name mobile")
    .populate("branchId", "name address")

  if (!counterPayment) {
    res.status(404)
    throw new Error("Counter payment not found")
  }

  res.status(200).json({
    payment: {
      id: counterPayment._id,
      order: {
        id: counterPayment.orderId._id,
        customerName: counterPayment.orderId.customerName,
        phoneNumber: counterPayment.orderId.phoneNumber,
        grandTotal: counterPayment.orderId.grandTotal,
        orderStatus: counterPayment.orderId.orderStatus,
      },
      bill: {
        id: counterPayment.billId._id,
        date: counterPayment.billId.date,
        time: counterPayment.billId.time,
      },
      user: {
        id: counterPayment.userId._id,
        name: counterPayment.userId.name,
        mobile: counterPayment.userId.mobile,
      },
      branch: {
        id: counterPayment.branchId._id,
        name: counterPayment.branchId.name,
        location: counterPayment.branchId.address,
      },
      amount: counterPayment.amount,
      paymentMethod: counterPayment.paymentMethod,
      amountReceived: counterPayment.amountReceived,
      change: counterPayment.change,
      status: counterPayment.status,
      paymentDate: counterPayment.paymentDate,
      transactionId: counterPayment.transactionId,
      remarks: counterPayment.remarks,
      createdAt: counterPayment.createdAt,
    },
  })
})

exports.getCounterPaymentsByOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params

  // Validate ObjectId format
  if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400)
    throw new Error("Invalid order ID format")
  }

  const counterPayments = await CounterPayment.find({ orderId })
    .populate("orderId", "customerName phoneNumber grandTotal orderStatus")
    .populate("billId", "date time")
    .populate("userId", "name mobile")
    .populate("branchId", "name address")
    .sort({ createdAt: -1 })

  res.status(200).json({
    message: "Counter payments retrieved successfully",
    count: counterPayments.length,
    payments: counterPayments.map((payment) => ({
      id: payment._id,
      order: {
        id: payment.orderId._id,
        customerName: payment.orderId.customerName,
        phoneNumber: payment.orderId.phoneNumber,
        grandTotal: payment.orderId.grandTotal,
        orderStatus: payment.orderId.orderStatus,
      },
      bill: {
        id: payment.billId._id,
        date: payment.billId.date,
        time: payment.billId.time,
      },
      user: {
        id: payment.userId._id,
        name: payment.userId.name,
        mobile: payment.userId.mobile,
      },
      branch: {
        id: payment.branchId._id,
        name: payment.branchId.name,
        location: payment.branchId.address,
      },
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      amountReceived: payment.amountReceived,
      change: payment.change,
      status: payment.status,
      paymentDate: payment.paymentDate,
      transactionId: payment.transactionId,
      remarks: payment.remarks,
      createdAt: payment.createdAt,
    })),
  })
})

exports.getAllCounterPayments = asyncHandler(async (req, res) => {
  const { branchId, paymentMethod, status, startDate, endDate } = req.query
  const query = {}

  if (branchId) query.branchId = branchId
  if (paymentMethod) query.paymentMethod = paymentMethod
  if (status) query.status = status
  if (startDate && endDate) {
    query.paymentDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    }
  }

  const counterPayments = await CounterPayment.find(query)
    .populate("orderId", "customerName phoneNumber grandTotal orderStatus")
    .populate("billId", "date time")
    .populate("userId", "name mobile")
    .populate("branchId", "name address")
    .sort({ createdAt: -1 })

  res.status(200).json({
    message: "Counter payments retrieved successfully",
    count: counterPayments.length,
    payments: counterPayments.map((payment) => ({
      id: payment._id,
      order: {
        id: payment.orderId._id,
        customerName: payment.orderId.customerName,
        phoneNumber: payment.orderId.phoneNumber,
        grandTotal: payment.orderId.grandTotal,
        orderStatus: payment.orderId.orderStatus,
      },
      bill: {
        id: payment.billId._id,
        date: payment.billId.date,
        time: payment.billId.time,
      },
      user: {
        id: payment.userId._id,
        name: payment.userId.name,
        mobile: payment.userId.mobile,
      },
      branch: {
        id: payment.branchId._id,
        name: payment.branchId.name,
        location: payment.branchId.address,
      },
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      amountReceived: payment.amountReceived,
      change: payment.change,
      status: payment.status,
      paymentDate: payment.paymentDate,
      transactionId: payment.transactionId,
      remarks: payment.remarks,
      createdAt: payment.createdAt,
    })),
  })
})

exports.updateCounterPaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { status, remarks } = req.body

  // Validate ObjectId format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400)
    throw new Error("Invalid payment ID format")
  }

  if (!status || !["pending", "completed", "failed", "refunded"].includes(status)) {
    res.status(400)
    throw new Error("Invalid payment status. Must be one of: pending, completed, failed, refunded")
  }

  const counterPayment = await CounterPayment.findById(id)
  if (!counterPayment) {
    res.status(404)
    throw new Error("Counter payment not found")
  }

  counterPayment.status = status
  if (remarks) {
    counterPayment.remarks = remarks
  }

  await counterPayment.save()

  // Update related order payment status if needed
  if (status === "completed") {
    await CounterOrder.findByIdAndUpdate(counterPayment.orderId, {
      paymentStatus: "completed",
    })
  } else if (status === "failed") {
    await CounterOrder.findByIdAndUpdate(counterPayment.orderId, {
      paymentStatus: "failed",
    })
  }

  const populatedPayment = await CounterPayment.findById(id)
    .populate("orderId", "customerName phoneNumber grandTotal orderStatus")
    .populate("billId", "date time")
    .populate("userId", "name mobile")
    .populate("branchId", "name address")

  res.status(200).json({
    message: "Counter payment status updated successfully",
    payment: {
      id: populatedPayment._id,
      order: {
        id: populatedPayment.orderId._id,
        customerName: populatedPayment.orderId.customerName,
        phoneNumber: populatedPayment.orderId.phoneNumber,
        grandTotal: populatedPayment.orderId.grandTotal,
        orderStatus: populatedPayment.orderId.orderStatus,
      },
      bill: {
        id: populatedPayment.billId._id,
        date: populatedPayment.billId.date,
        time: populatedPayment.billId.time,
      },
      user: {
        id: populatedPayment.userId._id,
        name: populatedPayment.userId.name,
        mobile: populatedPayment.userId.mobile,
      },
      branch: {
        id: populatedPayment.branchId._id,
        name: populatedPayment.branchId.name,
        location: populatedPayment.branchId.address,
      },
      amount: populatedPayment.amount,
      paymentMethod: populatedPayment.paymentMethod,
      amountReceived: populatedPayment.amountReceived,
      change: populatedPayment.change,
      status: populatedPayment.status,
      paymentDate: populatedPayment.paymentDate,
      transactionId: populatedPayment.transactionId,
      remarks: populatedPayment.remarks,
      createdAt: populatedPayment.createdAt,
    },
  })
})