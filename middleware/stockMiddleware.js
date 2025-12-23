const Menu = require('../model/menuModel');
const StockHistory = require('../model/stockHistoryModel');

// Middleware to validate stock before creating order (DISABLED - out of stock functionality removed)
const validateStock = async (req, res, next) => {
  try {
    const { items, branchId } = req.body;

    console.log('🔍 STOCK VALIDATION DISABLED - SKIPPING:');
    console.log('- items:', items);
    console.log('- branchId:', branchId);

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('❌ No items provided');
      return res.status(400).json({
        success: false,
        message: 'Items array is required'
      });
    }

    // Skip all stock validation - just prepare basic stock updates without checking availability
    const stockUpdates = [];

    for (const item of items) {
      const product = await Menu.findById(item.menuItemId);
      
      if (!product) {
        console.log(`⚠️ Product ${item.menuItemId} not found, but continuing anyway`);
        continue;
      }

      if (product.branchId.toString() !== branchId) {
        console.log(`⚠️ Product ${item.name} not in branch ${branchId}, but continuing anyway`);
        continue;
      }

      // Prepare stock update without validation (allow negative stock)
      stockUpdates.push({
        productId: item.menuItemId,
        quantity: item.quantity,
        oldStock: product.stock,
        newStock: Math.max(0, product.stock - item.quantity) // Prevent negative stock but don't block order
      });
    }

    // Always proceed regardless of stock levels
    req.stockUpdates = stockUpdates;
    console.log('✅ Stock validation SKIPPED. Proceeding with order. Stock updates:', stockUpdates);
    next();
  } catch (error) {
    console.error('Stock validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing order',
      error: error.message
    });
  }
};

// Middleware to update stock after order creation
const updateStockAfterOrder = async (req, res, next) => {
  try {
    const { stockUpdates } = req;
    const orderId = req.orderId; // This should be set by the order creation controller
    const updatedBy = req.user?.id || req.admin?.id;

    console.log('🔍 STOCK UPDATE DEBUG:');
    console.log('- stockUpdates:', stockUpdates);
    console.log('- orderId:', orderId);
    console.log('- updatedBy:', updatedBy);

    if (!stockUpdates || stockUpdates.length === 0) {
      console.log('❌ No stock updates to process');
      // Send response if orderResponse exists
      if (req.orderResponse) {
        return res.status(201).json(req.orderResponse);
      }
      return next();
    }

    console.log(`📦 Processing ${stockUpdates.length} stock updates...`);

    for (const update of stockUpdates) {
      console.log(`🔄 Updating product ${update.productId}: ${update.oldStock} → ${update.newStock} (reducing by ${update.quantity})`);
      
      // Update product stock
      const result = await Menu.findByIdAndUpdate(update.productId, {
        $inc: { stock: -update.quantity },
        $set: { 
          isActive: update.newStock > 0 
        }
      });

      console.log(`✅ Stock updated for product ${update.productId}:`, result);

      // Log stock history
      try {
        await StockHistory.create({
          productId: update.productId,
          branchId: req.body.branchId,
          updatedBy,
          oldStock: update.oldStock,
          newStock: update.newStock,
          changeType: 'order_placed',
          orderId,
          quantity: update.quantity,
          notes: 'Stock reduced due to order placement'
        });
        console.log(`📝 Stock history logged for product ${update.productId}`);
      } catch (historyError) {
        console.error('❌ Failed to log stock history:', historyError.message);
        // Continue without failing the main operation
      }
    }

    console.log('✅ All stock updates completed successfully');
    
    // Send the response if orderResponse exists
    if (req.orderResponse) {
      res.status(201).json(req.orderResponse);
    } else {
      next();
    }
  } catch (error) {
    console.error('❌ Stock update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stock',
      error: error.message
    });
  }
};

// Middleware to restore stock when order is cancelled
const restoreStockOnCancellation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status !== 'cancelled') {
      return next();
    }

    // Get the order to find items
    const Order = require('../model/orderModel');
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const updatedBy = req.user?.id || req.admin?.id || 'system';

    // Restore stock for each item
    for (const item of order.items) {
      const product = await Menu.findById(item.menuItemId);
      
      if (product) {
        const oldStock = product.stock;
        const newStock = oldStock + item.quantity;

        // Update product stock
        await Menu.findByIdAndUpdate(item.menuItemId, {
          $inc: { stock: item.quantity },
          $set: { 
            isActive: newStock > 0 
          }
        });

        // Log stock history
        await StockHistory.create({
          productId: item.menuItemId,
          branchId: order.branchId,
          updatedBy,
          oldStock,
          newStock,
          changeType: 'order_cancelled',
          orderId: order._id,
          quantity: item.quantity,
          notes: 'Stock restored due to order cancellation'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Stock restoration error:', error);
    // Don't block the cancellation if stock restoration fails
    // Just log the error and continue
    console.log('Continuing with order cancellation despite stock restoration error');
    next();
  }
};

module.exports = {
  validateStock,
  updateStockAfterOrder,
  restoreStockOnCancellation
};
