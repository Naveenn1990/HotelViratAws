const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    // Support both name and itemName for backward compatibility
    menuItemNumber: {
      type: Number,
      unique: true,
      sparse: true, // Allows null values but ensures uniqueness when set
      min: [1, "Menu item number must be at least 1"],
    },
    name: {
      type: String,
      trim: true,
    },
    itemName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Old structure: single price (optional for backward compatibility)
    price: {
      type: Number,
      min: [0, "Price cannot be negative"],
    },
    // New structure: quantities and prices
    quantities: {
      type: [String],
      default: [],
    },
    prices: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    menuTypes: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      default: null,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categoryy",
      required: [true, "Category ID is required"],
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      default: null,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch ID is required"],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    lowStockAlert: {
      type: Number,
      default: 5,
      min: [0, "Low stock alert cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscriptionPlans: [
      {
        type: {
          type: String,
          enum: ["daily", "weekly", "monthly", "yearly"],
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: [0, "Subscription price cannot be negative"],
        },
        duration: {
          type: Number,
          default: null, // Optional duration in cycles (e.g., 3 months = 3)
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        discount: {
          type: Number,
          default: 0,
          min: [0, "Discount cannot be negative"],
          max: [100, "Discount cannot exceed 100%"],
        },
      },
    ],
    subscriptionEnabled: {
      type: Boolean,
      default: false,
    },
    subscriptionAmount: {
      type: Number,
      default: 0,
      min: [0, "Subscription amount cannot be negative"],
    },
    subscriptionDiscount: {
      type: Number,
      default: 0,
      min: [0, "Subscription discount cannot be negative"],
      max: [100, "Subscription discount cannot exceed 100%"],
    },
    subscriptionDuration: {
      type: String,
      enum: ["3days", "1week", "1month", "30days"], // include old value for backward compatibility
      default: "3days",
    },
    subscription3Days: {
      type: Number,
      default: 0,
      min: [0, "Subscription price cannot be negative"],
    },
    subscription1Week: {
      type: Number,
      default: 0,
      min: [0, "Subscription price cannot be negative"],
    },
    subscription1Month: {
      type: Number,
      default: 0,
      min: [0, "Subscription price cannot be negative"],
    },
    subscription3DaysDiscount: {
      type: Number,
      default: 0,
      min: [0, "Subscription discount cannot be negative"],
      max: [100, "Subscription discount cannot exceed 100%"],
    },
    subscription1WeekDiscount: {
      type: Number,
      default: 0,
      min: [0, "Subscription discount cannot be negative"],
      max: [100, "Subscription discount cannot exceed 100%"],
    },
    subscription1MonthDiscount: {
      type: Number,
      default: 0,
      min: [0, "Subscription discount cannot be negative"],
      max: [100, "Subscription discount cannot exceed 100%"],
    },
    // Keep old field for backward compatibility
    subscription30Days: {
      type: Number,
      default: 0,
      min: [0, "Subscription price cannot be negative"],
    },
    // Add subscription price fields (what users pay to buy subscriptions)
    subscription3DaysPrice: {
      type: Number,
      default: 0,
      min: [0, "Subscription price cannot be negative"],
    },
    subscription1WeekPrice: {
      type: Number,
      default: 0,
      min: [0, "Subscription price cannot be negative"],
    },
    subscription1MonthPrice: {
      type: Number,
      default: 0,
      min: [0, "Subscription price cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Menu", menuSchema);
