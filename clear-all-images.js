const mongoose = require('mongoose');
const Menu = require('./model/menuModel');
require('dotenv').config();

/**
 * Clear ALL menu images (set all to null)
 * This will completely reset the image state for all menu items
 */

async function clearAllImages() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get all menu items
    const menuItems = await Menu.find({});
    console.log(`📋 Found ${menuItems.length} menu items`);

    // Count items with images before clearing
    const itemsWithImagesBefore = await Menu.find({ image: { $ne: null, $ne: '' } });
    console.log(`📊 Items with images before clearing: ${itemsWithImagesBefore.length}`);

    console.log('\n🧹 Clearing ALL images...\n');

    // Update all items to have null images
    const result = await Menu.updateMany({}, { image: null });
    
    console.log(`✅ Updated ${result.modifiedCount} items`);

    // Verify the clearing
    console.log('\n📊 Verification:');
    const itemsWithImagesAfter = await Menu.find({ image: { $ne: null, $ne: '' } });
    const itemsWithoutImagesAfter = await Menu.find({ $or: [{ image: null }, { image: '' }] });
    
    console.log(`✅ Items with images after clearing: ${itemsWithImagesAfter.length}`);
    console.log(`❌ Items without images after clearing: ${itemsWithoutImagesAfter.length}`);
    
    if (itemsWithImagesAfter.length === 0) {
      console.log('\n🎉 SUCCESS: All images have been cleared!');
    } else {
      console.log('\n⚠️  Some items still have images:');
      itemsWithImagesAfter.forEach(item => {
        console.log(`  - ${item.name}: ${item.image}`);
      });
    }

    console.log(`\n📈 Summary:`);
    console.log(`  - Before: ${itemsWithImagesBefore.length} items had images`);
    console.log(`  - After: ${itemsWithImagesAfter.length} items have images`);
    console.log(`  - Cleared: ${itemsWithImagesBefore.length - itemsWithImagesAfter.length} images`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will clear ALL menu images (set all to NULL)');
console.log('🧹 This is a complete reset - no images will remain');
console.log('🔄 You can always run fix-menu-images.js again to repopulate them');
console.log('\n🚀 Starting complete image clearing in 3 seconds...');

setTimeout(() => {
  console.log('🔧 Starting complete image clearing...');
  clearAllImages();
}, 3000);