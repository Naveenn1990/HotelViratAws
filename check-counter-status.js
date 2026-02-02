const mongoose = require('mongoose');
require('dotenv').config();

// Import the BillCounter model directly (not the service)
const BillCounter = require('./model/billCounterModel');

async function checkCounterStatus() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Connect to MongoDB using the connection string from .env
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hotelvirat';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Checking counters for date: ${today}`);
    
    // Find all bill counters for today
    const counters = await BillCounter.find({ date: today });
    
    if (counters.length === 0) {
      console.log('📊 No counters found for today - next numbers will be 001');
      return;
    }
    
    console.log(`📊 Found ${counters.length} counters for today:`);
    console.log('\n📋 Current counter status (NEXT numbers will be):');
    
    counters.forEach(counter => {
      const nextBill = String(counter.lastBillNumber + 1).padStart(3, '0');
      const nextKOT = `KOT-${String(counter.lastKOTNumber + 1).padStart(3, '0')}`;
      
      console.log(`\n   📂 Category: ${counter.category}`);
      console.log(`      Branch: ${counter.branchId}`);
      console.log(`      Current Bill Number: ${counter.lastBillNumber}`);
      console.log(`      Current Invoice Number: ${counter.lastInvoiceNumber}`);
      console.log(`      Current KOT Number: ${counter.lastKOTNumber}`);
      console.log(`      ➡️  NEXT Bill/Invoice: ${nextBill}`);
      console.log(`      ➡️  NEXT KOT: ${nextKOT}`);
    });
    
    // Check if all are at 0 (ready for 001)
    const allAtZero = counters.every(counter => 
      counter.lastBillNumber === 0 && 
      counter.lastInvoiceNumber === 0 && 
      counter.lastKOTNumber === 0
    );
    
    if (allAtZero) {
      console.log('\n✅ SUCCESS: All counters are at 0 - next orders will start from 001!');
    } else {
      console.log('\n⚠️  Some counters are not at 0 - orders will not start from 001');
    }
    
  } catch (error) {
    console.error('❌ Error checking counter status:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the check
if (require.main === module) {
  checkCounterStatus();
}

module.exports = checkCounterStatus;