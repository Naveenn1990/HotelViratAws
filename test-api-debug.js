// Test API endpoint directly to debug the issue
const express = require('express');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat');

// Clear require cache to ensure fresh model loading
delete require.cache[require.resolve('./model/counterOrderModel')];

// Import the model
const CounterOrder = require('./model/counterOrderModel');

async function testAPIDebug() {
  try {
    console.log('🧪 Testing API debug...');
    
    // Check the model schema
    console.log('📋 Model schema for invoice field:');
    console.log(CounterOrder.schema.paths.invoice);
    
    // Test creating an order directly
    const orderData = {
      userId: new mongoose.Types.ObjectId("6964bde859360240eb66958a"),
      customerName: "Test Customer",
      phoneNumber: "9876543210",
      branch: new mongoose.Types.ObjectId("692abe14f2bcfd6d0bbd98ad"),
      invoice: null, // This should be allowed
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
    
    console.log('🔍 Creating order with data:', JSON.stringify(orderData, null, 2));
    
    const counterOrder = new CounterOrder(orderData);
    
    // Validate
    const validationError = counterOrder.validateSync();
    if (validationError) {
      console.log('❌ Validation Error:', validationError.message);
      console.log('📋 Validation Details:', validationError.errors);
      return;
    }
    
    console.log('✅ Validation passed!');
    
    // Try to save
    const savedOrder = await counterOrder.save();
    console.log('✅ Order saved successfully!');
    console.log('📋 Order ID:', savedOrder._id);
    
    // Clean up
    await CounterOrder.findByIdAndDelete(savedOrder._id);
    console.log('🧹 Test order cleaned up');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('📋 Error Details:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAPIDebug();