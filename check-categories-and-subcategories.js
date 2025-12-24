const mongoose = require('mongoose');
const Menu = require('./model/menuModel');
const Category = require('./model/Category');
const Subcategory = require('./model/subcategoryModel');
require('dotenv').config();

/**
 * Check categories and subcategories to understand the relationship
 * This will help identify what changed when subcategory was edited
 */

async function checkCategoriesAndSubcategories() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get all menu items with their category information
    const menuItems = await Menu.find({}).populate('categoryId').sort({ name: 1 });
    console.log(`📋 Found ${menuItems.length} menu items`);

    // Group by category
    const categoryGroups = {};
    const itemsWithoutCategory = [];
    const itemsWithImages = [];
    const itemsWithoutImages = [];

    menuItems.forEach(item => {
      // Track image status
      if (item.image && item.image.trim() !== '') {
        itemsWithImages.push(item);
      } else {
        itemsWithoutImages.push(item);
      }

      // Group by category
      if (item.categoryId && item.categoryId.name) {
        const categoryName = item.categoryId.name;
        if (!categoryGroups[categoryName]) {
          categoryGroups[categoryName] = {
            categoryId: item.categoryId._id,
            items: [],
            itemsWithImages: 0,
            itemsWithoutImages: 0
          };
        }
        categoryGroups[categoryName].items.push(item);
        
        if (item.image && item.image.trim() !== '') {
          categoryGroups[categoryName].itemsWithImages++;
        } else {
          categoryGroups[categoryName].itemsWithoutImages++;
        }
      } else {
        itemsWithoutCategory.push(item);
      }
    });

    console.log('\n📊 CATEGORY ANALYSIS:');
    console.log(`✅ Items with images: ${itemsWithImages.length}`);
    console.log(`❌ Items without images: ${itemsWithoutImages.length}`);
    console.log(`🔗 Items without category: ${itemsWithoutCategory.length}`);

    console.log('\n📁 CATEGORIES AND THEIR ITEMS:');
    Object.entries(categoryGroups).forEach(([categoryName, data]) => {
      console.log(`\n🏷️  ${categoryName} (ID: ${data.categoryId})`);
      console.log(`   📊 Total items: ${data.items.length}`);
      console.log(`   ✅ With images: ${data.itemsWithImages}`);
      console.log(`   ❌ Without images: ${data.itemsWithoutImages}`);
      
      // Show first few items as examples
      const exampleItems = data.items.slice(0, 5);
      console.log(`   📋 Example items:`);
      exampleItems.forEach(item => {
        const hasImage = item.image && item.image.trim() !== '' ? '✅' : '❌';
        console.log(`      ${hasImage} ${item.name}`);
      });
      
      if (data.items.length > 5) {
        console.log(`      ... and ${data.items.length - 5} more items`);
      }
    });

    if (itemsWithoutCategory.length > 0) {
      console.log('\n⚠️  ITEMS WITHOUT CATEGORY:');
      itemsWithoutCategory.forEach(item => {
        const hasImage = item.image && item.image.trim() !== '' ? '✅' : '❌';
        console.log(`   ${hasImage} ${item.name} (categoryId: ${item.categoryId})`);
      });
    }

    // Show items that currently have images
    if (itemsWithImages.length > 0) {
      console.log('\n🖼️  ITEMS THAT CURRENTLY HAVE IMAGES:');
      itemsWithImages.forEach(item => {
        const categoryName = item.categoryId?.name || 'No Category';
        console.log(`   ✅ ${item.name} (${categoryName})`);
        console.log(`      Image: ${item.image}`);
      });
    }

    // Check for any recent updates (items updated in last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentlyUpdated = menuItems.filter(item => 
      item.updatedAt && new Date(item.updatedAt) > yesterday
    );

    if (recentlyUpdated.length > 0) {
      console.log('\n🕒 RECENTLY UPDATED ITEMS (last 24 hours):');
      recentlyUpdated.forEach(item => {
        const hasImage = item.image && item.image.trim() !== '' ? '✅' : '❌';
        const categoryName = item.categoryId?.name || 'No Category';
        console.log(`   ${hasImage} ${item.name} (${categoryName})`);
        console.log(`      Updated: ${item.updatedAt}`);
        console.log(`      Image: ${item.image || 'NULL'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

console.log('🔍 Checking categories and subcategories...');
checkCategoriesAndSubcategories();