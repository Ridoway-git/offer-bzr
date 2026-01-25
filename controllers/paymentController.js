const Payment = require('../models/Payment');
const Commission = require('../models/Commission');
const Merchant = require('../models/Merchant');



// Create a new payment
const createPayment = async (req, res) => {
  try {
    const merchantId = req.user?.id;

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

    const {
      amount,
      paymentMethod,
      transactionId,
      senderPhone,
      senderAccount,
      receiverPhone,
      receiverAccount,
      bankName,
      bankAccountNumber,
      paymentProof,
      commissionId,
      package: packageId,
      packageDurationMonths
    } = req.body;

    // Validate required fields
    if (!amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Amount and payment method are required'
      });
    }

    // Get merchant's commission
    let commission = await Commission.findOne({ merchant: merchantId });
    if (!commission) {
      // Create commission record if it doesn't exist
      commission = new Commission({
        merchant: merchantId,
        totalCommission: 0,
        paidCommission: 0,
        pendingCommission: 0
      });
      await commission.save();
    }





    // Default Manual Payment Logic
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required for manual payments'
      });
    }

    // Create payment
    const paymentData = {
      merchant: merchantId,
      amount,
      paymentMethod,
      transactionId,
      senderPhone,
      senderAccount,
      receiverPhone,
      receiverAccount,
      bankName,
      bankAccountNumber,
      paymentProof,
      commissionId: commissionId || commission._id,
      status: 'pending'
    };

    // Add package information if provided
    if (packageId) {
      paymentData.package = packageId;
      paymentData.packageDurationMonths = packageDurationMonths;
    }

    const payment = new Payment(paymentData);

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment submitted successfully. Waiting for admin approval.',
      data: payment
    });
  } catch (error) {
    console.error('Error creating payment (Generic Catch):', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment',
      error: error.message,
      details: error.errors // In case of Mongoose validation errors
    });
  }
};





// Get all payments for a merchant
const getMerchantPayments = async (req, res) => {
  try {
    const merchantId = req.user?.id;

    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const payments = await Payment.find({ merchant: merchantId })
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

// Get merchant commission
const getMerchantCommission = async (req, res) => {
  try {
    const merchantId = req.user?.id;

    if (!merchantId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    let commission = await Commission.findOne({ merchant: merchantId });

    if (!commission) {
      // Create commission record if it doesn't exist
      commission = new Commission({
        merchant: merchantId,
        totalCommission: 0,
        paidCommission: 0,
        pendingCommission: 0
      });
      await commission.save();
    }

    res.json({
      success: true,
      data: commission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching commission',
      error: error.message
    });
  }
};

// Admin: Get all pending payments
const getPendingPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('merchant', 'name email businessName')
      .populate('commissionId');

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending payments',
      error: error.message
    });
  }
};

// Admin: Get all payments
const getAllPayments = async (req, res) => {
  try {
    const { status, merchantId, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (merchantId) {
      query.merchant = merchantId;
    }

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('merchant', 'name email businessName')
      .populate('approvedBy', 'name email')
      .populate('commissionId');

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPayments: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

// Admin: Approve payment
const approvePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user?.id;

    const payment = await Payment.findById(id).populate('commissionId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Payment is already approved'
      });
    }

    // Update payment status
    payment.status = 'approved';
    payment.approvedAt = new Date();
    payment.approvedBy = adminId;
    if (adminNotes) {
      payment.adminNotes = adminNotes;
    }
    await payment.save();

    // Update commission
    if (payment.commissionId) {
      const commission = await Commission.findById(payment.commissionId);
      if (commission) {
        commission.paidCommission += payment.amount;
        commission.pendingCommission = Math.max(0, commission.totalCommission - commission.paidCommission);
        await commission.save();
      }
    }

    // Check if this payment is for access fee
    const merchant = await Merchant.findById(payment.merchant);
    if (merchant && payment.amount >= merchant.accessFee && !merchant.accessFeePaid) {
      merchant.accessFeePaid = true;
      merchant.accessFeePaymentDate = new Date();
      merchant.accessFeePaymentId = payment._id;
      await merchant.save();
    }

    // Check if this payment is for a package
    if (payment.package && payment.packageDurationMonths) {
      const Package = require('../models/Package');
      const pkg = await Package.findById(payment.package);

      if (pkg && merchant) {
        // Calculate package start and end dates
        let startDate = new Date();
        let endDate = new Date();

        // Check if merchant has an active subscription to extend
        if (merchant.packageStatus === 'active' && merchant.packageEndDate && new Date(merchant.packageEndDate) > new Date()) {
          startDate = merchant.packageStartDate; // Keep original start date
          endDate = new Date(merchant.packageEndDate); // Start calculation from current expiry
        }

        endDate.setMonth(endDate.getMonth() + payment.packageDurationMonths);

        // Update merchant with package information
        merchant.package = payment.package;
        merchant.packageStartDate = startDate;
        merchant.packageEndDate = endDate;
        merchant.packageStatus = 'active';
        await merchant.save();
      }
    }

    res.json({
      success: true,
      message: 'Payment approved successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error approving payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving payment',
      error: error.message
    });
  }
};

// Admin: Reject payment
const rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user?.id;

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject an approved payment'
      });
    }

    payment.status = 'rejected';
    payment.approvedBy = adminId;
    if (adminNotes) {
      payment.adminNotes = adminNotes;
    }
    await payment.save();

    res.json({
      success: true,
      message: 'Payment rejected',
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting payment',
      error: error.message
    });
  }
};

// Admin: Add commission to merchant
const addCommission = async (req, res) => {
  try {
    const { merchantId, amount, commissionRate } = req.body;

    if (!merchantId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Merchant ID and amount are required'
      });
    }

    let commission = await Commission.findOne({ merchant: merchantId });

    if (!commission) {
      commission = new Commission({
        merchant: merchantId,
        totalCommission: 0,
        paidCommission: 0,
        pendingCommission: 0,
        commissionRate: commissionRate || 10
      });
    }

    if (commissionRate) {
      commission.commissionRate = commissionRate;
    }

    commission.totalCommission += amount;
    commission.pendingCommission = Math.max(0, commission.totalCommission - commission.paidCommission);
    await commission.save();

    res.json({
      success: true,
      message: 'Commission added successfully',
      data: commission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding commission',
      error: error.message
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const merchantId = req.user?.id;

    const payment = await Payment.findById(id)
      .populate('merchant', 'name email businessName')
      .populate('approvedBy', 'name email')
      .populate('commissionId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if merchant is authorized to view this payment
    if (payment.merchant._id.toString() !== merchantId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this payment'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment',
      error: error.message
    });
  }
};

// Admin: Delete payment
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Delete the payment
    await Payment.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting payment',
      error: error.message
    });
  }
};

module.exports = {
  createPayment,
  getMerchantPayments,
  getMerchantCommission,
  getPendingPayments,
  getAllPayments,
  approvePayment,
  rejectPayment,
  addCommission,
  getPaymentById,
  deletePayment,

};

