const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const calculateQuote = require('../utils/quoteCalculator');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [
      '.dxf',
      '.dwg',
      '.step',
      '.stp',
      '.iges',
      '.igs',
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file type. Only DXF, DWG, STEP, and IGES files are allowed.'
        )
      );
    }
  },
});

// Calculate quote (for preview)
router.post('/calculate', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: 'No items provided for calculation' });
    }

    // Calculate pricing for each item
    const calculatedItems = items.map((item) => {
      const pricing = calculateQuote(item);
      return {
        ...item,
        pricing,
      };
    });

    // Calculate totals
    const totalPrice = calculatedItems.reduce((sum, item) => {
      return sum + (item.pricing.costs.total || 0);
    }, 0);

    res.json({
      items: calculatedItems,
      totalPrice,
      calculated: true,
    });
  } catch (error) {
    console.error('Error calculating quote:', error);
    res.status(500).json({ error: 'Failed to calculate quote' });
  }
});

// Create a new quote
router.post('/', async (req, res) => {
  try {
    const { customer, items, notes, dueDate } = req.body;

    if (!customer || !items || items.length === 0) {
      return res
        .status(400)
        .json({ error: 'Customer information and items are required' });
    }

    // Calculate pricing for each item if not already calculated
    const processedItems = items.map((item) => {
      if (!item.pricing) {
        const pricing = calculateQuote(item);
        return { ...item, pricing };
      }
      return item;
    });

    // Calculate total price from the costs.total field (matching calculator structure)
    const totalPrice = processedItems.reduce((sum, item) => {
      return sum + (item.pricing?.costs?.total || 0);
    }, 0);

    // Create the quote
    const quote = new Quote({
      customer,
      items: processedItems,
      totalPrice,
      notes,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      status: 'draft',
    });

    const savedQuote = await quote.save();
    res.status(201).json(savedQuote);
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

// Get all quotes
router.get('/', async (req, res) => {
  try {
    const { status, customerId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (customerId) filter['customer.id'] = customerId;

    const quotes = await Quote.find(filter).sort({ createdAt: -1 }).limit(100);

    res.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// Get a single quote by ID
router.get('/:id', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// Update quote status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json(quote);
  } catch (error) {
    console.error('Error updating quote status:', error);
    res.status(500).json({ error: 'Failed to update quote status' });
  }
});

// Delete a quote
router.delete('/:id', async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
});

// Upload files for a quote
router.post('/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const fileInfo = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      path: file.path,
    }));

    res.json({ files: fileInfo });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

module.exports = router;
