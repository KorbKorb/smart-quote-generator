const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const { calculateQuote, parseDXF } = require('../utils/quoteCalculator');
const pdfGenerator = require('../utils/pdfGenerator');
const emailService = require('../utils/emailService');
const multer = require('multer');
const path = require('path');
const { validate, quoteValidators, fileValidators } = require('../middleware/validators');
const logger = require('../utils/logger');

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

// Get available materials
router.get('/materials', (req, res) => {
  const materials = [
    { id: 1, name: 'Cold Rolled Steel', pricePerPound: 0.85 },
    { id: 2, name: 'Stainless Steel 304', pricePerPound: 2.5 },
    { id: 3, name: 'Stainless Steel 316', pricePerPound: 3.2 },
    { id: 4, name: 'Aluminum 6061', pricePerPound: 1.8 },
  ];
  res.json(materials);
});

// Analyze DXF file
router.post('/analyze-dxf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const dxfData = await parseDXF(req.file.path);
    
    // Clean up uploaded file after parsing
    const fs = require('fs').promises;
    await fs.unlink(req.file.path);
    
    res.json({
      success: true,
      data: dxfData,
      filename: req.file.originalname
    });
  } catch (error) {
    console.error('Error analyzing DXF:', error);
    
    // Clean up file on error
    if (req.file && req.file.path) {
      const fs = require('fs').promises;
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({ 
      error: 'Failed to analyze DXF file',
      message: error.message 
    });
  }
});

// Calculate quote (for preview)
router.post('/calculate', quoteValidators.calculateQuote, validate, async (req, res) => {
  try {
    // Handle both old format (items array) and new format (direct quote data)
    const { items, ...directQuoteData } = req.body;

    // If items array is provided (old format)
    if (items && Array.isArray(items) && items.length > 0) {
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
        return sum + parseFloat(item.pricing.costs.total || 0);
      }, 0);

      res.json({
        items: calculatedItems,
        totalPrice: totalPrice.toFixed(2),
        calculated: true,
      });
    } 
    // New format - direct quote calculation
    else if (directQuoteData.material) {
      // Material mapping for the new format
      const materialMap = {
        'cold-rolled-steel': 'Cold Rolled Steel',
        'stainless-304': 'Stainless Steel 304',
        'stainless-316': 'Stainless Steel 316',
        'aluminum-6061': 'Aluminum 6061'
      };

      // Convert material name if needed
      const mappedMaterial = materialMap[directQuoteData.material] || directQuoteData.material;

      // Calculate the quote
      const quoteData = {
        ...directQuoteData,
        material: mappedMaterial,
        files: directQuoteData.dxfData ? [{ name: 'uploaded.dxf' }] : []
      };

      const pricing = calculateQuote(quoteData);

      // Format response to match frontend expectations
      const response = {
        // Include both new and old format for compatibility
        costs: pricing.costs,
        details: pricing.details,
        quote: {
          pricing: {
            subtotal: pricing.costs.subtotal,
            urgencyMultiplier: directQuoteData.urgency === 'emergency' ? 1.5 : 
                              directQuoteData.urgency === 'rush' ? 1.25 : 1.0,
            quantity: directQuoteData.quantity,
            total: pricing.costs.total,
            perUnit: (parseFloat(pricing.costs.total) / directQuoteData.quantity).toFixed(2)
          },
          breakdown: {
            material: {
              cost: pricing.costs.materialCost,
              weight: pricing.details.weightPounds,
              pricePerPound: pricing.details.pricePerPound
            },
            operations: {
              cutting: {
                cost: pricing.costs.cuttingCost,
                length: pricing.details.cutLengthPerPart,
                rate: 0.10
              },
              piercing: {
                cost: pricing.costs.pierceCost,
                count: pricing.details.holeCount,
                rate: 0.50
              },
              bending: {
                cost: pricing.costs.bendCost,
                count: pricing.details.bendCount,
                rate: 5.00
              }
            },
            finishing: {
              cost: pricing.costs.finishCost,
              area: pricing.details.totalAreaSqFt,
              rate: directQuoteData.finishType === 'powder-coat' ? 3.50 :
                    directQuoteData.finishType === 'anodize' ? 4.00 :
                    directQuoteData.finishType === 'zinc-plate' ? 2.50 : 0,
              type: directQuoteData.finishType
            }
          },
          measurements: {
            source: pricing.details.measurementSource,
            area: pricing.details.totalAreaSqFt,
            cutLength: pricing.details.cutLengthPerPart,
            holes: pricing.details.holeCount,
            bends: pricing.details.bendCount,
            complexity: pricing.details.complexity,
            cuttingComplexity: pricing.details.cuttingComplexity
          },
          parameters: directQuoteData,
          previewData: directQuoteData.dxfData?.previewData
        }
      };

      res.json(response);
    } else {
      return res
        .status(400)
        .json({ error: 'No quote data provided for calculation' });
    }
  } catch (error) {
    console.error('Error calculating quote:', error);
    res.status(500).json({ error: 'Failed to calculate quote: ' + error.message });
  }
});

// Create a new quote
router.post('/', quoteValidators.createQuote, validate, async (req, res) => {
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
      return sum + parseFloat(item.pricing?.costs?.total || 0);
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

// Get all quotes with advanced filtering
router.get('/', quoteValidators.getQuotes, validate, async (req, res) => {
  try {
    const { 
      status, 
      customerId, 
      startDate, 
      endDate, 
      minPrice, 
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 100 
    } = req.query;
    
    const filter = {};

    // Status filter
    if (status) filter.status = status;
    
    // Customer filter
    if (customerId) filter['customer.id'] = customerId;
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.totalPrice = {};
      if (minPrice) filter.totalPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.totalPrice.$lte = parseFloat(maxPrice);
    }
    
    // Search filter (customer name, company, or quote ID)
    if (search) {
      filter.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.company': { $regex: search, $options: 'i' } },
        { '_id': { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const quotes = await Quote.find(filter)
      .sort(sortOptions)
      .limit(parseInt(limit));

    res.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// Get a single quote by ID
router.get('/:id', quoteValidators.quoteId, validate, async (req, res) => {
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
router.patch('/:id/status', quoteValidators.updateQuoteStatus, validate, async (req, res) => {
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

// Generate PDF for a quote
router.get('/:id/pdf', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Generate PDF
    const { filename, buffer } = await pdfGenerator.generateQuotePDF(quote);
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    // Send PDF buffer
    res.send(buffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Generate and save PDF for a quote
router.post('/:id/generate-pdf', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Generate and save PDF
    const { filename, filepath } = await pdfGenerator.generateQuotePDF(quote);
    
    // Update quote with PDF info
    quote.pdfFile = filename;
    quote.pdfGeneratedAt = new Date();
    await quote.save();
    
    res.json({ 
      success: true,
      filename,
      message: 'PDF generated successfully'
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Send quote via email
router.post('/:id/send-email', async (req, res) => {
  try {
    const { recipientEmail } = req.body;
    const quote = await Quote.findById(req.params.id);
    
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Generate PDF first
    const { filepath } = await pdfGenerator.generateQuotePDF(quote);
    
    // Send email with PDF attachment
    await emailService.sendQuoteEmail(quote, filepath, recipientEmail);
    
    // Update quote with email information
    quote.emailSentAt = new Date();
    quote.emailSentTo = recipientEmail || quote.customer.email;
    quote.emailStatus = 'sent';
    
    // Update quote status to 'sent' if it's still a draft
    if (quote.status === 'draft') {
      quote.status = 'sent';
      quote.sentAt = new Date();
    }
    
    await quote.save();
    
    res.json({ 
      success: true,
      message: 'Quote sent successfully',
      recipientEmail: recipientEmail || quote.customer.email
    });
  } catch (error) {
    console.error('Error sending quote email:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      message: error.message 
    });
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
