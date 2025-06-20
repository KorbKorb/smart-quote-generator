// backend/src/utils/quoteCalculator.js

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

  // For now, estimate area from file count (in production, parse CAD files)
  const filesCount = quoteData.files ? quoteData.files.length : 1;
  const estimatedAreaPerPart = 144 * filesCount; // 144 sq in per file
  const totalArea = estimatedAreaPerPart * quantity;

  // Calculate weight
  const volumeCubicInches = totalArea * thickness;
  const weightPounds = volumeCubicInches * material.density;

  // Base material cost
  const materialCost = weightPounds * material.pricePerPound;

  // Cutting cost (setup + per inch)
  const setupCost = 25;
  const inchesOfCut = Math.sqrt(estimatedAreaPerPart) * 4 * 1.5 * quantity;
  const cuttingCost = setupCost + (inchesOfCut * 0.25);

  // Bend cost
  const bendCosts = {
    'simple': 0,
    'moderate': 15 * quantity,
    'complex': 30 * quantity
  };
  const bendCost = bendCosts[quoteData.bendComplexity] || 0;

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

  // Calculate subtotal
  const baseCost = (materialCost + cuttingCost + bendCost) * toleranceMultiplier;
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
      bendCost: bendCost.toFixed(2),
      finishCost: finishCost.toFixed(2),
      rushFee: rushFee.toFixed(2),
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2)
    },
    details: {
      weightPounds: weightPounds.toFixed(2),
      totalAreaSqIn: totalArea,
      totalAreaSqFt: (totalArea / 144).toFixed(2),
      pricePerPound: material.pricePerPound,
      quantity: quantity
    }
  };
};

module.exports = { calculateQuote };
