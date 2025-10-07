const Merchant = require('../models/Merchant');

const checkMerchantApproval = async (req, res, next) => {
  try {
    const merchantId = req.user?.id;
    
    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Merchant authentication required'
      });
    }

    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    // Check if merchant is approved
    if (merchant.approvalStatus !== 'approved' || !merchant.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your merchant account is pending approval. You cannot create stores or offers until approved by admin.',
        approvalStatus: merchant.approvalStatus,
        isApproved: merchant.isApproved
      });
    }

    // Check if merchant is active
    if (!merchant.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your merchant account is deactivated. Please contact admin.'
      });
    }

    req.merchant = merchant;
    next();
  } catch (error) {
    console.error('Merchant approval check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking merchant approval status'
    });
  }
};

module.exports = checkMerchantApproval;

