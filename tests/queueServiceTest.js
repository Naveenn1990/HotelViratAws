/**
 * Queue Service Test (No Database Required)
 * 
 * Tests the queue service logic without database operations
 * Useful for quick validation of queue behavior
 */

const BillNumberQueueService = require('../services/billNumberQueueService');

// Mock the BillNumberService to avoid database dependency
const mockBillNumbers = [];
let mockCounter = 0;

// Override the service methods for testing
const originalGetNextBillNumber = require('../services/billNumberService').getNextBillNumber;
const originalGetNextKOTNumber = require('../services/billNumberService').getNextKOTNumber;

// Mock implementation
const BillNumberService = require('../services/billNumberService');
BillNumberService.getNextBillNumber = async (branchId, category) => {
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
  
  mockCounter++;
  const number = String(mockCounter).padStart(3, '0');
  mockBillNumbers.push(number);
  return number;
};

BillNumberService.getNextKOTNumber = async (branchId) => {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
  
  mockCounter++;
  const number = `KOT-${String(mockCounter).padStart(3, '0')}`;
  mockBillNumbers.push(number);
  return number;
};

// Test configuration
const TEST_BRANCH_ID = 'mock-branch-id';
const TEST_CATEGORY = 'Restaurant';

/**
 * Test 1: Queue ordering (FIFO)
 */
async function testQueueOrdering() {
  console.log('\n📋 Test 1: Queue Ordering (FIFO)');
  console.log('==================================');
  
  mockCounter = 0;
  mockBillNumbers.length = 0;
  
  const promises = [];
  const startTime = Date.now();
  
  // Create 10 requests
  for (let i = 0; i < 10; i++) {
    promises.push(
      BillNumberQueueService.requestBillNumber(TEST_BRANCH_ID, TEST_CATEGORY)
    );
  }
  
  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  // Check if numbers are sequential
  const isSequential = results.every((num, idx) => {
    const expected = String(idx + 1).padStart(3, '0');
    return num === expected;
  });
  
  console.log(`\n⏱️  Duration: ${duration}ms`);
  console.log(`📊 Numbers: ${results.join(', ')}`);
  console.log(`✅ Sequential: ${isSequential}`);
  
  return isSequential;
}

/**
 * Test 2: Concurrent requests (100 orders)
 */
async function testConcurrentRequests() {
  console.log('\n📋 Test 2: Concurrent Requests (100 orders)');
  console.log('=============================================');
  
  mockCounter = 0;
  mockBillNumbers.length = 0;
  BillNumberQueueService.resetMetrics();
  
  const promises = [];
  const startTime = Date.now();
  
  // Create 100 concurrent requests
  for (let i = 0; i < 100; i++) {
    promises.push(
      BillNumberQueueService.requestBillNumber(TEST_BRANCH_ID, TEST_CATEGORY)
    );
  }
  
  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  // Check for gaps and duplicates
  const numbers = results.map(n => parseInt(n));
  numbers.sort((a, b) => a - b);
  
  let hasGaps = false;
  let hasDuplicates = false;
  const seen = new Set();
  
  for (let i = 0; i < numbers.length; i++) {
    // Check for duplicates
    if (seen.has(numbers[i])) {
      hasDuplicates = true;
    }
    seen.add(numbers[i]);
    
    // Check for gaps
    if (i > 0 && numbers[i] !== numbers[i-1] + 1) {
      hasGaps = true;
    }
  }
  
  const metrics = BillNumberQueueService.getQueueStatus();
  
  console.log(`\n⏱️  Duration: ${duration}ms`);
  console.log(`⚡ Throughput: ${(100 / (duration / 1000)).toFixed(2)} requests/second`);
  console.log(`📊 First 10: ${results.slice(0, 10).join(', ')}`);
  console.log(`📊 Last 10: ${results.slice(-10).join(', ')}`);
  console.log(`✅ No gaps: ${!hasGaps}`);
  console.log(`✅ No duplicates: ${!hasDuplicates}`);
  console.log(`📊 Metrics:`, metrics.metrics);
  
  return !hasGaps && !hasDuplicates;
}

/**
 * Test 3: High volume (1000 orders)
 */
async function testHighVolume() {
  console.log('\n📋 Test 3: High Volume (1000 orders)');
  console.log('======================================');
  
  mockCounter = 0;
  mockBillNumbers.length = 0;
  BillNumberQueueService.resetMetrics();
  
  const promises = [];
  const startTime = Date.now();
  
  console.log('🚀 Creating 1000 concurrent requests...');
  
  // Create 1000 concurrent requests
  for (let i = 0; i < 1000; i++) {
    promises.push(
      BillNumberQueueService.requestBillNumber(TEST_BRANCH_ID, TEST_CATEGORY)
    );
  }
  
  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  // Check for gaps and duplicates
  const numbers = results.map(n => parseInt(n));
  numbers.sort((a, b) => a - b);
  
  let hasGaps = false;
  let hasDuplicates = false;
  const seen = new Set();
  
  for (let i = 0; i < numbers.length; i++) {
    if (seen.has(numbers[i])) {
      hasDuplicates = true;
    }
    seen.add(numbers[i]);
    
    if (i > 0 && numbers[i] !== numbers[i-1] + 1) {
      hasGaps = true;
    }
  }
  
  const metrics = BillNumberQueueService.getQueueStatus();
  
  console.log(`\n⏱️  Total Duration: ${duration}ms`);
  console.log(`⚡ Throughput: ${(1000 / (duration / 1000)).toFixed(2)} requests/second`);
  console.log(`⚡ Avg per request: ${(duration / 1000).toFixed(2)}ms`);
  console.log(`📊 First 10: ${results.slice(0, 10).join(', ')}`);
  console.log(`📊 Last 10: ${results.slice(-10).join(', ')}`);
  console.log(`✅ No gaps: ${!hasGaps}`);
  console.log(`✅ No duplicates: ${!hasDuplicates}`);
  console.log(`\n📊 Performance Metrics:`);
  console.log(`   Total Processed: ${metrics.metrics.totalProcessed}`);
  console.log(`   Success Rate: ${metrics.metrics.successRate}`);
  console.log(`   Avg Processing Time: ${metrics.metrics.averageProcessingTime}`);
  console.log(`   Peak Queue Size: ${metrics.metrics.peakQueueSize}`);
  
  return !hasGaps && !hasDuplicates;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 Queue Service Test Suite (No Database)');
  console.log('==========================================\n');
  console.log('ℹ️  Using mock bill number service');
  console.log('ℹ️  No database connection required\n');
  
  const results = {
    test1: false,
    test2: false,
    test3: false
  };
  
  try {
    results.test1 = await testQueueOrdering();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    results.test2 = await testConcurrentRequests();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    results.test3 = await testHighVolume();
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Test 1 (Queue Ordering): ${results.test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 (Concurrent - 100): ${results.test2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 3 (High Volume - 1000): ${results.test3 ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r);
  console.log(`\n${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 Queue service is working correctly!');
    console.log('💡 Run billNumberSequenceTest.js for full database integration test');
  }
  
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
  testQueueOrdering,
  testConcurrentRequests,
  testHighVolume
};
