// Realistic DXF Sample Generator for Sheet Metal Parts
const DXFGenerator = require('./dxf-generator');
const fs = require('fs');
const path = require('path');

// Create generator instance
const generator = new DXFGenerator();

// Define realistic part specifications
const partSpecifications = {
  'electrical-enclosure': {
    description: 'Standard NEMA electrical enclosure',
    material: 'Cold Rolled Steel',
    thickness: 0.0625, // 16 gauge
    expectedBends: 4,
    complexityFactors: ['multiple_cutouts', 'ventilation_pattern', 'mounting_holes']
  },
  'server-bracket': {
    description: '2U server mounting bracket',
    material: 'Cold Rolled Steel',
    thickness: 0.125, // 11 gauge
    expectedBends: 2,
    complexityFactors: ['slots', 'precise_spacing', 'standard_mounting']
  },
  'hvac-transition': {
    description: 'HVAC duct transition piece',
    material: 'Galvanized Steel',
    thickness: 0.05, // 18 gauge
    expectedBends: 8,
    complexityFactors: ['complex_geometry', 'multiple_bends', 'seam_allowance']
  },
  'automotive-shield': {
    description: 'Engine heat shield',
    material: 'Stainless Steel 304',
    thickness: 0.0625,
    expectedBends: 0,
    complexityFactors: ['organic_shape', 'embossed_areas', 'thermal_slots']
  },
  'control-panel': {
    description: 'Industrial control panel face',
    material: 'Aluminum 6061',
    thickness: 0.125,
    expectedBends: 0,
    complexityFactors: ['precision_cutouts', 'engraving_areas', 'multiple_hole_sizes']
  }
};

// Generate part variations
function generatePartVariations() {
  const outputDir = path.join(__dirname, 'realistic-samples');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate metadata file
  const metadata = {
    generatedDate: new Date().toISOString(),
    parts: []
  };

  Object.entries(partSpecifications).forEach(([partType, spec]) => {
    console.log(`Generating ${partType}...`);
    
    // Generate multiple variations
    for (let i = 1; i <= 3; i++) {
      const filename = `${partType}-v${i}.dxf`;
      const filepath = path.join(outputDir, filename);
      
      // Generate with variations
      let content;
      switch(partType) {
        case 'electrical-enclosure':
          content = generateEnclosureVariation(i);
          break;
        case 'server-bracket':
          content = generateBracketVariation(i);
          break;
        case 'hvac-transition':
          content = generateHVACVariation(i);
          break;
        case 'automotive-shield':
          content = generateShieldVariation(i);
          break;
        case 'control-panel':
          content = generatePanelVariation(i);
          break;
      }
      
      fs.writeFileSync(filepath, content);
      
      metadata.parts.push({
        filename,
        type: partType,
        variation: i,
        ...spec,
        estimatedArea: calculateEstimatedArea(partType, i),
        estimatedCutLength: calculateEstimatedCutLength(partType, i)
      });
    }
  });

  // Save metadata
  fs.writeFileSync(
    path.join(outputDir, 'part-specifications.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log('Generation complete! Check realistic-samples directory.');
}

// Variation generators (implement based on your needs)
function generateEnclosureVariation(version) {
  // Different sizes and hole patterns
  return generator.createEnclosurePanel(); // Modify based on version
}

function generateBracketVariation(version) {
  return generator.createBracket();
}

function generateHVACVariation(version) {
  // Complex transition pieces
  return generator.createChassisBase(); // Modify for HVAC
}

function generateShieldVariation(version) {
  return generator.createHeatShield();
}

function generatePanelVariation(version) {
  return generator.createRackPanel();
}

function calculateEstimatedArea(partType, version) {
  // Rough estimates for testing
  const baseAreas = {
    'electrical-enclosure': 96,
    'server-bracket': 32,
    'hvac-transition': 144,
    'automotive-shield': 77,
    'control-panel': 33.25
  };
  return baseAreas[partType] * (1 + version * 0.1);
}

function calculateEstimatedCutLength(partType, version) {
  // Rough estimates for testing
  const baseLengths = {
    'electrical-enclosure': 65,
    'server-bracket': 28,
    'hvac-transition': 85,
    'automotive-shield': 45,
    'control-panel': 42
  };
  return baseLengths[partType] * (1 + version * 0.15);
}

// Run generator
generatePartVariations();