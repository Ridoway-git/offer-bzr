const Merchant = require('../models/Merchant');
const Store = require('../models/Store');
const Offer = require('../models/Offer');
const { validationResult } = require('express-validator');

const getAllMerchants = async (req, res) => {
  try {
    const { page = 1, limit = 10, isApproved, isActive } = req.query;
    const query = {};

    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true';
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const merchants = await Merchant.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Merchant.countDocuments(query);

    res.json({
      success: true,
      data: merchants,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMerchants: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching merchants',
      error: error.message
    });
  }
};

const getMerchantById = async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.params.id);
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    res.json({
      success: true,
      data: merchant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching merchant',
      error: error.message
    });
  }
};

const createMerchant = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const merchant = new Merchant(req.body);
    await merchant.save();

    res.status(201).json({
      success: true,
      message: 'Merchant registration successful. Waiting for admin approval.',
      data: merchant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating merchant',
      error: error.message
    });
  }
};

const updateMerchant = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const merchant = await Merchant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    res.json({
      success: true,
      message: 'Merchant updated successfully',
      data: merchant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating merchant',
      error: error.message
    });
  }
};

const deleteMerchant = async (req, res) => {
  try {
    const merchant = await Merchant.findByIdAndDelete(req.params.id);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    res.json({
      success: true,
      message: 'Merchant deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting merchant',
      error: error.message
    });
  }
};

const toggleMerchantApproval = async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.params.id);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    merchant.isApproved = !merchant.isApproved;
    await merchant.save();

    res.json({
      success: true,
      message: `Merchant ${merchant.isApproved ? 'approved' : 'disapproved'} successfully`,
      data: merchant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling merchant approval',
      error: error.message
    });
  }
};

const getPendingApprovals = async (req, res) => {
  try {
    const pendingStores = await Store.find({ isApproved: false }).populate('merchant');
    const pendingOffers = await Offer.find({ isApproved: false }).populate('merchant').populate('store');

    res.json({
      success: true,
      data: {
        pendingStores,
        pendingOffers,
        totalPending: pendingStores.length + pendingOffers.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending approvals',
      error: error.message
    });
  }
};

const approveStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    store.isApproved = true;
    await store.save();

    res.json({
      success: true,
      message: 'Store approved successfully',
      data: store
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving store',
      error: error.message
    });
  }
};

const approveOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    offer.isApproved = true;
    await offer.save();

    res.json({
      success: true,
      message: 'Offer approved successfully',
      data: offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving offer',
      error: error.message
    });
  }
};

// Merchant profile functions
const getMerchantProfile = async (req, res) => {
  try {
    // Get merchant ID from token (you'll need to implement JWT middleware)
    const merchantId = req.user?.id; // Assuming JWT middleware sets req.user
    
    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    // Get merchant's store
    const Store = require('../models/Store');
    const store = await Store.findOne({ merchant: merchantId });

    res.json({
      success: true,
      data: {
        ...merchant.toObject(),
        store: store
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching merchant profile',
      error: error.message
    });
  }
};

const updateMerchantProfile = async (req, res) => {
  try {
    const merchantId = req.user?.id;
    
    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const merchant = await Merchant.findByIdAndUpdate(
      merchantId,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: merchant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Merchant store functions
const createMerchantStore = async (req, res) => {
  try {
    const merchantId = req.user?.id;
    
    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const storeData = {
      ...req.body,
      merchant: merchantId
    };

    const store = new Store(storeData);
    await store.save();

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: store
    });
  } catch (error) {
    console.error('Error creating store:', error);
    console.error('Store data received:', req.body);
    res.status(500).json({
      success: false,
      message: 'Error creating store',
      error: error.message
    });
  }
};

const getMerchantStore = async (req, res) => {
  try {
    const merchantId = req.user?.id;
    
    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const store = await Store.findOne({ merchant: merchantId });
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    res.json({
      success: true,
      data: store
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching store',
      error: error.message
    });
  }
};

const updateMerchantStore = async (req, res) => {
  try {
    const merchantId = req.user?.id;
    
    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const store = await Store.findOneAndUpdate(
      { merchant: merchantId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: store
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating store',
      error: error.message
    });
  }
};

// Merchant offers functions
const getMerchantOffers = async (req, res) => {
  try {
    const merchantId = req.user?.id;
    
    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const offers = await Offer.find({ merchant: merchantId })
      .populate('store')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: offers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching offers',
      error: error.message
    });
  }
};

const createMerchantOffer = async (req, res) => {
  try {
    const merchantId = req.user?.id;
    
    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Get merchant's store
    const store = await Store.findOne({ merchant: merchantId });
    
    if (!store) {
      return res.status(400).json({
        success: false,
        message: 'Store not found. Please create a store first.'
      });
    }

    const offerData = {
      ...req.body,
      merchant: merchantId,
      store: store._id
    };

    const offer = new Offer(offerData);
    await offer.save();

    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      data: offer
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    console.error('Offer data received:', req.body);
    res.status(500).json({
      success: false,
      message: 'Error creating offer',
      error: error.message
    });
  }
};

const updateMerchantOffer = async (req, res) => {
  try {
    const merchantId = req.user?.id;
    const offerId = req.params.id;
    
    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const offer = await Offer.findOneAndUpdate(
      { _id: offerId, merchant: merchantId },
      req.body,
      { new: true, runValidators: true }
    );

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

const deleteMerchantOffer = async (req, res) => {
  try {
    const merchantId = req.user?.id;
    const offerId = req.params.id;
    
    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const offer = await Offer.findOneAndDelete({
      _id: offerId,
      merchant: merchantId
    });

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

const deleteMerchantStore = async (req, res) => {
  try {
    const merchantId = req.user?.id;
    
    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const store = await Store.findOneAndDelete({ merchant: merchantId });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    res.json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting store',
      error: error.message
    });
  }
};

module.exports = {
  getAllMerchants,
  getMerchantById,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  toggleMerchantApproval,
  getPendingApprovals,
  approveStore,
  approveOffer,
  // New merchant functions
  getMerchantProfile,
  updateMerchantProfile,
  createMerchantStore,
  getMerchantStore,
  updateMerchantStore,
  deleteMerchantStore,
  getMerchantOffers,
  createMerchantOffer,
  updateMerchantOffer,
  deleteMerchantOffer
};
