const mongoose = require('mongoose');
const Menu = require('./model/menuModel');
require('dotenv').config();

async function checkMenuImages() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get all menu items
    const menuItems = await Menu.find({}).select('name image');
    console.log(`📋 Found ${menuItems.length} menu items\n`);

    let hasImageCount = 0;
    let noImageCount = 0;

    console.log('=== MENU ITEMS IMAGE STATUS ===\n');

    menuItems.forEach((item, index) => {
      const hasImage = item.image && item.image.trim() !== '';
      
      if (hasImage) {
        console.log(`✅ ${index + 1}. ${item.name}`);
        console.log(`   Image: ${item.image}\n`);
        hasImageCount++;
      } else {
        console.log(`❌ ${index + 1}. ${item.name}`);
        console.log(`   Image: ${item.image || 'NULL'}\n`);
        noImageCount++;
      }
    });

    console.log('=== SUMMARY ===');
    console.log(`✅ Items WITH images: ${hasImageCount}`);
    console.log(`❌ Items WITHOUT images: ${noImageCount}`);
    console.log(`📊 Total items: ${menuItems.length}`);
    console.log(`📈 Coverage: ${((hasImageCount / menuItems.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check
console.log('🔍 Checking menu image status...\n');
checkMenuImages();