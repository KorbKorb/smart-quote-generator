// quote-calculator.js - Pricing logic for sheet metal quotes
// This can be added to your backend or used in frontend

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

  // Parse thickness (convert to decimal inches)
  const thickness = parseFloat(quoteData.thickness);
  const quantity = parseInt(quoteData.quantity);

  // Estimate sheet size (this would normally come from CAD file analysis)
  // For now, let's assume a standard sheet size based on uploaded file
  // In production, you'd parse the DXF/DWG file to get actual dimensions
  const estimatedAreaSquareInches = 144; // 12" x 12" = 1 sq ft for testing
  const estimatedAreaSquareFeet = estimatedAreaSquareInches / 144;

  // Calculate volume and weight
  const volumeCubicInches = estimatedAreaSquareInches * thickness * quantity;
  const weightPounds = volumeCubicInches * material.density;

  // Base material cost
  const baseMaterialCost = weightPounds * material.pricePerPound;

  // Cutting and processing cost
  // Base rate: $0.15-0.50 per linear inch of cut
  // Estimate perimeter + internal cuts
  const estimatedCutLength = Math.sqrt(estimatedAreaSquareInches) * 4 * 1.5; // perimeter + 50% for internal cuts
  const cuttingRate = 0.25; // $ per linear inch
  const cuttingCost = estimatedCutLength * cuttingRate * quantity;

  // Setup cost (one-time)
  const setupCost = 25; // flat setup fee

  // Bend complexity cost
  const bendCosts = {
    'simple': 0,
    'moderate': 15 * quantity,
    'complex': 30 * quantity
  };
  const bendingCost = bendCosts[quoteData.bendComplexity] || 0;

  // Finish cost
  const finishCosts = {
    'none': 0,
    'powder-coat': estimatedAreaSquareFeet * 3.50 * quantity, // $3.50 per sq ft
    'anodized': estimatedAreaSquareFeet * 4.25 * quantity,    // $4.25 per sq ft
    'painted': estimatedAreaSquareFeet * 2.75 * quantity,      // $2.75 per sq ft
    'polished': estimatedAreaSquareFeet * 5.00 * quantity      // $5.00 per sq ft
  };
  const finishCost = finishCosts[quoteData.finishType] || 0;

  // Tolerance cost multiplier
  const toleranceMultipliers = {
    'standard': 1.0,
    'precision': 1.25,
    'tight': 1.5
  };
  const toleranceMultiplier = toleranceMultipliers[quoteData.toleranceLevel] || 1.0;

  // Calculate subtotal with tolerance
  const subtotal = (baseMaterialCost + cuttingCost + setupCost + bendingCost) * toleranceMultiplier + finishCost;

  // Rush fees
  const rushFees = {
    'standard': 0,
    'rush': subtotal * 0.25,      // 25% rush fee
    'emergency': subtotal * 0.50   // 50% emergency fee
  };
  const rushFee = rushFees[quoteData.urgency] || 0;

  // Total cost
  const totalCost = subtotal + rushFee;

  // Profit margin (typically 15-30%)
  const profitMargin = 0.20;
  const finalPrice = totalCost * (1 + profitMargin);

  return {
    // Debug info
    debug: {
      estimatedAreaSqIn: estimatedAreaSquareInches,
      estimatedAreaSqFt: estimatedAreaSquareFeet,
      thickness: thickness,
      quantity: quantity,
      weightPounds: weightPounds.toFixed(2),
      cutLengthInches: estimatedCutLength.toFixed(2)
    },
    // Cost breakdown
    costs: {
      baseMaterialCost: baseMaterialCost.toFixed(2),
      cuttingCost: cuttingCost.toFixed(2),
      setupCost: setupCost.toFixed(2),
      bendingCost: bendingCost.toFixed(2),
      finishCost: finishCost.toFixed(2),
      rushFee: rushFee.toFixed(2),
      subtotal: subtotal.toFixed(2),
      totalCost: finalPrice.toFixed(2)
    }
  };
};

// Example usage:
const testQuote = {
  material: 'Stainless Steel 304',
  thickness: '0.125',  // 1/8 inch
  quantity: 10,
  finishType: 'powder-coat',
  bendComplexity: 'moderate',
  toleranceLevel: 'standard',
  urgency: 'rush'
};

console.log('Test Quote Calculation:', calculateQuote(testQuote));

module.exports = { calculateQuote };
