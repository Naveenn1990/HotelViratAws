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
      subscription30Days, // backward compatibility
      // Add discount percentage fields
      subscription3DaysDiscount,
      subscription1WeekDiscount,
      subscription1MonthDiscount,
      // Add subscription price fields
      subscription3DaysPrice,
      subscription1WeekPrice,
      subscription1MonthPrice,
      _id,
    } = req.body;

    console.log("Received menu item data:", {
      name,
      itemName,
      quantities,
      prices,
      menuTypes,
      categoryId,
      branchId,
    });
    console.log("req.file:", req.file);
    console.log("req.files:", req.files);
    console.log("Content-Type:", req.headers["content-type"]);

    // Parse JSON strings if needed
    let parsedQuantities = quantities;
    if (typeof quantities === "string") {
      try {
        parsedQuantities = JSON.parse(quantities);
      } catch (error) {
        console.error("Error parsing quantities:", error);
      }
    }

    let parsedPrices = prices;
    if (typeof prices === "string") {
      try {
        parsedPrices = JSON.parse(prices);
      } catch (error) {
        console.error("Error parsing prices:", error);
      }
    }

    let parsedMenuTypes = menuTypes;
    if (typeof menuTypes === "string") {
      try {
        parsedMenuTypes = JSON.parse(menuTypes);
      } catch (error) {
        console.error("Error parsing menuTypes:", error);
      }
    }

    let parsedSubscriptionPlans = subscriptionPlans;
    if (typeof subscriptionPlans === "string") {
      try {
        parsedSubscriptionPlans = JSON.parse(subscriptionPlans);
      } catch (error) {
        console.error("Error parsing subscriptionPlans:", error);
        parsedSubscriptionPlans = [];
      }
    }

    // Handle image upload
    let image = null;
    if (req.file) {
      try {
        let fileBuffer;
        let localFilePath = null;

        // Check if file has a path (diskStorage) or buffer (memoryStorage)
        if (req.file.path) {
          // Disk storage - file already saved
          fileBuffer = await fs.promises.readFile(req.file.path);
          const uploadsIndex = req.file.path.indexOf("uploads");
          localFilePath = uploadsIndex !== -1
            ? req.file.path.substring(uploadsIndex).replace(/\\/g, "/")
            : req.file.path;
        } else if (req.file.buffer) {
          // Memory storage - need to save to disk
          fileBuffer = req.file.buffer;
          
          // Generate unique filename
          const timestamp = Date.now();
          const originalName = req.file.originalname;
          const extension = path.extname(originalName);
          const filename = `${timestamp}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          
          // Save to uploads/menu directory
          const uploadDir = path.join(__dirname, '../uploads/menu');
          const fullPath = path.join(uploadDir, filename);
          
          // Ensure directory exists
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          // Write file to disk
          await fs.promises.writeFile(fullPath, fileBuffer);
          localFilePath = `uploads/menu/${filename}`;
          
          console.log("Saved file to local storage:", localFilePath);
        }

        if (fileBuffer && localFilePath) {
          image = localFilePath;
          console.log("Using local file path:", image);

          // Try S3 upload as backup (optional)
          try {
            const s3Url = await uploadFile2(
              fileBuffer,
              req.file.originalname,
              req.file.mimetype
            );
            if (s3Url) {
              console.log("Image also uploaded to S3:", s3Url);
              // Keep local file - don't delete it
            }
          } catch (error) {
            console.warn(
              "S3 upload failed, using local storage only:",
              error.message
            );
          }
        }
      } catch (error) {
        console.error("Error handling image upload:", error);
        // Continue without image if upload fails
      }
    } else {
      console.log("No image file provided");
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
        parseFloat(subscription1Month) || parseFloat(subscription30Days) || 0, // backward compatibility
      subscription30Days:
        parseFloat(subscription30Days) || parseFloat(subscription1Month) || 0, // backward compatibility
      // Add discount percentage fields
      subscription3DaysDiscount: parseFloat(subscription3DaysDiscount) || 0,
      subscription1WeekDiscount: parseFloat(subscription1WeekDiscount) || 0,
      subscription1MonthDiscount: parseFloat(subscription1MonthDiscount) || 0,
      // Add subscription price fields
      subscription3DaysPrice: parseFloat(subscription3DaysPrice) || 0,
      subscription1WeekPrice: parseFloat(subscription1WeekPrice) || 0,
      subscription1MonthPrice: parseFloat(subscription1MonthPrice) || 0,
    };

    // If _id is provided (from dual backend sync), use it
    if (_id) {
      menuItemData._id = _id;
    }

    const menuItem = new Menu(menuItemData);

    await menuItem.save();
    res
      .status(201)
      .json({ message: "Menu item created successfully", menuItem });
  } catch (error) {
    console.error("Error creating menu item:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res
      .status(400)
      .json({ message: "Error creating menu item", error: error.message });
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
      .select('menuItemNumber name itemName description price quantities prices menuTypes image categoryId subcategoryId branchId stock lowStockAlert isActive subscriptionEnabled subscriptionPlans subscriptionAmount subscriptionDiscount subscriptionDuration subscription3Days subscription1Week subscription1Month subscription30Days subscription3DaysDiscount subscription1WeekDiscount subscription1MonthDiscount subscription3DaysPrice subscription1WeekPrice subscription1MonthPrice').sort({ name: 1 });

    res.status(200).json(menuItems);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching menu items", error: error.message });
  }
};
exports.getMenuItemById = async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id)
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .populate("branchId", "name")
    .select('menuItemNumber name description price image categoryId subcategoryId branchId stock lowStockAlert isActive subscriptionEnabled subscriptionPlans subscriptionAmount subscriptionDiscount subscriptionDuration subscription3Days subscription1Week subscription1Month subscription30Days subscription3DaysDiscount subscription1WeekDiscount subscription1MonthDiscount subscription3DaysPrice subscription1WeekPrice subscription1MonthPrice')


    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    res.status(200).json(menuItem);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching menu item", error: error.message });
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
      // Add discount percentage fields
      subscription3DaysDiscount,
      subscription1WeekDiscount,
      subscription1MonthDiscount,
      // Add subscription price fields
      subscription3DaysPrice,
      subscription1WeekPrice,
      subscription1MonthPrice,
    } = req.body;

    console.log("Updating menu item with data:", {
      name,
      itemName,
      quantities,
      prices,
      menuTypes,
      categoryId,
      branchId,
    });
 console.log('🔍 ALL SUBSCRIPTION FIELDS RECEIVED:', { 
  subscriptionEnabled, 
  subscription3DaysDiscount, 
  subscription1WeekDiscount, 
  subscription1MonthDiscount,
  subscription3DaysPrice,
  subscription1WeekPrice,
  subscription1MonthPrice
});
console.log('🔍 FULL REQUEST BODY:', req.body);
console.log('Updating menu item with data:', { name, itemName, quantities, prices, menuTypes, categoryId, branchId });
console.log('🔍 FULL REQUEST BODY:', req.body);
console.log('Updating menu item with data:', { name, itemName, quantities, prices, menuTypes, categoryId, branchId });


console.log('🔍 FULL REQ.BODY KEYS:', Object.keys(req.body));
// ADD THIS NEW LOGGING CODE HERE:
console.log('🔍 SUBSCRIPTION PRICE FIELDS RECEIVED:', {
  subscription3DaysPrice: req.body.subscription3DaysPrice,
  subscription1WeekPrice: req.body.subscription1WeekPrice,
  subscription1MonthPrice: req.body.subscription1MonthPrice,
  subscription3DaysDiscount: req.body.subscription3DaysDiscount,
  subscription1WeekDiscount: req.body.subscription1WeekDiscount,
  subscription1MonthDiscount: req.body.subscription1MonthDiscount
});
console.log('🔍 FULL REQ.BODY KEYS:', Object.keys(req.body));


    // Parse JSON strings if needed
    let parsedQuantities = quantities;
    if (typeof quantities === "string") {
      try {
        parsedQuantities = JSON.parse(quantities);
      } catch (error) {
        console.error("Error parsing quantities:", error);
      }
    }

    let parsedPrices = prices;
    if (typeof prices === "string") {
      try {
        parsedPrices = JSON.parse(prices);
      } catch (error) {
        console.error("Error parsing prices:", error);
      }
    }

    let parsedMenuTypes = menuTypes;
    if (typeof menuTypes === "string") {
      try {
        parsedMenuTypes = JSON.parse(menuTypes);
      } catch (error) {
        console.error("Error parsing menuTypes:", error);
      }
    }

    // Parse subscriptionPlans if it's a JSON string
    let parsedSubscriptionPlans = subscriptionPlans;
    if (typeof subscriptionPlans === "string") {
      try {
        parsedSubscriptionPlans = JSON.parse(subscriptionPlans);
      } catch (error) {
        console.error("Error parsing subscriptionPlans:", error);
        parsedSubscriptionPlans = [];
      }
    }

    const updateData = {
      menuItemNumber: menuItemNumber ? parseInt(menuItemNumber) : undefined, // Don't set to null if not provided
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
        parseFloat(subscription1Month) || parseFloat(subscription30Days) || 0, // backward compatibility
      subscription30Days:
        parseFloat(subscription30Days) || parseFloat(subscription1Month) || 0, // backward compatibility
      // Add discount percentage fields
      subscription3DaysDiscount: parseFloat(subscription3DaysDiscount) || 0,
      subscription1WeekDiscount: parseFloat(subscription1WeekDiscount) || 0,
      subscription1MonthDiscount: parseFloat(subscription1MonthDiscount) || 0,
      // Add subscription price fields
      subscription3DaysPrice: parseFloat(subscription3DaysPrice) || 0,
      subscription1WeekPrice: parseFloat(subscription1WeekPrice) || 0,
      subscription1MonthPrice: parseFloat(subscription1MonthPrice) || 0,
    };

    // Remove undefined fields (including menuItemNumber if not provided)
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    // If a new image is uploaded, update the image path and delete the old image
    if (req.file) {
      try {
        let fileBuffer;
        let localFilePath = null;

        // Check if file has a path (diskStorage) or buffer (memoryStorage)
        if (req.file.path) {
          // Disk storage - file already saved
          fileBuffer = await fs.promises.readFile(req.file.path);
          const uploadsIndex = req.file.path.indexOf("uploads");
          localFilePath = uploadsIndex !== -1
            ? req.file.path.substring(uploadsIndex).replace(/\\/g, "/")
            : req.file.path;
        } else if (req.file.buffer) {
          // Memory storage - need to save to disk
          fileBuffer = req.file.buffer;
          
          // Generate unique filename
          const timestamp = Date.now();
          const originalName = req.file.originalname;
          const extension = path.extname(originalName);
          const filename = `${timestamp}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          
          // Save to uploads/menu directory
          const uploadDir = path.join(__dirname, '../uploads/menu');
          const fullPath = path.join(uploadDir, filename);
          
          // Ensure directory exists
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          // Write file to disk
          await fs.promises.writeFile(fullPath, fileBuffer);
          localFilePath = `uploads/menu/${filename}`;
          
          console.log("Saved updated file to local storage:", localFilePath);
        }

        if (fileBuffer && localFilePath) {
          updateData.image = localFilePath;
          console.log("Using local file path:", updateData.image);

          // Try S3 upload as backup (optional)
          try {
            const s3Url = await uploadFile2(
              fileBuffer,
              req.file.originalname,
              req.file.mimetype
            );
            if (s3Url) {
              console.log("Image also uploaded to S3:", s3Url);
              // Keep local file - don't delete it
            }
          } catch (error) {
            console.warn(
              "S3 upload failed, using local storage only:",
              error.message
            );
          }

          // Find the menu item to get the old image path and delete it
          const existingMenuItem = await Menu.findById(req.params.id);
          if (existingMenuItem && existingMenuItem.image) {
            deleteFile(existingMenuItem.image);
          }
        }
      } catch (error) {
        console.error("Error handling image upload during update:", error);
        // Continue with update even if image upload fails
      }
    }

    console.log("Final updateData before database update:", updateData);
    console.log("Request params ID:", req.params.id);

    const menuItem = await Menu.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res
      .status(200)
      .json({ message: "Menu item updated successfully", menuItem });
  } catch (error) {
    console.error("Error updating menu item:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      errors: error.errors,
    });
    
    // More specific error handling
    if (error.name === 'ValidationError') {
      console.error("Validation errors:", error.errors);
      return res.status(400).json({ 
        message: "Validation error", 
        error: error.message,
        validationErrors: error.errors 
      });
    }
    
    if (error.name === 'CastError') {
      console.error("Cast error (likely invalid ID):", error);
      return res.status(400).json({ 
        message: "Invalid ID format", 
        error: error.message 
      });
    }
    
    res
      .status(400)
      .json({ message: "Error updating menu item", error: error.message });
  }
};
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Delete the associated image file
    if (menuItem.image) {
      deleteFile(menuItem.image);
    }

    await Menu.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting menu item", error: error.message });
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
    res
      .status(500)
      .json({ message: "Error fetching menu items", error: error.message });
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