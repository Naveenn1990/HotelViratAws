const Branch = require('../model/Branch');

// Get all branches
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find()
      .sort({ createdAt: -1 });
    
    res.status(200).json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ message: 'Error fetching branches', error: error.message });
  }
};

// Get branch by ID
exports.getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    
    res.status(200).json(branch);
  } catch (error) {
    console.error('Error fetching branch:', error);
    res.status(500).json({ message: 'Error fetching branch', error: error.message });
  }
};

// Create new branch
exports.createBranch = async (req, res) => {
  try {
    const branchData = req.body;
    
    const branch = new Branch(branchData);
    await branch.save();
    
    res.status(201).json(branch);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(400).json({ message: 'Error creating branch', error: error.message });
  }
};

// Update branch
exports.updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    
    res.status(200).json(branch);
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(400).json({ message: 'Error updating branch', error: error.message });
  }
};

// Delete branch
exports.deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    
    res.status(200).json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ message: 'Error deleting branch', error: error.message });
  }
};