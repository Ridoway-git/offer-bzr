const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Merchant name is required'],
    trim: true,
    maxlength: [100, 'Merchant name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  photoURL: {
    type: String
  },
  phone: {
    type: String,
    trim: true
  },
  businessName: {
    type: String,
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  businessType: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Website must be a valid URL'
    }
  },
  address: {
    type: String,
        trim: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  accessFee: {
    type: Number,
    default: 0,
    min: [0, 'Access fee cannot be negative']
  },
  accessFeePaid: {
    type: Boolean,
    default: false
  },
  accessFeePaymentDate: {
    type: Date
  },
  accessFeePaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  // Package-related fields
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package'
  },
  packageStartDate: {
    type: Date
  },
  packageEndDate: {
    type: Date
  },
  packageStatus: {
    type: String,
    enum: ['active', 'expired', 'pending'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

merchantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

merchantSchema.index({ email: 1 });
merchantSchema.index({ isApproved: 1 });
merchantSchema.index({ approvalStatus: 1 });
merchantSchema.index({ isActive: 1 });

module.exports = mongoose.model('Merchant', merchantSchema);
