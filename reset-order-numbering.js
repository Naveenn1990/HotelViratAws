const mongoose = require('mongoose');
require('dotenv').config();

// Import the BillCounter model
const BillCounter = require('./model/billCounterModel');

async function resetOrderNumbering() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Connect to MongoDB using the connection string from .env
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hotelvirat';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Resetting counters for date: ${today}`);
    
    // Find all bill counters for today
    const existingCounters = await BillCounter.find({ date: today });
    console.log(`📊 Found ${existingCounters.length} existing counters for today`);
    
    if (existingCounters.length > 0) {
      console.log('\n📋 Current counters:');
      existingCounters.forEach(counter => {
        console.log(`   Branch: ${counter.branchId}, Category: ${counter.category}`);
        console.log(`   Last Bill Number: ${counter.lastBillNumber}`);
        console.log(`   Last Invoice Number: ${counter.lastInvoiceNumber}`);
        console.log(`   Last KOT Number: ${counter.lastKOTNumber}`);
        console.log('   ---');
      });
    }
    
    // Reset all counters to 0 (next number will be 1)
    const resetResult = await BillCounter.updateMany(
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
    
    console.log(`\n🔄 Reset ${resetResult.modifiedCount} counters`);
    
    // Verify the reset
    const resetCounters = await BillCounter.find({ date: today });
    console.log('\n✅ Counters after reset:');
    resetCounters.forEach(counter => {
      console.log(`   Branch: ${counter.branchId}, Category: ${counter.category}`);
      console.log(`   Last Bill Number: ${counter.lastBillNumber} (next will be 001)`);
      console.log(`   Last Invoice Number: ${counter.lastInvoiceNumber} (next will be 001)`);
      console.log(`   Last KOT Number: ${counter.lastKOTNumber} (next will be KOT-001)`);
      console.log('   ---');
    });
    
    console.log('\n🎉 Order numbering has been reset successfully!');
    console.log('📝 Next orders will start from:');
    console.log('   - Bill Numbers: 001, 002, 003...');
    console.log('   - Invoice Numbers: 001, 002, 003...');
    console.log('   - KOT Numbers: KOT-001, KOT-002, KOT-003...');
    
  } catch (error) {
    console.error('❌ Error resetting order numbering:', error);
    
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      console.log('\n💡 Database connection tips:');
      console.log('   1. Make sure MongoDB is running');
      console.log('   2. Check your .env file has the correct MONGODB_URI');
      console.log('   3. Verify network connectivity to the database');
    }
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the reset function
if (require.main === module) {
  resetOrderNumbering();
}

module.exports = resetOrderNumbering;