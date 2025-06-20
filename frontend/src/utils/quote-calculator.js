// backend/src/routes/quotes.js
const express = require('express');
const router = express.Router();
const { calculateQuote } = require('../utils/quoteCalculator');

// In-memory storage
let quotes = [];
let quoteIdCounter = 1;

// GET all quotes
router.get('/', (req, res) => {
  res.json({
    success: true,
    count: quotes.length,
    data: quotes
  });
});

// POST create new quote
router.post('/', (req, res) => {
  try {
    // Calculate pricing
    const pricing = calculateQuote(req.body);
    
    // Create quote object
    const newQuote = {
      id: `Q-${new Date().getFullYear()}-${String(quoteIdCounter++).padStart(4, '0')}`,
      ...req.body,
      ...pricing.costs,
      details: pricing.details,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    // Save to memory
    quotes.push(newQuote);
    
    // Return the created quote
    res.status(201).json({
      success: true,
      data: newQuote
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET single quote by ID
router.get('/:id', (req, res) => {
  const quote = quotes.find(q => q.id === req.params.id);
  
  if (!quote) {
    return res.status(404).json({
      success: false,
      error: 'Quote not found'
    });
  }
  
  res.json({
    success: true,
    data: quote
  });
});

module.exports = router;