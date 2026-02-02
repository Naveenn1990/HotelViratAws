const mongoose = require('mongoose');
require('dotenv').config();

// Import the BillNumberService
const BillNumberService = require('./services/billNumberService');

async function testFirstNumbers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Connect to MongoDB using the connection string from .env
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hotelvirat';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Test branch ID
    const testBranchId = '692abe14f2bcfd6d0bbd98ad';
    
    console.log('\n🧪 Testing first numbers after reset...');
    
    // Test one number from each category
    console.log('\n📂 Restaurant - First Bill Number:');
    const restaurantBill = await BillNumberService.getNextBillNumber(testBranchId, 'Restaurant');
    console.log(`   ✅ ${restaurantBill}`);
    
    console.log('\n📂 Self Service - First Bill Number:');
    const selfServiceBill = await BillNumberService.getNextBillNumber(testBranchId, 'Self Service');
    console.log(`   ✅ ${selfServiceBill}`);
    
    console.log('\n📂 Temple Meals - First Bill Number:');
    const templeMealsBill = await BillNumberService.getNextBillNumber(testBranchId, 'Temple Meals');
    console.log(`   ✅ ${templeMealsBill}`);
    
    console.log('\n🍽️ First KOT Number:');
    const kotNumber = await BillNumberService.getNextKOTNumber(testBranchId);
    console.log(`   ✅ ${kotNumber}`);
    
    console.log('\n🎯 Summary:');
    console.log(`   Restaurant: ${restaurantBill}`);
    console.log(`   Self Service: ${selfServiceBill}`);
    console.log(`   Temple Meals: ${templeMealsBill}`);
    console.log(`   KOT: ${kotNumber}`);
    
    if (restaurantBill === '001' && selfServiceBill === '001' && templeMealsBill === '001' && kotNumber === 'KOT-001') {
      console.log('\n✅ SUCCESS: All numbering starts from 001 as expected!');
    } else {
      console.log('\n⚠️  WARNING: Some numbers did not start from 001');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testFirstNumbers();
}

module.exports = testFirstNumbers;