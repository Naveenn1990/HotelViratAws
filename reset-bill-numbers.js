const mongoose = require('mongoose');
const BillCounter = require('./model/billCounterModel');
require('dotenv').config();

// Reset bill numbers to 0 for today
async function resetBillNumbers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log(`📅 Resetting bill numbers for date: ${today}`);
    
    // Find all bill counters for today
    const counters = await BillCounter.find({ date: today });
    
    if (counters.length === 0) {
      console.log('ℹ️ No bill counters found for today. No reset needed.');
      return;
    }
    
    console.log(`📊 Found ${counters.length} bill counter(s) for today:`);
    counters.forEach(counter => {
      console.log(`   - Branch: ${counter.branchId}, Category: ${counter.category}, Last Bill: ${counter.lastBillNumber}`);
    });
    
    // Reset all counters to 0
    const result = await BillCounter.updateMany(
      { date: today },
      {
        $set: {
          lastBillNumber: 0,
          lastInvoiceNumber: 0,
          lastKOTNumber: 0,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Successfully reset ${result.modifiedCount} bill counter(s) to 0`);
    console.log('🎯 Next bill will start from 001');
    
    // Verify the reset
    const resetCounters = await BillCounter.find({ date: today });
    console.log('\n📋 Verification - Current counters after reset:');
    resetCounters.forEach(counter => {
      console.log(`   - Branch: ${counter.branchId}, Category: ${counter.category}, Last Bill: ${counter.lastBillNumber}`);
    });
    
  } catch (error) {
    console.error('❌ Error resetting bill numbers:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the reset function
resetBillNumbers();