const Merchant = require('../models/Merchant');
const Payment = require('../models/Payment');
const Commission = require('../models/Commission');
const Notification = require('../models/Notification');

// Set access fee for a merchant
const setMerchantAccessFee = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { accessFee } = req.body;

    if (!accessFee || accessFee < 0) {
      return res.status(400).json({
        success: false,
        message: 'Access fee must be a positive number'
      });
    }

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    merchant.accessFee = accessFee;
    // Reset payment status if fee is changed
    if (merchant.accessFeePaid && merchant.accessFee > 0) {
      // Keep paid status if fee is being updated but was already paid
      // Only reset if fee is increased beyond what was paid
    }
    await merchant.save();

    res.json({
      success: true,
      message: 'Access fee set successfully',
      data: merchant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error setting access fee',
      error: error.message
    });
  }
};

// Get all merchants with payment status
const getMerchantsWithPaymentStatus = async (req, res) => {
  try {
    const merchants = await Merchant.find()
      .sort({ createdAt: -1 })
      .select('name email businessName phone address accessFee accessFeePaid accessFeePaymentDate approvalStatus isActive createdAt');

    // Get payment status for each merchant
    const merchantsWithStatus = await Promise.all(
      merchants.map(async (merchant) => {
        const payments = await Payment.find({ merchant: merchant._id })
          .sort({ createdAt: -1 })
          .limit(5);

        const commission = await Commission.findOne({ merchant: merchant._id });

        return {
          ...merchant.toObject(),
          recentPayments: payments,
          commission: commission || null,
          paymentStatus: merchant.accessFeePaid ? 'paid' : 'pending'
        };
      })
    );

    res.json({
      success: true,
      data: merchantsWithStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching merchants with payment status',
      error: error.message
    });
  }
};

// Get merchant payment details
const getMerchantPaymentDetails = async (req, res) => {
  try {
    const { merchantId } = req.params;

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    const payments = await Payment.find({ merchant: merchantId })
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'name email');

    const commission = await Commission.findOne({ merchant: merchantId });

    res.json({
      success: true,
      data: {
        merchant: {
          _id: merchant._id,
          name: merchant.name,
          email: merchant.email,
          businessName: merchant.businessName,
          phone: merchant.phone,
          accessFee: merchant.accessFee,
          accessFeePaid: merchant.accessFeePaid,
          accessFeePaymentDate: merchant.accessFeePaymentDate,
          approvalStatus: merchant.approvalStatus
        },
        payments: payments,
        commission: commission,
        paymentSummary: {
          totalPayments: payments.length,
          approvedPayments: payments.filter(p => p.status === 'approved').length,
          pendingPayments: payments.filter(p => p.status === 'pending').length,
          rejectedPayments: payments.filter(p => p.status === 'rejected').length,
          totalAmountPaid: payments
            .filter(p => p.status === 'approved')
            .reduce((sum, p) => sum + p.amount, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching merchant payment details',
      error: error.message
    });
  }
};

// Mark access fee as paid
const markAccessFeeAsPaid = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { paymentId } = req.body;

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    merchant.accessFeePaid = true;
    merchant.accessFeePaymentDate = new Date();
    if (paymentId) {
      merchant.accessFeePaymentId = paymentId;
    }
    await merchant.save();

    res.json({
      success: true,
      message: 'Access fee marked as paid',
      data: merchant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking access fee as paid',
      error: error.message
    });
  }
};

// Send notification to merchant (admin)
const sendNotificationToMerchant = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { message, type = 'info' } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    const notification = new Notification({
      merchant: merchantId,
      message,
      type,
      sentBy: 'Admin'
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notification',
      error: error.message
    });
  }
};

// Send notification to multiple merchants
const sendNotificationToMultipleMerchants = async (req, res) => {
  try {
    const { merchantIds, message, type = 'info' } = req.body;

    if (!message || !merchantIds || !Array.isArray(merchantIds) || merchantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message and merchant IDs array are required'
      });
    }

    const notifications = await Promise.all(
      merchantIds.map(async (merchantId) => {
        const merchant = await Merchant.findById(merchantId);
        if (!merchant) return null;

        const notification = new Notification({
          merchant: merchantId,
          message,
          type,
          sentBy: 'Admin'
        });

        return await notification.save();
      })
    );

    const successfulNotifications = notifications.filter(n => n !== null);

    res.json({
      success: true,
      message: `Notification sent to ${successfulNotifications.length} merchants`,
      data: {
        sent: successfulNotifications.length,
        total: merchantIds.length,
        notifications: successfulNotifications
      }
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notifications',
      error: error.message
    });
  }
};

// Send notification to all merchants
const sendNotificationToAllMerchants = async (req, res) => {
  try {
    const { message, type = 'info' } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get all merchants
    const allMerchants = await Merchant.find({ isActive: true });
    
    if (allMerchants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active merchants found'
      });
    }

    // Create notifications for all merchants
    const notifications = await Promise.all(
      allMerchants.map(async (merchant) => {
        const notification = new Notification({
          merchant: merchant._id,
          message,
          type,
          sentBy: 'Admin'
        });

        return await notification.save();
      })
    );

    res.json({
      success: true,
      message: `Notification sent to ${notifications.length} merchants`,
      data: {
        sent: notifications.length,
        total: allMerchants.length,
        notifications: notifications
      }
    });
  } catch (error) {
    console.error('Error sending notifications to all merchants:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notifications',
      error: error.message
    });
  }
};

module.exports = {
  setMerchantAccessFee,
  getMerchantsWithPaymentStatus,
  getMerchantPaymentDetails,
  markAccessFeeAsPaid,
  sendNotificationToMerchant,
  sendNotificationToMultipleMerchants,
  sendNotificationToAllMerchants
};

