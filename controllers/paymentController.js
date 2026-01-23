const Payment = require('../models/Payment');
const Commission = require('../models/Commission');
const Merchant = require('../models/Merchant');
const SSLCommerz = require('sslcommerz-nodejs');

// SSLCommerz configuration
const config = {
  store_id: process.env.STORE_ID || 'testbox',
  store_passwd: process.env.STORE_PASSWORD || 'qwerty',
  is_live: process.env.IS_LIVE === 'true',
  api_url: process.env.IS_LIVE === 'true' ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php' : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php',
};

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

    // Handle SSLCommerz Payment
    if (paymentMethod === 'sslcommerz') {
      const tran_id = transactionId || `TXN-${Date.now()}`;

      const sslcommerz = new SSLCommerz(config);

      const postData = {
        total_amount: amount,
        currency: 'BDT',
        tran_id: tran_id,
        success_url: `${process.env.API_URL || 'http://localhost:5000'}/api/payments/ssl-success`,
        fail_url: `${process.env.API_URL || 'http://localhost:5000'}/api/payments/ssl-fail`,
        cancel_url: `${process.env.API_URL || 'http://localhost:5000'}/api/payments/ssl-cancel`,
        ipn_url: `${process.env.API_URL || 'http://localhost:5000'}/api/payments/ssl-ipn`,
        shipping_method: 'No',
        product_name: 'Payment',
        product_category: 'Payment',
        product_profile: 'general',
        cus_name: 'Merchant',
        cus_email: 'merchant@example.com',
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: 'Merchant',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
        value_a: merchantId ? merchantId.toString() : '', // Pass merchant ID in extra param
        value_b: packageId ? packageId.toString() : '', // Pass package ID
        value_c: packageDurationMonths ? packageDurationMonths.toString() : '', // Pass duration
        value_d: commissionId ? commissionId.toString() : (commission._id ? commission._id.toString() : '') // Pass commission ID
      };

      try {
        const data = await sslcommerz.init(postData);

        if (data?.GatewayPageURL) {

          // Determine status based on what we're doing
          // If we have package ID, we don't save payment yet, we wait for success
          // Or we can save as pending

          const paymentData = {
            merchant: merchantId,
            amount,
            paymentMethod,
            transactionId: tran_id, // Use generated transaction ID
            commissionId: commissionId || commission._id,
            status: 'pending'
          };

          if (packageId) {
            paymentData.package = packageId;
            paymentData.packageDurationMonths = packageDurationMonths;
          }

          const payment = new Payment(paymentData);
          await payment.save();

          return res.status(200).json({
            success: true,
            gatewayUrl: data.GatewayPageURL,
            paymentId: payment._id
          });
        }
        else {
          return res.status(400).json({
            success: false,
            message: 'SSLCommerz Session Failed'
          });
        }
      } catch (error) {
        console.error('SSLCommerz Init Error:', error);
        return res.status(500).json({
          success: false,
          message: 'SSLCommerz Init Error',
          error: error.message
        });
      }
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
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment',
      error: error.message
    });
  }
};

// SSLCommerz Success Handler
const sslSuccess = async (req, res) => {
  try {
    const { val_id, value_a, value_b, value_c, value_d, tran_id } = req.body;

    // Validate Payment
    const sslcommerz = new SSLCommerz(config);
    const validation = await sslcommerz.validate(val_id);

    if (validation && (validation.status === 'VALID' || validation.status === 'VALIDATED')) {

      // Update Payment Status
      const payment = await Payment.findOne({ transactionId: tran_id });

      if (payment) {
        payment.status = 'approved'; // Auto approve for online payment
        payment.approvedAt = new Date();
        payment.adminNotes = 'Auto-approved via SSLCommerz';
        await payment.save();

        // Update Commission
        if (payment.commissionId) {
          const commission = await Commission.findById(payment.commissionId);
          if (commission) {
            commission.paidCommission += payment.amount;
            commission.pendingCommission = Math.max(0, commission.totalCommission - commission.paidCommission);
            await commission.save();
          }
        }

        // Update Merchant Access Fee
        const merchantId = value_a;
        const merchant = await Merchant.findById(merchantId);

        if (merchant && payment.amount >= merchant.accessFee && !merchant.accessFeePaid) {
          merchant.accessFeePaid = true;
          merchant.accessFeePaymentDate = new Date();
          merchant.accessFeePaymentId = payment._id;
          await merchant.save();
        }

        // Update Package
        if (value_b && value_c) { // if packageId and duration exists
          const Package = require('../models/Package');
          const pkg = await Package.findById(value_b);

          if (pkg) {
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + parseInt(value_c));

            merchant.package = value_b;
            merchant.packageStartDate = startDate;
            merchant.packageEndDate = endDate;
            merchant.packageStatus = 'active';
            await merchant.save();
          }
        }

      }

      // Redirect to frontend success page
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/merchant/dashboard?payment=success`);
    } else {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/merchant/dashboard?payment=fail`);
    }

  } catch (error) {
    console.error('SSL Success Error', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/merchant/dashboard?payment=error`);
  }
}

const sslFail = async (req, res) => {
  return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/merchant/dashboard?payment=fail`);
}

const sslCancel = async (req, res) => {
  return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/merchant/dashboard?payment=cancel`);
}

const sslIpn = async (req, res) => {
  return res.status(200).send("IPN");
}

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
      const package = await Package.findById(payment.package);

      if (package) {
        // Calculate package start and end dates
        const startDate = new Date();
        const endDate = new Date(startDate);
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
  sslSuccess,
  sslFail,
  sslCancel,
  sslIpn
};

