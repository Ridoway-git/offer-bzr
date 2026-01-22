const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const {
  getAllMerchants,
  getMerchantById,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  toggleMerchantApproval,
  getPendingApprovals,
  approveStore,
  approveOffer,
  getMerchantProfile,
  updateMerchantProfile,
  createMerchantStore,
  getMerchantStore,
  updateMerchantStore,
  deleteMerchantStore,
  getMerchantOffers,
  createMerchantOffer,
  updateMerchantOffer,
  deleteMerchantOffer,
  toggleMerchantStatus,
  sendNotificationToMerchant
} = require('../controllers/merchantController');

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

const merchantValidation = [
  body('name')
    .notEmpty()
    .withMessage('Merchant name is required')
    .isLength({ max: 100 })
    .withMessage('Merchant name cannot exceed 100 characters')
    .trim(),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .trim(),
  body('businessName')
    .notEmpty()
    .withMessage('Business name is required')
    .isLength({ max: 100 })
    .withMessage('Business name cannot exceed 100 characters')
    .trim(),
  body('businessType')
    .notEmpty()
    .withMessage('Business type is required')
    .trim(),
  body('website')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return /^https?:\/\/.+/.test(value);
    })
    .withMessage('Website must be a valid URL'),
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .trim()
];

router.get('/profile', authMiddleware, getMerchantProfile);
router.put('/profile', authMiddleware, updateMerchantProfile);

router.post('/store', authMiddleware, upload.none(), createMerchantStore);
router.get('/store', authMiddleware, getMerchantStore);
router.put('/store', authMiddleware, upload.none(), updateMerchantStore);
router.delete('/store', authMiddleware, deleteMerchantStore);

router.get('/offers', authMiddleware, getMerchantOffers);
router.post('/offers', authMiddleware, upload.none(), createMerchantOffer);
router.put('/offers/:id', authMiddleware, upload.none(), updateMerchantOffer);
router.delete('/offers/:id', deleteMerchantOffer); // Temporarily remove auth for testing

router.get('/notifications', authMiddleware, require('../controllers/notificationController').getMerchantNotificationsByToken);
router.patch('/notifications/:id/read', authMiddleware, require('../controllers/notificationController').markNotificationAsRead);
router.patch('/notifications/read-all', authMiddleware, require('../controllers/notificationController').markAllMerchantNotificationsAsRead);

router.get('/', getAllMerchants);
router.get('/pending', getPendingApprovals);
router.put('/:id/toggle-status', toggleMerchantStatus);
router.post('/:id/notify', sendNotificationToMerchant);
router.get('/:id', getMerchantById);
router.post('/', merchantValidation, createMerchant);
router.put('/:id', merchantValidation, updateMerchant);
router.delete('/:id', deleteMerchant);
router.patch('/:id/toggle-approval', toggleMerchantApproval);
router.patch('/stores/:id/approve', approveStore);
router.patch('/offers/:id/approve', approveOffer);

module.exports = router;
