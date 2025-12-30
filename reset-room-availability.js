const mongoose = require('mongoose');
const Room = require('./model/Room');
require('dotenv').config();

const resetRoomAvailability = async () => {
  try {
    // Connect to MongoDB using the same URI as the main app
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hotelvirat');
    console.log('Connected to MongoDB');

    // Update all rooms to be available
    const result = await Room.updateMany(
      {}, // Update all rooms
      { isAvailable: true }
    );

    console.log(`Updated ${result.modifiedCount} rooms to available status`);
    console.log('All rooms are now available for time slot-based booking');

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error resetting room availability:', error);
    process.exit(1);
  }
};

resetRoomAvailability();