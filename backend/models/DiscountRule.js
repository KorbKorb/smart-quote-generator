const mongoose = require('mongoose');

const discountRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  type: {
    type: String,
    enum: ['volume', 'category', 'bundle', 'combination'],
    required: true,
  },
  conditions: {
    // Volume-based conditions
    minQuantity: {
      type: Number,
      min: 0,
    },
    maxQuantity: {
      type: Number,
      min: 0,
    },
    
    // Category-based conditions
    categories: [{
      type: String,
      trim: true,
    }],
    requireAllCategories: {
      type: Boolean,
      default: false,
    },
    
    // Product-specific conditions
    productIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    }],
    
    // Value-based conditions
    minOrderValue: {
      type: Number,
      min: 0,
    },
    
    // Bundle conditions
    bundleRequirements: [{
      category: String,
      minQuantity: Number,
      productIds: [mongoose.Schema.Types.ObjectId],
    }],
  },
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'tiered'],
      required: true,
    },
    value: {
      type: Number,
      required: function() {
        return this.discount.type !== 'tiered';
      },
      min: 0,
    },
    tiers: [{
      minQuantity: Number,
      maxQuantity: Number,
      discountValue: Number,
    }],
  },
  applicableTo: {
    type: String,
    enum: ['all_items', 'matching_items', 'cheapest_item', 'most_expensive_item'],
    default: 'matching_items',
  },
  stackable: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: Number,
    default: 0,
    help: 'Higher priority rules are applied first',
  },
  maxUsagePerQuote: {
    type: Number,
    default: 1,
  },
  validFrom: {
    type: Date,
    default: Date.now,
  },
  validUntil: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
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
discountRuleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if rule applies to a set of items
discountRuleSchema.methods.checkApplicability = function(items) {
  const now = new Date();
  
  // Check if rule is active and within valid dates
  if (!this.isActive) return false;
  if (this.validFrom && now < this.validFrom) return false;
  if (this.validUntil && now > this.validUntil) return false;
  
  // Check conditions based on rule type
  switch (this.type) {
    case 'volume':
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      if (this.conditions.minQuantity && totalQuantity < this.conditions.minQuantity) return false;
      if (this.conditions.maxQuantity && totalQuantity > this.conditions.maxQuantity) return false;
      return true;
      
    case 'category':
      const itemCategories = new Set(items.map(item => item.category));
      if (this.conditions.requireAllCategories) {
        return this.conditions.categories.every(cat => itemCategories.has(cat));
      } else {
        return this.conditions.categories.some(cat => itemCategories.has(cat));
      }
      
    case 'bundle':
      // Check if all bundle requirements are met
      return this.conditions.bundleRequirements.every(req => {
        const matchingItems = items.filter(item => 
          item.category === req.category || 
          (req.productIds && req.productIds.includes(item.productId))
        );
        const totalQty = matchingItems.reduce((sum, item) => sum + item.quantity, 0);
        return totalQty >= req.minQuantity;
      });
      
    case 'combination':
      // Implement combination logic
      return true; // Placeholder
      
    default:
      return false;
  }
};

// Method to calculate discount amount
discountRuleSchema.methods.calculateDiscount = function(items, subtotal) {
  let discountAmount = 0;
  
  switch (this.discount.type) {
    case 'percentage':
      discountAmount = subtotal * (this.discount.value / 100);
      break;
      
    case 'fixed':
      discountAmount = this.discount.value;
      break;
      
    case 'tiered':
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const applicableTier = this.discount.tiers.find(tier => 
        totalQuantity >= tier.minQuantity && 
        (!tier.maxQuantity || totalQuantity <= tier.maxQuantity)
      );
      if (applicableTier) {
        discountAmount = subtotal * (applicableTier.discountValue / 100);
      }
      break;
  }
  
  return Math.min(discountAmount, subtotal); // Ensure discount doesn't exceed subtotal
};

// Indexes
discountRuleSchema.index({ type: 1, isActive: 1 });
discountRuleSchema.index({ priority: -1 });
discountRuleSchema.index({ validFrom: 1, validUntil: 1 });

const DiscountRule = mongoose.model('DiscountRule', discountRuleSchema);

module.exports = DiscountRule;