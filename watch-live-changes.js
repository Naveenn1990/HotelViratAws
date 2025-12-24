const mongoose = require('mongoose');
const Menu = require('./model/menuModel');
const axios = require('axios');
require('dotenv').config();

/**
 * Watch for changes in live system and auto-sync
 * This will monitor the live API and automatically update local database when changes are detected
 */

let lastKnownState = new Map();
let isRunning = false;

async function getCurrentLiveState() {
  try {
    const response = await axios.get('https://hotelvirat.com/api/v1/hotel/menu', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000
    });

    const state = new Map();
    response.data.forEach(item => {
      state.set(item.name, item.image || null);
    });

    return state;
  } catch (error) {
    console.log(`⚠️  API fetch failed: ${error.message}`);
    return null;
  }
}

async function syncChangedItems(changes) {
  if (changes.length === 0) return;

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat');
    
    console.log(`\n🔄 Syncing ${changes.length} changed items...`);
    
    for (const change of changes) {
      try {
        await Menu.findOneAndUpdate(
          { name: change.name },
          { image: change.newImage }
        );
        console.log(`✅ Updated: ${change.name}`);
        console.log(`   ${change.oldImage || 'NULL'} → ${change.newImage || 'NULL'}`);
      } catch (error) {
        console.log(`❌ Failed to update ${change.name}: ${error.message}`);
      }
    }
    
    await mongoose.disconnect();
    console.log('🔄 Sync complete\n');
    
  } catch (error) {
    console.error('❌ Database sync error:', error.message);
  }
}

async function checkForChanges() {
  if (!isRunning) return;

  const currentState = await getCurrentLiveState();
  if (!currentState) {
    console.log('⚠️  Skipping check due to API error');
    return;
  }

  if (lastKnownState.size === 0) {
    // First run - just store the state
    lastKnownState = currentState;
    console.log(`📊 Initial state captured: ${currentState.size} items`);
    return;
  }

  // Check for changes
  const changes = [];
  
  for (const [itemName, currentImage] of currentState) {
    const previousImage = lastKnownState.get(itemName);
    if (previousImage !== currentImage) {
      changes.push({
        name: itemName,
        oldImage: previousImage,
        newImage: currentImage
      });
    }
  }

  if (changes.length > 0) {
    console.log(`\n🔔 CHANGES DETECTED! ${changes.length} items changed:`);
    changes.forEach(change => {
      console.log(`   📝 ${change.name}: ${change.oldImage || 'NULL'} → ${change.newImage || 'NULL'}`);
    });
    
    await syncChangedItems(changes);
    lastKnownState = currentState;
  } else {
    process.stdout.write('.');
  }
}

function startWatching() {
  console.log('👁️  LIVE IMAGE WATCHER STARTED');
  console.log('📡 Monitoring: https://hotelvirat.com/api/v1/hotel/menu');
  console.log('🔄 Check interval: 30 seconds');
  console.log('🎯 Will auto-sync any image changes to local database');
  console.log('⏹️  Press Ctrl+C to stop\n');
  
  isRunning = true;
  
  // Initial check
  checkForChanges();
  
  // Set up periodic checking
  const interval = setInterval(checkForChanges, 30000); // Check every 30 seconds
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n⏹️  Stopping live image watcher...');
    isRunning = false;
    clearInterval(interval);
    mongoose.disconnect().then(() => {
      console.log('✅ Watcher stopped');
      process.exit(0);
    });
  });
}

// Start watching
startWatching();