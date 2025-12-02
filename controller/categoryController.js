const Category = require('../model/Category');
const fs = require('fs').promises;
const path = require('path');
const { uploadFile2, deleteFile } = require('../middleware/AWS');

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, branchId, branchName, branchAddress, _id } = req.body;
    
    console.log('Received category data:', { name, branchId, branchName, branchAddress, _id });
    
    // Validate required fields
    if (!branchId || branchId.trim() === '') {
      return res.status(400).json({ message: 'Branch ID is required' });
    }
    
    // Build branch object (required by crm_backend format)
    const branchData = {
      id: branchId,
      name: branchName || 'Unknown Branch',
      address: branchAddress || 'Address not available'
    };
    
    // Check if category with the same name already exists for this branch
    const existingCategory = await Category.findOne({ name, 'branch.id': branchId });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists for this branch' });
    }

    // Try to upload image to S3, fallback to local storage if S3 fails
    let image = null;
    if (req.file) {
      // Read file from disk (multer saved it using diskStorage)
      const fileBuffer = await fs.readFile(req.file.path);
      
      // Try S3 upload first
      const s3Url = await uploadFile2(fileBuffer, req.file.originalname, req.file.mimetype);
      
      if (s3Url) {
        // S3 upload succeeded - use S3 URL and delete local file
        image = s3Url;
        console.log("Image uploaded to S3:", image);
        // Delete local file since we're using S3
        try {
          await fs.unlink(req.file.path);
        } catch (err) {
          console.warn('Failed to delete local file after S3 upload:', err.message);
        }
      } else {
        // S3 upload failed, use local file storage
        console.log("S3 upload failed - using local storage");
        if (req.file.path) {
          // Convert absolute path to relative path
          const uploadsIndex = req.file.path.indexOf('uploads');
          image = uploadsIndex !== -1 ? req.file.path.substring(uploadsIndex).replace(/\\/g, '/') : req.file.path;
          console.log("Using local file path:", image);
        }
      }
    }

    const categoryData = {
      name,
      branchId, // Keep for backward compatibility
      branch: branchData,
      image
    };
    
    // If _id is provided (from dual backend sync), use it
    if (_id) {
      categoryData._id = _id;
    }

    const category = new Category(categoryData);

    await category.save();
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    console.error('Error creating category:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(400).json({ message: 'Error creating category', error: error.message });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const { branchId } = req.query;
    
    // If branchId is provided, filter by branch (support both formats)
    const filter = branchId ? { $or: [{ branchId }, { 'branch.id': branchId }] } : {};
    
    const categories = await Category.find(filter);
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Get a single category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category', error: error.message });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const { name, branchId, branchName, branchAddress } = req.body;
    const updateData = { name };
    
    // Update branch data if provided
    if (branchId) {
      updateData.branchId = branchId;
      updateData.branch = {
        id: branchId,
        name: branchName || 'Unknown Branch',
        address: branchAddress || 'Address not available'
      };
    }

    // If a new image is uploaded, update the image path and delete the old image
    if (req.file) {
      // Read file from disk (multer saved it using diskStorage)
      const fileBuffer = await fs.readFile(req.file.path);
      
      // Try S3 upload first
      const s3Url = await uploadFile2(fileBuffer, req.file.originalname, req.file.mimetype);
      
      if (s3Url) {
        // S3 upload succeeded - use S3 URL and delete local file
        updateData.image = s3Url;
        console.log("Image uploaded to S3:", updateData.image);
        // Delete local file since we're using S3
        try {
          await fs.unlink(req.file.path);
        } catch (err) {
          console.warn('Failed to delete local file after S3 upload:', err.message);
        }
      } else {
        // S3 upload failed, use local file storage
        console.log("S3 upload failed - using local storage");
        if (req.file.path) {
          // Convert absolute path to relative path
          const uploadsIndex = req.file.path.indexOf('uploads');
          updateData.image = uploadsIndex !== -1 ? req.file.path.substring(uploadsIndex).replace(/\\/g, '/') : req.file.path;
          console.log("Using local file path:", updateData.image);
        }
      }
      
      // Delete old image if update was successful
      if (updateData.image) {
        const category = await Category.findById(req.params.id);
        if (category && category.image && category.image !== updateData.image) {
          await deleteFile(category.image);
        }
      }
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Category updated successfully', category });
  } catch (error) {
    res.status(400).json({ message: 'Error updating category', error: error.message });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete the associated image file
    if (category.image) {
      try {
        await deleteFile(category.image);
      } catch (deleteError) {
        console.warn('Failed to delete image from S3:', deleteError.message);
        // Continue with category deletion even if S3 delete fails
      }
    }

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};