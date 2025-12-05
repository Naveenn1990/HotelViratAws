const mongoose = require("mongoose")

const sOrderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: String, // Changed to String to match frontend item IDs
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity cannot be less than 1"],
  },
  image: {
    type: String, // Added to store image path
    required: false,
  },
  description: {
    type: String, // Added to store item description
    required: false,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Categoryy",
    required: false,
  },
})

const staffOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffLogin", // Reference to StaffLogin model
      required: false, // CHANGED: Made optional for guest orders
    },
    // NEW FIELDS FOR GUEST ORDERS
    customerName: {
      type: String,
      required: false, // Required for guest orders, optional for staff orders
      trim: true,
    },
    customerMobile: {
      type: String,
      required: false, // Required for guest orders, optional for staff orders
      validate: {
        validator: (v) => {
          // Only validate if value is provided
          return !v || /^[0-9]{10}$/.test(v)
        },
        message: "Mobile number must be 10 digits",
      },
    },
    isGuestOrder: {
      type: Boolean,
      default: false, // NEW: Flag to identify guest orders
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch ID is required"],
    },
    branchName: {
      type: String,
      required: true, // Store branch name for easy access
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categoryy",
      required: false, // Optional - for filtering orders by category
    },
    categoryName: {
      type: String,
      required: false, // Store category name for easy access
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: false, // Made optional for guest orders from QR codes
    },
    tableNumber: {
      type: String,
      required: true,
    },
    peopleCount: {
      type: Number,
      required: true,
      min: [1, "People count cannot be less than 1"],
    },
    items: [sOrderItemSchema],
    status: {
      type: String,
      enum: ["pending", "preparing", "served", "completed", "cancelled"],
      default: "pending",
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    serviceCharge: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: function () {
        // Default to pending for guest orders, completed for staff orders
        return this.isGuestOrder ? "pending" : "completed"
      },
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "cash", "wallet"],
      required: true,
    },
    // NEW FIELD ADDED - to track when payment was last updated
    paymentUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    orderTime: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
)

// UPDATED: Custom validation to ensure either userId OR (customerName + customerMobile) is provided
staffOrderSchema.pre("validate", function (next) {
  if (this.isGuestOrder) {
    // For guest orders, require customerName and customerMobile
    if (!this.customerName || !this.customerMobile) {
      return next(new Error("Guest orders require customerName and customerMobile"))
    }
    // Validate mobile number format for guest orders
    if (!/^[0-9]{10}$/.test(this.customerMobile)) {
      return next(new Error("Mobile number must be 10 digits"))
    }
  } else {
    // For staff orders, require userId
    if (!this.userId) {
      return next(new Error("Staff orders require userId"))
    }
  }
  next()
})

// Category code mapping for order IDs
const getCategoryCode = async (items) => {
  if (!items || items.length === 0) return "RES"

  try {
    // Get the first item's category to determine the code
    const firstItem = items[0]
    const categoryId = firstItem.categoryId?._id || firstItem.categoryId

    if (categoryId) {
      const Category = mongoose.model("Categoryy")
      const category = await Category.findById(categoryId)

      if (category && category.name) {
        const categoryName = category.name.toLowerCase()
        // Map category names to codes
        if (categoryName.includes("temple")) {
          return "TM" // Temple Meals
        } else if (categoryName.includes("self")) {
          return "SS" // Self Service
        } else if (categoryName.includes("restarunt") || categoryName.includes("restaurant")) {
          return "RES" // Restaurant
        } else if (categoryName.includes("bar") || categoryName.includes("drink")) {
          return "BAR"
        }
        // Use first 2-3 letters of category name as code
        return category.name.substring(0, 3).toUpperCase()
      }
    }
  } catch (error) {
    console.log("Error getting category code:", error.message)
  }

  return "RES" // Default code
}

// Generate unique order ID before saving (format: DDMMYYYY-CODE-sequence)
staffOrderSchema.pre("save", async function (next) {
  if (
    !this.orderId ||
    this.orderId.startsWith("GUEST-") ||
    this.orderId.startsWith("STAFF-")
  ) {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, "0")
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const year = now.getFullYear()
    const datePrefix = `${day}${month}${year}`

    // Get category code from items
    const categoryCode = await getCategoryCode(this.items)

    // Find the last order with the same date prefix and category code to get the sequence
    const StaffOrder = mongoose.model("StaffOrder")
    const lastOrder = await StaffOrder.findOne({
      orderId: { $regex: `^${datePrefix}-${categoryCode}-` },
    }).sort({ createdAt: -1 })

    let sequence = 1
    if (lastOrder && lastOrder.orderId) {
      const parts = lastOrder.orderId.split("-")
      const lastSequence = parseInt(parts[2]) || 0
      sequence = lastSequence + 1
    }

    this.orderId = `${datePrefix}-${categoryCode}-${sequence}`
  }
  next()
})

// Add indexes for faster queries
staffOrderSchema.index({ userId: 1 })
staffOrderSchema.index({ orderId: 1 })
staffOrderSchema.index({ branchId: 1, tableId: 1 })
staffOrderSchema.index({ branchName: 1, tableNumber: 1 })
staffOrderSchema.index({ status: 1 })
staffOrderSchema.index({ paymentStatus: 1 })
staffOrderSchema.index({ paymentMethod: 1 })
staffOrderSchema.index({ isGuestOrder: 1 }) // NEW INDEX
staffOrderSchema.index({ customerMobile: 1 }) // NEW INDEX for guest orders

module.exports = mongoose.model("StaffOrder", staffOrderSchema)
