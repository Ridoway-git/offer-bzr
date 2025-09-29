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

module.exports = {
  getAllMerchants,
  getMerchantById,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  toggleMerchantApproval,
  getPendingApprovals,
  approveStore,
  approveOffer
};
