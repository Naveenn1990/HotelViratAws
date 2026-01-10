const Supplier = require("../model/supplier");

// Get all suppliers (populate category)
exports.getAll = async (req, res) => {
  try {
    const suppliers = await Supplier.find().populate("category");
    res.json({
      success: true,
      count: suppliers.length,
      data: suppliers
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get single supplier (populate category)
exports.getOne = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id).populate("category");
    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        error: "Supplier not found" 
      });
    }
    res.json({
      success: true,
      data: supplier
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Create new supplier
exports.create = async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Update supplier
exports.update = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        error: "Supplier not found" 
      });
    }
    res.json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Delete supplier
exports.remove = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ 
        success: false,
        error: "Supplier not found" 
      });
    }
    res.json({ 
      success: true,
      message: "Supplier deleted successfully" 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};