/**
 * Migration script to update existing orders with new order ID format (DDMMYYYY-sequence)
 * Run this script once to update all existing orders
 * 
 * Usage: node migrate-order-ids.js
 */

const mongoose = require("mongoose")
require("dotenv").config()

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat'
    await mongoose.connect(mongoURI)
    console.log("MongoDB connected successfully")
  } catch (error) {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  }
}

// Staff Order Schema (simplified for migration)
const staffOrderSchema = new mongoose.Schema({
  orderId: String,
  createdAt: Date,
  orderTime: Date,
}, { collection: 'stafforders' })

// Regular Order Schema (simplified for migration)
const orderSchema = new mongoose.Schema({
  orderNumber: String,
  createdAt: Date,
}, { collection: 'orders' })

const StaffOrder = mongoose.model("StaffOrderMigration", staffOrderSchema)
const Order = mongoose.model("OrderMigration", orderSchema)

// Generate order ID based on date (format: DDMMYYYY-RES-sequence)
const generateOrderId = (date, sequence) => {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}${month}${year}-RES-${sequence}`
}

const migrateStaffOrders = async () => {
  console.log("\n--- Migrating Staff Orders ---")
  
  // Get all staff orders that need migration (don't have the new RES format)
  const orders = await StaffOrder.find({
    $or: [
      { orderId: { $exists: false } },
      { orderId: null },
      { orderId: "" },
      { orderId: { $regex: /^GUEST-|^STAFF-|^UNKNOWN/ } },
      { orderId: { $not: { $regex: /^\d{8}-RES-\d+$/ } } }
    ]
  }).sort({ createdAt: 1 })
  
  console.log(`Found ${orders.length} staff orders to migrate`)
  
  // Group orders by date
  const ordersByDate = {}
  for (const order of orders) {
    const date = order.orderTime || order.createdAt || new Date()
    const dateKey = new Date(date).toISOString().split('T')[0]
    if (!ordersByDate[dateKey]) {
      ordersByDate[dateKey] = []
    }
    ordersByDate[dateKey].push(order)
  }
  
  // Update orders with new IDs
  let updated = 0
  for (const [dateKey, dateOrders] of Object.entries(ordersByDate)) {
    // Get the highest existing sequence for this date (format: DDMMYYYY-RES-sequence)
    const [year, month, day] = dateKey.split('-')
    const datePrefix = `${day}${month}${year}`
    const existingOrders = await StaffOrder.find({
      orderId: { $regex: `^${datePrefix}-RES-` }
    })
    
    let maxSequence = 0
    for (const existing of existingOrders) {
      if (existing.orderId) {
        const parts = existing.orderId.split('-')
        const seq = parseInt(parts[2]) || 0
        if (seq > maxSequence) maxSequence = seq
      }
    }
    
    // Assign new IDs
    for (const order of dateOrders) {
      maxSequence++
      const newOrderId = generateOrderId(order.orderTime || order.createdAt || new Date(), maxSequence)
      
      await StaffOrder.updateOne(
        { _id: order._id },
        { $set: { orderId: newOrderId } }
      )
      updated++
      console.log(`Updated staff order ${order._id} -> ${newOrderId}`)
    }
  }
  
  console.log(`Migrated ${updated} staff orders`)
}

const migrateRegularOrders = async () => {
  console.log("\n--- Migrating Regular Orders ---")
  
  // Get all orders that need migration (don't have the new RES format)
  const orders = await Order.find({
    $or: [
      { orderNumber: { $exists: false } },
      { orderNumber: null },
      { orderNumber: "" },
      { orderNumber: { $not: { $regex: /^\d{8}-RES-\d+$/ } } }
    ]
  }).sort({ createdAt: 1 })
  
  console.log(`Found ${orders.length} regular orders to migrate`)
  
  // Group orders by date
  const ordersByDate = {}
  for (const order of orders) {
    const date = order.createdAt || new Date()
    const dateKey = new Date(date).toISOString().split('T')[0]
    if (!ordersByDate[dateKey]) {
      ordersByDate[dateKey] = []
    }
    ordersByDate[dateKey].push(order)
  }
  
  // Update orders with new IDs (format: DDMMYYYY-RES-sequence)
  let updated = 0
  for (const [dateKey, dateOrders] of Object.entries(ordersByDate)) {
    const [year, month, day] = dateKey.split('-')
    const datePrefix = `${day}${month}${year}`
    
    // Get the highest existing sequence for this date
    const existingOrders = await Order.find({
      orderNumber: { $regex: `^${datePrefix}-RES-` }
    })
    
    let maxSequence = 0
    for (const existing of existingOrders) {
      if (existing.orderNumber) {
        const parts = existing.orderNumber.split('-')
        const seq = parseInt(parts[2]) || 0
        if (seq > maxSequence) maxSequence = seq
      }
    }
    
    // Assign new IDs
    for (const order of dateOrders) {
      maxSequence++
      const newOrderNumber = `${datePrefix}-RES-${maxSequence}`
      
      await Order.updateOne(
        { _id: order._id },
        { $set: { orderNumber: newOrderNumber } }
      )
      updated++
      console.log(`Updated order ${order._id} -> ${newOrderNumber}`)
    }
  }
  
  console.log(`Migrated ${updated} regular orders`)
}

const main = async () => {
  await connectDB()
  
  try {
    await migrateStaffOrders()
    await migrateRegularOrders()
    console.log("\n✅ Migration completed successfully!")
  } catch (error) {
    console.error("Migration error:", error)
  } finally {
    await mongoose.disconnect()
    console.log("MongoDB disconnected")
  }
}

main()
