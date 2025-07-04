const express = require('express');
const Quote = require('../models/Quote');
const Customer = require('../models/Customer');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all quotes (admin view)
router.get('/', async (req, res) => {
  try {
    const {
      status,
      customer,
      startDate,
      endDate,
      sort = '-createdAt',
      limit = 10,
      page = 1,
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (customer) query.customerId = customer;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const quotes = await Quote.find(query)
      .populate('customerId', 'name email company')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Quote.countDocuments(query);

    res.json({
      success: true,
      data: quotes,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotes',
      error: error.message,
    });
  }
});

// Get materials list (moved before /:id route to avoid conflicts)
router.get('/materials', async (req, res) => {
  try {
    // In a real app, this would come from a database
    const materials = [
      { id: 1, name: 'Mild Steel', pricePerKg: 2.5 },
      { id: 2, name: 'Stainless Steel 304', pricePerKg: 8.0 },
      { id: 3, name: 'Stainless Steel 316', pricePerKg: 10.0 },
      { id: 4, name: 'Aluminum 6061', pricePerKg: 4.5 },
      { id: 5, name: 'Aluminum 5052', pricePerKg: 4.0 },
      { id: 6, name: 'Brass', pricePerKg: 12.0 },
      { id: 7, name: 'Copper', pricePerKg: 15.0 },
    ];

    res.json({
      success: true,
      data: materials,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch materials',
    });
  }
});

// Get single quote
router.get('/:id', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('customerId', 'name email company phone');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quote',
      error: error.message,
    });
  }
});

// Create new quote
router.post('/', async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      customerCompany,
      items,
      notes,
    } = req.body;

    // Validate customer
    let customer = null;
    if (customerId) {
      customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxRate = 0.08; // 8% tax - make this configurable
    const tax = subtotal * taxRate;
    const totalPrice = subtotal + tax;

    // Generate quote number
    const quoteNumber = await Quote.generateQuoteNumber();

    // Create quote
    const quote = new Quote({
      quoteNumber,
      customerId: customer?._id || null,
      customerName: customer?.name || customerName,
      customerEmail: customer?.email || customerEmail,
      customerCompany: customer?.company?.name || customerCompany,
      items,
      subtotal,
      tax,
      totalPrice,
      notes,
      createdBy: 'admin', // In production, use req.adminId
      status: 'draft',
    });

    await quote.save();

    // If customer exists, we could send them an email notification here

    res.status(201).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quote',
      error: error.message,
    });
  }
});

// Update quote status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['draft', 'pending', 'sent', 'accepted', 'rejected', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    quote.status = status;
    if (status === 'sent') {
      quote.sentAt = new Date();
    }

    await quote.save();

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error('Update quote status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quote status',
      error: error.message,
    });
  }
});

// Update quote
router.put('/:id', async (req, res) => {
  try {
    const {
      items,
      notes,
      validUntil,
    } = req.body;

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    // Only allow editing draft quotes
    if (quote.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only edit draft quotes',
      });
    }

    // Recalculate totals if items changed
    if (items) {
      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxRate = 0.08;
      const tax = subtotal * taxRate;
      const totalPrice = subtotal + tax;

      quote.items = items;
      quote.subtotal = subtotal;
      quote.tax = tax;
      quote.totalPrice = totalPrice;
    }

    if (notes !== undefined) quote.notes = notes;
    if (validUntil) quote.validUntil = validUntil;

    await quote.save();

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error('Update quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quote',
      error: error.message,
    });
  }
});

// Delete quote
router.delete('/:id', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    // Only allow deleting draft quotes
    if (quote.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete draft quotes',
      });
    }

    await quote.deleteOne();

    res.json({
      success: true,
      message: 'Quote deleted successfully',
    });
  } catch (error) {
    console.error('Delete quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quote',
      error: error.message,
    });
  }
});

// Calculate quote preview
router.post('/calculate', async (req, res) => {
  try {
    const { items } = req.body;

    const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const taxRate = 0.08;
    const tax = subtotal * taxRate;
    const totalPrice = subtotal + tax;

    res.json({
      success: true,
      data: {
        subtotal,
        tax,
        totalPrice,
        taxRate,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate quote',
    });
  }
});

// Analyze DXF file
router.post('/analyze-dxf', async (req, res) => {
  try {
    // For now, return mock data since we don't have actual DXF parsing
    // In production, you would parse the DXF file here
    const mockDxfData = {
      success: true,
      data: {
        dimensions: {
          width: Math.random() * 500 + 100,
          height: Math.random() * 500 + 100,
        },
        area: Math.random() * 10000 + 1000,
        perimeter: Math.random() * 1000 + 100,
        complexity: 'moderate',
        bendLines: [],
        cutLength: Math.random() * 2000 + 500,
      },
    };

    res.json(mockDxfData);
  } catch (error) {
    console.error('DXF analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze DXF file',
    });
  }
});

module.exports = router;