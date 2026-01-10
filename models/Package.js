const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Package name is required'],
    trim: true,
    maxlength: [50, 'Package name cannot exceed 50 characters']
  },
  durationInMonths: {
    type: Number,
    required: [true, 'Duration in months is required'],
    min: [1, 'Duration must be at least 1 month']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  features: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

packageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

packageSchema.index({ name: 1 });
packageSchema.index({ isActive: 1 });
packageSchema.index({ durationInMonths: 1 });

module.exports = mongoose.model('Package', packageSchema);