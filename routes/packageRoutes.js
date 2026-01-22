const express = require('express');
const { body } = require('express-validator');
const adminAuthMiddleware = require('../middleware/adminAuth');
const {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  getActivePackages
} = require('../controllers/packageController');

const router = express.Router();

const packageValidation = [
  body('name')
    .notEmpty()
    .withMessage('Package name is required')
    .isLength({ max: 50 })
    .withMessage('Package name cannot exceed 50 characters')
    .trim(),
  body('durationInMonths')
    .notEmpty()
    .withMessage('Duration in months is required')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 month'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number')
];

router.get('/', getAllPackages);
router.get('/active', getActivePackages);
router.get('/:id', getPackageById);

router.post('/', adminAuthMiddleware, packageValidation, createPackage);
router.put('/:id', adminAuthMiddleware, packageValidation, updatePackage);
router.delete('/:id', adminAuthMiddleware, deletePackage);

module.exports = router;