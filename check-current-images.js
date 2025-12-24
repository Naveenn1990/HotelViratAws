const mongoose = require('mongoose');
const Menu = require('./model/menuModel');
require('dotenv').config();

/**
 * Check current image state in the database
 * Shows which items have images and which don't
 */

async function checkCurrentImages() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get all menu items
    const menuItems = await Menu.find({}).sort({ name: 1 });
    console.log(`📋 Found ${menuItems.length} menu items`);

    // Separate items with and without images
    const itemsWithImages = menuItems.filter(item => item.image && item.image.trim() !== '');
    const itemsWithoutImages = menuItems.filter(item => !item.image || item.image.trim() === '');

    console.log(`\n📊 Current Image Status:`);
    console.log(`✅ Items WITH images: ${itemsWithImages.length}`);
    console.log(`❌ Items WITHOUT images: ${itemsWithoutImages.length}`);
    console.log(`📈 Coverage: ${((itemsWithImages.length / menuItems.length) * 100).toFixed(1)}%`);

    if (itemsWithImages.length > 0) {
      console.log(`\n✅ ITEMS WITH IMAGES (${itemsWithImages.length}):`);
      itemsWithImages.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name}`);
        console.log(`   Image: ${item.image}`);
        console.log('   ---');
      });
    }

    if (itemsWithoutImages.length > 0 && itemsWithoutImages.length <= 20) {
      console.log(`\n❌ ITEMS WITHOUT IMAGES (${itemsWithoutImages.length}):`);
      itemsWithoutImages.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name}`);
      });
    } else if (itemsWithoutImages.length > 20) {
      console.log(`\n❌ ITEMS WITHOUT IMAGES (${itemsWithoutImages.length}) - showing first 20:`);
      itemsWithoutImages.slice(0, 20).forEach((item, index) => {
        console.log(`${index + 1}. ${item.name}`);
      });
      console.log(`... and ${itemsWithoutImages.length - 20} more items`);
    }

    // Group images by path to see duplicates
    const imageGroups = {};
    itemsWithImages.forEach(item => {
      if (!imageGroups[item.image]) {
        imageGroups[item.image] = [];
      }
      imageGroups[item.image].push(item.name);
    });

    if (Object.keys(imageGroups).length > 0) {
      console.log(`\n🖼️  IMAGE USAGE:`);
      Object.entries(imageGroups).forEach(([imagePath, items]) => {
        console.log(`📁 ${imagePath}`);
        console.log(`   Used by ${items.length} items: ${items.join(', ')}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

console.log('🔍 Checking current image state in database...');
checkCurrentImages();