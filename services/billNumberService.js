const BillCounter = require('../model/billCounterModel');

class BillNumberService {
  
  // Get next unified bill/invoice number for a branch and category on a specific date
  // This number is used for BOTH bill and invoice - they are the same
  static async getNextBillNumber(branchId, category) {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Validate category
      const validCategories = ['Restaurant', 'Self Service', 'Temple Meals'];
      if (!validCategories.includes(category)) {
        throw new Error(`Invalid category: ${category}. Must be one of: ${validCategories.join(', ')}`);
      }
      
      // Try to find existing counter for this category
      let counter = await BillCounter.findOne({ branchId, category, date: today });
      
      if (counter) {
        // Counter exists, increment it
        counter.lastBillNumber += 1;
        counter.lastInvoiceNumber = counter.lastBillNumber;
        counter.updatedAt = new Date();
        await counter.save();
      } else {
        // Try to create new counter, handle duplicate key error gracefully
        try {
          counter = new BillCounter({
            branchId,
            category,
            date: today,
            lastBillNumber: 1,
            lastInvoiceNumber: 1,
            lastKOTNumber: 0,
          });
          await counter.save();
        } catch (error) {
          if (error.code === 11000) {
            // Duplicate key error - another process created it, try to find it again
            console.log('🔄 Duplicate key detected, retrying find...');
            counter = await BillCounter.findOne({ branchId, category, date: today });
            if (counter) {
              counter.lastBillNumber += 1;
              counter.lastInvoiceNumber = counter.lastBillNumber;
              counter.updatedAt = new Date();
              await counter.save();
            } else {
              throw new Error('Counter creation failed and retry find failed');
            }
          } else {
            throw error;
          }
        }
      }
      
      // Return formatted number (3 digits with leading zeros)
      const unifiedNumber = String(counter.lastBillNumber).padStart(3, '0');
      
      console.log(`🧾 Generated unified Bill/Invoice number: ${unifiedNumber} for category "${category}" in branch ${branchId} on ${today}`);
      return unifiedNumber;
      
    } catch (error) {
      console.error('❌ Error generating unified bill/invoice number:', error);
      throw new Error('Failed to generate bill/invoice number');
    }
  }
  
  // Alias for getNextBillNumber - they return the same value
  static async getNextInvoiceNumber(branchId, category) {
    console.log('📄 Invoice number requested - using unified bill/invoice numbering for category:', category);
    return this.getNextBillNumber(branchId, category);
  }
  
  // Get next KOT number for a branch on a specific date (separate from bill/invoice, not category-specific)
  static async getNextKOTNumber(branchId) {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // KOT numbers are not category-specific, use 'Restaurant' as default for KOT counter
      let counter = await BillCounter.findOne({ branchId, category: 'Restaurant', date: today });
      
      if (!counter) {
        // Create new counter for today
        counter = new BillCounter({
          branchId,
          category: 'Restaurant',
          date: today,
          lastBillNumber: 0,
          lastInvoiceNumber: 0,
          lastKOTNumber: 0,
        });
      }
      
      // Increment KOT number (separate from bill/invoice)
      counter.lastKOTNumber += 1;
      await counter.save();
      
      // Return formatted KOT number
      const kotNumber = `KOT-${String(counter.lastKOTNumber).padStart(3, '0')}`;
      
      console.log(`🍽️ Generated KOT number: ${kotNumber} for branch ${branchId} on ${today}`);
      return kotNumber;
      
    } catch (error) {
      console.error('❌ Error generating KOT number:', error);
      throw new Error('Failed to generate KOT number');
    }
  }
  
  // Get current counters for a branch, category and date (for debugging)
  static async getCurrentCounters(branchId, category = null, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      if (category) {
        const counter = await BillCounter.findOne({ branchId, category, date: targetDate });
        return counter || {
          branchId,
          category,
          date: targetDate,
          lastBillNumber: 0,
          lastInvoiceNumber: 0,
          lastKOTNumber: 0,
        };
      } else {
        // Return all categories for this branch and date
        const counters = await BillCounter.find({ branchId, date: targetDate });
        return counters;
      }
    } catch (error) {
      console.error('❌ Error getting current counters:', error);
      throw new Error('Failed to get current counters');
    }
  }
}

module.exports = BillNumberService;