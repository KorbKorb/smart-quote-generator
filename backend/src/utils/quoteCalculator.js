// backend/src/utils/quoteCalculator.js

const dxfParser = require('./dxfParser');

const calculateQuote = (quoteData) => {
  // Material properties (price per pound, density in lbs/cubic inch)
  const materials = {
    'Stainless Steel 304': { pricePerPound: 2.5, density: 0.289 },
    'Stainless Steel 316': { pricePerPound: 3.2, density: 0.289 },
    'Aluminum 6061': { pricePerPound: 1.8, density: 0.098 },
    'Cold Rolled Steel': { pricePerPound: 0.85, density: 0.284 }
  };

  // Get material properties
  const material = materials[quoteData.material];
  if (!material) {
    throw new Error('Invalid material selected');
  }

  // Parse inputs
  const thickness = parseFloat(quoteData.thickness);
  const quantity = parseInt(quoteData.quantity);

  // Initialize calculation variables
  let areaPerPart, perimeterPerPart, cutLengthPerPart, holeCount, bendCount, complexity;
  let measurementSource = 'estimated';
  let warnings = [];

  // Use DXF data if available
  if (quoteData.dxfData) {
    areaPerPart = quoteData.dxfData.area;
    perimeterPerPart = quoteData.dxfData.perimeter;
    cutLengthPerPart = quoteData.dxfData.cutLength;
    holeCount = quoteData.dxfData.holeCount || 0;
    bendCount = quoteData.dxfData.bendLines ? quoteData.dxfData.bendLines.length : 0;
    complexity = quoteData.dxfData.complexity || 'simple';
    warnings = quoteData.dxfData.warnings || [];
    measurementSource = 'measured';
  } else {
    // Fall back to estimates
    const filesCount = quoteData.files ? quoteData.files.length : 1;
    areaPerPart = 144 * filesCount; // 144 sq in per file
    perimeterPerPart = Math.sqrt(areaPerPart) * 4 * 1.5; // Estimate with complexity factor
    cutLengthPerPart = perimeterPerPart;
    holeCount = 0;
    bendCount = 0;
    complexity = quoteData.bendComplexity || 'simple';
  }

  // Calculate total area
  const totalArea = areaPerPart * quantity;

  // Calculate weight
  const volumeCubicInches = totalArea * thickness;
  const weightPounds = volumeCubicInches * material.density;

  // Base material cost
  const materialCost = weightPounds * material.pricePerPound;

  // Cutting cost (setup + per inch)
  const setupCost = 25;
  const totalCutLength = cutLengthPerPart * quantity;
  
  // Cutting rate varies by material and thickness
  let cuttingRate = 0.25; // base rate per inch
  if (thickness > 0.25) cuttingRate *= 1.5;
  if (thickness > 0.5) cuttingRate *= 2;
  if (quoteData.material.includes('Stainless')) cuttingRate *= 1.2;
  
  const cuttingCost = setupCost + (totalCutLength * cuttingRate);

  // Pierce cost for holes
  const pierceCost = holeCount * quantity * 0.50; // $0.50 per hole

  // Bend cost - now based on actual bend count
  let bendCost = 0;
  if (bendCount > 0) {
    const bendSetupCost = 15;
    const costPerBend = 2.50;
    bendCost = bendSetupCost + (bendCount * costPerBend * quantity);
  } else {
    // Fall back to complexity-based bend cost if no DXF data
    const bendCosts = {
      'simple': 0,
      'moderate': 15 * quantity,
      'complex': 30 * quantity
    };
    bendCost = bendCosts[quoteData.bendComplexity] || 0;
  }

  // Finish cost (per sq ft)
  const sqFeet = totalArea / 144;
  const finishRates = {
    'none': 0,
    'powder-coat': 3.50,
    'anodized': 4.25,
    'painted': 2.75,
    'polished': 5.00
  };
  const finishCost = sqFeet * (finishRates[quoteData.finishType] || 0);

  // Tolerance multiplier
  const toleranceMultipliers = {
    'standard': 1.0,
    'precision': 1.25,
    'tight': 1.5
  };
  const toleranceMultiplier = toleranceMultipliers[quoteData.toleranceLevel] || 1.0;

  // Complexity multiplier (only when using DXF data)
  let complexityMultiplier = 1.0;
  if (measurementSource === 'measured') {
    const complexityMultipliers = {
      'simple': 1.0,
      'moderate': 1.15,
      'complex': 1.35
    };
    complexityMultiplier = complexityMultipliers[complexity] || 1.0;
  }

  // Calculate subtotal
  const baseCost = (materialCost + cuttingCost + pierceCost + bendCost) * toleranceMultiplier * complexityMultiplier;
  const subtotal = baseCost + finishCost;

  // Rush fee
  const rushMultipliers = {
    'standard': 0,
    'rush': 0.25,
    'emergency': 0.50
  };
  const rushFee = subtotal * (rushMultipliers[quoteData.urgency] || 0);

  // Final total with margin
  const total = (subtotal + rushFee) * 1.20; // 20% profit margin

  return {
    costs: {
      materialCost: materialCost.toFixed(2),
      cuttingCost: cuttingCost.toFixed(2),
      pierceCost: pierceCost.toFixed(2),
      bendCost: bendCost.toFixed(2),
      finishCost: finishCost.toFixed(2),
      rushFee: rushFee.toFixed(2),
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2)
    },
    details: {
      weightPounds: weightPounds.toFixed(2),
      totalAreaSqIn: totalArea.toFixed(2),
      totalAreaSqFt: (totalArea / 144).toFixed(2),
      areaPerPart: areaPerPart.toFixed(2),
      cutLengthPerPart: cutLengthPerPart.toFixed(2),
      totalCutLength: totalCutLength.toFixed(2),
      holeCount: holeCount,
      bendCount: bendCount,
      complexity: complexity,
      pricePerPound: material.pricePerPound,
      quantity: quantity,
      measurementSource: measurementSource,
      warnings: warnings
    }
  };
};

// Export both the main function and a utility to parse DXF files
module.exports = { 
  calculateQuote,
  parseDXF: async (filePath) => {
    return await dxfParser.parse(filePath);
  }
};
