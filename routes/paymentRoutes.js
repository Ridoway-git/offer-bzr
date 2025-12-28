const express = require('express');
const authMiddleware = require('../middleware/auth');
const adminAuthMiddleware = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const {
  createPayment,
  getMerchantPayments,
  getMerchantCommission,
  getPendingPayments,
  getAllPayments,
  approvePayment,
  rejectPayment,
  addCommission,
  getPaymentById
} = require('../controllers/paymentController');

const router = express.Router();

// Configure multer for payment proof uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/payment-proofs/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed!'));
    }
  }
});

// Create uploads/payment-proofs directory if it doesn't exist
const fs = require('fs');
const paymentProofsDir = 'public/uploads/payment-proofs';
if (!fs.existsSync(paymentProofsDir)) {
  fs.mkdirSync(paymentProofsDir, { recursive: true });
}

// Merchant routes (protected)
router.post('/', authMiddleware, upload.single('paymentProof'), async (req, res) => {
  try {
    // Add payment proof URL if file was uploaded
    if (req.file) {
      req.body.paymentProof = `/uploads/payment-proofs/${req.file.filename}`;
    }
    
    // Call the controller
    return await createPayment(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
});

router.get('/merchant', authMiddleware, getMerchantPayments);
router.get('/commission', authMiddleware, getMerchantCommission);
router.get('/merchant/:id', authMiddleware, getPaymentById);

// Admin routes (protected)
router.get('/pending', adminAuthMiddleware, getPendingPayments);
router.get('/all', adminAuthMiddleware, getAllPayments);
router.get('/:id', adminAuthMiddleware, getPaymentById);
router.patch('/:id/approve', adminAuthMiddleware, approvePayment);
router.patch('/:id/reject', adminAuthMiddleware, rejectPayment);
router.post('/commission/add', adminAuthMiddleware, addCommission);

module.exports = router;

