const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat';

mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    fixMissingImages();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Import the Menu model
const Menu = require('./model/menuModel');

async function fixMissingImages() {
  try {
    console.log('🔍 Checking for missing images...');
    
    // Get all menu items
    const menuItems = await Menu.find({});
    console.log(`📊 Found ${menuItems.length} menu items`);
    
    // Get list of existing image files
    const uploadsDir = path.join(__dirname, 'uploads', 'menu');
    const existingFiles = fs.readdirSync(uploadsDir);
    console.log(`📁 Found ${existingFiles.length} existing image files`);
    
    let fixedCount = 0;
    let missingCount = 0;
    
    for (const item of menuItems) {
      if (item.image) {
        // Extract filename from the image path
        const imagePath = item.image.replace('uploads/menu/', '');
        const imageExists = existingFiles.includes(imagePath);
        
        if (!imageExists) {
          console.log(`❌ Missing image for "${item.name}": ${item.image}`);
          missingCount++;
          
          // Try to find a suitable replacement from existing files
          // For now, let's use a default image or remove the image reference
          await Menu.findByIdAndUpdate(item._id, { 
            $unset: { image: "" } 
          });
          
          console.log(`🔧 Removed missing image reference for "${item.name}"`);
          fixedCount++;
        } else {
          console.log(`✅ Image exists for "${item.name}": ${item.image}`);
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Total items: ${menuItems.length}`);
    console.log(`   - Missing images: ${missingCount}`);
    console.log(`   - Fixed items: ${fixedCount}`);
    
    console.log('\n✅ Image fix completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing images:', error);
    process.exit(1);
  }
}