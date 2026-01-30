const Invoice = require('../model/counterInvoiceModel');
const Branch = require('../model/Branch');
const BillNumberService = require('../services/billNumberService');
const asyncHandler = require('express-async-handler');

exports.addInvoice = asyncHandler(async (req, res) => {
  const { customerName, phoneNumber, branchId, date, time } = req.body;

  // Validate input
  if (!customerName || !customerName.trim()) {
    res.status(400);
    throw new Error('Customer name is required');
  }

  if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
    res.status(400);
    throw new Error('Phone number must be a valid 10-digit number');
  }

  if (!branchId) {
    res.status(400);
    throw new Error('Branch is required');
  }

  if (!date || !time) {
    res.status(400);
    throw new Error('Date and time are required');
  }

  // Verify branch exists
  const branch = await Branch.findById(branchId);
  if (!branch) {
    res.status(404);
    throw new Error('Selected branch not found');
  }

  // Generate sequential invoice number using the bill number service
  const invoiceNumber = await BillNumberService.getNextInvoiceNumber(branchId);

  console.log(`📄 Creating invoice with number: ${invoiceNumber} for branch: ${branchId}`);

  // Create new invoice
  const invoice = new Invoice({
    invoiceNumber,
    customerName: customerName.trim(),
    phoneNumber: phoneNumber.trim(),
    branch: branchId,
    date,
    time,
  });

  // Save to database
  await invoice.save();

  // Populate branch details in response
  const populatedInvoice = await Invoice.findById(invoice._id).populate('branch');

  // Respond with success
  res.status(201).json({
    message: 'Invoice created successfully',
    invoice: {
      invoiceNumber: populatedInvoice.invoiceNumber,
      customerName: populatedInvoice.customerName,
      phoneNumber: populatedInvoice.phoneNumber,
      branch: {
        id: populatedInvoice.branch._id,
        name: populatedInvoice.branch.name,
        location: populatedInvoice.branch.address,
      },
      date: populatedInvoice.date,
      time: populatedInvoice.time,
      id: populatedInvoice._id,
    },
  });
});

// Get next bill number for self-service
exports.getNextBillNumber = asyncHandler(async (req, res) => {
  const { branchId } = req.params;
  const { category } = req.query; // Get category from query parameter

  // Validate branchId
  if (!branchId) {
    res.status(400);
    throw new Error('Branch ID is required');
  }

  // Validate category
  const validCategories = ['Restaurant', 'Self Service', 'Temple Meals'];
  if (!category || !validCategories.includes(category)) {
    res.status(400);
    throw new Error(`Category is required and must be one of: ${validCategories.join(', ')}`);
  }

  // Verify branch exists
  const branch = await Branch.findById(branchId);
  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  try {
    // Get next bill number using the service with category
    const billNumber = await BillNumberService.getNextBillNumber(branchId, category);
    
    console.log(`🧾 Generated bill number ${billNumber} for category "${category}" in branch ${branchId}`);
    
    res.status(200).json({
      success: true,
      billNumber,
      branchId,
      category,
      date: new Date().toISOString().split('T')[0],
      message: 'Bill number generated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error generating bill number:', error);
    res.status(500);
    throw new Error('Failed to generate bill number');
  }
});

// Get next KOT number for self-service
exports.getNextKOTNumber = asyncHandler(async (req, res) => {
  const { branchId } = req.params;

  // Validate branchId
  if (!branchId) {
    res.status(400);
    throw new Error('Branch ID is required');
  }

  // Verify branch exists
  const branch = await Branch.findById(branchId);
  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  try {
    // Get next KOT number using the service
    const kotNumber = await BillNumberService.getNextKOTNumber(branchId);
    
    console.log(`🍽️ Generated KOT number ${kotNumber} for branch ${branchId}`);
    
    res.status(200).json({
      success: true,
      kotNumber,
      branchId,
      date: new Date().toISOString().split('T')[0],
      message: 'KOT number generated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error generating KOT number:', error);
    res.status(500);
    throw new Error('Failed to generate KOT number');
  }
});

// Get current counters for debugging
exports.getCurrentCounters = asyncHandler(async (req, res) => {
  const { branchId } = req.params;
  const { category, date } = req.query;

  // Validate branchId
  if (!branchId) {
    res.status(400);
    throw new Error('Branch ID is required');
  }

  try {
    const counters = await BillNumberService.getCurrentCounters(branchId, category, date);
    
    res.status(200).json({
      success: true,
      counters,
      message: 'Current counters retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error getting current counters:', error);
    res.status(500);
    throw new Error('Failed to get current counters');
  }
});