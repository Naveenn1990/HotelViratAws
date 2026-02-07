const PublicRestaurantOrder = require('../model/publicRestaurantOrderModel');

// Generate unique order ID in format: DDMMYYYY-PUB-sequence
const generateOrderId = async () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const datePrefix = `${day}${month}${year}-PUB-`;

  // Find the last order for today
  const lastOrder = await PublicRestaurantOrder.findOne({
    orderId: new RegExp(`^${datePrefix}`)
  }).sort({ orderId: -1 });

  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderId.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `${datePrefix}${String(sequence).padStart(4, '0')}`;
};

// Create new public restaurant order
exports.createPublicOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerMobile,
      peopleCount,
      branchId,
      branchName,
      tableId,
      tableNumber,
      categoryId,
      categoryName,
      sessionId,
      items,
      totalAmount,
      paymentMethod,
      notes
    } = req.body;

    // Validation
    if (!customerName || !customerMobile) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and mobile number are required'
      });
    }

    if (!branchId || !tableNumber) {
      return res.status(400).json({
        success: false,
        message: 'Branch and table information are required'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // Validate mobile number (10 digits)
    if (!/^\d{10}$/.test(customerMobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be 10 digits'
      });
    }

    // Generate unique order ID
    const orderId = await generateOrderId();

    // Calculate total from items (no tax, no service charge)
    const calculatedTotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Create order
    const newOrder = new PublicRestaurantOrder({
      orderId,
      customerName,
      customerMobile,
      peopleCount: peopleCount || 1,
      branchId,
      branchName,
      tableId,
      tableNumber,
      categoryId,
      categoryName,
      sessionId, // Store session ID
      items,
      totalAmount: calculatedTotal,
      paymentMethod: paymentMethod || 'pending',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      notes,
      isGuestOrder: true,
      orderTime: new Date()
    });

    await newOrder.save();

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId: newOrder.orderId,
        orderTime: newOrder.orderTime,
        totalAmount: newOrder.totalAmount,
        customerName: newOrder.customerName,
        tableNumber: newOrder.tableNumber
      }
    });

  } catch (error) {
    console.error('Error creating public restaurant order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to place order',
      error: error.message
    });
  }
};

// Get all public orders (for admin/staff)
exports.getAllPublicOrders = async (req, res) => {
  try {
    const { branchId, startDate, endDate, status } = req.query;

    let query = {};

    if (branchId) {
      query.branchId = branchId;
    }

    if (status) {
      query.orderStatus = status;
    }

    if (startDate || endDate) {
      query.orderTime = {};
      if (startDate) {
        query.orderTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.orderTime.$lte = new Date(endDate);
      }
    }

    const orders = await PublicRestaurantOrder.find(query)
      .populate('branchId', 'name')
      .populate('categoryId', 'name')
      .sort({ orderTime: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error('Error fetching public orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await PublicRestaurantOrder.findOne({ orderId })
      .populate('branchId', 'name contact address')
      .populate('categoryId', 'name')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, paymentStatus, paymentMethod } = req.body;

    const updateData = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;

    const order = await PublicRestaurantOrder.findOneAndUpdate(
      { orderId },
      updateData,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};

// Get orders by customer mobile
exports.getOrdersByMobile = async (req, res) => {
  try {
    const { mobile } = req.params;

    const orders = await PublicRestaurantOrder.find({ customerMobile: mobile })
      .populate('branchId', 'name')
      .sort({ orderTime: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error('Error fetching orders by mobile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};
