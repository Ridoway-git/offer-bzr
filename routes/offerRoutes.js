const express = require('express');
const { body } = require('express-validator');
const {
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferFeatured,
  toggleOfferStatus,
  getFeaturedOffers,
  getFavorites,
  getFavoriteStatus,
  toggleFavorite
} = require('../controllers/offerController');

const router = express.Router();

// Validation middleware for offer creation/update
const offerValidation = [
  body('title')
    .notEmpty()
    .withMessage('Offer title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters')
    .trim(),
  body('offerCode')
    .notEmpty()
    .withMessage('Offer code is required')
    .isLength({ max: 20 })
    .withMessage('Offer code cannot exceed 20 characters')
    .trim()
    .toUpperCase(),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
  body('imageUrl')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      
      return /^(\/uploads\/.+|https?:\/\/.+)/.test(value);
    })
    .withMessage('Image URL must be a valid URL or upload path'),
  body('productUrl')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      
      return /^https?:\/\/.+/.test(value);
    })
    .withMessage('Product URL must be a valid URL'),
  body('discount')
    .notEmpty()
    .withMessage('Discount amount is required')
    .isNumeric()
    .withMessage('Discount must be a number')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  body('discountType')
    .notEmpty()
    .withMessage('Discount type is required')
    .isIn(['Percentage', 'Fixed'])
    .withMessage('Discount type must be either Percentage or Fixed'),
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

// Routes
router.get('/', getAllOffers);
router.get('/featured', getFeaturedOffers);
router.get('/favorites', getFavorites);
router.get('/:id', getOfferById);
router.post('/', offerValidation, createOffer);
router.put('/:id', offerValidation, updateOffer);
router.delete('/:id', deleteOffer);
router.patch('/:id/toggle-featured', toggleOfferFeatured);
router.patch('/:id/toggle-status', toggleOfferStatus);
router.get('/:id/favorite-status', getFavoriteStatus);
router.post('/:id/favorite', toggleFavorite);

module.exports = router;
