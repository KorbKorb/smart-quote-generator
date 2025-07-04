const express = require('express');
const Customer = require('../models/Customer');
const Quote = require('../models/Quote');
const { customerAuth } = require('../middleware/auth');

const router = express.Router();

// Get customer profile
router.get('/profile', customerAuth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customerId).select('-password');
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
    });
  }
});

// Update customer profile
router.put('/profile', customerAuth, async (req, res) => {
  try {
    const updates = req.body;
    
    // Fields that cannot be updated directly
    const restrictedFields = ['email', 'password', 'emailVerified', 'status'];
    restrictedFields.forEach(field => delete updates[field]);

    const customer = await Customer.findByIdAndUpdate(
      req.customerId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
});

// Get customer quotes
router.get('/quotes', customerAuth, async (req, res) => {
  try {
    const {
      status,
      limit = 10,
      page = 1,
      sort = '-createdAt',
    } = req.query;

    const query = { customerId: req.customerId };
    if (status) query.status = status;

    const quotes = await Quote.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Quote.countDocuments(query);

    res.json({
      success: true,
      data: {
        quotes,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quotes',
    });
  }
});

// Get specific quote
router.get('/quotes/:id', customerAuth, async (req, res) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      customerId: req.customerId,
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    res.json({
      success: true,
      quote,
    });
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quote',
    });
  }
});

// Accept quote
router.post('/quotes/:id/accept', customerAuth, async (req, res) => {
  try {
    const { purchaseOrderNumber, notes } = req.body;

    const quote = await Quote.findOne({
      _id: req.params.id,
      customerId: req.customerId,
      status: 'sent',
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found or not available for acceptance',
      });
    }

    quote.status = 'accepted';
    quote.acceptedAt = new Date();
    quote.purchaseOrderNumber = purchaseOrderNumber;
    if (notes) {
      quote.notes = (quote.notes || '') + `\n\nCustomer acceptance notes: ${notes}`;
    }

    await quote.save();

    // TODO: Send confirmation email
    // TODO: Create order in system

    res.json({
      success: true,
      message: 'Quote accepted successfully',
      quote,
    });
  } catch (error) {
    console.error('Accept quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept quote',
    });
  }
});

// Reject quote
router.post('/quotes/:id/reject', customerAuth, async (req, res) => {
  try {
    const { reason } = req.body;

    const quote = await Quote.findOne({
      _id: req.params.id,
      customerId: req.customerId,
      status: 'sent',
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found or not available for rejection',
      });
    }

    quote.status = 'rejected';
    quote.rejectedAt = new Date();
    quote.rejectionReason = reason;

    await quote.save();

    // TODO: Send notification email

    res.json({
      success: true,
      message: 'Quote rejected',
      quote,
    });
  } catch (error) {
    console.error('Reject quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject quote',
    });
  }
});

// Get analytics
router.get('/analytics', customerAuth, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    if (range === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (range === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    } else if (range === '1y') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const quotes = await Quote.find({
      customerId: req.customerId,
      createdAt: { $gte: startDate },
    });

    const activeQuotes = quotes.filter(q => ['sent', 'pending'].includes(q.status)).length;
    const pendingQuotes = quotes.filter(q => q.status === 'pending').length;
    const acceptedQuotes = quotes.filter(q => q.status === 'accepted');
    const totalOrders = acceptedQuotes.length;
    const totalSpent = acceptedQuotes.reduce((sum, q) => sum + (q.totalPrice || 0), 0);

    res.json({
      success: true,
      data: {
        activeQuotes,
        pendingQuotes,
        totalOrders,
        totalSpent,
        quotes: quotes.length,
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
    });
  }
});

module.exports = router;