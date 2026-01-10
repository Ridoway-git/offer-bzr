const Package = require('../models/Package');

// Get all packages
const getAllPackages = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const packages = await Package.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Package.countDocuments(query);
    
    res.json({
      success: true,
      data: packages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPackages: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching packages',
      error: error.message
    });
  }
};

// Get package by ID
const getPackageById = async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }
    
    res.json({
      success: true,
      data: package
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching package',
      error: error.message
    });
  }
};

// Create a new package
const createPackage = async (req, res) => {
  try {
    const { name, durationInMonths, price, description, features } = req.body;
    
    // Check if package with same name already exists
    const existingPackage = await Package.findOne({ name: name.trim() });
    if (existingPackage) {
      return res.status(400).json({
        success: false,
        message: 'Package with this name already exists'
      });
    }
    
    const package = new Package({
      name,
      durationInMonths,
      price,
      description,
      features: features || []
    });
    
    await package.save();
    
    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: package
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating package',
      error: error.message
    });
  }
};

// Update a package
const updatePackage = async (req, res) => {
  try {
    const { name, durationInMonths, price, description, features, isActive } = req.body;
    
    const package = await Package.findById(req.params.id);
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }
    
    // Check if name is being changed and if it already exists
    if (name && name.trim() !== package.name) {
      const existingPackage = await Package.findOne({ name: name.trim() });
      if (existingPackage && existingPackage._id.toString() !== req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Package with this name already exists'
        });
      }
    }
    
    const updateData = {
      name: name || package.name,
      durationInMonths: durationInMonths !== undefined ? durationInMonths : package.durationInMonths,
      price: price !== undefined ? price : package.price,
      description: description || package.description,
      features: features !== undefined ? features : package.features,
      isActive: isActive !== undefined ? isActive : package.isActive
    };
    
    const updatedPackage = await Package.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Package updated successfully',
      data: updatedPackage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating package',
      error: error.message
    });
  }
};

// Delete a package
const deletePackage = async (req, res) => {
  try {
    const package = await Package.findByIdAndDelete(req.params.id);
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting package',
      error: error.message
    });
  }
};

// Get active packages only
const getActivePackages = async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true })
      .sort({ durationInMonths: 1 })
      .exec();
    
    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active packages',
      error: error.message
    });
  }
};

module.exports = {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  getActivePackages
};