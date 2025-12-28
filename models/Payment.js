const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: [true, 'Merchant is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['bkash', 'nagad', 'upay', 'rocket', 'bank_transfer'],
      message: 'Payment method must be one of: bkash, nagad, upay, rocket, bank_transfer'
    }
  },
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    trim: true
  },
  senderPhone: {
    type: String,
    trim: true
  },
  senderAccount: {
    type: String,
    trim: true
  },
  receiverPhone: {
    type: String,
    trim: true
  },
  receiverAccount: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  bankAccountNumber: {
    type: String,
    trim: true
  },
  paymentProof: {
    type: String, // URL to payment proof image
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true
  },
  commissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commission'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.status === 'approved' && !this.approvedAt) {
    this.approvedAt = Date.now();
  }
  next();
});

paymentSchema.index({ merchant: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);

