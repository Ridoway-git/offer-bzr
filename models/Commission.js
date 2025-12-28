const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: [true, 'Merchant is required']
  },
  totalCommission: {
    type: Number,
    required: [true, 'Total commission is required'],
    default: 0,
    min: [0, 'Commission cannot be negative']
  },
  paidCommission: {
    type: Number,
    default: 0,
    min: [0, 'Paid commission cannot be negative']
  },
  pendingCommission: {
    type: Number,
    default: 0,
    min: [0, 'Pending commission cannot be negative']
  },
  commissionRate: {
    type: Number,
    default: 10, // Default 10% commission
    min: [0, 'Commission rate cannot be negative'],
    max: [100, 'Commission rate cannot exceed 100%']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual to calculate pending commission
commissionSchema.virtual('calculatedPending').get(function() {
  return Math.max(0, this.totalCommission - this.paidCommission);
});

// Update pending commission before save
commissionSchema.pre('save', function(next) {
  this.pendingCommission = Math.max(0, this.totalCommission - this.paidCommission);
  this.lastUpdated = Date.now();
  next();
});

commissionSchema.index({ merchant: 1 });
commissionSchema.index({ pendingCommission: -1 });

module.exports = mongoose.model('Commission', commissionSchema);

