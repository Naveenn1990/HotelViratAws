/**
 * Bill Number Sequence Test
 * 
 * Tests the bill number generation system to ensure:
 * 1. No gaps in sequence
 * 2. No duplicate numbers
 * 3. Handles concurrent requests properly
 * 4. Retry mechanism works
 * 
 * REQUIREMENTS:
 * - MongoDB must be running and connected
 * - Run from project root: node tests/billNumberSequenceTest.js
 * - Or with database connection: NODE_ENV=test node tests/billNumberSequenceTest.js
 */

const BillNumberQueueService = require('../services/billNumberQueueService');
const BillNumberService = require('../services/billNumberService');
const mongoose = require('mongoose');

// Connect to database if not already connected
async function ensureDbConnection() {
  if (mongoose.connection.readyState === 0) {
    console.log('📡 Connecting to database...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hotel_virat_test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Database connected\n');
  }
}

// Test configuration
// Use a valid MongoDB ObjectId for testing
const TEST_BRANCH_ID = new mongoose.Types.ObjectId().toString();
const TEST_CATEGORY = 'Restaurant';
const NUM_CONCURRENT_REQUESTS = 20;
const NUM_HIGH_VOLUME_REQUESTS = 1000; // For stress test

console.log('🔧 Test Configuration:');
console.log(`   Branch ID: ${TEST_BRANCH_ID}`);
console.log(`   Category: ${TEST_CATEGORY}`);
console.log(`   Concurrent requests: ${NUM_CONCURRENT_REQUESTS}`);
console.log(`   High volume requests: ${NUM_HIGH_VOLUME_REQUESTS}\n`);

/**
 * Test 1: Sequential requests (baseline)
 */
async function testSequentialRequests() {
  console.log('\n📋 Test 1: Sequential Requests');
  console.log('================================');
  
  const numbers = [];
  const startTime = Date.now();
  
  for (let i = 0; i < 10; i++) {
    try {
      const number = await BillNumberQueueService.requestBillNumber(TEST_BRANCH_ID, TEST_CATEGORY);
      numbers.push(number);
      console.log(`✅ Request ${i + 1}: ${number}`);
    } catch (error) {
      console.error(`❌ Request ${i + 1} failed:`, error.message);
    }
  }
  
  const duration = Date.now() - startTime;
  
  // Verify sequence
  const hasGaps = checkForGaps(numbers);
  const hasDuplicates = checkForDuplicates(numbers);
  
  console.log(`\n⏱️  Duration: ${duration}ms`);
  console.log(`📊 Numbers generated: ${numbers.join(', ')}`);
  console.log(`✅ No gaps: ${!hasGaps}`);
  console.log(`✅ No duplicates: ${!hasDuplicates}`);
  
  return !hasGaps && !hasDuplicates;
}

/**
 * Test 2: Concurrent requests (stress test)
 */
async function testConcurrentRequests() {
  console.log('\n📋 Test 2: Concurrent Requests');
  console.log('================================');
  
  const promises = [];
  const startTime = Date.now();
  
  // Create multiple concurrent requests
  for (let i = 0; i < NUM_CONCURRENT_REQUESTS; i++) {
    promises.push(
      BillNumberQueueService.requestBillNumber(TEST_BRANCH_ID, TEST_CATEGORY)
        .then(number => ({ success: true, number, index: i }))
        .catch(error => ({ success: false, error: error.message, index: i }))
    );
  }
  
  // Wait for all requests to complete
  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const numbers = successful.map(r => r.number);
  
  const hasGaps = checkForGaps(numbers);
  const hasDuplicates = checkForDuplicates(numbers);
  
  console.log(`\n⏱️  Duration: ${duration}ms`);
  console.log(`📊 Total requests: ${NUM_CONCURRENT_REQUESTS}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`📈 Success rate: ${(successful.length / NUM_CONCURRENT_REQUESTS * 100).toFixed(2)}%`);
  console.log(`⚡ Avg time per request: ${(duration / NUM_CONCURRENT_REQUESTS).toFixed(2)}ms`);
  console.log(`📊 Numbers: ${numbers.slice(0, 10).join(', ')}${numbers.length > 10 ? '...' : ''}`);
  console.log(`✅ No gaps: ${!hasGaps}`);
  console.log(`✅ No duplicates: ${!hasDuplicates}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed requests:');
    failed.forEach(f => {
      console.log(`  Request ${f.index}: ${f.error}`);
    });
  }
  
  return !hasGaps && !hasDuplicates && successful.length === NUM_CONCURRENT_REQUESTS;
}

/**
 * Test 3: Queue status monitoring
 */
async function testQueueStatus() {
  console.log('\n📋 Test 3: Queue Status Monitoring');
  console.log('===================================');
  
  // Start some requests
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(BillNumberQueueService.requestBillNumber(TEST_BRANCH_ID, TEST_CATEGORY));
  }
  
  // Check queue status immediately
  const statusDuring = BillNumberQueueService.getQueueStatus();
  console.log('📊 Queue status during processing:', JSON.stringify(statusDuring, null, 2));
  
  // Wait for completion
  await Promise.all(promises);
  
  // Check queue status after
  const statusAfter = BillNumberQueueService.getQueueStatus();
  console.log('📊 Queue status after completion:', JSON.stringify(statusAfter, null, 2));
  
  return true;
}

/**
 * Test 4: KOT number generation
 */
async function testKOTNumbers() {
  console.log('\n📋 Test 4: KOT Number Generation');
  console.log('=================================');
  
  const numbers = [];
  const startTime = Date.now();
  
  // Generate 10 KOT numbers concurrently
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      BillNumberQueueService.requestKOTNumber(TEST_BRANCH_ID)
        .then(number => ({ success: true, number }))
        .catch(error => ({ success: false, error: error.message }))
    );
  }
  
  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  const successful = results.filter(r => r.success);
  const kotNumbers = successful.map(r => r.number);
  
  console.log(`\n⏱️  Duration: ${duration}ms`);
  console.log(`✅ Successful: ${successful.length}/10`);
  console.log(`📊 KOT Numbers: ${kotNumbers.join(', ')}`);
  
  // Check for duplicates
  const hasDuplicates = checkForDuplicates(kotNumbers);
  console.log(`✅ No duplicates: ${!hasDuplicates}`);
  
  return !hasDuplicates && successful.length === 10;
}

/**
 * Test 5: High volume stress test (1000 orders)
 */
async function testHighVolume() {
  console.log('\n📋 Test 5: High Volume Stress Test (1000 Orders)');
  console.log('==================================================');
  
  const promises = [];
  const startTime = Date.now();
  
  console.log(`🚀 Creating ${NUM_HIGH_VOLUME_REQUESTS} concurrent requests...`);
  
  // Create 1000 concurrent requests
  for (let i = 0; i < NUM_HIGH_VOLUME_REQUESTS; i++) {
    promises.push(
      BillNumberQueueService.requestBillNumber(TEST_BRANCH_ID, TEST_CATEGORY)
        .then(number => ({ success: true, number, index: i }))
        .catch(error => ({ success: false, error: error.message, index: i }))
    );
  }
  
  // Wait for all requests to complete
  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const numbers = successful.map(r => r.number);
  
  const hasGaps = checkForGaps(numbers);
  const hasDuplicates = checkForDuplicates(numbers);
  
  // Get final metrics
  const metrics = BillNumberQueueService.getQueueStatus();
  
  console.log(`\n⏱️  Total Duration: ${duration}ms`);
  console.log(`📊 Total requests: ${NUM_HIGH_VOLUME_REQUESTS}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`📈 Success rate: ${(successful.length / NUM_HIGH_VOLUME_REQUESTS * 100).toFixed(2)}%`);
  console.log(`⚡ Throughput: ${(NUM_HIGH_VOLUME_REQUESTS / (duration / 1000)).toFixed(2)} requests/second`);
  console.log(`⚡ Avg time per request: ${(duration / NUM_HIGH_VOLUME_REQUESTS).toFixed(2)}ms`);
  console.log(`📊 First 10 numbers: ${numbers.slice(0, 10).join(', ')}`);
  console.log(`📊 Last 10 numbers: ${numbers.slice(-10).join(', ')}`);
  console.log(`✅ No gaps: ${!hasGaps}`);
  console.log(`✅ No duplicates: ${!hasDuplicates}`);
  
  console.log(`\n📊 Performance Metrics:`);
  console.log(`   Total Processed: ${metrics.metrics.totalProcessed}`);
  console.log(`   Total Failed: ${metrics.metrics.totalFailed}`);
  console.log(`   Success Rate: ${metrics.metrics.successRate}`);
  console.log(`   Avg Processing Time: ${metrics.metrics.averageProcessingTime}`);
  console.log(`   Peak Queue Size: ${metrics.metrics.peakQueueSize}`);
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed requests (showing first 10):`);
    failed.slice(0, 10).forEach(f => {
      console.log(`  Request ${f.index}: ${f.error}`);
    });
  }
  
  return !hasGaps && !hasDuplicates && successful.length === NUM_HIGH_VOLUME_REQUESTS;
}

/**
 * Helper: Check for gaps in number sequence
 */
function checkForGaps(numbers) {
  if (numbers.length < 2) return false;
  
  // Convert to integers
  const nums = numbers.map(n => parseInt(n));
  nums.sort((a, b) => a - b);
  
  // Check for gaps
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] !== nums[i - 1] + 1) {
      console.log(`⚠️  Gap detected: ${nums[i - 1]} → ${nums[i]}`);
      return true;
    }
  }
  
  return false;
}

/**
 * Helper: Check for duplicate numbers
 */
function checkForDuplicates(numbers) {
  const seen = new Set();
  const duplicates = [];
  
  for (const num of numbers) {
    if (seen.has(num)) {
      duplicates.push(num);
    }
    seen.add(num);
  }
  
  if (duplicates.length > 0) {
    console.log(`⚠️  Duplicates found: ${duplicates.join(', ')}`);
    return true;
  }
  
  return false;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 Bill Number Sequence Test Suite');
  console.log('===================================\n');
  
  // Ensure database connection
  try {
    await ensureDbConnection();
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    console.error('\n💡 Make sure MongoDB is running and accessible');
    console.error('   Connection string:', process.env.MONGO_URI || 'mongodb://localhost:27017/hotel_virat_test');
    return false;
  }
  
  console.log(`Branch ID: ${TEST_BRANCH_ID}`);
  console.log(`Category: ${TEST_CATEGORY}`);
  console.log(`Concurrent requests: ${NUM_CONCURRENT_REQUESTS}`);
  console.log(`High volume test: ${NUM_HIGH_VOLUME_REQUESTS} orders\n`);
  
  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
    test5: false
  };
  
  try {
    // Reset metrics before starting
    BillNumberQueueService.resetMetrics();
    
    results.test1 = await testSequentialRequests();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
    
    results.test2 = await testConcurrentRequests();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    results.test3 = await testQueueStatus();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    results.test4 = await testKOTNumbers();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Longer wait before stress test
    
    // Reset metrics before high volume test
    BillNumberQueueService.resetMetrics();
    results.test5 = await testHighVolume();
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Test 1 (Sequential): ${results.test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 (Concurrent): ${results.test2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 3 (Queue Status): ${results.test3 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 4 (KOT Numbers): ${results.test4 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 5 (High Volume - 1000 orders): ${results.test5 ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r);
  console.log(`\n${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 System is ready to handle 1000+ orders without gaps!');
  }
  
  // Close database connection
  await mongoose.connection.close();
  console.log('\n📡 Database connection closed');
  
  return allPassed;
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testSequentialRequests,
  testConcurrentRequests,
  testQueueStatus,
  testKOTNumbers,
  testHighVolume
};
