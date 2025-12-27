const Menu = require('../model/menuModel');
const fs = require('fs');
const path = require('path');
const { uploadFile2, deleteFile } = require('../middleware/AWS');
exports.createMenuItem = async (req, res) => {
  try {
    const { 
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
      _id
    } = req.body;

    console.log('Received menu item data:', { name, itemName, quantities, prices, menuTypes, categoryId, branchId });
    console.log('req.file:', req.file);
    console.log('req.files:', req.files);
    console.log('Content-Type:', req.headers['content-type']);

    // Parse JSON strings if needed
    let parsedQuantities = quantities;
    if (typeof quantities === 'string') {
      try {
        parsedQuantities = JSON.parse(quantities);
      } catch (error) {
        console.error('Error parsing quantities:', error);
      }
    }

    let parsedPrices = prices;
    if (typeof prices === 'string') {
      try {
        parsedPrices = JSON.parse(prices);
      } catch (error) {
        console.error('Error parsing prices:', error);
      }
    }

    let parsedMenuTypes = menuTypes;
    if (typeof menuTypes === 'string') {
      try {
        parsedMenuTypes = JSON.parse(menuTypes);
      } catch (error) {
        console.error('Error parsing menuTypes:', error);
      }
    }

    let parsedSubscriptionPlans = subscriptionPlans;
    if (typeof subscriptionPlans === 'string') {
      try {
        parsedSubscriptionPlans = JSON.parse(subscriptionPlans);
      } catch (error) {
        console.error('Error parsing subscriptionPlans:', error);
        parsedSubscriptionPlans = [];
      }
    }

    // Handle image upload
    let image = null;
    if (req.file) {
      try {
        let fileBuffer;
        
        // Check if file has a path (diskStorage) or buffer (memoryStorage)
        if (req.file.path) {
          fileBuffer = await fs.promises.readFile(req.file.path);
        } else if (req.file.buffer) {
          fileBuffer = req.file.buffer;
        }
        
        if (fileBuffer) {
          // Always use local storage path for reliability
          if (req.file.path) {
            const uploadsIndex = req.file.path.indexOf('uploads');
            image = uploadsIndex !== -1 ? req.file.path.substring(uploadsIndex).replace(/\\/g, '/') : req.file.path;
            console.log("Using local file path:", image);
          }
          
          // Try S3 upload as backup (optional)
          try {
            const s3Url = await uploadFile2(fileBuffer, req.file.originalname, req.file.mimetype);
            if (s3Url) {
              console.log("Image also uploaded to S3:", s3Url);
              // Keep local file - don't delete it
            }
          } catch (error) {
            console.warn("S3 upload failed, using local storage only:", error.message);
          }
        }
      } catch (error) {
        console.error('Error handling image upload:', error);
        // Continue without image if upload fails
      }
    } else {
      console.log("No image file provided");
    }

    const menuItemData = {
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
      subscriptionEnabled: subscriptionEnabled === 'true' || subscriptionEnabled === true,
      subscriptionPlans: parsedSubscriptionPlans || [],
      subscriptionAmount: parseFloat(subscriptionAmount) || 0,
      subscriptionDiscount: parseFloat(subscriptionDiscount) || 0,
      subscriptionDuration: subscriptionDuration || '3days',
      subscription3Days: parseFloat(subscription3Days) || 0,
      subscription1Week: parseFloat(subscription1Week) || 0,
      subscription1Month: parseFloat(subscription1Month) || parseFloat(subscription30Days) || 0, // backward compatibility
      subscription30Days: parseFloat(subscription30Days) || parseFloat(subscription1Month) || 0 // backward compatibility
    };

    // If _id is provided (from dual backend sync), use it
    if (_id) {
      menuItemData._id = _id;
    }

    const menuItem = new Menu(menuItemData);

    await menuItem.save();
    res.status(201).json({ message: 'Menu item created successfully', menuItem });
  } catch (error) {
    console.error('Error creating menu item:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(400).json({ message: 'Error creating menu item', error: error.message });
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
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .populate('branchId', 'name')
      .select('name itemName description price quantities prices menuTypes image categoryId subcategoryId branchId stock lowStockAlert isActive subscriptionEnabled subscriptionPlans subscriptionAmount subscriptionDiscount subscriptionDuration subscription3Days subscription1Week subscription1Month subscription30Days')
      .sort({ name: 1 });
      
    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu items', error: error.message });
  }
};
exports.getMenuItemById = async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id)
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .populate('branchId', 'name')
      .select('name description price image categoryId subcategoryId branchId stock lowStockAlert isActive subscriptionEnabled subscriptionPlans subscriptionAmount subscriptionDiscount subscriptionDuration subscription3Days subscription1Week subscription1Month subscription30Days');
      
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.status(200).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu item', error: error.message });
  }
};
exports.updateMenuItem = async (req, res) => {
  try {
    const { 
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
      subscription30Days
    } = req.body;

    console.log('Updating menu item with data:', { name, itemName, quantities, prices, menuTypes, categoryId, branchId });

    // Parse JSON strings if needed
    let parsedQuantities = quantities;
    if (typeof quantities === 'string') {
      try {
        parsedQuantities = JSON.parse(quantities);
      } catch (error) {
        console.error('Error parsing quantities:', error);
      }
    }

    let parsedPrices = prices;
    if (typeof prices === 'string') {
      try {
        parsedPrices = JSON.parse(prices);
      } catch (error) {
        console.error('Error parsing prices:', error);
      }
    }

    let parsedMenuTypes = menuTypes;
    if (typeof menuTypes === 'string') {
      try {
        parsedMenuTypes = JSON.parse(menuTypes);
      } catch (error) {
        console.error('Error parsing menuTypes:', error);
      }
    }

    // Parse subscriptionPlans if it's a JSON string
    let parsedSubscriptionPlans = subscriptionPlans;
    if (typeof subscriptionPlans === 'string') {
      try {
        parsedSubscriptionPlans = JSON.parse(subscriptionPlans);
      } catch (error) {
        console.error('Error parsing subscriptionPlans:', error);
        parsedSubscriptionPlans = [];
      }
    }
    
    const updateData = { 
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
      subscriptionEnabled: subscriptionEnabled === 'true' || subscriptionEnabled === true,
      subscriptionPlans: parsedSubscriptionPlans || [],
      subscriptionAmount: parseFloat(subscriptionAmount) || 0,
      subscriptionDiscount: parseFloat(subscriptionDiscount) || 0,
      subscriptionDuration: subscriptionDuration || '3days',
      subscription3Days: parseFloat(subscription3Days) || 0,
      subscription1Week: parseFloat(subscription1Week) || 0,
      subscription1Month: parseFloat(subscription1Month) || parseFloat(subscription30Days) || 0, // backward compatibility
      subscription30Days: parseFloat(subscription30Days) || parseFloat(subscription1Month) || 0 // backward compatibility
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    // If a new image is uploaded, update the image path and delete the old image
    if (req.file) {
      try {
        let fileBuffer;
        
        // Check if file has a path (diskStorage) or buffer (memoryStorage)
        if (req.file.path) {
          fileBuffer = await fs.promises.readFile(req.file.path);
        } else if (req.file.buffer) {
          fileBuffer = req.file.buffer;
        }
        
        if (fileBuffer) {
          // Always use local storage path for reliability
          if (req.file.path) {
            const uploadsIndex = req.file.path.indexOf('uploads');
            updateData.image = uploadsIndex !== -1 ? req.file.path.substring(uploadsIndex).replace(/\\/g, '/') : req.file.path;
            console.log("Using local file path:", updateData.image);
          }
          
          // Try S3 upload as backup (optional)
          try {
            const s3Url = await uploadFile2(fileBuffer, req.file.originalname, req.file.mimetype);
            if (s3Url) {
              console.log("Image also uploaded to S3:", s3Url);
              // Keep local file - don't delete it
            }
          } catch (error) {
            console.warn("S3 upload failed, using local storage only:", error.message);
          }
          
          // Find the menu item to get the old image path and delete it
          const existingMenuItem = await Menu.findById(req.params.id);
          if (existingMenuItem && existingMenuItem.image) {
            deleteFile(existingMenuItem.image);
          }
        }
      } catch (error) {
        console.error('Error handling image upload during update:', error);
        // Continue with update even if image upload fails
      }
    }

    const menuItem = await Menu.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json({ message: 'Menu item updated successfully', menuItem });
  } catch (error) {
    console.error('Error updating menu item:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      errors: error.errors
    });
    res.status(400).json({ message: 'Error updating menu item', error: error.message });
  }
};
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Delete the associated image file
    if (menuItem.image) {
      deleteFile(menuItem.image);
    }

    await Menu.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting menu item', error: error.message });
  }
};
exports.getMenuItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const menuItems = await Menu.find({ 
      categoryId
    }).sort({ name: 1 });
    
    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu items', error: error.message });
  }
};