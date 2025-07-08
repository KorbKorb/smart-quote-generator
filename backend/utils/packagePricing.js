const Product = require('../models/Product');
const DiscountRule = require('../models/DiscountRule');

/**
 * Calculate package pricing with all applicable discounts
 */
class PackagePricingEngine {
  /**
   * Parse text input to identify products
   */
  static async parseProductInput(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const parsedItems = [];
    const notFound = [];
    
    for (const line of lines) {
      // Try different parsing patterns
      let productName, quantity;
      
      // Pattern 1: "Product Name x Quantity"
      const match1 = line.match(/^(.+?)\s*x\s*(\d+)\s*$/i);
      // Pattern 2: "Product Name (Quantity)"
      const match2 = line.match(/^(.+?)\s*\((\d+)\)\s*$/);
      // Pattern 3: "Product Name - Quantity"
      const match3 = line.match(/^(.+?)\s*-\s*(\d+)\s*$/);
      // Pattern 4: "Product Name, qty: Quantity"
      const match4 = line.match(/^(.+?),\s*qty:\s*(\d+)\s*$/i);
      
      if (match1) {
        productName = match1[1].trim();
        quantity = parseInt(match1[2]);
      } else if (match2) {
        productName = match2[1].trim();
        quantity = parseInt(match2[2]);
      } else if (match3) {
        productName = match3[1].trim();
        quantity = parseInt(match3[2]);
      } else if (match4) {
        productName = match4[1].trim();
        quantity = parseInt(match4[2]);
      } else {
        // Default: assume the whole line is the product name with quantity 1
        productName = line.trim();
        quantity = 1;
      }
      
      try {
        // Try to find the product
        const product = await Product.findOne({
          $or: [
            { name: new RegExp(`^${productName}$`, 'i') },
            { sku: productName.toUpperCase() },
            { name: new RegExp(productName, 'i') }
          ]
        });
        
        if (product) {
          parsedItems.push({
            _id: product._id.toString(),
            product: {
              _id: product._id.toString(),
              name: product.name,
              category: product.category,
              basePrice: product.basePrice,
              unit: product.priceUnit || 'per_piece',
              material: product.material,
              thickness: product.thickness,
              description: product.description,
            },
            quantity: quantity,
            originalText: line.trim(),
          });
        } else {
          notFound.push({
            originalText: line.trim(),
            searchTerm: productName,
            quantity: quantity,
          });
        }
      } catch (error) {
        console.error('Error finding product:', error);
        notFound.push({
          originalText: line.trim(),
          searchTerm: productName,
          quantity: quantity,
          error: error.message,
        });
      }
    }
    
    return {
      found: parsedItems,
      notFound: notFound,
    };
  }

  /**
   * Apply all applicable discount rules to a package
   * @param {Array} items - Array of package items
   * @returns {Object} Pricing breakdown with applied discounts
   */
  static async calculatePackagePricing(items) {
    // Calculate base totals
    const subtotal = items.reduce((sum, item) => 
      sum + (item.product.basePrice * item.quantity), 0
    );
    
    // Calculate category totals
    const categoryMap = {};
    items.forEach(item => {
      const category = item.product.category;
      if (!categoryMap[category]) {
        categoryMap[category] = {
          name: category,
          itemCount: 0,
          total: 0,
        };
      }
      categoryMap[category].itemCount += 1;
      categoryMap[category].total += item.product.basePrice * item.quantity;
    });
    
    const categories = Object.values(categoryMap);
    
    // Get all active discount rules
    const discountRules = await DiscountRule.find({
      isActive: true,
      $or: [
        { validUntil: { $gte: new Date() } },
        { validUntil: null }
      ]
    }).sort({ priority: -1 });
    
    // Apply discount rules
    const discounts = [];
    let totalDiscount = 0;
    
    for (const rule of discountRules) {
      const discountResult = await this.applyDiscountRule(rule, items, subtotal);
      if (discountResult && discountResult.amount > 0) {
        discounts.push(discountResult);
        totalDiscount += discountResult.amount;
      }
    }
    
    const total = subtotal - totalDiscount;
    const discountPercentage = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;
    
    return {
      subtotal,
      discounts,
      totalDiscount,
      total,
      discountPercentage,
      categories,
      appliedRules: discounts.map(d => ({
        name: d.ruleName,
        description: d.description || `${d.type} discount applied`,
      })),
    };
  }
  
  /**
   * Apply a single discount rule
   */
  static async applyDiscountRule(rule, items, subtotal) {
    // Check if rule applies based on conditions
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Volume discount
    if (rule.type === 'volume' && rule.conditions.minQuantity) {
      if (totalQuantity < rule.conditions.minQuantity) return null;
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    let reason = '';
    
    if (rule.discount.type === 'percentage') {
      discountAmount = subtotal * (rule.discount.value / 100);
      reason = `${rule.discount.value}% off`;
    } else if (rule.discount.type === 'fixed') {
      discountAmount = Math.min(rule.discount.value, subtotal);
      reason = `$${rule.discount.value} off`;
    }
    
    if (discountAmount === 0) return null;
    
    return {
      type: rule.type,
      ruleName: rule.name,
      amount: discountAmount,
      reason: reason,
      description: rule.description,
    };
  }
  
  /**
   * Calculate totals by category
   */
  static calculateCategoryTotals(items) {
    const categories = {};
    
    items.forEach(item => {
      const category = item.product.category;
      if (!categories[category]) {
        categories[category] = {
          name: category,
          items: [],
          quantity: 0,
          subtotal: 0,
        };
      }
      
      categories[category].items.push(item);
      categories[category].quantity += item.quantity;
      categories[category].subtotal += item.product.basePrice * item.quantity;
    });
    
    return categories;
  }
}

module.exports = PackagePricingEngine;