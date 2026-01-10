const Cart = require('../model/cartModel');

// Get cart items for a user and branch
exports.getCartItems = async (req, res) => {
  try {
    const { userId, branchId } = req.query;
    
    if (!userId || !branchId) {
      return res.status(400).json({ message: 'userId and branchId are required' });
    }
    
    const cart = await Cart.findOne({ userId, branchId })
      .populate('items.menuItemId', 'name price image');
    
    if (!cart) {
      return res.status(200).json({ items: [] });
    }
    
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { userId, branchId, menuItemId, quantity, price } = req.body;
    
    if (!userId || !branchId || !menuItemId || !quantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    let cart = await Cart.findOne({ userId, branchId });
    
    if (!cart) {
      cart = new Cart({
        userId,
        branchId,
        items: []
      });
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.menuItemId.toString() === menuItemId
    );
    
    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
      if (price) {
        cart.items[existingItemIndex].price = price;
      }
    } else {
      // Add new item
      cart.items.push({
        menuItemId,
        quantity,
        price: price || 0
      });
    }
    
    await cart.save();
    
    res.status(200).json({ message: 'Item added to cart', cart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
};

// Update cart item
exports.updateCartItem = async (req, res) => {
  try {
    const { userId, branchId, menuItemId, quantity } = req.body;
    
    const cart = await Cart.findOne({ userId, branchId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    const itemIndex = cart.items.findIndex(
      item => item.menuItemId.toString() === menuItemId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
    
    await cart.save();
    
    res.status(200).json({ message: 'Cart updated', cart });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Error updating cart', error: error.message });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { userId, branchId, menuItemId } = req.query;
    
    const cart = await Cart.findOne({ userId, branchId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(
      item => item.menuItemId.toString() !== menuItemId
    );
    
    await cart.save();
    
    res.status(200).json({ message: 'Item removed from cart', cart });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Error removing from cart', error: error.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const { userId, branchId } = req.body;
    
    await Cart.findOneAndDelete({ userId, branchId });
    
    res.status(200).json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
};