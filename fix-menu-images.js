const mongoose = require('mongoose');
const Menu = require('./model/menuModel');
require('dotenv').config();

// Available images in uploads/menu/ directory
const availableImages = [
  '1764746116013_Paneer-Tikka-Masala-4.webp',
  '1764746186395_breakfast-2408818_1280.jpg',
  '1764746414017_istockphoto-838927480-1024x1024.jpg',
  '1764828063761_RD 1_00000.jpg',
  '1764828132819_001_00000.jpg',
  '1764828199105_PD 1_00000.jpg',
  '1764828318539_MD 1_00000.jpg',
  '1764828535292_GM 1_00000.jpg',
  '1764828594834_G 65 1_00000.jpg',
  '1764828673340_Baby Corn Machurian 1_00000.jpg',
  '1764829358768_breakfast-2408818_1280.jpg'
];

// Menu item to image mapping (based on likely matches)
const imageMapping = {
  // Exact matches (already working)
  'Babycorn Manchurian': '1764828673340_Baby Corn Machurian 1_00000.jpg',
  'Gobi 65': '1764828594834_G 65 1_00000.jpg',
  'Gobi Manchurian': '1764828535292_GM 1_00000.jpg',
  
  // Paneer dishes
  'Paneer Tikka': '1764746116013_Paneer-Tikka-Masala-4.webp',
  'Malai Paneer Tikka': '1764746116013_Paneer-Tikka-Masala-4.webp',
  'Paneer Hariyali Tikka': '1764746116013_Paneer-Tikka-Masala-4.webp',
  'Tri colour Paneer tikka': '1764746116013_Paneer-Tikka-Masala-4.webp',
  'Paneer 65': '1764746116013_Paneer-Tikka-Masala-4.webp',
  'Paneer Chilly': '1764746116013_Paneer-Tikka-Masala-4.webp',
  'Paneer Manchurian': '1764746116013_Paneer-Tikka-Masala-4.webp',
  'Paneer Pepper Dry': '1764746116013_Paneer-Tikka-Masala-4.webp',
  
  // Roti/Bread items
  'Butter Roti': '1764828063761_RD 1_00000.jpg',
  'Tandoori Roti': '1764828063761_RD 1_00000.jpg',
  'Chilli Milli Roti': '1764828063761_RD 1_00000.jpg',
  'Methi roti': '1764828063761_RD 1_00000.jpg',
  'Missi Roti': '1764828063761_RD 1_00000.jpg',
  'Pudina Roti': '1764828063761_RD 1_00000.jpg',
  'Kulcha': '1764828063761_RD 1_00000.jpg',
  
  // Papad items
  'Fried / Roasted Papad': '1764828199105_PD 1_00000.jpg',
  'Masala Papad': '1764828199105_PD 1_00000.jpg',
  
  // Manchurian dishes
  'Mushroom Manchurian': '1764828318539_MD 1_00000.jpg',
  'Veg. Balls Manchurian': '1764828318539_MD 1_00000.jpg',
  
  // Breakfast items
  'French Fries': '1764746186395_breakfast-2408818_1280.jpg',
  'Onion Rings': '1764746186395_breakfast-2408818_1280.jpg',
  'Onion Pakoda': '1764746186395_breakfast-2408818_1280.jpg',
};

// Generic images for categories
const categoryImages = {
  'paneer': '1764746116013_Paneer-Tikka-Masala-4.webp',
  'roti': '1764828063761_RD 1_00000.jpg',
  'papad': '1764828199105_PD 1_00000.jpg',
  'manchurian': '1764828318539_MD 1_00000.jpg',
  'breakfast': '1764746186395_breakfast-2408818_1280.jpg',
  'soup': '1764746414017_istockphoto-838927480-1024x1024.jpg',
  'drink': '1764829358768_breakfast-2408818_1280.jpg',
  'default': '1764746414017_istockphoto-838927480-1024x1024.jpg'
};

async function fixMenuImages() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get all menu items
    const menuItems = await Menu.find({});
    console.log(`📋 Found ${menuItems.length} menu items`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of menuItems) {
      // Skip if item already has an image
      if (item.image && item.image.trim() !== '') {
        console.log(`⏭️  Skipping ${item.name} (already has image)`);
        skippedCount++;
        continue;
      }

      let imagePath = null;

      // Try exact name match first
      if (imageMapping[item.name]) {
        imagePath = `uploads/menu/${imageMapping[item.name]}`;
      }
      // Try partial name match for categories
      else {
        const itemNameLower = item.name.toLowerCase();
        
        if (itemNameLower.includes('paneer')) {
          imagePath = `uploads/menu/${categoryImages.paneer}`;
        } else if (itemNameLower.includes('roti') || itemNameLower.includes('kulcha')) {
          imagePath = `uploads/menu/${categoryImages.roti}`;
        } else if (itemNameLower.includes('papad')) {
          imagePath = `uploads/menu/${categoryImages.papad}`;
        } else if (itemNameLower.includes('manchurian')) {
          imagePath = `uploads/menu/${categoryImages.manchurian}`;
        } else if (itemNameLower.includes('soup')) {
          imagePath = `uploads/menu/${categoryImages.soup}`;
        } else if (itemNameLower.includes('soda') || itemNameLower.includes('jaljeera') || itemNameLower.includes('lime')) {
          imagePath = `uploads/menu/${categoryImages.drink}`;
        } else if (itemNameLower.includes('fries') || itemNameLower.includes('pakoda') || itemNameLower.includes('rings')) {
          imagePath = `uploads/menu/${categoryImages.breakfast}`;
        } else if (itemNameLower.includes('babycorn') || itemNameLower.includes('baby corn')) {
          imagePath = `uploads/menu/1764828673340_Baby Corn Machurian 1_00000.jpg`; // Use babycorn image
        } else if (itemNameLower.includes('gobi') || itemNameLower.includes('cauliflower')) {
          imagePath = `uploads/menu/1764828594834_G 65 1_00000.jpg`; // Use gobi image
        } else if (itemNameLower.includes('mushroom')) {
          imagePath = `uploads/menu/${categoryImages.manchurian}`;
        } else if (itemNameLower.includes('tandoori')) {
          imagePath = `uploads/menu/${categoryImages.default}`;
        } else if (itemNameLower.includes('65')) {
          imagePath = `uploads/menu/1764828594834_G 65 1_00000.jpg`; // Use 65 style image
        } else if (itemNameLower.includes('tikka')) {
          imagePath = `uploads/menu/${categoryImages.paneer}`;
        } else if (itemNameLower.includes('salad') || itemNameLower.includes('masala')) {
          imagePath = `uploads/menu/${categoryImages.default}`;
        } else {
          // Use default image for items without specific matches
          imagePath = `uploads/menu/${categoryImages.default}`;
        }
      }

      if (imagePath) {
        try {
          await Menu.findByIdAndUpdate(item._id, { image: imagePath });
          console.log(`✅ Updated ${item.name} with image: ${imagePath}`);
          updatedCount++;
        } catch (error) {
          console.log(`❌ Failed to update ${item.name}: ${error.message}`);
        }
      }
    }

    console.log(`\n🎉 Update complete!`);
    console.log(`✅ Updated: ${updatedCount} items`);
    console.log(`⏭️  Skipped: ${skippedCount} items (already had images)`);
    console.log(`📊 Total: ${menuItems.length} items`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
console.log('🔧 Starting menu image fix...');
fixMenuImages();