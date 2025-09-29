const express = require('express');
const { body } = require('express-validator');
const {
  getAllMerchants,
  getMerchantById,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  toggleMerchantApproval,
  getPendingApprovals,
  approveStore,
  approveOffer
} = require('../controllers/merchantController');

const router = express.Router();

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

router.get('/', getAllMerchants);
router.get('/pending', getPendingApprovals);
router.get('/:id', getMerchantById);
router.post('/', merchantValidation, createMerchant);
router.put('/:id', merchantValidation, updateMerchant);
router.delete('/:id', deleteMerchant);
router.patch('/:id/toggle-approval', toggleMerchantApproval);
router.patch('/stores/:id/approve', approveStore);
router.patch('/offers/:id/approve', approveOffer);

module.exports = router;
