const express = require('express');
const router = express.Router();
const PackageQuote = require('../models/PackageQuote');
const Product = require('../models/Product');
const DiscountRule = require('../models/DiscountRule');
const Quote = require('../models/Quote');
const PackagePricingEngine = require('../utils/packagePricing');

// Debug endpoint to check if products exist
router.get('/debug/products', async (req, res) => {
  try {
    const products = await Product.find({}).limit(10);
    res.json({
      success: true,
      count: products.length,
      products: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message,
    });
  }
});

// Parse products from text input
router.post('/parse-products', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'No text provided',
      });
    }
    
    console.log('Parsing products from text:', text);
    
    const parseResult = await PackagePricingEngine.parseProductInput(text);
    
    console.log('Parse result:', JSON.stringify(parseResult, null, 2));
    
    res.json({
      success: true,
      data: parseResult,
    });
  } catch (error) {
    console.error('Error parsing products:', error);
    res.status(500).json({
      success: false,
      message: 'Error parsing products',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Calculate package pricing
router.post('/calculate-pricing', async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'No items provided',
      });
    }
    
    const pricing = await PackagePricingEngine.calculatePackagePricing(items);
    
    res.json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    console.error('Error calculating package pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating pricing',
      error: error.message,
    });
  }
});

// Create a new package quote
router.post('/create', async (req, res) => {
  try {
    const {
      quoteId,
      packageName,
      description,
      items,
      notes,
      saveAsTemplate,
      templateName,
    } = req.body;
    
    // Validate quote exists
    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }
    
    // Calculate pricing
    const pricing = await PackagePricingEngine.calculatePackagePricing(items);
    
    // Create package quote
    const packageQuote = new PackageQuote({
      quoteId,
      packageName,
      description,
      items: pricing.items,
      categories: Object.values(pricing.categoryBreakdown),
      appliedDiscounts: pricing.appliedDiscounts,
      pricing: {
        itemsSubtotal: pricing.itemsSubtotal,
        totalDiscount: pricing.totalDiscount,
        subtotal: pricing.finalSubtotal,
        tax: pricing.finalSubtotal * 0.08, // 8% tax rate
        total: pricing.finalSubtotal * 1.08,
      },
      isTemplate: saveAsTemplate || false,
      templateName: saveAsTemplate ? templateName : undefined,
      notes,
      createdBy: req.user?.email || 'system',
    });
    
    await packageQuote.save();
    
    // Update quote to reference this package
    quote.packageQuotes.push(packageQuote._id);
    quote.hasPackages = true;
    await quote.save();
    
    res.json({
      success: true,
      data: packageQuote,
    });
  } catch (error) {
    console.error('Error creating package quote:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating package quote',
      error: error.message,
    });
  }
});

// Get package templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await PackageQuote.find({
      isTemplate: true,
    }).select('packageName templateName description usageCount createdAt');
    
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching templates',
      error: error.message,
    });
  }
});

// Load a template
router.get('/templates/:id', async (req, res) => {
  try {
    const template = await PackageQuote.findById(req.params.id);
    
    if (!template || !template.isTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }
    
    // Increment usage count
    template.usageCount += 1;
    await template.save();
    
    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error loading template:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading template',
      error: error.message,
    });
  }
});

// Get all discount rules
router.get('/discount-rules', async (req, res) => {
  try {
    const rules = await DiscountRule.find({
      isActive: true,
      $or: [
        { validUntil: { $gte: new Date() } },
        { validUntil: null }
      ]
    }).sort({ priority: -1 });
    
    res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    console.error('Error fetching discount rules:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching discount rules',
      error: error.message,
    });
  }
});

// Get all products grouped by category
router.get('/products-by-category', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    
    // Group by category
    const groupedProducts = products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: groupedProducts,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message,
    });
  }
});

// Search products
router.get('/products/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query required',
      });
    }
    
    const products = await Product.find({
      isActive: true,
      $or: [
        { name: new RegExp(query, 'i') },
        { sku: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') },
        { category: new RegExp(query, 'i') },
      ],
    }).limit(10);
    
    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message,
    });
  }
});

module.exports = router;