const mongoose = require('mongoose');

const packageItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: String,
  category: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  baseUnitPrice: {
    type: Number,
    required: true,
  },
  customUnitPrice: Number, // Override price if needed
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  notes: String,
});

const discountRuleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['volume', 'category', 'bundle', 'custom'],
    required: true,
  },
  name: String,
  description: String,
  conditions: {
    minQuantity: Number,
    categories: [String],
    productIds: [mongoose.Schema.Types.ObjectId],
    minAmount: Number,
  },
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: Number,
    default: 0,
  },
});

const packageQuoteSchema = new mongoose.Schema({
  quoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
    required: true,
  },
  packageName: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  items: [packageItemSchema],
  categories: [{
    name: String,
    itemCount: Number,
    subtotal: Number,
    discount: Number,
    total: Number,
  }],
  appliedDiscounts: [{
    ruleId: mongoose.Schema.Types.ObjectId,
    ruleName: String,
    discountType: String,
    discountValue: Number,
    discountAmount: Number,
    affectedItems: [mongoose.Schema.Types.ObjectId],
  }],
  pricing: {
    itemsSubtotal: {
      type: Number,
      required: true,
    },
    totalDiscount: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
  },
  isTemplate: {
    type: Boolean,
    default: false,
  },
  templateName: String,
  usageCount: {
    type: Number,
    default: 0,
  },
  notes: String,
  createdBy: String,
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
packageQuoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to calculate category breakdowns
packageQuoteSchema.methods.calculateCategoryBreakdown = function() {
  const categoryMap = new Map();
  
  this.items.forEach(item => {
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, {
        name: item.category,
        itemCount: 0,
        subtotal: 0,
        discount: 0,
        total: 0,
      });
    }
    
    const category = categoryMap.get(item.category);
    category.itemCount += 1;
    category.subtotal += item.baseUnitPrice * item.quantity;
    category.discount += (item.baseUnitPrice - (item.customUnitPrice || item.baseUnitPrice)) * item.quantity;
    category.total += item.totalPrice;
  });
  
  this.categories = Array.from(categoryMap.values());
};

// Indexes
packageQuoteSchema.index({ quoteId: 1 });
packageQuoteSchema.index({ isTemplate: 1, templateName: 1 });
packageQuoteSchema.index({ createdAt: -1 });

const PackageQuote = mongoose.model('PackageQuote', packageQuoteSchema);

module.exports = PackageQuote;