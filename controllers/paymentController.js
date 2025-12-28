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
      commissionId
    } = req.body;

    // Validate required fields
    if (!amount || !paymentMethod || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Amount, payment method, and transaction ID are required'
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

    // Create payment
    const payment = new Payment({
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
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment submitted successfully. Waiting for admin approval.',
      data: payment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment',
      error: error.message
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
    if (payment.merchant._id.toString() !== merchantId && !req.user?.isAdmin) {
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

module.exports = {
  createPayment,
  getMerchantPayments,
  getMerchantCommission,
  getPendingPayments,
  getAllPayments,
  approvePayment,
  rejectPayment,
  addCommission,
  getPaymentById
};

