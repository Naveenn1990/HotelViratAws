const Category = require('../model/Category');
const fs = require('fs');
const path = require('path');
const { uploadFile2, deleteFile } = require('../middleware/AWS');

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, branchId, branchName, branchAddress, _id } = req.body;
    
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
      try {
        image = await uploadFile2(req.file, "category");
      } catch (s3Error) {
        console.warn('S3 upload failed, using local file path:', s3Error.message);
        // Fallback to local file path if S3 is not configured
        if (req.file.path) {
          image = req.file.path; // Use local file path
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
      try {
        updateData.image = await uploadFile2(req.file, "category");
      } catch (s3Error) {
        console.warn('S3 upload failed, using local file path:', s3Error.message);
        // Fallback to local file path if S3 is not configured
        if (req.file.path) {
          updateData.image = req.file.path;
        }
      }
      
      // Delete old image if update was successful
      if (updateData.image) {
        const category = await Category.findById(req.params.id);
        if (category && category.image && category.image !== updateData.image) {
          try {
            await deleteFile(category.image);
          } catch (deleteError) {
            console.warn('Failed to delete old image:', deleteError.message);
          }
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