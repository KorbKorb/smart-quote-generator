const express = require('express');
const router = express.Router();
const { calculateQuote } = require('../utils/quoteCalculator');
const mongoose = require('mongoose');

// Quote Schema (if not already defined elsewhere)
const quoteSchema = new mongoose.Schema({
  quoteNumber: { type: String, unique: true },
  customer: {
    name: String,
    email: String,
    company: String,
    phone: String,
  },
  items: [
    {
      material: String,
      thickness: Number,
      quantity: Number,
      finishType: String,
      bendComplexity: String,
      toleranceLevel: String,
      urgency: String,
      files: [String],
      pricing: Object,
    },
  ],
  totalPrice: Number,
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
    default: 'draft',
  },
  validUntil: Date,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Quote = mongoose.model('Quote', quoteSchema);

// Generate quote number
function generateQuoteNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `Q-${year}${month}-${random}`;
}

// @route   GET /api/quotes
// @desc    Get all quotes with filtering and pagination
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { quoteNumber: new RegExp(search, 'i') },
        { 'customer.name': new RegExp(search, 'i') },
        { 'customer.company': new RegExp(search, 'i') },
      ];
    }

    const quotes = await Quote.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Quote.countDocuments(query);

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: quotes,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/quotes/:id
// @desc    Get single quote by ID
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id);

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
    next(error);
  }
});

// @route   POST /api/quotes
// @desc    Create new quote
// @access  Private
router.post('/', async (req, res, next) => {
  try {
    const { customer, items, notes } = req.body;

    // Calculate pricing for each item
    const pricedItems = await Promise.all(
      items.map(async (item) => {
        const pricing = await calculateQuote(item);
        return {
          ...item,
          pricing,
        };
      })
    );

    // Calculate total price
    const totalPrice = pricedItems.reduce(
      (sum, item) => sum + parseFloat(item.pricing.breakdown.total),
      0
    );

    // Create quote
    const quote = new Quote({
      quoteNumber: generateQuoteNumber(),
      customer,
      items: pricedItems,
      totalPrice,
      notes,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await quote.save();

    res.status(201).json({
      success: true,
      message: 'Quote created successfully',
      data: quote,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/quotes/calculate
// @desc    Calculate quote price without saving
// @access  Public
router.post('/calculate', async (req, res, next) => {
  try {
    const quoteData = req.body;
    const pricing = await calculateQuote(quoteData);

    res.json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/quotes/:id
// @desc    Update quote
// @access  Private
router.put('/:id', async (req, res, next) => {
  try {
    const { items, notes, status } = req.body;

    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    // Recalculate pricing if items changed
    if (items) {
      const pricedItems = await Promise.all(
        items.map(async (item) => {
          const pricing = await calculateQuote(item);
          return {
            ...item,
            pricing,
          };
        })
      );

      quote.items = pricedItems;
      quote.totalPrice = pricedItems.reduce(
        (sum, item) => sum + parseFloat(item.pricing.breakdown.total),
        0
      );
    }

    if (notes !== undefined) quote.notes = notes;
    if (status) quote.status = status;
    quote.updatedAt = Date.now();

    await quote.save();

    res.json({
      success: true,
      message: 'Quote updated successfully',
      data: quote,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/quotes/:id
// @desc    Delete quote (soft delete by changing status)
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    // Soft delete by changing status
    quote.status = 'expired';
    await quote.save();

    res.json({
      success: true,
      message: 'Quote deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/quotes/:id/send
// @desc    Send quote via email
// @access  Private
router.post('/:id/send', async (req, res, next) => {
  try {
    const { email } = req.body;
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    // TODO: Implement email sending with nodemailer
    // For now, just update status
    quote.status = 'sent';
    await quote.save();

    res.json({
      success: true,
      message: `Quote ${quote.quoteNumber} sent to ${email}`,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/quotes/stats
// @desc    Get quote statistics
// @access  Private
router.get('/stats/summary', async (req, res, next) => {
  try {
    const stats = await Quote.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalPrice' },
        },
      },
    ]);

    const totalQuotes = await Quote.countDocuments();
    const avgQuoteValue = await Quote.aggregate([
      { $group: { _id: null, avg: { $avg: '$totalPrice' } } },
    ]);

    res.json({
      success: true,
      data: {
        totalQuotes,
        averageQuoteValue: avgQuoteValue[0]?.avg || 0,
        byStatus: stats,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
