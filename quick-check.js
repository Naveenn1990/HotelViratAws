const mongoose = require('mongoose');
const Menu = require('./model/menuModel');
require('dotenv').config();

async function quickCheck() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat';
    await mongoose.connect(mongoURI);
    
    const sampleItems = await Menu.find({name: {$in: ['Babycorn 65', 'Paneer Tikka', 'Butter Roti']}}).select('name image');
    console.log('=== SAMPLE ITEMS CHECK ===');
    sampleItems.forEach(item => {
      console.log(`${item.name}: ${item.image || 'NULL'}`);
    });
    
    await mongoose.disconnect();
    console.log('✅ Database check complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickCheck();