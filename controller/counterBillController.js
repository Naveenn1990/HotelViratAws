const CounterBill = require("../model/counterBillModel")
const CounterOrder = require("../model/counterOrderModel")
const CounterInvoice = require("../model/counterInvoiceModel")
const Branch = require("../model/Branch")
const Menu = require("../model/menuModel")
const Counter = require("../model/counterLoginModel")
const asyncHandler = require("express-async-handler")

const TAX_RATE = 0.05 // 5%
const SERVICE_CHARGE_RATE = 0.1 // 10%

exports.createCounterBill = asyncHandler(async (req, res) => {
  const {
    userId,
    counterUserId, // Alternative field name from frontend
    orderId,
    invoiceId,
    invoiceNumber, // Alternative field name from frontend
    branchId,
    selectedBranch, // Alternative field name from frontend
    customerName,
    phoneNumber,
    items,
    subtotal,
    tax,
    serviceCharge,
    totalAmount,
    grandTotal,
    total, // Alternative field name from frontend
    date,
    time,
    // Extra fields from frontend that we should ignore
    paymentMethod,
    amountReceived,
    change,
    status,
    orderDate,
  } = req.body

  // Handle alternative field names from frontend
  const actualUserId = userId || counterUserId
  const actualBranchId = branchId || (selectedBranch && selectedBranch._id)
  const actualInvoiceId = invoiceId || invoiceNumber
  const actualTotal = grandTotal || total

  // Input validation
  if (!actualUserId || !orderId || !actualInvoiceId || !actualBranchId || !customerName || !phoneNumber || !items) {
    res.status(400)
    throw new Error("All required fields must be provided")
  }

  if (!/^\d{10}$/.test(phoneNumber)) {
    res.status(400)
    throw new Error("Phone number must be a valid 10-digit number")
  }

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400)
    throw new Error("Items array is required and must not be empty")
  }

  // Use provided values or calculate defaults
  const billSubtotal = subtotal || 0
  const billTax = tax || 0
  const billServiceCharge = serviceCharge || 0
  const billTotalAmount = totalAmount || billSubtotal
  const billGrandTotal = actualTotal || billSubtotal + billTax + billServiceCharge

  if (billSubtotal < 0 || billTax < 0 || billServiceCharge < 0 || billTotalAmount < 0 || billGrandTotal < 0) {
    res.status(400)
    throw new Error("All amounts must be non-negative")
  }

  // Generate date and time if not provided
  const billDate = date || new Date().toLocaleDateString('en-IN')
  const billTime = time || new Date().toLocaleTimeString('en-IN', { 
    hour12: true,
    hour: '2-digit',
    minute: '2-digit'
  })

  // Parallel validation
  const [counterUser, counterOrder, branch] = await Promise.all([
    Counter.findById(actualUserId),
    CounterOrder.findById(orderId),
    Branch.findById(actualBranchId),
  ])

  if (!counterUser) {
    console.log(`Counter user ${actualUserId} not found, proceeding with bill creation anyway`)
  }

  if (!counterOrder) {
    res.status(404)
    throw new Error("Counter order not found")
  }

  if (!branch) {
    res.status(404)
    throw new Error("Branch not found")
  }

  if (counterOrder.userId.toString() !== actualUserId) {
    console.log(`User ID mismatch: order user=${counterOrder.userId}, provided user=${actualUserId}`)
  }

  const existingBill = await CounterBill.findOne({ order: orderId })
  if (existingBill) {
    res.status(400)
    throw new Error("A counter bill already exists for this order")
  }

  // Find invoice by ID or invoice number
  let invoice = null
  try {
    if (actualInvoiceId.match(/^[0-9a-fA-F]{24}$/)) {
      // It's an ObjectId
      invoice = await CounterInvoice.findById(actualInvoiceId)
    } else {
      // It's an invoice number, find by invoice number
      invoice = await CounterInvoice.findOne({ invoiceNumber: actualInvoiceId })
    }
    
    if (!invoice) {
      console.log(`Invoice ${actualInvoiceId} not found, proceeding with bill creation anyway`)
    }
  } catch (err) {
    console.log(`Error finding invoice: ${err.message}, proceeding with bill creation anyway`)
  }

  // Validate items (relaxed validation)
  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    if (!item.menuItemId || !item.name || !item.quantity || item.price === undefined) {
      res.status(400)
      throw new Error("Invalid item data: missing required fields")
    }

    // Skip strict menu item validation - just log if not found
    const menuItem = await Menu.findById(item.menuItemId)
    if (!menuItem) {
      console.log(`Menu item ${item.name} not found in database`)
    }
  }

  // Create bill
  const counterBill = new CounterBill({
    userId: actualUserId,
    order: orderId,
    invoice: invoice ? invoice._id : actualInvoiceId, // Use invoice ID if found, otherwise use provided ID
    branch: actualBranchId,
    customerName,
    phoneNumber,
    items,
    subtotal: billSubtotal,
    tax: billTax,
    serviceCharge: billServiceCharge,
    totalAmount: billTotalAmount,
    grandTotal: billGrandTotal,
    date: billDate,
    time: billTime,
  })

  await counterBill.save()

  // Populate the bill with related data (with error handling)
  const populatedBill = await CounterBill.findById(counterBill._id)
    .populate("userId", "name mobile")
    .populate("order", "items subtotal tax serviceCharge totalAmount grandTotal paymentMethod")
    .populate("branch", "name address")
    .populate("invoice", "invoiceNumber")
    .populate("items.menuItemId", "name")

  res.status(201).json({
    message: "Counter bill created successfully",
    bill: populatedBill,
    _id: populatedBill._id, // Add this for compatibility
  })
})

exports.getCounterBillById = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400)
    throw new Error("Invalid bill ID format")
  }

  const counterBill = await CounterBill.findById(id)
    .populate("userId", "name mobile")
    .populate("order", "items subtotal tax serviceCharge totalAmount grandTotal paymentMethod")
    .populate("branch", "name address")
    .populate("invoice", "invoiceNumber")
    .populate("items.menuItemId", "name")

  if (!counterBill) {
    res.status(404)
    throw new Error("Counter bill not found")
  }

  if (!counterBill.branch || !counterBill.invoice || !counterBill.order || !counterBill.userId) {
    res.status(500)
    throw new Error("Required counter bill references are missing")
  }

  res.status(200).json({
    bill: {
      id: counterBill._id,
      userId: {
        id: counterBill.userId._id,
        name: counterBill.userId.name,
        mobile: counterBill.userId.mobile,
      },
      order: {
        id: counterBill.order._id,
        items: counterBill.order.items,
        subtotal: counterBill.order.subtotal,
        tax: counterBill.order.tax,
        serviceCharge: counterBill.order.serviceCharge,
        totalAmount: counterBill.order.totalAmount,
        grandTotal: counterBill.order.grandTotal,
        paymentMethod: counterBill.order.paymentMethod,
      },
      invoice: {
        id: counterBill.invoice._id,
        invoiceNumber: counterBill.invoice.invoiceNumber,
      },
      branch: {
        id: counterBill.branch._id,
        name: counterBill.branch.name,
        location: counterBill.branch.address,
      },
      customerName: counterBill.customerName,
      phoneNumber: counterBill.phoneNumber,
      items: counterBill.items,
      subtotal: counterBill.subtotal,
      tax: counterBill.tax,
      serviceCharge: counterBill.serviceCharge,
      totalAmount: counterBill.totalAmount,
      grandTotal: counterBill.grandTotal,
      date: counterBill.date,
      time: counterBill.time,
      createdAt: counterBill.createdAt,
    },
  })
})

exports.listCounterBills = asyncHandler(async (req, res) => {
  const { branchId, customerName, phoneNumber, startDate, endDate } = req.query
  const query = {}

  if (branchId) query.branch = branchId
  if (customerName) query.customerName = { $regex: customerName, $options: "i" }
  if (phoneNumber) query.phoneNumber = phoneNumber
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate }
  }

  const counterBills = await CounterBill.find(query)
    .populate("userId", "name mobile")
    .populate("order", "items subtotal tax serviceCharge totalAmount grandTotal paymentMethod")
    .populate("branch", "name address")
    .populate("invoice", "invoiceNumber")
    .populate("items.menuItemId", "name")
    .sort({ createdAt: -1 })

  // Add null checks to prevent undefined errors
  const formattedBills = counterBills
    .map((bill) => {
      // Check if all required populated fields exist
      if (!bill.userId || !bill.order || !bill.invoice || !bill.branch) {
        console.warn(`Bill ${bill._id} has missing populated references`)
        return null
      }

      return {
        id: bill._id,
        userId: {
          id: bill.userId._id,
          name: bill.userId.name,
          mobile: bill.userId.mobile,
        },
        order: {
          id: bill.order._id,
          items: bill.order.items || [],
          subtotal: bill.order.subtotal,
          tax: bill.order.tax,
          serviceCharge: bill.order.serviceCharge,
          totalAmount: bill.order.totalAmount,
          grandTotal: bill.order.grandTotal,
          paymentMethod: bill.order.paymentMethod,
        },
        invoice: {
          id: bill.invoice._id,
          invoiceNumber: bill.invoice.invoiceNumber,
        },
        branch: {
          id: bill.branch._id,
          name: bill.branch.name,
          location: bill.branch.address,
        },
        customerName: bill.customerName,
        phoneNumber: bill.phoneNumber,
        items: bill.items || [],
        subtotal: bill.subtotal,
        tax: bill.tax,
        serviceCharge: bill.serviceCharge,
        totalAmount: bill.totalAmount,
        grandTotal: bill.grandTotal,
        date: bill.date,
        time: bill.time,
        createdAt: bill.createdAt,
      }
    })
    .filter((bill) => bill !== null) // Remove any null entries

  res.status(200).json({
    message: "Counter bills retrieved successfully",
    count: formattedBills.length,
    bills: formattedBills,
  })
})
