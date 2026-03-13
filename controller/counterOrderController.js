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
    branchName,
    categoryId,
    categoryName,
    invoiceId,
    items,
    paymentMethod,
    status,
    isComplimentary = false,
    complimentaryReason = null,
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

  // Make invoiceId optional for KOT orders - they can be created without invoice initially
  // if (!invoiceId) {
  //   res.status(400)
  //   throw new Error("Invoice is required")
  // }

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
    // if (!counterUser) {
    //   console.log(`Counter user ${userId} not found, proceeding with order anyway`)
    // }
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
  if (invoiceId) {
    try {
      invoice = await CounterInvoice.findById(invoiceId)
      // if (!invoice) {
      //   console.log(`Invoice ${invoiceId} not found, proceeding with order anyway`)
      // }
    } catch (err) {
      console.log(`Error finding invoice: ${err.message}, proceeding with order anyway`)
    }
  } else {
    console.log('No invoiceId provided, creating order without invoice reference')
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
      // console.log(`Menu item ${item.name} not found in database, using provided price`)
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
    // if (dbPrice !== undefined && Math.abs(dbPrice - item.price) > 0.01) {
    //   console.log(`Price difference for ${item.name}: DB=${dbPrice}, Sent=${item.price}`)
    // }

    // Skip branch validation if branchId is not set on menu item
    // if (menuItem.branchId && menuItem.branchId.toString() !== branchId) {
    //   console.log(`Item ${item.name} branch mismatch: DB=${menuItem.branchId}, Sent=${branchId}`)
    // }

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
    branchName: branchName || null,
    categoryId: categoryId || null,
    categoryName: categoryName || null,
    invoice: invoiceId || null, // Make invoice optional
    tableId: req.body.tableId || null,
    tableNumber: req.body.tableNumber || null,
    kotNumber: req.body.kotNumber || null,
    kotTime: req.body.kotTime || null,
    invoiceNumber: req.body.invoiceNumber || null, // Add invoiceNumber field
    items,
    subtotal: calculatedSubtotal,
    tax: finalTax,
    serviceCharge: finalServiceCharge,
    totalAmount: finalTotalAmount,
    grandTotal: finalGrandTotal,
    isComplimentary,
    complimentaryReason,
    paymentMethod,
    orderStatus: "processing", // Default order status
    paymentStatus: status || "completed", // Payment status based on payment completion
  })

  // Save to database
  // console.log('💾 Saving counter order with category info:', {
  //   categoryName: counterOrder.categoryName,
  //   branchName: counterOrder.branchName,
  //   categoryId: counterOrder.categoryId
  // });
  
  await counterOrder.save()
  
  // console.log('✅ Counter order saved successfully with category:', counterOrder.categoryName);

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
      invoice: populatedOrder.invoice ? {
        id: populatedOrder.invoice._id,
        invoiceNumber: populatedOrder.invoice.invoiceNumber,
      } : null,
      tableId: populatedOrder.tableId,
      tableNumber: populatedOrder.tableNumber,
      kotNumber: populatedOrder.kotNumber,
      kotTime: populatedOrder.kotTime,
      invoiceNumber: populatedOrder.invoiceNumber, // ADD: Include invoiceNumber in response
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
      invoice: counterOrder.invoice ? {
        id: counterOrder.invoice._id,
        invoiceNumber: counterOrder.invoice.invoiceNumber,
      } : null,
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
  const { 
    includeComplimentary = false, 
    startDate, 
    endDate, 
    date,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    branchId,
    categoryName,
    paymentStatus,
    orderStatus,
    paymentMethod
  } = req.query
  
  // console.log('📅 Date filter params:', { startDate, endDate, date });
  // console.log('🔍 Filter params:', { search, branchId, categoryName, paymentStatus, orderStatus, paymentMethod });
  
  // Build query to exclude complimentary orders from sales reports unless explicitly requested
  const query = {}
  if (!includeComplimentary || includeComplimentary === 'false') {
    query.isComplimentary = { $ne: true }
  }

  // Add date filtering
  if (date) {
    // Single date filter - filter for orders on specific date
    const filterDate = new Date(date);
    const startOfDay = new Date(filterDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(filterDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    query.createdAt = {
      $gte: startOfDay,
      $lte: endOfDay
    };
    
    // console.log('📅 Single date filter applied:', {
    //   date: date,
    //   startOfDay: startOfDay,
    //   endOfDay: endOfDay
    // });
  } else if (startDate || endDate) {
    // Date range filter
    query.createdAt = {};
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query.createdAt.$gte = start;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
    
    // console.log('📅 Date range filter applied:', {
    //   startDate: startDate,
    //   endDate: endDate,
    //   query: query.createdAt
    // });
  }

  // Add search filter - search by customer name, phone number, invoice number, KOT number
  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { customerName: searchRegex },
      { phoneNumber: searchRegex },
      { invoiceNumber: searchRegex },
      { kotNumber: searchRegex }
    ];
  }

  // Add branch filter
  if (branchId) {
    query.branch = branchId;
  }

  // Add category filter
  if (categoryName) {
    query.categoryName = new RegExp(categoryName.trim(), 'i');
    // console.log('📂 Category filter applied:', categoryName);
  }

  // Add payment status filter
  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  // Add order status filter
  if (orderStatus) {
    query.orderStatus = orderStatus;
  }

  // Add payment method filter
  if (paymentMethod) {
    query.paymentMethod = paymentMethod;
  }

  // console.log('🔍 Final query:', query);

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Start performance timer
  const startTime = Date.now();

  // Execute query with pagination
  const [counterOrders, totalCount] = await Promise.all([
    CounterOrder.find(query)
      .populate("userId", "name mobile")
      .populate("branch", "name address")
      .populate("invoice", "invoiceNumber")
      .populate("items.menuItemId", "name")
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    CounterOrder.countDocuments(query)
  ]);

  // Log performance
  const queryTime = Date.now() - startTime;
  // console.log(`⚡ Query executed in ${queryTime}ms - Found ${counterOrders.length} of ${totalCount} orders`);

  // console.log('📊 Found orders after filters:', counterOrders.length, 'of', totalCount);

  if (!counterOrders || counterOrders.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No counter orders found",
      data: [],
      orders: [],
      pagination: {
        currentPage: pageNum,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: limitNum,
        hasNextPage: false,
        hasPrevPage: false
      }
    })
  }

  // Add null checks to prevent undefined errors
  const formattedOrders = counterOrders
    .map((order) => {
      // Check if required populated fields exist (invoice is optional for KOT orders)
      if (!order.userId || !order.branch) {
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
        invoice: order.invoice ? {
          id: order.invoice._id,
          invoiceNumber: order.invoice.invoiceNumber,
        } : null,
        tableId: order.tableId,
        tableNumber: order.tableNumber,
        kotNumber: order.kotNumber,
        kotTime: order.kotTime,
        invoiceNumber: order.invoiceNumber,
        categoryName: order.categoryName,
        categoryId: order.categoryId,
        branchName: order.branchName,
        items: order.items || [],
        subtotal: order.subtotal,
        tax: order.tax,
        serviceCharge: order.serviceCharge,
        totalAmount: order.totalAmount,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        isComplimentary: order.isComplimentary || false,
        complimentaryReason: order.complimentaryReason,
        cancellationReason: order.cancellationReason,
        cancelledBy: order.cancelledBy,
        cancelledAt: order.cancelledAt,
        createdAt: order.createdAt,
        orderDate: order.createdAt,
      }
    })
    .filter((order) => order !== null);

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  // console.log('✅ Returning formatted orders:', formattedOrders.length);

  res.status(200).json({
    success: true,
    message: "Counter orders retrieved successfully",
    count: formattedOrders.length,
    data: formattedOrders,
    orders: formattedOrders,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limitNum,
      hasNextPage,
      hasPrevPage
    },
    filters: {
      includeComplimentary,
      startDate,
      endDate,
      date,
      search,
      branchId,
      categoryName,
      paymentStatus,
      orderStatus,
      paymentMethod
    }
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
    invoice: order.invoice ? {
      id: order.invoice._id,
      invoiceNumber: order.invoice.invoiceNumber,
    } : null,
    tableId: order.tableId,
    tableNumber: order.tableNumber,
    kotNumber: order.kotNumber,
    kotTime: order.kotTime,
    invoiceNumber: order.invoiceNumber, // ADD: Include invoiceNumber in response
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
      invoice: populatedOrder.invoice ? { id: populatedOrder.invoice._id, invoiceNumber: populatedOrder.invoice.invoiceNumber, } : null,
      tableId: populatedOrder.tableId,
      tableNumber: populatedOrder.tableNumber,
      kotNumber: populatedOrder.kotNumber,
      kotTime: populatedOrder.kotTime,
      invoiceNumber: populatedOrder.invoiceNumber, // ADD: Include invoiceNumber in response
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
      invoice: populatedOrder.invoice ? { id: populatedOrder.invoice._id, invoiceNumber: populatedOrder.invoice.invoiceNumber, } : null,
      tableId: populatedOrder.tableId,
      tableNumber: populatedOrder.tableNumber,
      kotNumber: populatedOrder.kotNumber,
      kotTime: populatedOrder.kotTime,
      invoiceNumber: populatedOrder.invoiceNumber, // ADD: Include invoiceNumber in response
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

  if (!paymentStatus || !["pending", "completed", "failed", "refunded", "consolidated"].includes(paymentStatus)) {
    res.status(400)
    throw new Error("Invalid payment status. Must be one of: pending, completed, failed, refunded, consolidated")
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
      invoice: populatedOrder.invoice ? { id: populatedOrder.invoice._id, invoiceNumber: populatedOrder.invoice.invoiceNumber, } : null,
      tableId: populatedOrder.tableId,
      tableNumber: populatedOrder.tableNumber,
      kotNumber: populatedOrder.kotNumber,
      kotTime: populatedOrder.kotTime,
      invoiceNumber: populatedOrder.invoiceNumber, // ADD: Include invoiceNumber in response
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
  const { cancellationReason, cancelledBy } = req.body

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

  // REMOVED: Allow cancelling completed orders
  // if (counterOrder.orderStatus === "completed") {
  //   res.status(400)
  //   throw new Error("Cannot cancel a completed order")
  // }

  // Update order status to cancelled and add cancellation details
  counterOrder.orderStatus = "cancelled"
  counterOrder.cancellationReason = cancellationReason.trim()
  counterOrder.cancelledBy = cancelledBy ? cancelledBy.trim() : null
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
      invoice: populatedOrder.invoice ? { id: populatedOrder.invoice._id, invoiceNumber: populatedOrder.invoice.invoiceNumber, } : null,
      tableId: populatedOrder.tableId,
      tableNumber: populatedOrder.tableNumber,
      kotNumber: populatedOrder.kotNumber,
      kotTime: populatedOrder.kotTime,
      invoiceNumber: populatedOrder.invoiceNumber, // ADD: Include invoiceNumber in response
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
      cancelledBy: populatedOrder.cancelledBy,
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

// Get categorized orders with pagination and filtering (optimized for big data)
exports.getCategorizedOrders = asyncHandler(async (req, res) => {
  const { 
    includeComplimentary = false, 
    startDate, 
    endDate, 
    date,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    branchId,
    categoryName,
    paymentStatus,
    orderStatus,
    paymentMethod
  } = req.query
  
  // console.log('📊 getCategorizedOrders called with params:', { 
  //   date, startDate, endDate, categoryName, orderStatus, page, limit 
  // });
  
  // Build query to exclude complimentary orders unless explicitly requested
  const query = {}
  if (!includeComplimentary || includeComplimentary === 'false') {
    query.isComplimentary = { $ne: true }
  }

  // Only include orders with invoice numbers (completed bills)
  query.$or = [
    { invoiceNumber: { $exists: true, $ne: null, $ne: '' } },
    { 'invoice': { $exists: true, $ne: null } }
  ]

  // Add date filtering
  if (date) {
    const filterDate = new Date(date);
    const startOfDay = new Date(filterDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(filterDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    query.createdAt = {
      $gte: startOfDay,
      $lte: endOfDay
    };
  } else if (startDate || endDate) {
    query.createdAt = {};
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query.createdAt.$gte = start;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  // Add search filter
  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { customerName: searchRegex },
        { phoneNumber: searchRegex },
        { invoiceNumber: searchRegex },
        { kotNumber: searchRegex }
      ]
    });
  }

  // Add branch filter
  if (branchId) {
    query.branch = branchId;
  }

  // Add category filter
  if (categoryName && categoryName !== 'all') {
    const categoryLower = categoryName.toLowerCase().trim();
    
    if (categoryLower === 'selfservice' || categoryLower === 'self service') {
      // Self service: categoryName contains 'self service' or 'darshini', OR no table
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { categoryName: /self service|self-service|darshini/i },
          { $and: [
            { categoryName: { $not: /restaurant|temple/i } },
            { $or: [
              { tableNumber: { $exists: false } },
              { tableNumber: null },
              { tableNumber: '' }
            ]}
          ]}
        ]
      });
    } else if (categoryLower === 'restaurant') {
      // Restaurant: categoryName contains 'restaurant' OR has table number
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { categoryName: /restaurant/i },
          { $and: [
            { categoryName: { $not: /temple|self service|darshini/i } },
            { tableNumber: { $exists: true, $ne: null, $ne: '' } }
          ]}
        ]
      });
    } else if (categoryLower === 'templemeals' || categoryLower === 'temple meals') {
      // Temple meals: categoryName contains 'temple'
      query.categoryName = /temple/i;
    }
  }

  // Add payment status filter
  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  // Add order status filter
  if (orderStatus) {
    query.orderStatus = orderStatus;
  }

  // Add payment method filter
  if (paymentMethod) {
    query.paymentMethod = paymentMethod;
  }

  // console.log('🔍 Final query:', JSON.stringify(query, null, 2));

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Start performance timer
  const startTime = Date.now();

  // Execute query with pagination
  const [counterOrders, totalCount] = await Promise.all([
    CounterOrder.find(query)
      .populate("userId", "name mobile")
      .populate("branch", "name address")
      .populate("invoice", "invoiceNumber")
      .populate("items.menuItemId", "name")
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    CounterOrder.countDocuments(query)
  ]);

  // Calculate category counts (for all matching orders, not just current page)
  const categoryCounts = await Promise.all([
    // Self Service count
    CounterOrder.countDocuments({
      ...query,
      $or: [
        { categoryName: /self service|self-service|darshini/i },
        { $and: [
          { categoryName: { $not: /restaurant|temple/i } },
          { $or: [
            { tableNumber: { $exists: false } },
            { tableNumber: null },
            { tableNumber: '' }
          ]}
        ]}
      ]
    }),
    // Restaurant count
    CounterOrder.countDocuments({
      ...query,
      $or: [
        { categoryName: /restaurant/i },
        { $and: [
          { categoryName: { $not: /temple|self service|darshini/i } },
          { tableNumber: { $exists: true, $ne: null, $ne: '' } }
        ]}
      ]
    }),
    // Temple Meals count
    CounterOrder.countDocuments({
      ...query,
      categoryName: /temple/i
    })
  ]);

  // Calculate statistics for all matching orders (not just current page)
  const allMatchingOrders = await CounterOrder.find(query).select('grandTotal totalAmount orderStatus').lean();
  
  const stats = {
    totalOrders: totalCount,
    totalRevenue: 0,
    cancelledOrders: 0,
    cancelledAmount: 0,
    completedOrders: 0,
    pendingOrders: 0
  };

  allMatchingOrders.forEach(order => {
    const status = (order.orderStatus || 'completed').toLowerCase();
    const amount = order.grandTotal || order.totalAmount || 0;
    
    if (status === 'cancelled') {
      stats.cancelledOrders++;
      stats.cancelledAmount += amount;
    } else {
      stats.totalRevenue += amount;
      if (status === 'completed') {
        stats.completedOrders++;
      } else if (status === 'pending' || status === 'processing') {
        stats.pendingOrders++;
      }
    }
  });

  // Log performance
  const queryTime = Date.now() - startTime;
  // console.log(`⚡ Query executed in ${queryTime}ms - Found ${counterOrders.length} of ${totalCount} orders`);

  if (!counterOrders || counterOrders.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No counter orders found",
      data: [],
      orders: [],
      stats,
      categoryCounts: {
        selfService: categoryCounts[0],
        restaurant: categoryCounts[1],
        templeMeals: categoryCounts[2]
      },
      pagination: {
        currentPage: pageNum,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: limitNum,
        hasNextPage: false,
        hasPrevPage: false
      }
    })
  }

  // Format orders
  const formattedOrders = counterOrders
    .map((order) => {
      if (!order.userId || !order.branch) {
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
        invoice: order.invoice ? {
          id: order.invoice._id,
          invoiceNumber: order.invoice.invoiceNumber,
        } : null,
        tableId: order.tableId,
        tableNumber: order.tableNumber,
        kotNumber: order.kotNumber,
        kotTime: order.kotTime,
        invoiceNumber: order.invoiceNumber,
        categoryName: order.categoryName,
        categoryId: order.categoryId,
        branchName: order.branchName,
        items: order.items || [],
        subtotal: order.subtotal,
        tax: order.tax,
        serviceCharge: order.serviceCharge,
        totalAmount: order.totalAmount,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        isComplimentary: order.isComplimentary || false,
        complimentaryReason: order.complimentaryReason,
        cancellationReason: order.cancellationReason,
        cancelledBy: order.cancelledBy,
        cancelledAt: order.cancelledAt,
        createdAt: order.createdAt,
        orderDate: order.createdAt,
      }
    })
    .filter((order) => order !== null);

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  // console.log('✅ Returning formatted orders:', formattedOrders.length);

  res.status(200).json({
    success: true,
    message: "Categorized orders retrieved successfully",
    count: formattedOrders.length,
    data: formattedOrders,
    orders: formattedOrders,
    stats,
    categoryCounts: {
      selfService: categoryCounts[0],
      restaurant: categoryCounts[1],
      templeMeals: categoryCounts[2]
    },
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limitNum,
      hasNextPage,
      hasPrevPage
    },
    filters: {
      includeComplimentary,
      startDate,
      endDate,
      date,
      search,
      branchId,
      categoryName,
      paymentStatus,
      orderStatus,
      paymentMethod
    }
  })
})
