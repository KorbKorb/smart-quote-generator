const express = require('express');
const router = express.Router();

// @route   GET /api/materials
// @desc    Get all materials
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    // TODO: Fetch from database
    const materials = [
      {
        id: '1',
        name: 'Stainless Steel 304',
        category: 'Stainless Steel',
        pricePerPound: 2.50,
        density: 0.289, // lbs/in³
        available: true
      },
      {
        id: '2',
        name: 'Stainless Steel 316',
        category: 'Stainless Steel',
        pricePerPound: 3.20,
        density: 0.289,
        available: true
      },
      {
        id: '3',
        name: 'Aluminum 6061',
        category: 'Aluminum',
        pricePerPound: 1.80,
        density: 0.098,
        available: true
      },
      {
        id: '4',
        name: 'Cold Rolled Steel',
        category: 'Steel',
        pricePerPound: 0.85,
        density: 0.284,
        available: true
      }
    ];
    
    res.json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/materials/:id
// @desc    Get single material
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // TODO: Fetch from database
    res.json({
      success: true,
      data: {
        id,
        name: 'Material Name',
        category: 'Category',
        pricePerPound: 0,
        density: 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/materials
// @desc    Create new material
// @access  Private (Admin only)
router.post('/', async (req, res, next) => {
  try {
    const materialData = req.body;
    
    // TODO: Validate and save to database
    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: {
        id: 'new-id',
        ...materialData
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/materials/:id
// @desc    Update material
// @access  Private (Admin only)
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // TODO: Update in database
    res.json({
      success: true,
      message: 'Material updated successfully',
      data: {
        id,
        ...updates
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/materials/:id
// @desc    Delete material
// @access  Private (Admin only)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // TODO: Delete from database
    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/materials/categories
// @desc    Get material categories
// @access  Public
router.get('/categories/list', async (req, res, next) => {
  try {
    const categories = [
      'Stainless Steel',
      'Aluminum',
      'Steel',
      'Copper',
      'Brass',
      'Galvanized Steel'
    ];
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;