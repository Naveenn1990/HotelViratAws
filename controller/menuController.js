const Menu = require("../model/menuModel");
const Category = require("../model/Category");
const Subcategory = require("../model/subcategoryModel");
const Branch = require("../model/Branch");
const fs = require("fs");
const path = require("path");
const { uploadFile2, deleteFile } = require("../middleware/AWS");

exports.createMenuItem = async (req, res) => {
  try {
    const {
       menuItemNumber,
      name,
      itemName,
      description,
      price,
      quantities,
      prices,
      menuTypes,
      categoryId,
      subcategoryId,
      branchId,
      subscriptionEnabled,
      subscriptionPlans,
      subscriptionAmount,
      subscriptionDiscount,
      subscriptionDuration,
      subscription3Days,
      subscription1Week,
      subscription1Month,
      subscription30Days,
      subscription3DaysDiscount,
      subscription1WeekDiscount,
      subscription1MonthDiscount,
      subscription3DaysPrice,
      subscription1WeekPrice,
      subscription1MonthPrice,
      _id,
    } = req.body;

    // Parse JSON strings if needed
    let parsedQuantities = quantities;
    if (typeof quantities === "string") {
      try {
        parsedQuantities = JSON.parse(quantities);
      } catch (error) {
        // Silent error handling
      }
    }

    let parsedPrices = prices;
    if (typeof prices === "string") {
      try {
        parsedPrices = JSON.parse(prices);
      } catch (error) {
        // Silent error handling
      }
    }

    let parsedMenuTypes = menuTypes;
    if (typeof menuTypes === "string") {
      try {
        parsedMenuTypes = JSON.parse(menuTypes);
      } catch (error) {
        // Silent error handling
      }
    }

    let parsedSubscriptionPlans = subscriptionPlans;
    if (typeof subscriptionPlans === "string") {
      try {
        parsedSubscriptionPlans = JSON.parse(subscriptionPlans);
      } catch (error) {
        parsedSubscriptionPlans = [];
      }
    }

    // Handle image upload
    let image = null;
    if (req.file) {
      try {
        let fileBuffer;
        let localFilePath = null;

        if (req.file.path) {
          fileBuffer = await fs.promises.readFile(req.file.path);
          const uploadsIndex = req.file.path.indexOf("uploads");
          localFilePath = uploadsIndex !== -1
            ? req.file.path.substring(uploadsIndex).replace(/\\/g, "/")
            : req.file.path;
        } else if (req.file.buffer) {
          fileBuffer = req.file.buffer;
          
          const timestamp = Date.now();
          const originalName = req.file.originalname;
          const filename = `${timestamp}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          
          const uploadDir = path.join(__dirname, '../uploads/menu');
          const fullPath = path.join(uploadDir, filename);
          
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          await fs.promises.writeFile(fullPath, fileBuffer);
          localFilePath = `uploads/menu/${filename}`;
        }

        if (fileBuffer && localFilePath) {
          image = localFilePath;

          try {
            const s3Url = await uploadFile2(
              fileBuffer,
              req.file.originalname,
              req.file.mimetype
            );
          } catch (error) {
            // Silent S3 error handling
          }
        }
      } catch (error) {
        // Silent error handling
      }
    }

    const menuItemData = {
      menuItemNumber: parseInt(menuItemNumber) || null,
      itemName: itemName || name,
      name: itemName || name,
      description,
      price,
      quantities: parsedQuantities,
      prices: parsedPrices,
      menuTypes: parsedMenuTypes || parsedQuantities,
      categoryId,
      subcategoryId: subcategoryId || null,
      branchId,
      image,
      subscriptionEnabled:
        subscriptionEnabled === "true" || subscriptionEnabled === true,
      subscriptionPlans: parsedSubscriptionPlans || [],
      subscriptionAmount: parseFloat(subscriptionAmount) || 0,
      subscriptionDiscount: parseFloat(subscriptionDiscount) || 0,
      subscriptionDuration: subscriptionDuration || "3days",
      subscription3Days: parseFloat(subscription3Days) || 0,
      subscription1Week: parseFloat(subscription1Week) || 0,
      subscription1Month:
        parseFloat(subscription1Month) || parseFloat(subscription30Days) || 0,
      subscription30Days:
        parseFloat(subscription30Days) || parseFloat(subscription1Month) || 0,
      subscription3DaysDiscount: parseFloat(subscription3DaysDiscount) || 0,
      subscription1WeekDiscount: parseFloat(subscription1WeekDiscount) || 0,
      subscription1MonthDiscount: parseFloat(subscription1MonthDiscount) || 0,
      subscription3DaysPrice: parseFloat(subscription3DaysPrice) || 0,
      subscription1WeekPrice: parseFloat(subscription1WeekPrice) || 0,
      subscription1MonthPrice: parseFloat(subscription1MonthPrice) || 0,
    };

    if (_id) {
      menuItemData._id = _id;
    }

    const menuItem = new Menu(menuItemData);
    await menuItem.save();
    res.status(201).json({ message: "Menu item created successfully", menuItem });
  } catch (error) {
    res.status(400).json({ message: "Error creating menu item", error: error.message });
  }
};

exports.getAllMenuItems = async (req, res) => {
  try {
    const { categoryId, subcategoryId, branchId } = req.query;

    const filter = {};
    if (categoryId) filter.categoryId = categoryId;
    if (subcategoryId) filter.subcategoryId = subcategoryId;
    if (branchId) filter.branchId = branchId;

    const menuItems = await Menu.find(filter)
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .populate("branchId", "name")
      .select('menuItemNumber name itemName description price quantities prices menuTypes image categoryId subcategoryId branchId stock lowStockAlert isActive subscriptionEnabled subscriptionPlans subscriptionAmount subscriptionDiscount subscriptionDuration subscription3Days subscription1Week subscription1Month subscription30Days subscription3DaysDiscount subscription1WeekDiscount subscription1MonthDiscount subscription3DaysPrice subscription1WeekPrice subscription1MonthPrice')
      .sort({ name: 1 });

    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: "Error fetching menu items", error: error.message });
  }
};

exports.getMenuItemById = async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id)
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .populate("branchId", "name")
      .select('menuItemNumber name description price image categoryId subcategoryId branchId stock lowStockAlert isActive subscriptionEnabled subscriptionPlans subscriptionAmount subscriptionDiscount subscriptionDuration subscription3Days subscription1Week subscription1Month subscription30Days subscription3DaysDiscount subscription1WeekDiscount subscription1MonthDiscount subscription3DaysPrice subscription1WeekPrice subscription1MonthPrice');

    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    res.status(200).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: "Error fetching menu item", error: error.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const {
      menuItemNumber,
      name,
      itemName,
      description,
      price,
      quantities,
      prices,
      menuTypes,
      categoryId,
      subcategoryId,
      branchId,
      subscriptionEnabled,
      subscriptionPlans,
      subscriptionAmount,
      subscriptionDiscount,
      subscriptionDuration,
      subscription3Days,
      subscription1Week,
      subscription1Month,
      subscription30Days,
      subscription3DaysDiscount,
      subscription1WeekDiscount,
      subscription1MonthDiscount,
      subscription3DaysPrice,
      subscription1WeekPrice,
      subscription1MonthPrice,
    } = req.body;

    // Parse JSON strings if needed
    let parsedQuantities = quantities;
    if (typeof quantities === "string") {
      try {
        parsedQuantities = JSON.parse(quantities);
      } catch (error) {
        // Silent error handling
      }
    }

    let parsedPrices = prices;
    if (typeof prices === "string") {
      try {
        parsedPrices = JSON.parse(prices);
      } catch (error) {
        // Silent error handling
      }
    }

    let parsedMenuTypes = menuTypes;
    if (typeof menuTypes === "string") {
      try {
        parsedMenuTypes = JSON.parse(menuTypes);
      } catch (error) {
        // Silent error handling
      }
    }

    let parsedSubscriptionPlans = subscriptionPlans;
    if (typeof subscriptionPlans === "string") {
      try {
        parsedSubscriptionPlans = JSON.parse(subscriptionPlans);
      } catch (error) {
        parsedSubscriptionPlans = [];
      }
    }

    const updateData = {
      menuItemNumber: menuItemNumber ? parseInt(menuItemNumber) : undefined,
      name: itemName || name,
      itemName: itemName || name,
      description,
      price,
      quantities: parsedQuantities,
      prices: parsedPrices,
      menuTypes: parsedMenuTypes || parsedQuantities,
      categoryId,
      subcategoryId: subcategoryId || null,
      branchId,
      subscriptionEnabled:
        subscriptionEnabled === "true" || subscriptionEnabled === true,
      subscriptionPlans: parsedSubscriptionPlans || [],
      subscriptionAmount: parseFloat(subscriptionAmount) || 0,
      subscriptionDiscount: parseFloat(subscriptionDiscount) || 0,
      subscriptionDuration: subscriptionDuration || "3days",
      subscription3Days: parseFloat(subscription3Days) || 0,
      subscription1Week: parseFloat(subscription1Week) || 0,
      subscription1Month:
        parseFloat(subscription1Month) || parseFloat(subscription30Days) || 0,
      subscription30Days:
        parseFloat(subscription30Days) || parseFloat(subscription1Month) || 0,
      subscription3DaysDiscount: parseFloat(subscription3DaysDiscount) || 0,
      subscription1WeekDiscount: parseFloat(subscription1WeekDiscount) || 0,
      subscription1MonthDiscount: parseFloat(subscription1MonthDiscount) || 0,
      subscription3DaysPrice: parseFloat(subscription3DaysPrice) || 0,
      subscription1WeekPrice: parseFloat(subscription1WeekPrice) || 0,
      subscription1MonthPrice: parseFloat(subscription1MonthPrice) || 0,
    };

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    if (req.file) {
      try {
        let fileBuffer;
        let localFilePath = null;

        if (req.file.path) {
          fileBuffer = await fs.promises.readFile(req.file.path);
          const uploadsIndex = req.file.path.indexOf("uploads");
          localFilePath = uploadsIndex !== -1
            ? req.file.path.substring(uploadsIndex).replace(/\\/g, "/")
            : req.file.path;
        } else if (req.file.buffer) {
          fileBuffer = req.file.buffer;
          
          const timestamp = Date.now();
          const originalName = req.file.originalname;
          const filename = `${timestamp}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          
          const uploadDir = path.join(__dirname, '../uploads/menu');
          const fullPath = path.join(uploadDir, filename);
          
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          await fs.promises.writeFile(fullPath, fileBuffer);
          localFilePath = `uploads/menu/${filename}`;
        }

        if (fileBuffer && localFilePath) {
          updateData.image = localFilePath;

          try {
            const s3Url = await uploadFile2(
              fileBuffer,
              req.file.originalname,
              req.file.mimetype
            );
          } catch (error) {
            // Silent S3 error handling
          }

          const existingMenuItem = await Menu.findById(req.params.id);
          if (existingMenuItem && existingMenuItem.image) {
            deleteFile(existingMenuItem.image);
          }
        }
      } catch (error) {
        // Silent error handling
      }
    }

    const menuItem = await Menu.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.status(200).json({ message: "Menu item updated successfully", menuItem });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        error: error.message,
        validationErrors: error.errors 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid ID format", 
        error: error.message 
      });
    }
    
    res.status(400).json({ message: "Error updating menu item", error: error.message });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    if (menuItem.image) {
      deleteFile(menuItem.image);
    }

    await Menu.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting menu item", error: error.message });
  }
};

exports.getMenuItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const menuItems = await Menu.find({
      categoryId,
    }).sort({ name: 1 });

    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: "Error fetching menu items", error: error.message });
  }
};

exports.getMenuItemByNumber = async (req, res) => {
  try {
    const { number } = req.params;
    const menuItem = await Menu.findOne({ menuItemNumber: parseInt(number) })
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .populate('branchId', 'name')
      .select('menuItemNumber name description price image categoryId subcategoryId branchId stock lowStockAlert isActive subscriptionEnabled subscriptionPlans subscriptionAmount subscriptionDiscount subscriptionDuration subscription3Days subscription1Week subscription1Month subscription30Days subscription3DaysDiscount subscription1WeekDiscount subscription1MonthDiscount subscription3DaysPrice subscription1WeekPrice subscription1MonthPrice');
      
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found with this number' });
    }
    res.status(200).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu item', error: error.message });
  }
};