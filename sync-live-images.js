const mongoose = require('mongoose');
const Menu = require('./model/menuModel');
const axios = require('axios');
require('dotenv').config();

/**
 * Sync images from live system to local database
 * This will fetch the current live data and update local database to match
 */

async function syncLiveImages() {
  try {
    console.log('🔄 Syncing images from live system...\n');

    // Connect to local MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to local MongoDB');

    // Fetch live data from API
    console.log('📡 Fetching live data from API...');
    const response = await axios.get('https://hotelvirat.com/api/v1/hotel/menu', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    console.log(`📊 Received ${response.data.length} items from live API`);

    // Get local menu items
    const localItems = await Menu.find({});
    console.log(`📋 Found ${localItems.length} items in local database`);

    let updatedCount = 0;
    let matchedCount = 0;
    let notFoundCount = 0;

    console.log('\n🔄 Syncing images...\n');

    // Process each live item
    for (const liveItem of response.data) {
      // Find matching local item by name
      const localItem = localItems.find(local => local.name === liveItem.name);
      
      if (localItem) {
        // Check if images are different
        const liveImage = liveItem.image || null;
        const localImage = localItem.image || null;
        
        if (liveImage !== localImage) {
          // Update local item with live image
          try {
            await Menu.findByIdAndUpdate(localItem._id, { image: liveImage });
            console.log(`🔄 Updated: ${liveItem.name}`);
            console.log(`   From: ${localImage || 'NULL'}`);
            console.log(`   To: ${liveImage || 'NULL'}`);
            updatedCount++;
          } catch (error) {
            console.log(`❌ Failed to update ${liveItem.name}: ${error.message}`);
          }
        } else {
          console.log(`✅ Already synced: ${liveItem.name}`);
          matchedCount++;
        }
      } else {
        console.log(`⚠️  Not found locally: ${liveItem.name}`);
        notFoundCount++;
      }
    }

    console.log(`\n🎉 Sync complete!`);
    console.log(`🔄 Updated: ${updatedCount} items`);
    console.log(`✅ Already synced: ${matchedCount} items`);
    console.log(`⚠️  Not found locally: ${notFoundCount} items`);
    console.log(`📊 Total processed: ${response.data.length} items`);

    // Verify the sync
    console.log('\n📊 Final verification:');
    const finalItemsWithImages = await Menu.find({ image: { $ne: null, $ne: '' } });
    const finalItemsWithoutImages = await Menu.find({ $or: [{ image: null }, { image: '' }] });
    
    console.log(`✅ Local items with images: ${finalItemsWithImages.length}`);
    console.log(`❌ Local items without images: ${finalItemsWithoutImages.length}`);
    console.log(`📈 Coverage: ${((finalItemsWithImages.length / localItems.length) * 100).toFixed(1)}%`);

    // Show some examples of synced images
    if (finalItemsWithImages.length > 0) {
      console.log('\n🖼️  Sample synced images:');
      finalItemsWithImages.slice(0, 5).forEach(item => {
        console.log(`   ✅ ${item.name}: ${item.image}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during sync:', error.message);
    if (error.response) {
      console.error('   API Status:', error.response.status);
      console.error('   API Data:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Auto-run with confirmation
console.log('🔄 LIVE IMAGE SYNC');
console.log('This will update local database images to match the live system');
console.log('📡 Source: https://hotelvirat.com/api/v1/hotel/menu');
console.log('🎯 Target: Local MongoDB database');
console.log('\n🚀 Starting sync in 3 seconds...');

setTimeout(() => {
  console.log('🔧 Starting live image sync...');
  syncLiveImages();
}, 3000);