const mongoose = require('mongoose');
const Menu = require('./model/menuModel');
require('dotenv').config();

/**
 * Restore images to the state before subcategory edit (before Dec 24, 2025)
 * This will restore the images that were working before the live subcategory edit
 */

// Images that were working before the subcategory edit (based on our previous fix-menu-images.js)
const preEditImageMapping = {
  // Items that should have images (these were working before the edit)
  'Akki Rotti': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Babycorn 65': 'uploads/menu/1764828673340_Baby Corn Machurian 1_00000.jpg',
  'Babycorn Chilly': 'uploads/menu/1764828673340_Baby Corn Machurian 1_00000.jpg',
  'Babycorn Manchurian': 'uploads/menu/1764828673340_Baby Corn Machurian 1_00000.jpg', // Keep existing
  'Babycorn Pepper Dry': 'uploads/menu/1764828673340_Baby Corn Machurian 1_00000.jpg',
  'Badam Milk': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Bhel Puri': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Butter Roti': 'uploads/menu/1764828063761_RD 1_00000.jpg', // Keep existing
  'Cheese Grill Sandwich': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Cheese Sandwich': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Chilli Milli Roti': 'uploads/menu/1764828063761_RD 1_00000.jpg',
  'Chow Chow Bath': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Cream of Mushroom Soup': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Cream of Veg Soup': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Dahi Puri': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'French Fries': 'uploads/menu/1764746186395_breakfast-2408818_1280.jpg',
  'Fresh Lime Soda': 'uploads/menu/1764829358768_breakfast-2408818_1280.jpg',
  'Fried / Roasted Papad': 'uploads/menu/1764828199105_PD 1_00000.jpg', // Keep existing
  'Fried Rice': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Fried Rice 123': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Ghee Khali Dosa': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Ghee Roast Masala Dosa': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Ghee Roast Plain': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Ginger Tea': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Gobi 65': 'uploads/menu/1764828594834_G 65 1_00000.jpg', // Keep existing
  'Gobi Chilly': 'uploads/menu/1764828594834_G 65 1_00000.jpg',
  'Gobi Manchurian': 'uploads/menu/1764828535292_GM 1_00000.jpg', // Keep existing
  'Gobi Pepper dry': 'uploads/menu/1764828594834_G 65 1_00000.jpg',
  'Green Salad': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Groundnut Masala': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Hariyali Babycorn': 'uploads/menu/1764828673340_Baby Corn Machurian 1_00000.jpg',
  'Hariyali Gobi': 'uploads/menu/1764828594834_G 65 1_00000.jpg',
  'Hot & Sour Veg Soup': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Idly': 'uploads/menu/1764829358768_breakfast-2408818_1280.jpg',
  'Idly 1, Vada 1': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Idly 2, Vada 1': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Jaljeera': 'uploads/menu/1764829358768_breakfast-2408818_1280.jpg',
  'Kachori': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Kashaya': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Kesari Bath': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Khara Bath': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Kulcha': 'uploads/menu/1764828063761_RD 1_00000.jpg',
  'Lemon Coriander Soup': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Lemon Tea': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Malai Paneer Tikka': 'uploads/menu/1764746116013_Paneer-Tikka-Masala-4.webp',
  'Masala Dosa': 'uploads/menu/1764828318539_MD 1_00000.jpg',
  'Masala Papad': 'uploads/menu/1764828199105_PD 1_00000.jpg', // Keep existing
  'Masala Puri': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Masala soda': 'uploads/menu/1764829358768_breakfast-2408818_1280.jpg',
  'Methi roti': 'uploads/menu/1764828063761_RD 1_00000.jpg',
  'Mirchi [2 Piece]': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Missi Roti': 'uploads/menu/1764828063761_RD 1_00000.jpg',
  'Mushroom 65': 'uploads/menu/1764828318539_MD 1_00000.jpg',
  'Mushroom Chilly': 'uploads/menu/1764828318539_MD 1_00000.jpg',
  'Mushroom Manchurian': 'uploads/menu/1764828318539_MD 1_00000.jpg', // Keep existing
  'Mushroom Spinach Soup': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Onion Pakoda': 'uploads/menu/1764746186395_breakfast-2408818_1280.jpg',
  'Onion Rings': 'uploads/menu/1764746186395_breakfast-2408818_1280.jpg',
  'Onion Uttapam': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Paneer 65': 'uploads/menu/1764746116013_Paneer-Tikka-Masala-4.webp',
  'Paneer Chilly': 'uploads/menu/1764746116013_Paneer-Tikka-Masala-4.webp',
  'Paneer Hariyali Tikka': 'uploads/menu/1764746116013_Paneer-Tikka-Masala-4.webp',
  'Paneer Manchurian': 'uploads/menu/1764746116013_Paneer-Tikka-Masala-4.webp',
  'Paneer Pepper Dry': 'uploads/menu/1764746116013_Paneer-Tikka-Masala-4.webp',
  'Paneer Tikka': 'uploads/menu/1764746116013_Paneer-Tikka-Masala-4.webp', // Keep existing
  'Pani Puri': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Paper Dosa': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Paper Masala Dosa': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Pav Bhaji': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Plain Dosa': 'uploads/menu/1764828199105_PD 1_00000.jpg',
  'Pudi Masala Dosa': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Pudina Roti': 'uploads/menu/1764828063761_RD 1_00000.jpg',
  'Puri Sagu': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Ragi Rotti': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Rava Dosa': 'uploads/menu/1764828063761_RD 1_00000.jpg',
  'Rava Idly': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Rava Masala Dosa': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Rava Onion Masala Dosa': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Rice Bath': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Samosa': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Samosa Chat': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Set Dosa': 'uploads/menu/1764828132819_001_00000.jpg',
  'Sweet Corn Veg Soup': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Tandoori Babycorn': 'uploads/menu/1764828673340_Baby Corn Machurian 1_00000.jpg',
  'Tandoori Gobi': 'uploads/menu/1764828594834_G 65 1_00000.jpg',
  'Tandoori Mushroom': 'uploads/menu/1764828318539_MD 1_00000.jpg',
  'Tandoori Roti': 'uploads/menu/1764828063761_RD 1_00000.jpg',
  'Tea / Coffee': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Tomato Soup': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Tomato Uttapam': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Tri colour Paneer tikka': 'uploads/menu/1764746116013_Paneer-Tikka-Masala-4.webp',
  'Vada': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Vada Pav': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Veg Clear Soup': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Veg Grill Sandwich': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Veg Manchow Soup': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Veg Sandwich': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Veg seekh Kabab': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg',
  'Veg. Balls Manchurian': 'uploads/menu/1764828318539_MD 1_00000.jpg',
  'Virat spl. Tandoori Platter': 'uploads/menu/1764746414017_istockphoto-838927480-1024x1024.jpg'
};

async function restorePreSubcategoryEditImages() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get all menu items
    const menuItems = await Menu.find({});
    console.log(`📋 Found ${menuItems.length} menu items`);

    let restoredCount = 0;
    let skippedCount = 0;
    let keptCount = 0;

    console.log('\n🔄 Restoring images to pre-subcategory-edit state...\n');

    for (const item of menuItems) {
      const targetImage = preEditImageMapping[item.name];
      
      if (targetImage) {
        // Check if item already has the correct image
        if (item.image === targetImage) {
          console.log(`✅ Keeping ${item.name} (already has correct image)`);
          keptCount++;
        } else {
          // Restore the image
          try {
            await Menu.findByIdAndUpdate(item._id, { image: targetImage });
            console.log(`🔄 Restored ${item.name}`);
            console.log(`   From: ${item.image || 'NULL'}`);
            console.log(`   To: ${targetImage}`);
            restoredCount++;
          } catch (error) {
            console.log(`❌ Failed to restore ${item.name}: ${error.message}`);
          }
        }
      } else {
        // Item not in mapping, leave as is
        console.log(`⏭️  Skipping ${item.name} (not in pre-edit mapping)`);
        skippedCount++;
      }
    }

    console.log(`\n🎉 Restoration complete!`);
    console.log(`🔄 Restored: ${restoredCount} items`);
    console.log(`✅ Kept (already correct): ${keptCount} items`);
    console.log(`⏭️  Skipped (not in mapping): ${skippedCount} items`);
    console.log(`📊 Total: ${menuItems.length} items`);

    // Verify the restoration
    console.log('\n📊 Verification:');
    const itemsWithImages = await Menu.find({ image: { $ne: null, $ne: '' } });
    const itemsWithoutImages = await Menu.find({ $or: [{ image: null }, { image: '' }] });
    
    console.log(`✅ Items with images after restoration: ${itemsWithImages.length}`);
    console.log(`❌ Items without images after restoration: ${itemsWithoutImages.length}`);
    console.log(`📈 Coverage: ${((itemsWithImages.length / menuItems.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Confirmation prompt
console.log('🔄 This will restore menu images to the state before subcategory edit');
console.log('📅 Target: Images that were working before Dec 24, 2025 10:16 AM');
console.log('📊 Expected result: ~100 items will have images (like before the edit)');
console.log('\n🚀 Starting restoration in 3 seconds...');

setTimeout(() => {
  console.log('🔧 Starting pre-subcategory-edit image restoration...');
  restorePreSubcategoryEditImages();
}, 3000);