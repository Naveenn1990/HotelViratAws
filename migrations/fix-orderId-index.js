/**
 * Migration script to fix orderId index
 * This removes the old unique index on orderId and creates a new compound index
 * that allows the same orderId across different categories
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function migrateIndexes() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/Hotel';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('stafforders');

    // Get existing indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop the old orderId_1 unique index if it exists
    try {
      await collection.dropIndex('orderId_1');
      console.log('\n✅ Dropped old orderId_1 unique index');
    } catch (error) {
      if (error.code === 27) {
        console.log('\n⚠️  orderId_1 index does not exist (already dropped)');
      } else {
        throw error;
      }
    }

    // Create new compound unique index: (branchId, categoryName, orderId)
    try {
      await collection.createIndex(
        { branchId: 1, categoryName: 1, orderId: 1 },
        { unique: true, name: 'branchId_1_categoryName_1_orderId_1' }
      );
      console.log('✅ Created new compound unique index: branchId_1_categoryName_1_orderId_1');
    } catch (error) {
      if (error.code === 85) {
        console.log('⚠️  Compound index already exists');
      } else {
        throw error;
      }
    }

    // Show updated indexes
    const updatedIndexes = await collection.indexes();
    console.log('\n📋 Updated indexes:');
    updatedIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log('  - Removed global unique constraint on orderId');
    console.log('  - Added compound unique index on (branchId, categoryName, orderId)');
    console.log('  - Now each category can have its own sequence: 001, 002, 003...');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateIndexes();
