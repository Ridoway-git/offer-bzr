const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const checkMerchantApproval = require('../middleware/merchantApproval');
const {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  toggleStoreStatus
} = require('../controllers/storeController');

const router = express.Router();

// Validation middleware for store creation/update
const storeValidation = [
  body('name')
    .notEmpty()
    .withMessage('Store name is required')
    .isLength({ max: 100 })
    .withMessage('Store name cannot exceed 100 characters')
    .trim(),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
  body('websiteUrl')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return /^https?:\/\/.+/.test(value);
    })
    .withMessage('Website URL must be a valid URL starting with http:// or https://'),
  body('contactEmail')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    })
    .withMessage('Contact email must be a valid email address'),
  body('logoUrl')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      // Allow both relative paths (/uploads/...) and full URLs (http://...)
      return /^(\/uploads\/.+|https?:\/\/.+)/.test(value);
    })
    .withMessage('Logo URL must be a valid URL or upload path'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Routes
router.get('/', getAllStores);
router.get('/:id', getStoreById);
router.post('/', authMiddleware, checkMerchantApproval, storeValidation, createStore);
router.put('/:id', authMiddleware, checkMerchantApproval, storeValidation, updateStore);
router.delete('/:id', authMiddleware, checkMerchantApproval, deleteStore);
router.patch('/:id/toggle-status', authMiddleware, checkMerchantApproval, toggleStoreStatus);

module.exports = router;
