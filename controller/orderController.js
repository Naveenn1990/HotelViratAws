const Order = require('../model/orderModel');

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const { branchId, status, categoryId, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (branchId) filter.branchId = branchId;
    if (status) filter.orderStatus = status;
    if (categoryId) filter.categoryId = categoryId;
    
    const orders = await Order.find(filter)
      .populate('userId', 'name phone')
      .populate('branchId', 'name')
      .populate('items.menuItemId', 'name price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(filter);
    
    res.status(200).json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name phone email')
      .populate('branchId', 'name address')
      .populate('items.menuItemId', 'name price image');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    const order = new Order(orderData);
    await order.save();
    
    // Populate the order before returning
    await order.populate([
      { path: 'userId', select: 'name phone' },
      { path: 'branchId', select: 'name' },
      { path: 'items.menuItemId', select: 'name price' }
    ]);
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ message: 'Error creating order', error: error.message });
  }
};

// Update order
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'userId', select: 'name phone' },
      { path: 'branchId', select: 'name' },
      { path: 'items.menuItemId', select: 'name price' }
    ]);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(400).json({ message: 'Error updating order', error: error.message });
  }
};

// Delete order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
};

// Get orders by category (for category orders page)
exports.getOrdersByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { branchId } = req.query;
    
    const filter = { categoryId };
    if (branchId) filter.branchId = branchId;
    
    const orders = await Order.find(filter)
      .populate('userId', 'name phone')
      .populate('branchId', 'name')
      .populate('items.menuItemId', 'name price')
      .sort({ createdAt: -1 });
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching category orders:', error);
    res.status(500).json({ message: 'Error fetching category orders', error: error.message });
  }
};