const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  material: {
    type: String,
    required: true,
  },
  thickness: {
    type: Number,
    required: true,
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  priceUnit: {
    type: String,
    enum: ['per_piece', 'per_sqft', 'per_linear_ft', 'per_pound'],
    default: 'per_piece',
  },
  minimumQuantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  specifications: {
    type: Map,
    of: String,
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ sku: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;