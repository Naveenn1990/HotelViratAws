const Subcategory = require('../model/subcategoryModel');

// Get all subcategories
exports.getAllSubcategories = async (req, res) => {
  try {
    const { categoryId } = req.query;
    
    const filter = {};
    if (categoryId) {
      filter.categoryId = categoryId;
    }
    
    const subcategories = await Subcategory.find(filter)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json(subcategories);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ message: 'Error fetching subcategories', error: error.message });
  }
};

// Get subcategory by ID
exports.getSubcategoryById = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id)
      .populate('categoryId', 'name');
    
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    
    res.status(200).json(subcategory);
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    res.status(500).json({ message: 'Error fetching subcategory', error: error.message });
  }
};

// Create new subcategory
exports.createSubcategory = async (req, res) => {
  try {
    const subcategoryData = req.body;
    
    const subcategory = new Subcategory(subcategoryData);
    await subcategory.save();
    
    // Populate the category info before returning
    await subcategory.populate('categoryId', 'name');
    
    res.status(201).json(subcategory);
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(400).json({ message: 'Error creating subcategory', error: error.message });
  }
};

// Update subcategory
exports.updateSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name');
    
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    
    res.status(200).json(subcategory);
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(400).json({ message: 'Error updating subcategory', error: error.message });
  }
};

// Delete subcategory
exports.deleteSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findByIdAndDelete(req.params.id);
    
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    
    res.status(200).json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({ message: 'Error deleting subcategory', error: error.message });
  }
};