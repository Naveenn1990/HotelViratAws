/**
 * Script to check category names in the database
 */

const mongoose = require("mongoose")

const connectDB = async () => {
  try {
    const mongoURI = 'mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat'
    await mongoose.connect(mongoURI)
    console.log("MongoDB connected successfully")
  } catch (error) {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  }
}

const categorySchema = new mongoose.Schema({
  name: String,
}, { collection: 'categoryys' })

const Category = mongoose.model("CategoryCheck", categorySchema)

const main = async () => {
  await connectDB()
  
  try {
    const categories = await Category.find({})
    console.log("\n--- Categories in Database ---")
    categories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat._id})`)
    })
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await mongoose.disconnect()
    console.log("\nMongoDB disconnected")
  }
}

main()
