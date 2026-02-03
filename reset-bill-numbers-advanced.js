const mongoose = require('mongoose');
const BillCounter = require('./model/billCounterModel');
const Branch = require('./model/Branch');
require('dotenv').config();

// Advanced reset function with options
async function resetBillNumbers(options = {}) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    const {
      date = new Date().toISOString().split('T')[0], // Default to today
      branchId = null, // Reset for specific branch
      category = null, // Reset for specific category
      resetKOT = true, // Whether to reset KOT numbers too
    } = options;
    
    console.log(`📅 Resetting bill numbers for date: ${date}`);
    
    // Build query filter
    const filter = { date };
    if (branchId) filter.branchId = branchId;
    if (category) filter.category = category;
    
    // Find matching counters
    const counters = await BillCounter.find(filter).populate('branchId', 'name');
    
    if (counters.length === 0) {
      console.log('ℹ️ No matching bill counters found. No reset needed.');
      return;
    }
    
    console.log(`📊 Found ${counters.length} matching bill counter(s):`);
    counters.forEach(counter => {
      const branchName = counter.branchId?.name || 'Unknown Branch';
      console.log(`   - Branch: ${branchName} (${counter.branchId})`);
      console.log(`     Category: ${counter.category}`);
      console.log(`     Current Bill Number: ${counter.lastBillNumber}`);
      console.log(`     Current Invoice Number: ${counter.lastInvoiceNumber}`);
      console.log(`     Current KOT Number: ${counter.lastKOTNumber}`);
      console.log('');
    });
    
    // Prepare update object
    const updateFields = {
      lastBillNumber: 0,
      lastInvoiceNumber: 0,
      updatedAt: new Date()
    };
    
    if (resetKOT) {
      updateFields.lastKOTNumber = 0;
    }
    
    // Reset counters
    const result = await BillCounter.updateMany(filter, { $set: updateFields });
    
    console.log(`✅ Successfully reset ${result.modifiedCount} bill counter(s) to 0`);
    console.log('🎯 Next bill will start from 001');
    
    if (!resetKOT) {
      console.log('ℹ️ KOT numbers were not reset (resetKOT = false)');
    }
    
    // Verify the reset
    const resetCounters = await BillCounter.find(filter).populate('branchId', 'name');
    console.log('\n📋 Verification - Current counters after reset:');
    resetCounters.forEach(counter => {
      const branchName = counter.branchId?.name || 'Unknown Branch';
      console.log(`   - Branch: ${branchName}`);
      console.log(`     Category: ${counter.category}`);
      console.log(`     Bill Number: ${counter.lastBillNumber}`);
      console.log(`     Invoice Number: ${counter.lastInvoiceNumber}`);
      console.log(`     KOT Number: ${counter.lastKOTNumber}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error resetting bill numbers:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Command line argument parsing
const args = process.argv.slice(2);
const options = {};

// Parse command line arguments
for (let i = 0; i < args.length; i += 2) {
  const key = args[i];
  const value = args[i + 1];
  
  switch (key) {
    case '--date':
      options.date = value;
      break;
    case '--branch':
      options.branchId = value;
      break;
    case '--category':
      options.category = value;
      break;
    case '--no-kot':
      options.resetKOT = false;
      i--; // This flag doesn't have a value
      break;
  }
}

// Display usage if help is requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📋 Bill Number Reset Utility

Usage: node reset-bill-numbers-advanced.js [options]

Options:
  --date YYYY-MM-DD     Reset for specific date (default: today)
  --branch BRANCH_ID    Reset for specific branch only
  --category CATEGORY   Reset for specific category only (Restaurant, Self Service, Temple Meals)
  --no-kot             Don't reset KOT numbers (only reset bill/invoice numbers)
  --help, -h           Show this help message

Examples:
  node reset-bill-numbers-advanced.js
  node reset-bill-numbers-advanced.js --date 2024-02-03
  node reset-bill-numbers-advanced.js --category "Self Service"
  node reset-bill-numbers-advanced.js --branch 507f1f77bcf86cd799439011
  node reset-bill-numbers-advanced.js --date 2024-02-03 --category "Restaurant" --no-kot
  `);
  process.exit(0);
}

// Run the reset function with parsed options
resetBillNumbers(options);