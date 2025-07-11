// Test script for Cutting Complexity Analyzer
// Run with: node scripts/test-cutting-complexity.js

const fs = require('fs');
const path = require('path');
const DXFParser = require('dxf-parser');
const { CuttingComplexityAnalyzer, enhancedCalculateCuttingCost } = require('../backend/src/utils/cuttingComplexityAnalyzer');

// Test with a real DXF file
async function testCuttingComplexity() {
  console.log('=== Testing Cutting Complexity Analyzer ===\n');

  // List available test files
  const testFilesDir = path.join(__dirname, '..', 'test-files');
  const dxfFiles = fs.readdirSync(testFilesDir).filter(f => f.endsWith('.dxf'));
  
  console.log('Available DXF files:', dxfFiles);

  // Test each file
  for (const fileName of dxfFiles) {
    console.log(`\n--- Testing ${fileName} ---`);
    
    try {
      // Read and parse DXF
      const filePath = path.join(testFilesDir, fileName);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const parser = new DXFParser();
      const dxfData = parser.parseSync(fileContent);

      // Add entities to match expected structure
      const processedData = {
        entities: dxfData.entities,
        bounds: {
          minX: Math.min(...dxfData.entities.map(e => e.startPoint?.x || e.center?.x || 0)),
          maxX: Math.max(...dxfData.entities.map(e => e.endPoint?.x || e.center?.x || 0)),
          minY: Math.min(...dxfData.entities.map(e => e.startPoint?.y || e.center?.y || 0)),
          maxY: Math.max(...dxfData.entities.map(e => e.endPoint?.y || e.center?.y || 0))
        }
      };

      // Analyze complexity
      const analyzer = new CuttingComplexityAnalyzer(processedData);
      const analysis = analyzer.analyzeCuttingComplexity();

      console.log('\nComplexity Analysis:');
      console.log(`  Total Cuts: ${analysis.totalCuts}`);
      console.log(`  Straight Cuts: ${analysis.straightCuts}`);
      console.log(`  Curved Cuts: ${analysis.curvedCuts}`);
      console.log(`  Tight Corners: ${analysis.tightCorners}`);
      console.log(`  Intricate Patterns: ${analysis.intricatePatterns}`);
      console.log(`  Complexity Score: ${analysis.complexityScore}/100`);
      console.log(`  Base Cutting Cost: $${analysis.weightedCuttingCost.toFixed(2)}`);

      // Test with different materials and thicknesses
      console.log('\nCost Variations:');
      const materials = ['cold-rolled-steel', 'stainless-steel-304', 'aluminum-6061'];
      const thicknesses = [0.0625, 0.125, 0.25];

      materials.forEach(material => {
        console.log(`\n  ${material}:`);
        thicknesses.forEach(thickness => {
          const result = enhancedCalculateCuttingCost(processedData, thickness, material);
          console.log(`    ${thickness}" thick: $${result.cost.toFixed(2)}`);
        });
      });

      // Show recommendations
      if (analysis.recommendations.length > 0) {
        console.log('\nRecommendations:');
        analysis.recommendations.forEach(rec => {
          console.log(`  [${rec.impact.toUpperCase()}] ${rec.message}`);
        });
      }

    } catch (error) {
      console.error(`Error processing ${fileName}:`, error.message);
    }
  }

  // Test with synthetic complex part
  console.log('\n--- Testing Synthetic Complex Part ---');
  testSyntheticPart();
}

function testSyntheticPart() {
  // Create a synthetic part with various complexity features
  const syntheticData = {
    entities: [
      // Straight lines
      { type: 'LINE', startPoint: { x: 0, y: 0 }, endPoint: { x: 10, y: 0 } },
      { type: 'LINE', startPoint: { x: 10, y: 0 }, endPoint: { x: 10, y: 10 } },
      
      // Large radius arc
      { type: 'ARC', center: { x: 5, y: 5 }, radius: 5, startAngle: 0, endAngle: 90 },
      
      // Tight radius arc
      { type: 'ARC', center: { x: 2, y: 2 }, radius: 0.125, startAngle: 0, endAngle: 180 },
      
      // Multiple tight corners
      ...Array(10).fill(null).map((_, i) => ({
        type: 'ARC',
        center: { x: i * 0.5, y: 8 },
        radius: 0.1,
        startAngle: 0,
        endAngle: 90
      })),
      
      // Spline
      {
        type: 'SPLINE',
        controlPoints: [
          { x: 0, y: 5 },
          { x: 2, y: 7 },
          { x: 4, y: 6 },
          { x: 6, y: 8 }
        ]
      }
    ],
    bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 }
  };

  const analyzer = new CuttingComplexityAnalyzer(syntheticData);
  const analysis = analyzer.analyzeCuttingComplexity();

  console.log('\nSynthetic Part Analysis:');
  console.log(`  Complexity Score: ${analysis.complexityScore}/100`);
  console.log(`  Should trigger "many tight corners" recommendation`);
  console.log('\nRecommendations:');
  analysis.recommendations.forEach(rec => {
    console.log(`  [${rec.impact.toUpperCase()}] ${rec.message}`);
  });
}

// Run the test
testCuttingComplexity().catch(console.error);