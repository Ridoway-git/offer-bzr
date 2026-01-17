const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Either merchant-specific or general notification
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant'
  },
  // Fields for general offer notifications
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'offer', 'store'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  sentBy: {
    type: String,
    default: 'system'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date
  }
});

// Index for better query performance
notificationSchema.index({ merchant: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ offerId: 1, createdAt: -1 });
notificationSchema.index({ storeId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 }); // Additional index for type filtering

module.exports = mongoose.model('Notification', notificationSchema);
