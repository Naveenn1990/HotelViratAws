// Test direct model creation to isolate the issue
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat');

// Import the model directly
const CounterOrder = require('./model/counterOrderModel');

async function testDirectModelCreation() {
  try {
    console.log('🧪 Testing direct model creation...');
    
    const orderData = {
      userId: new mongoose.Types.ObjectId("6964bde859360240eb66958a"),
      customerName: "Test Customer",
      phoneNumber: "9876543210",
      branch: new mongoose.Types.ObjectId("692abe14f2bcfd6d0bbd98ad"),
      invoice: null, // This should be allowed now
      items: [{
        menuItemId: new mongoose.Types.ObjectId("696e0ce6794dfc9af0c37d52"),
        name: "Curd",
        quantity: 2,
        price: 39.96
      }],
      subtotal: 79.92,
      tax: 0,
      serviceCharge: 0,
      totalAmount: 79.92,
      grandTotal: 79.92,
      paymentMethod: "cash",
      orderStatus: "processing",
      paymentStatus: "pending"
    };
    
    const counterOrder = new CounterOrder(orderData);
    
    // Validate without saving first
    const validationError = counterOrder.validateSync();
    if (validationError) {
      console.log('❌ Validation Error:', validationError.message);
      console.log('📋 Validation Details:', validationError.errors);
      return;
    }
    
    console.log('✅ Validation passed! Attempting to save...');
    
    const savedOrder = await counterOrder.save();
    console.log('✅ Order saved successfully!');
    console.log('📋 Order ID:', savedOrder._id);
    
    // Clean up - delete the test order
    await CounterOrder.findByIdAndDelete(savedOrder._id);
    console.log('🧹 Test order cleaned up');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('📋 Error Details:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDirectModelCreation();