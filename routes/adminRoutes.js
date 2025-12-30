const express = require('express');
const { body } = require('express-validator');
const adminAuthMiddleware = require('../middleware/adminAuth');
const {
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferFeatured,
  toggleOfferStatus,
  getCategories
} = require('../controllers/offerController');
const {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  toggleStoreStatus
} = require('../controllers/storeController');
const {
  getAllMerchants,
  getMerchantById,
  toggleMerchantApproval,
  toggleMerchantStatus
} = require('../controllers/merchantController');
const {
  setMerchantAccessFee,
  getMerchantsWithPaymentStatus,
  getMerchantPaymentDetails,
  markAccessFeeAsPaid,
  sendNotificationToMerchant,
  sendNotificationToMultipleMerchants,
  sendNotificationToAllMerchants
} = require('../controllers/adminController');
const {
  getPendingPayments,
  getAllPayments,
  approvePayment,
  rejectPayment
} = require('../controllers/paymentController');

const router = express.Router();

// Admin validation middleware for offer creation/update
const adminOfferValidation = [
  body('title')
    .notEmpty()
    .withMessage('Offer title is required')
    .isLength({ max: 100 })
    .withMessage('Offer title cannot exceed 100 characters')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Offer description is required')
    .isLength({ max: 500 })
    .withMessage('Offer description cannot exceed 500 characters')
    .trim(),
  body('offerCode')
    .notEmpty()
    .withMessage('Offer code is required')
    .isLength({ max: 20 })
    .withMessage('Offer code cannot exceed 20 characters')
    .trim(),
  body('discount')
    .notEmpty()
    .withMessage('Discount is required')
    .isNumeric()
    .withMessage('Discount must be a number')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  body('discountType')
    .notEmpty()
    .withMessage('Discount type is required')
    .isIn(['percentage', 'fixed', 'buy_x_get_y', 'free_shipping'])
    .withMessage('Discount type must be one of: percentage, fixed, buy_x_get_y, free_shipping'),
  body('store')
    .notEmpty()
    .withMessage('Store is required')
    .isMongoId()
    .withMessage('Store must be a valid MongoDB ObjectId'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters')
    .trim(),
  body('expiryDate')
    .notEmpty()
    .withMessage('Expiry date is required')
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
  body('minPurchaseAmount')
    .optional()
    .isNumeric()
    .withMessage('Minimum purchase amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Minimum purchase amount cannot be negative'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean value'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Admin Routes - No merchant authentication required
router.get('/offers', getAllOffers);
router.get('/offers/featured', require('../controllers/offerController').getFeaturedOffers);
router.get('/offers/categories', getCategories);
router.get('/offers/:id', getOfferById);
router.post('/offers', adminAuthMiddleware, adminOfferValidation, createOffer);
router.put('/offers/:id', adminAuthMiddleware, adminOfferValidation, updateOffer);
router.delete('/offers/:id', adminAuthMiddleware, deleteOffer);
router.patch('/offers/:id/toggle-featured', adminAuthMiddleware, toggleOfferFeatured);
router.patch('/offers/:id/toggle-status', adminAuthMiddleware, toggleOfferStatus);

// Admin Store Routes
router.get('/stores', getAllStores);
router.get('/stores/:id', getStoreById);
router.post('/stores', adminAuthMiddleware, createStore);
router.put('/stores/:id', adminAuthMiddleware, updateStore);
router.delete('/stores/:id', adminAuthMiddleware, deleteStore);
router.patch('/stores/:id/toggle-status', adminAuthMiddleware, toggleStoreStatus);

// Admin Merchant Routes
router.get('/merchants', getAllMerchants);
router.get('/merchants/payment-status', adminAuthMiddleware, getMerchantsWithPaymentStatus);
router.get('/merchants/:id', getMerchantById);
router.get('/merchants/:id/payment-details', adminAuthMiddleware, getMerchantPaymentDetails);
router.patch('/merchants/:id/toggle-approval', adminAuthMiddleware, toggleMerchantApproval);
router.patch('/merchants/:id/toggle-status', adminAuthMiddleware, toggleMerchantStatus);
router.post('/merchants/:merchantId/set-access-fee', adminAuthMiddleware, setMerchantAccessFee);
router.post('/merchants/:merchantId/mark-fee-paid', adminAuthMiddleware, markAccessFeeAsPaid);

// Admin Payment Routes
router.get('/payments/pending', adminAuthMiddleware, getPendingPayments);
router.get('/payments/all', adminAuthMiddleware, getAllPayments);
router.patch('/payments/:id/approve', adminAuthMiddleware, approvePayment);
router.patch('/payments/:id/reject', adminAuthMiddleware, rejectPayment);

// Admin Notification Routes
router.post('/merchants/:merchantId/notify', adminAuthMiddleware, sendNotificationToMerchant);
router.post('/merchants/notify-multiple', adminAuthMiddleware, sendNotificationToMultipleMerchants);
router.post('/merchants/notify-all', adminAuthMiddleware, sendNotificationToAllMerchants);

module.exports = router;
