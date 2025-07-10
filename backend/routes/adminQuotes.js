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
    // Support both old format (items array) and new format (direct quote data)
    const { items, ...directQuoteData } = req.body;

    // Handle new format (direct quote parameters)
    if (directQuoteData.material && directQuoteData.thickness && directQuoteData.quantity) {
      // Material name mapping
      const materialMap = {
        'cold-rolled-steel': 'Cold Rolled Steel',
        'stainless-304': 'Stainless Steel 304',
        'stainless-316': 'Stainless Steel 316',
        'aluminum-6061': 'Aluminum 6061'
      };

      // Convert to items array format for processing
      const item = {
        material: materialMap[directQuoteData.material] || directQuoteData.material,
        thickness: directQuoteData.thickness,
        quantity: directQuoteData.quantity,
        finishType: directQuoteData.finishType || 'none',
        urgency: directQuoteData.urgency || 'standard',
        bendComplexity: directQuoteData.bendComplexity || 'simple',
        dxfData: directQuoteData.dxfData
      };

      // If manual dimensions provided
      if (directQuoteData.manualLength && directQuoteData.manualWidth) {
        item.dxfData = {
          area: directQuoteData.manualLength * directQuoteData.manualWidth,
          cutLength: 2 * (directQuoteData.manualLength + directQuoteData.manualWidth),
          holeCount: directQuoteData.manualHoles || 0,
          bendLines: Array(directQuoteData.manualBends || 0).fill({}),
          complexity: 'simple'
        };
      }

      req.body.items = [item];
    }

    // Now process as items array
    const { items: itemsToProcess } = req.body;

    if (!itemsToProcess || !Array.isArray(itemsToProcess) || itemsToProcess.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items provided for calculation',
      });
    }

    // Process each item and calculate detailed pricing
    const processedItems = itemsToProcess.map(item => {
      // Base calculations
      const thickness = parseFloat(item.thickness) || 0.125;
      const quantity = parseInt(item.quantity) || 1;
      
      // Material pricing (simplified - in production, get from database)
      const materialPrices = {
        'Cold Rolled Steel': 0.85,
        'Stainless Steel 304': 2.5,
        'Stainless Steel 316': 3.2,
        'Aluminum 6061': 1.8,
      };
      
      const pricePerPound = materialPrices[item.material] || 1.0;
      
      // Calculate based on DXF data if available, otherwise use estimates
      let area, cutLength, holeCount, bendCount;
      
      if (item.dxfData) {
        // Use actual DXF measurements
        area = item.dxfData.area || 100;
        cutLength = item.dxfData.cutLength || 50;
        holeCount = item.dxfData.holeCount || 0;
        bendCount = (item.dxfData.bendLines && item.dxfData.bendLines.length) || 0;
      } else {
        // Use estimates
        area = 100; // sq inches
        cutLength = 50; // inches
        holeCount = 0;
        bendCount = item.bendComplexity === 'simple' ? 0 : item.bendComplexity === 'moderate' ? 3 : 6;
      }
      
      // Convert area to sq ft
      const areaSqFt = area / 144;
      
      // Calculate weight (assuming steel density ~0.2836 lb/in³)
      const volume = area * thickness;
      const weight = volume * 0.2836;
      
      // Calculate costs
      const materialCost = weight * pricePerPound * quantity;
      const cuttingCost = (cutLength * 0.10) * quantity; // $0.10 per inch
      const pierceCost = (holeCount * 0.50) * quantity; // $0.50 per hole
      const bendCost = (bendCount * 5.00) * quantity; // $5.00 per bend
      
      // Finish cost
      const finishRates = {
        'none': 0,
        'powder-coat': 3.50,
        'anodized': 5.00,
        'painted': 2.50,
        'polished': 4.00,
      };
      const finishRate = finishRates[item.finishType] || 0;
      const finishCost = (areaSqFt * finishRate) * quantity;
      
      // Rush fee
      const rushMultipliers = {
        'standard': 1.0,
        'rush': 1.25,
        'emergency': 1.50,
      };
      const rushMultiplier = rushMultipliers[item.urgency] || 1.0;
      
      const subtotal = materialCost + cuttingCost + pierceCost + bendCost + finishCost;
      const total = subtotal * rushMultiplier;
      const rushFee = total - subtotal;
      
      return {
        partName: item.partName,
        quantity: quantity,
        pricing: {
          costs: {
            materialCost: materialCost.toFixed(2),
            cuttingCost: cuttingCost.toFixed(2),
            pierceCost: pierceCost.toFixed(2),
            bendCost: bendCost.toFixed(2),
            finishCost: finishCost.toFixed(2),
            rushFee: rushFee.toFixed(2),
            total: total.toFixed(2),
          },
          details: {
            quantity: quantity,
            areaPerPart: area.toFixed(2),
            totalAreaSqFt: (areaSqFt * quantity).toFixed(2),
            cutLengthPerPart: cutLength.toFixed(2),
            weightPounds: (weight * quantity).toFixed(2),
            holeCount: holeCount,
            bendCount: bendCount,
            complexity: item.dxfData?.complexity || 'estimated',
            measurementSource: item.dxfData ? 'measured' : 'estimated',
            warnings: item.dxfData?.warnings || [],
            pricePerPound: pricePerPound,
          },
        },
      };
    });

    // Calculate totals
    const subtotal = processedItems.reduce((sum, item) => 
      sum + parseFloat(item.pricing.costs.total), 0
    );
    const taxRate = 0.08;
    const tax = subtotal * taxRate;
    const totalPrice = subtotal + tax;

    // Return different format based on input format
    if (directQuoteData.material && !items) {
      // New format response
      const item = processedItems[0];
      res.json({
        quote: {
          pricing: {
            subtotal: subtotal.toFixed(2),
            urgencyMultiplier: directQuoteData.urgency === 'emergency' ? 1.5 : 
                              directQuoteData.urgency === 'rush' ? 1.25 : 1.0,
            quantity: directQuoteData.quantity,
            total: item.pricing.costs.total,
            perUnit: (parseFloat(item.pricing.costs.total) / directQuoteData.quantity).toFixed(2)
          },
          breakdown: {
            material: {
              cost: item.pricing.costs.materialCost,
              weight: item.pricing.details.weightPounds,
              pricePerPound: item.pricing.details.pricePerPound || 1.0
            },
            operations: {
              cutting: {
                cost: item.pricing.costs.cuttingCost,
                length: item.pricing.details.cutLengthPerPart,
                rate: 0.10
              },
              piercing: {
                cost: item.pricing.costs.pierceCost,
                count: item.pricing.details.holeCount,
                rate: 0.50
              },
              bending: {
                cost: item.pricing.costs.bendCost,
                count: item.pricing.details.bendCount,
                rate: 5.00
              }
            },
            finishing: {
              cost: item.pricing.costs.finishCost,
              area: item.pricing.details.totalAreaSqFt,
              rate: directQuoteData.finishType === 'powder-coat' ? 3.50 :
                    directQuoteData.finishType === 'anodize' ? 4.00 :
                    directQuoteData.finishType === 'zinc-plate' ? 2.50 : 0,
              type: directQuoteData.finishType
            }
          },
          measurements: {
            source: item.pricing.details.measurementSource,
            area: item.pricing.details.totalAreaSqFt,
            cutLength: item.pricing.details.cutLengthPerPart,
            holes: item.pricing.details.holeCount,
            bends: item.pricing.details.bendCount,
            complexity: item.pricing.details.complexity
          },
          parameters: directQuoteData
        }
      });
    } else {
      // Old format response
      res.json({
        success: true,
        items: processedItems,
        summary: {
          subtotal,
          tax,
          totalPrice,
          taxRate,
        },
      });
    }
  } catch (error) {
    console.error('Calculate quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate quote',
      error: error.message,
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