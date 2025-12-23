const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
// Load environment variables from .env file
dotenv.config();
// Initialize Express app
const app = express();
// Middleware to parse JSON with increased limit for file uploads
app.use(express.json({ limit: '50mb' }));
// Middleware to parse URL-encoded data with increased limit
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Enable CORS for all routes - Allow all origins for React Native development
app.use(cors({ 
  origin: true, // Allow all origins for React Native
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
})); // Vite dev aur production
// Define the rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 500 : 10000, // Higher limit for development
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use(limiter);
// Use morgan for logging
app.use(morgan("dev"));
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       useDefaults: true,
//       directives: {
//         "img-src": [
//           "'self'",
//           "data:",
//           "http://localhost:3000",
//           "http://localhost:5173",
//           "https://hotelvirat.com",
//           "https://hotelvirat.s3.amazonaws.com"
//         ],
//       },
//     },
//     crossOriginResourcePolicy: { policy: "cross-origin" },
//   })
// );
// Create upload directories if they don't exist
const createDirIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Directory created: ${dirPath}`);
  }
};
createDirIfNotExists("uploads");
createDirIfNotExists("uploads/profile");
createDirIfNotExists("uploads/category");
createDirIfNotExists("uploads/menu");
createDirIfNotExists("uploads/offer");
createDirIfNotExists("uploads/rooms");
createDirIfNotExists("uploads/table");
// Serve static files from the "uploads" directory
// Add logging middleware for uploads
app.use("/uploads", (req, res, next) => {
  console.log(`📁 Static file request: ${req.url}`);
  console.log(`📂 Looking in: ${path.join(__dirname, "uploads", req.url)}`);
  next();
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// MongoDB Connection with better error handling and reconnection
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://hotelvirat:zR4WlMNuRO3ZB60x@cluster0.vyfwyjl.mongodb.net/HotelVirat';
console.log('🔄 Connecting to MongoDB...');
mongoose
  .connect(mongoURI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    console.log("📊 Connection State:", mongoose.connection.readyState === 1 ? "Connected" : "Not Connected");
    console.log("📊 Database:", mongoose.connection.db.databaseName);
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error: ", err.message);
    console.log("💡 General troubleshooting:");
    console.log("1. MongoDB server is running");
    console.log("2. MONGO_URI is correct in your .env file");
    console.log("3. Network connectivity to MongoDB");
    console.log("4. Check MongoDB Atlas cluster status");
  });
// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected');
});
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});
// Use Routes
const userRoutes = require("./routes/userRoutes");
const branchRoutes = require("./routes/branchRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const subcategoryRoutes = require("./routes/subcategoryRoutes");
const menuRoutes = require("./routes/menuRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const couponRoutes = require("./routes/couponRoutes");
const aboutUsRoutes = require("./routes/aboutUsRoutes");
const helpSupportRoutes = require("./routes/helpSupportRoutes");
const termsRoutes = require("./routes/termsRoutes");
const addressRoutes = require("./routes/addressRoutes");
const adminRoutes = require("./routes/adminRoutes");
const counterLoginRoutes = require("./routes/counterLoginRoutes");
const customerDetailsRoutes = require("./routes/customerDetailsRoutes");
const counterInvoiceRoutes = require("./routes/counterInvoiceRoutes");
const staffLoginRoutes = require("./routes/staffLoginRoutes");
const tableRoutes = require("./routes/tableRoutes");
const peopleSelectionRoutes = require("./routes/peopleSelectionRoutes");
const staffOrderRoutes = require("./routes/staffOrderRoutes");
const counterOrderRoutes = require("./routes/counterOrderRoutes");
const counterBillRoutes = require("./routes/counterBillRoutes");
const staffInvoiceRoutes = require("./routes/staffInvoiceRoutes");
const recipeRoutes = require("./routes/recipeRoutes");
const customerRoutes = require("./routes/customerRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const rawMaterialRoutes = require("./routes/rawMaterialRoutes");
const RawMaterial = require("./routes/rawMaterialRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const goodsReceiptNoteRoutes = require("./routes/goodReceipNotesRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const purchaseUserRoutes = require("./routes/purchaseUserRoutes");
const productSubmissionRoutes = require("./routes/productSubmissionRoutes");
const stockRoutes = require("./routes/stockInwardRoutes");
const storeLocationRoutes = require("./routes/storeLocationRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const subscriptionOrderRoutes = require("./routes/subscriptionOrderRoutes");
const mealOfTheDayRoutes = require("./routes/mealOfTheDayRoutes");
const roomRoutes = require("./routes/roomRoutes");
const roomBookingRoutes = require("./routes/roomBookingRoutes");
const categoryAccessRoutes = require("./routes/categoryAccessRoutes");
const receptionistAccessRoutes = require("./routes/receptionistAccessRoutes");
//construction
/* const roleRoutes = require('./routes/roleRoutes');
const configurationRoutes = require('./routes/configurationRoutes');
const employeeRoutes = require("./routes/employeeRoutes") */
// const reportRoutes = require('./routes/reportRoutes');
// const salesRoutes = require('./routes/salesRoutes');
// const ClientRoutes = require("./routes/ClientRoutes")
// const reportRoutes = require('./routes/reportRoutes'); 
// const salesRoutes = require('./routes/salesRoutes');   
// const ClientRoutes = require("./routes/ClientRoutes")   
/* const constructionClientRoutes = require("./routes/constructionClientRoutes");
const constructionIndex = require("./routes/constructionIndex");
const constructionInvoiceRoutes = require("./routes/constructionInvoiceRoutes");
const constructionPaymentRoutes = require("./routes/constructionPaymentRoutes");
const constructionProjectRoutes = require("./routes/constructionProjectRoutes");
const constructionReportRoutes = require("./routes/constructionReportRoutes");
const constructionSettingsRoutes = require("./routes/constructionSettingsRoutes");
const leaveRoutes = require("./routes/leaveRoutes")
const attendanceRoutes = require ("./routes/attendanceRoutes")
const poRoutes = require ("./routes/poRoutes");
const Vendor = require ("./routes/vendorRoutes");
const PurchaseCons = require("./routes/purchaseConsRoutes");
const constructionWorkOrderRoutes = require("./routes/constructionSettingsRoutes");     
const attendanceConsRoutes = require ("./routes/attendanceRoutesConstruction")
const supervisorExpenseRoutes = require("./routes/supervisorexpenseRoutes");
const PayslipCons = require ("./routes/payslipRoutes")
const PayrollCons = require ("./routes/payrollRoutesConstruction")
 */
// Restaurant Profile Adapter Routes (for WaveCrm compatibility)
const restaurantProfileRoutes = require("./routes/restaurantProfileRoutes");
// hotel Routes
app.use("/api/v1/hotel/user-auth", userRoutes);
app.use("/api/v1/hotel/branch", branchRoutes);
app.use("/api/v1/hotel", restaurantProfileRoutes); // Adapter routes for restaurant compatibility
app.use("/api/v1/hotel/category", categoryRoutes);
app.use("/api/v1/hotel/subcategory", subcategoryRoutes);
app.use("/api/v1/hotel/menu", menuRoutes);
app.use("/api/v1/hotel/cart", cartRoutes);
app.use("/api/v1/hotel/order", orderRoutes);
app.use("/api/v1/hotel/coupon", couponRoutes);
app.use("/api/v1/hotel/about-us", aboutUsRoutes);
app.use("/api/v1/hotel/help-support", helpSupportRoutes);
app.use("/api/v1/hotel/terms", termsRoutes);
app.use("/api/v1/hotel/address", addressRoutes);
app.use("/api/v1/hotel/admin-auth", adminRoutes);
app.use("/api/v1/hotel/counter-auth", counterLoginRoutes);
app.use("/api/v1/hotel/customer-details", customerDetailsRoutes);
app.use("/api/v1/hotel/counter-invoice", counterInvoiceRoutes);
app.use("/api/v1/hotel/staff-auth", staffLoginRoutes);
app.use("/api/v1/hotel/table", tableRoutes);
app.use("/api/v1/hotel/people-selection", peopleSelectionRoutes);
app.use("/api/v1/hotel/staff-order", staffOrderRoutes);
app.use("/api/v1/hotel/counter-order", counterOrderRoutes);
app.use("/api/v1/hotel/counter-bill", counterBillRoutes);
app.use("/api/v1/hotel/staff-invoice", staffInvoiceRoutes);
app.use("/api/v1/hotel/raw-materials", RawMaterial);
app.use("/api/v1/hotel/recipes", recipeRoutes);
app.use("/api/v1/hotel/customer", customerRoutes);
app.use("/api/v1/hotel/supplier", supplierRoutes);
app.use("/api/v1/hotel/purchase", purchaseRoutes);
app.use("/api/v1/hotel/raw-material", rawMaterialRoutes);
app.use("/api/v1/hotel/grn", goodsReceiptNoteRoutes);
app.use("/api/v1/hotel/reservation", reservationRoutes);
app.use("/api/v1/hotel/expense", expenseRoutes);
/* app.use("/api/v1/hotel/attendance", attendanceRoutes); */
app.use("/api/v1/hotel/purchase-user-auth", purchaseUserRoutes);
app.use("/api/v1/hotel/product-submission", productSubmissionRoutes);
app.use("/api/v1/hotel/stock", stockRoutes);
app.use("/api/v1/hotel/store-location", storeLocationRoutes);
app.use("/api/v1/hotel/inventory", inventoryRoutes);
app.use("/api/v1/hotel/subscription", subscriptionRoutes);
app.use("/api/v1/hotel/subscription-order", subscriptionOrderRoutes);
app.use("/api/v1/hotel/meal-of-the-day", mealOfTheDayRoutes);
app.use("/api/v1/hotel/room", roomRoutes);
app.use("/api/v1/hotel/room-booking", roomBookingRoutes);
app.use("/api/v1/hotel/category-access", categoryAccessRoutes);
app.use("/api/v1/hotel/receptionist-access", receptionistAccessRoutes);
app.use(express.static(path.join(__dirname, 'build')));
// Redirect all requests to the index.html file (except API and uploads)
app.get('*', (req, res, next) => {
  // Skip catch-all for API routes and uploads
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  return res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
// Global error handler middleware
app.use((err, req, res, next) => {
  console.error("=== GLOBAL ERROR HANDLER ===");
  console.error("Error:", err);
  console.error("Error type:", err?.constructor?.name);
  console.error("Error message:", err?.message);
  console.error("Error stack:", err?.stack);
  console.error("Request URL:", req.url);
  console.error("Request method:", req.method);
  console.error("Request headers:", req.headers);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
    debug: {
      errorType: err.constructor.name,
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method
    },
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});
// Define Port
const PORT = process.env.PORT || 9000;
// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
