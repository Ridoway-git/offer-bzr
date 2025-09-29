const Offer = require('../models/Offer');
const Store = require('../models/Store');
const { validationResult } = require('express-validator');

// Get all offers
const getAllOffers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      store, 
      isFeatured, 
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};

    // Filter by category if provided
    if (category) {
      query.category = new RegExp(category, 'i');
    }

    // Filter by store if provided
    if (store) {
      query.store = store;
    }

    // Filter by featured status if provided
    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true';
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Filter out expired offers
    query.expiryDate = { $gt: new Date() };

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const offers = await Offer.find(query)
      .populate('store', 'name category logoUrl')
      .populate('merchant', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Offer.countDocuments(query);

    res.json({
      success: true,
      data: offers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOffers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching offers',
      error: error.message
    });
  }
};

// Get offer by ID
const getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('store', 'name category logoUrl websiteUrl');
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.json({
      success: true,
      data: offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching offer',
      error: error.message
    });
  }
};

// Create new offer
const createOffer = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if store exists
    const store = await Store.findById(req.body.store);
    if (!store) {
      return res.status(400).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if offer code already exists
    const existingOffer = await Offer.findOne({ offerCode: req.body.offerCode });
    if (existingOffer) {
      return res.status(400).json({
        success: false,
        message: 'Offer code already exists'
      });
    }

    const offer = new Offer(req.body);
    await offer.save();
    await offer.populate('store', 'name category logoUrl');

    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      data: offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating offer',
      error: error.message
    });
  }
};

// Update offer
const updateOffer = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if store exists (if store is being updated)
    if (req.body.store) {
      const store = await Store.findById(req.body.store);
      if (!store) {
        return res.status(400).json({
          success: false,
          message: 'Store not found'
        });
      }
    }

    // Check if offer code already exists (if offer code is being updated)
    if (req.body.offerCode) {
      const existingOffer = await Offer.findOne({ 
        offerCode: req.body.offerCode,
        _id: { $ne: req.params.id }
      });
      if (existingOffer) {
        return res.status(400).json({
          success: false,
          message: 'Offer code already exists'
        });
      }
    }

    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('store', 'name category logoUrl');

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.json({
      success: true,
      message: 'Offer updated successfully',
      data: offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating offer',
      error: error.message
    });
  }
};

// Delete offer
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting offer',
      error: error.message
    });
  }
};

// Toggle offer featured status
const toggleOfferFeatured = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    offer.isFeatured = !offer.isFeatured;
    await offer.save();
    await offer.populate('store', 'name category logoUrl');

    res.json({
      success: true,
      message: `Offer ${offer.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling offer featured status',
      error: error.message
    });
  }
};

// Toggle offer active status
const toggleOfferStatus = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    offer.isActive = !offer.isActive;
    await offer.save();
    await offer.populate('store', 'name category logoUrl');

    res.json({
      success: true,
      message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
      data: offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling offer status',
      error: error.message
    });
  }
};

// Get featured offers
const getFeaturedOffers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const offers = await Offer.find({
      isFeatured: true,
      isActive: true,
      expiryDate: { $gt: new Date() }
    })
    .populate('store', 'name category logoUrl')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .exec();

    res.json({
      success: true,
      data: offers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured offers',
      error: error.message
    });
  }
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Offer.distinct('category', { isActive: true });
    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// Get user's favorite offers
const getFavorites = async (req, res) => {
  try {
    // For now, return all offers as favorites (mock implementation)
    // In a real app, you would fetch user's favorite offers from database
    const offers = await Offer.find({ isActive: true })
      .populate('store', 'name category logoUrl')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      favorites: offers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites',
      error: error.message
    });
  }
};

// Get favorite status for an offer
const getFavoriteStatus = async (req, res) => {
  try {
    // For now, return false as we don't have user authentication implemented
    // In a real app, you would check the user's favorites
    res.json({
      success: true,
      isFavorite: false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking favorite status',
      error: error.message
    });
  }
};

// Toggle favorite status for an offer
const toggleFavorite = async (req, res) => {
  try {
    // For now, return a mock response
    // In a real app, you would add/remove from user's favorites
    res.json({
      success: true,
      isFavorite: true,
      message: 'Added to favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling favorite',
      error: error.message
    });
  }
};

module.exports = {
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferFeatured,
  toggleOfferStatus,
  getFeaturedOffers,
  getFavorites,
  getCategories,
  getFavoriteStatus,
  toggleFavorite
};
