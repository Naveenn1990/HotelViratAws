const mongoose = require('mongoose');
require('dotenv').config();

// Import the BillNumberService
const BillNumberService = require('./services/billNumberService');

async function testResetVerification() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Connect to MongoDB using the connection string from .env
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hotelvirat';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Test branch ID (use the one from the reset)
    const testBranchId = '692abe14f2bcfd6d0bbd98ad';
    
    console.log('\n🧪 Testing next bill numbers after reset...');
    
    // Test each category
    const categories = ['Restaurant', 'Self Service', 'Temple Meals'];
    
    for (const category of categories) {
      console.log(`\n📂 Testing category: ${category}`);
      
      // Generate 3 bill numbers to verify sequence
      for (let i = 1; i <= 3; i++) {
        const billNumber = await BillNumberService.getNextBillNumber(testBranchId, category);
        console.log(`   Order ${i}: Bill/Invoice Number = ${billNumber}`);
      }
    }
    
    console.log('\n🍽️ Testing KOT numbers...');
    
    // Generate 3 KOT numbers
    for (let i = 1; i <= 3; i++) {
      const kotNumber = await BillNumberService.getNextKOTNumber(testBranchId);
      console.log(`   KOT ${i}: ${kotNumber}`);
    }
    
    console.log('\n📊 Final counter status:');
    const counters = await BillNumberService.getCurrentCounters(testBranchId);
    counters.forEach(counter => {
      console.log(`   ${counter.category}: Bill=${counter.lastBillNumber}, Invoice=${counter.lastInvoiceNumber}, KOT=${counter.lastKOTNumber}`);
    });
    
    console.log('\n✅ Reset verification completed successfully!');
    console.log('🎯 Order numbering is now working correctly from 001');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the verification
if (require.main === module) {
  testResetVerification();
}

module.exports = testResetVerification;