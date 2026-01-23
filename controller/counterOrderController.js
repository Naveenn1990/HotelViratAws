const CounterOrder = require("../model/counterOrderModel")
const Branch = require("../model/Branch")
const CounterInvoice = require("../model/counterInvoiceModel")
const Menu = require("../model/menuModel")
const Counter = require("../model/counterLoginModel")
const asyncHandler = require("express-async-handler")

// Tax and service charge rates (same as staff order)
const TAX_RATE = 0.05 // 5%
const SERVICE_CHARGE_RATE = 0.1 // 10%
exports.createCounterOrder = asyncHandler(async (req, res) => {
  const {
    userId,
    customerName,
    phoneNumber,
    branchId,
    invoiceId,
    items,
    paymentMethod,
    status,
    // Optional: allow frontend to send these, but we'll calculate them
    subtotal: providedSubtotal,
    tax: providedTax,
    serviceCharge: providedServiceCharge,
    totalAmount: providedTotalAmount,
    grandTotal: providedGrandTotal,
  } = req.body

  // Validate input
  if (!userId) {
    res.status(400)
    throw new Error("User ID is required")
  }

  if (!customerName || !customerName.trim()) {
    res.status(400)
    throw new Error("Customer name is required")
  }

  if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
    res.status(400)
    throw new Error("Phone number must be a valid 10-digit number")
  }

  if (!branchId) {
    res.status(400)
    throw new Error("Branch is required")
  }

  if (!invoiceId) {
    res.status(400)
    throw new Error("Invoice is required")
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400)
    throw new Error("Items are required")
  }

  if (!paymentMethod || !["cash", "card", "upi", "qr"].includes(paymentMethod)) {
    res.status(400)
    throw new Error("Invalid payment method")
  }

  // Verify counter user exists (optional - allow orders even if user not found)
  let counterUser = null
  try {
    counterUser = await Counter.findById(userId)
    if (!counterUser) {
      console.log(`Counter user ${userId} not found, proceeding with order anyway`)
    }
  } catch (err) {
    console.log(`Error finding counter user: ${err.message}, proceeding with order anyway`)
  }

  // Verify branch exists
  const branch = await Branch.findById(branchId)
  if (!branch) {
    res.status(404)
    throw new Error("Branch not found")
  }

  // Verify invoice exists (optional - allow orders even if invoice not found)
  let invoice = null
  try {
    invoice = await CounterInvoice.findById(invoiceId)
    if (!invoice) {
      console.log(`Invoice ${invoiceId} not found, proceeding with order anyway`)
    }
  } catch (err) {
    console.log(`Error finding invoice: ${err.message}, proceeding with order anyway`)
  }

  // Calculate subtotal and validate items
  let calculatedSubtotal = 0
  for (const item of items) {
    if (!item.menuItemId || !item.name || !item.quantity || item.price === undefined) {
      res.status(400)
      throw new Error("Invalid item data")
    }

    const menuItem = await Menu.findById(item.menuItemId)
    if (!menuItem) {
      // Skip validation if menu item not found - use provided price
      console.log(`Menu item ${item.name} not found in database, using provided price`)
      calculatedSubtotal += item.price * item.quantity
      continue
    }

    // Get the menu item price - handle multiple price formats
    let dbPrice = menuItem.price
    if (dbPrice === undefined && menuItem.prices && typeof menuItem.prices === 'object') {
      const priceValues = Object.values(menuItem.prices)
      if (priceValues.length > 0) {
        dbPrice = priceValues[0]
      }
    }

    // Skip strict price validation - just log if there's a mismatch
    if (dbPrice !== undefined && Math.abs(dbPrice - item.price) > 0.01) {
      console.log(`Price difference for ${item.name}: DB=${dbPrice}, Sent=${item.price}`)
    }

    // Skip branch validation if branchId is not set on menu item
    if (menuItem.branchId && menuItem.branchId.toString() !== branchId) {
      console.log(`Item ${item.name} branch mismatch: DB=${menuItem.branchId}, Sent=${branchId}`)
    }

    // Add to subtotal using the price sent from frontend
    calculatedSubtotal += item.price * item.quantity
  }

  // For counter orders, use provided tax and service charge (allow 0%)
  // If not provided, default to 0 for counter orders
  const finalTax = providedTax !== undefined ? providedTax : 0
  const finalServiceCharge = providedServiceCharge !== undefined ? providedServiceCharge : 0
  const finalTotalAmount = providedTotalAmount !== undefined ? providedTotalAmount : calculatedSubtotal
  const finalGrandTotal = providedGrandTotal !== undefined ? providedGrandTotal : calculatedSubtotal + finalTax + finalServiceCharge

  // Validate subtotal matches calculated
  if (providedSubtotal !== undefined && Math.abs(providedSubtotal - calculatedSubtotal) > 0.01) {
    res.status(400)
    throw new Error(`Subtotal mismatch: provided ₹${providedSubtotal}, calculated ₹${calculatedSubtotal}`)
  }

  // Create order with provided or default amounts
  const counterOrder = new CounterOrder({
    userId,
    customerName: customerName.trim(),
    phoneNumber: phoneNumber.trim(),
    branch: branchId,
    invoice: invoiceId,
    tableId: req.body.tableId || null,
    tableNumber: req.body.tableNumber || null,
    kotNumber: req.body.kotNumber || null,
    kotTime: req.body.kotTime || null,
    items,
    subtotal: calculatedSubtotal,
    tax: finalTax,
    serviceCharge: finalServiceCharge,
    totalAmount: finalTotalAmount,
    grandTotal: finalGrandTotal,
    paymentMethod,
    orderStatus: "processing", // Default order status
    paymentStatus: status || "completed", // Payment status based on payment completion
  })

  // Save to database
  await counterOrder.save()

  // Populate related data
  const populatedOrder = await CounterOrder.findById(counterOrder._id)
    .populate("userId", "name mobile")
    .populate("branch", "name address")
    .populate("invoice", "invoiceNumber")
    .populate("items.menuItemId", "name")

  res.status(201).json({
    message: "Counter order created successfully",
    order: {
      id: populatedOrder._id,
      userId: {
        id: populatedOrder.userId._id,
        name: populatedOrder.userId.name,
        mobile: populatedOrder.userId.mobile,
      },
      customerName: populatedOrder.customerName,
      phoneNumber: populatedOrder.phoneNumber,
      branch: {
        id: populatedOrder.branch._id,
        name: populatedOrder.branch.name,
        location: populatedOrder.branch.address,
      },
      invoice: {
        id: populatedOrder.invoice._id,
        invoiceNumber: populatedOrder.invoice.invoiceNumber,
      },
      tableId: populatedOrder.tableId,
      tableNumber: populatedOrder.tableNumber,
      kotNumber: populatedOrder.kotNumber,
      kotTime: populatedOrder.kotTime,
      items: populatedOrder.items,
      subtotal: populatedOrder.subtotal,
      tax: populatedOrder.tax,
      serviceCharge: populatedOrder.serviceCharge,
      totalAmount: populatedOrder.totalAmount,
      grandTotal: populatedOrder.grandTotal,
      paymentMethod: populatedOrder.paymentMethod,
      orderStatus: populatedOrder.orderStatus,
      paymentStatus: populatedOrder.paymentStatus,
      cancellationReason: populatedOrder.cancellationReason,
      cancelledAt: populatedOrder.cancelledAt,
      createdAt: populatedOrder.createdAt,
    },
  })
})
exports.getCounterOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400)
    throw new Error("Invalid order ID format")
  }

  const counterOrder = await CounterOrder.findById(id)
    .populate("userId", "name mobile")
    .populate("branch", "name address")
    .populate("invoice", "invoiceNumber")
    .populate("items.menuItemId", "name")

  if (!counterOrder) {
    res.status(404)
    throw new Error("Counter order not found")
  }

  res.status(200).json({
    order: {
      id: counterOrder._id,
      userId: {
        id: counterOrder.userId._id,
        name: counterOrder.userId.name,
        mobile: counterOrder.userId.mobile,
      },
      customerName: counterOrder.customerName,
      phoneNumber: counterOrder.phoneNumber,
      branch: {
        id: counterOrder.branch._id,
        name: counterOrder.branch.name,
        location: counterOrder.branch.address,
      },
      invoice: {
        id: counterOrder.invoice._id,
        invoiceNumber: counterOrder.invoice.invoiceNumber,
      },
      items: counterOrder.items,
      subtotal: counterOrder.subtotal,
      tax: counterOrder.tax,
      serviceCharge: counterOrder.serviceCharge,
      totalAmount: counterOrder.totalAmount,
      grandTotal: counterOrder.grandTotal,
      paymentMethod: counterOrder.paymentMethod,
      orderStatus: counterOrder.orderStatus,
      paymentStatus: counterOrder.paymentStatus,
      cancellationReason: counterOrder.cancellationReason,
      cancelledAt: counterOrder.cancelledAt,
      createdAt: counterOrder.createdAt,
    },
  })
})
exports.getAllCounterOrders = asyncHandler(async (req, res) => {
  const counterOrders = await CounterOrder.find()
    .populate("userId", "name mobile")
    .populate("branch", "name address")
    .populate("invoice", "invoiceNumber")
    .populate("items.menuItemId", "name")
    .sort({ createdAt: -1 })

  if (!counterOrders || counterOrders.length === 0) {
    return res.status(200).json({
      message: "No counter orders found",
      orders: [],
    })
  }

  // Add null checks to prevent undefined errors
  const formattedOrders = counterOrders
    .map((order) => {
      // Check if all required populated fields exist
      if (!order.userId || !order.branch || !order.invoice) {
        console.warn(`Order ${order._id} has missing populated references`)
        return null
      }

      return {
        id: order._id,
        userId: {
          id: order.userId._id,
          name: order.userId.name,
          mobile: order.userId.mobile,
        },
        customerName: order.customerName,
        phoneNumber: order.phoneNumber,
        branch: {
          id: order.branch._id,
          name: order.branch.name,
          location: order.branch.address,
        },
        invoice: {
          id: order.invoice._id,
          invoiceNumber: order.invoice.invoiceNumber,
        },
        tableId: order.tableId,
        tableNumber: order.tableNumber,
        kotNumber: order.kotNumber,
        kotTime: order.kotTime,
        items: order.items || [],
        subtotal: order.subtotal,
        tax: order.tax,
        serviceCharge: order.serviceCharge,
        totalAmount: order.totalAmount,
        grandTotal: order.grandTStatus,
        paymentStatus: order.paymentStatus,
        cancellationReason: order.cancellationReason,
        cancelledAt: order.cancelledAt,
        createdAt: order.createdAt,
      }
    })
    .filter((order) => order !== null) // Remove any null entries

  res.status(200).json({
    message: "Counter orders retrieved successfully",
    count: formattedOrders.length,
    orders: formattedOrders,
  })
})
exports.getCounterOrdersByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params
if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400)
    throw new Error("Invalid user ID format")
  }

  const counterOrders = await CounterOrder.find({ userId })
    .populate("userId", "name mobile")
    .populate("branch", "name address")
    .populate("invoice", "invoiceNumber")
    .populate("items.menuItemId", "name")
    .sort({ createdAt: -1 })

  if (!counterOrders || counterOrders.length === 0) {
    return res.status(200).json({
      message: "No counter orders found for this user",
      orders: [],
    })
  }

  const formattedOrders = counterOrders.map((order) => ({
    id: order._id,
    userId: {
      id: order.userId._id,
      name: order.userId.name,
      mobile: order.userId.mobile,
    },
    customerName: order.customerName,
    phoneNumber: order.phoneNumber,
    branch: {
      id: order.branch._id,
      name: order.branch.name,
      location: order.branch.address,
    },
    invoice: {
      id: order.invoice._id,
      invoiceNumber: order.invoice.invoiceNumber,
    },
    items: order.items || [],
    subtotal: order.subtotal,
    tax: order.tax,
    serviceCharge: order.serviceCharge,
    totalAmount: order.totalAmount,
    grandTotal: order.grandTotal,
    paymentMethod: order.paymentMethod,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    cancellationReason: order.cancellationReason,
    cancelledAt: order.cancelledAt,
    createdAt: order.createdAt,
  }))

  res.status(200).json({
    message: "Counter orders retrieved successfully",
    count: formattedOrders.length,
    orders: formattedOrders,
  })
})

exports.updateCounterOrder = asyncHandler(async (req, res) => {
  const { id } = req.params
  const updateData = req.body

  // Validate ObjectId format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400)
    throw new Error("Invalid order ID format")
  }

  const counterOrder = await CounterOrder.findById(id)
  if (!counterOrder) {
    res.status(404)
    throw new Error("Counter order not found")
  }

  // If items are being updated, recalculate totals
  if (updateData.items) {
    let calculatedSubtotal = 0
    for (const item of updateData.items) {
      calculatedSubtotal += item.price * item.quantity
    }

    updateData.subtotal = calculatedSubtotal
    updateData.tax = calculatedSubtotal * TAX_RATE
    updateData.serviceCharge = calculatedSubtotal * SERVICE_CHARGE_RATE
    updateData.totalAmount = calculatedSubtotal
    updateData.grandTotal = calculatedSubtotal + updateData.tax + updateData.serviceCharge
  }

  // Update the order
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) {
      counterOrder[key] = updateData[key]
    }
  })

  await counterOrder.save()

  const populatedOrder = await CounterOrder.findById(id)
    .populate("userId", "name mobile")
    .populate("branch", "name address")
    .populate("invoice", "invoiceNumber")
    .populate("items.menuItemId", "name")

  res.status(200).json({
    message: "Counter order updated successfully",
    order: {
      id: populatedOrder._id,
      userId: {
        id: populatedOrder.userId._id,
        name: populatedOrder.userId.name,
        mobile: populatedOrder.userId.mobile,
      },
      customerName: populatedOrder.customerName,
      phoneNumber: populatedOrder.phoneNumber,
      branch: {
        id: populatedOrder.branch._id,
        name: populatedOrder.branch.name,
        location: populatedOrder.branch.address,
      },
      invoice: {
        id: populatedOrder.invoice._id,
        invoiceNumber: populatedOrder.invoice.invoiceNumber,
      },
      items: populatedOrder.items,
      subtotal: populatedOrder.subtotal,
      tax: populatedOrder.tax,
      serviceCharge: populatedOrder.serviceCharge,
      totalAmount: populatedOrder.totalAmount,
      grandTotal: populatedOrder.grandTotal,
      paymentMethod: populatedOrder.paymentMethod,
      orderStatus: populatedOrder.orderStatus,
      paymentStatus: populatedOrder.paymentStatus,
      cancellationReason: populatedOrder.cancellationReason,
      cancelledAt: populatedOrder.cancelledAt,
      createdAt: populatedOrder.createdAt,
    },
  })
})

// Update order status only
exports.updateCounterOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { orderStatus } = req.body

  // Validate ObjectId format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400)
    throw new Error("Invalid order ID format")
  }

  if (!orderStatus || !["pending", "processing", "completed", "cancelled"].includes(orderStatus)) {
    res.status(400)
    throw new Error("Invalid order status. Must be one of: pending, processing, completed, cancelled")
  }

  const counterOrder = await CounterOrder.findById(id)
  if (!counterOrder) {
    res.status(404)
    throw new Error("Counter order not found")
  }

  // Check if order is already cancelled
  if (counterOrder.orderStatus === "cancelled") {
    res.status(400)
    throw new Error("Cannot update status of a cancelled order")
  }

  counterOrder.orderStatus = orderStatus
  await counterOrder.save()

  const populatedOrder = await CounterOrder.findById(id)
    .populate("userId", "name mobile")
    .populate("branch", "name address")
    .populate("invoice", "invoiceNumber")
    .populate("items.menuItemId", "name")

  res.status(200).json({
    message: "Counter order status updated successfully",
    order: {
      id: populatedOrder._id,
      userId: {
        id: populatedOrder.userId._id,
        name: populatedOrder.userId.name,
        mobile: populatedOrder.userId.mobile,
      },
      customerName: populatedOrder.customerName,
      phoneNumber: populatedOrder.phoneNumber,
      branch: {
        id: populatedOrder.branch._id,
        name: populatedOrder.branch.name,
        location: populatedOrder.branch.address,
      },
      invoice: {
        id: populatedOrder.invoice._id,
        invoiceNumber: populatedOrder.invoice.invoiceNumber,
      },
      items: populatedOrder.items,
      subtotal: populatedOrder.subtotal,
      tax: populatedOrder.tax,
      serviceCharge: populatedOrder.serviceCharge,
      totalAmount: populatedOrder.totalAmount,
      grandTotal: populatedOrder.grandTotal,
      paymentMethod: populatedOrder.paymentMethod,
      orderStatus: populatedOrder.orderStatus,
      paymentStatus: populatedOrder.paymentStatus,
      cancellationReason: populatedOrder.cancellationReason,
      cancelledAt: populatedOrder.cancelledAt,
      createdAt: populatedOrder.createdAt,
    },
  })
})

// Update payment status only
exports.updateCounterPaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { paymentStatus } = req.body

  // Validate ObjectId format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400)
    throw new Error("Invalid order ID format")
  }

  if (!paymentStatus || !["pending", "completed", "failed", "refunded"].includes(paymentStatus)) {
    res.status(400)
    throw new Error("Invalid payment status. Must be one of: pending, completed, failed, refunded")
  }

  const counterOrder = await CounterOrder.findById(id)
  if (!counterOrder) {
    res.status(404)
    throw new Error("Counter order not found")
  }

  // Check if order is cancelled
  if (counterOrder.orderStatus === "cancelled") {
    res.status(400)
    throw new Error("Cannot update payment status of a cancelled order")
  }

  counterOrder.paymentStatus = paymentStatus
  await counterOrder.save()

  const populatedOrder = await CounterOrder.findById(id)
    .populate("userId", "name mobile")
    .populate("branch", "name address")
    .populate("invoice", "invoiceNumber")
    .populate("items.menuItemId", "name")

  res.status(200).json({
    message: "Counter payment status updated successfully",
    order: {
      id: populatedOrder._id,
      userId: {
        id: populatedOrder.userId._id,
        name: populatedOrder.userId.name,
        mobile: populatedOrder.userId.mobile,
      },
      customerName: populatedOrder.customerName,
      phoneNumber: populatedOrder.phoneNumber,
      branch: {
        id: populatedOrder.branch._id,
        name: populatedOrder.branch.name,
        location: populatedOrder.branch.address,
      },
      invoice: {
        id: populatedOrder.invoice._id,
        invoiceNumber: populatedOrder.invoice.invoiceNumber,
      },
      items: populatedOrder.items,
      subtotal: populatedOrder.subtotal,
      tax: populatedOrder.tax,
      serviceCharge: populatedOrder.serviceCharge,
      totalAmount: populatedOrder.totalAmount,
      grandTotal: populatedOrder.grandTotal,
      paymentMethod: populatedOrder.paymentMethod,
      orderStatus: populatedOrder.orderStatus,
      paymentStatus: populatedOrder.paymentStatus,
      cancellationReason: populatedOrder.cancellationReason,
      cancelledAt: populatedOrder.cancelledAt,
      createdAt: populatedOrder.createdAt,
    },
  })
})

// Cancel order with reason
exports.cancelCounterOrder = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { cancellationReason } = req.body

  // Validate ObjectId format
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400)
    throw new Error("Invalid order ID format")
  }

  if (!cancellationReason || !cancellationReason.trim()) {
    res.status(400)
    throw new Error("Cancellation reason is required")
  }

  if (cancellationReason.trim().length > 500) {
    res.status(400)
    throw new Error("Cancellation reason cannot exceed 500 characters")
  }

  const counterOrder = await CounterOrder.findById(id)
  if (!counterOrder) {
    res.status(404)
    throw new Error("Counter order not found")
  }

  // Check if order is already cancelled
  if (counterOrder.orderStatus === "cancelled") {
    res.status(400)
    throw new Error("Order is already cancelled")
  }

  // Check if order is completed
  if (counterOrder.orderStatus === "completed") {
    res.status(400)
    throw new Error("Cannot cancel a completed order")
  }

  // Update order status to cancelled and add cancellation reason
  counterOrder.orderStatus = "cancelled"
  counterOrder.cancellationReason = cancellationReason.trim()
  counterOrder.cancelledAt = new Date()
  await counterOrder.save()

  const populatedOrder = await CounterOrder.findById(id)
    .populate("userId", "name mobile")
    .populate("branch", "name address")
    .populate("invoice", "invoiceNumber")
    .populate("items.menuItemId", "name")

  res.status(200).json({
    message: "Counter order cancelled successfully",
    order: {
      id: populatedOrder._id,
      userId: {
        id: populatedOrder.userId._id,
        name: populatedOrder.userId.name,
        mobile: populatedOrder.userId.mobile,
      },
      customerName: populatedOrder.customerName,
      phoneNumber: populatedOrder.phoneNumber,
      branch: {
        id: populatedOrder.branch._id,
        name: populatedOrder.branch.name,
        location: populatedOrder.branch.address,
      },
      invoice: {
        id: populatedOrder.invoice._id,
        invoiceNumber: populatedOrder.invoice.invoiceNumber,
      },
      items: populatedOrder.items,
      subtotal: populatedOrder.subtotal,
      tax: populatedOrder.tax,
      serviceCharge: populatedOrder.serviceCharge,
      totalAmount: populatedOrder.totalAmount,
      grandTotal: populatedOrder.grandTotal,
      paymentMethod: populatedOrder.paymentMethod,
      orderStatus: populatedOrder.orderStatus,
      paymentStatus: populatedOrder.paymentStatus,
      cancellationReason: populatedOrder.cancellationReason,
      cancelledAt: populatedOrder.cancelledAt,
      createdAt: populatedOrder.createdAt,
    },
  })
})

// Clear all counter orders (for testing/cleanup)
exports.clearAllCounterOrders = asyncHandler(async (req, res) => {
  try {
    // Delete all counter orders
    const deleteResult = await CounterOrder.deleteMany({})
    
    res.status(200).json({
      message: "All counter orders cleared successfully",
      deletedCount: deleteResult.deletedCount
    })
  } catch (error) {
    console.error("Error clearing counter orders:", error)
    res.status(500)
    throw new Error("Failed to clear counter orders")
  }
})
