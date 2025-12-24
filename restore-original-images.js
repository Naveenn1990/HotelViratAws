const mongoose = require('mongoose');
const Menu = require('./model/menuModel');
require('dotenv').config();

/**
 * Restore menu images to their original state (mostly null)
 * This will undo the changes made by fix-menu-images.js
 */

// Items that originally had images (these we'll keep)
const originallyHadImages = [
  'Babycorn Manchurian',
  'Gobi 65', 
  'Gobi Manchurian',
  'Paneer Tikka',
  'Butter Roti',
  'Fried / Roasted Papad',
  'Masala Papad',
  'Mushroom Manchurian'
];

async function restoreOriginalImages() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get all menu items
    const menuItems = await Menu.find({});
    console.log(`📋 Found ${menuItems.length} menu items`);

    let restoredCount = 0;
    let keptCount = 0;

    console.log('\n🔄 Restoring original image state...\n');

    for (const item of menuItems) {
      // Check if this item originally had an image
      const shouldKeepImage = originallyHadImages.includes(item.name);
      
      if (shouldKeepImage) {
        console.log(`✅ Keeping image for ${item.name}: ${item.image || 'NULL'}`);
        keptCount++;
      } else {
        // Restore to null (original state)
        try {
          await Menu.findByIdAndUpdate(item._id, { image: null });
          console.log(`🔄 Restored ${item.name} to NULL (original state)`);
          restoredCount++;
        } catch (error) {
          console.log(`❌ Failed to restore ${item.name}: ${error.message}`);
        }
      }
    }

    console.log(`\n🎉 Restoration complete!`);
    console.log(`🔄 Restored to NULL: ${restoredCount} items`);
    console.log(`✅ Kept images: ${keptCount} items`);
    console.log(`📊 Total: ${menuItems.length} items`);

    // Verify the restoration
    console.log('\n📊 Verification:');
    const itemsWithImages = await Menu.find({ image: { $ne: null, $ne: '' } });
    const itemsWithoutImages = await Menu.find({ $or: [{ image: null }, { image: '' }] });
    
    console.log(`✅ Items with images: ${itemsWithImages.length}`);
    console.log(`❌ Items without images: ${itemsWithoutImages.length}`);
    
    if (itemsWithImages.length > 0) {
      console.log('\nItems that still have images:');
      itemsWithImages.forEach(item => {
        console.log(`  - ${item.name}: ${item.image}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will restore menu images to their original state (mostly NULL)');
console.log('📋 Items that will keep their images:');
originallyHadImages.forEach(item => console.log(`  - ${item}`));
console.log('\n🔄 All other items will have their images set to NULL');
console.log('\n🚀 Starting restoration in 3 seconds...');

setTimeout(() => {
  console.log('🔧 Starting menu image restoration...');
  restoreOriginalImages();
}, 3000);