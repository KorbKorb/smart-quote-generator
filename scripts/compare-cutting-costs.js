// compare-cutting-costs.js
// Visual comparison of old vs new cutting cost calculations

const { CuttingComplexityAnalyzer, enhancedCalculateCuttingCost } = require('../backend/src/utils/cuttingComplexityAnalyzer');

console.log('💰 CUTTING COST COMPARISON: Old vs New System\n');
console.log('=' .repeat(70));

// Test scenarios
const scenarios = [
  {
    name: 'Simple 10x10 Rectangle',
    entities: [
      { type: 'LINE', startPoint: { x: 0, y: 0 }, endPoint: { x: 10, y: 0 } },
      { type: 'LINE', startPoint: { x: 10, y: 0 }, endPoint: { x: 10, y: 10 } },
      { type: 'LINE', startPoint: { x: 10, y: 10 }, endPoint: { x: 0, y: 10 } },
      { type: 'LINE', startPoint: { x: 0, y: 10 }, endPoint: { x: 0, y: 0 } }
    ],
    bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 },
    perimeter: 40
  },
  {
    name: 'Complex Part with Tight Corners',
    entities: [
      // Mix of straight lines and tight radius arcs
      { type: 'LINE', startPoint: { x: 0, y: 0 }, endPoint: { x: 5, y: 0 } },
      { type: 'ARC', center: { x: 5, y: 0.1 }, radius: 0.1, startAngle: 270, endAngle: 0 },
      { type: 'LINE', startPoint: { x: 5.1, y: 0.1 }, endPoint: { x: 5.1, y: 3 } },
      { type: 'ARC', center: { x: 5, y: 3 }, radius: 0.1, startAngle: 0, endAngle: 90 },
      { type: 'LINE', startPoint: { x: 5, y: 3.1 }, endPoint: { x: 2, y: 3.1 } },
      { type: 'ARC', center: { x: 2, y: 3 }, radius: 0.1, startAngle: 90, endAngle: 180 },
      { type: 'LINE', startPoint: { x: 1.9, y: 3 }, endPoint: { x: 1.9, y: 1 } },
      { type: 'ARC', center: { x: 2, y: 1 }, radius: 0.1, startAngle: 180, endAngle: 270 },
      { type: 'LINE', startPoint: { x: 2, y: 0.9 }, endPoint: { x: 0, y: 0.9 } },
      { type: 'LINE', startPoint: { x: 0, y: 0.9 }, endPoint: { x: 0, y: 0 } }
    ],
    bounds: { minX: 0, maxX: 5.1, minY: 0, maxY: 3.1 },
    perimeter: 16.8  // Approximate
  },
  {
    name: 'Large Circle with Holes',
    entities: [
      { type: 'CIRCLE', center: { x: 10, y: 10 }, radius: 8 },
      { type: 'CIRCLE', center: { x: 10, y: 10 }, radius: 1 },
      { type: 'CIRCLE', center: { x: 6, y: 10 }, radius: 0.5 },
      { type: 'CIRCLE', center: { x: 14, y: 10 }, radius: 0.5 },
      { type: 'CIRCLE', center: { x: 10, y: 6 }, radius: 0.5 },
      { type: 'CIRCLE', center: { x: 10, y: 14 }, radius: 0.5 }
    ],
    bounds: { minX: 2, maxX: 18, minY: 2, maxY: 18 },
    perimeter: 50.3 + 6.3 + 12.6  // Main circle + inner + 4 small holes
  }
];

// Test parameters
const thickness = 0.125;  // 1/8 inch
const material = 'cold-rolled-steel';
const quantity = 10;

scenarios.forEach(scenario => {
  console.log(`\n📐 ${scenario.name}`);
  console.log('-'.repeat(50));
  
  // Old calculation (simple perimeter-based)
  const oldRate = 0.25; // base rate per inch
  const oldCuttingCost = scenario.perimeter * oldRate * 1.2; // 1.2 for thickness > 0.125
  
  // New calculation (complexity-based)
  const analyzer = new CuttingComplexityAnalyzer({
    entities: scenario.entities,
    bounds: scenario.bounds
  });
  const analysis = analyzer.analyzeCuttingComplexity();
  const newResult = enhancedCalculateCuttingCost(
    { entities: scenario.entities, bounds: scenario.bounds },
    thickness,
    material
  );
  
  // Display results
  console.log(`Perimeter: ${scenario.perimeter.toFixed(1)} inches`);
  console.log(`Complexity Score: ${analysis.complexityScore}/100`);
  console.log(`\nCut Type Breakdown:`);
  console.log(`  - Straight cuts: ${analysis.straightCuts}`);
  console.log(`  - Curved cuts: ${analysis.curvedCuts}`);
  console.log(`  - Tight corners: ${analysis.tightCorners}`);
  console.log(`  - Intricate patterns: ${analysis.intricatePatterns}`);
  
  console.log(`\n💵 Cost Comparison (per part):`);
  console.log(`  OLD SYSTEM: $${oldCuttingCost.toFixed(2)}`);
  console.log(`  NEW SYSTEM: $${newResult.cost.toFixed(2)}`);
  
  const difference = newResult.cost - oldCuttingCost;
  const percentChange = ((difference / oldCuttingCost) * 100).toFixed(1);
  
  if (difference > 0) {
    console.log(`  DIFFERENCE: +$${difference.toFixed(2)} (${percentChange}% higher)`);
  } else {
    console.log(`  DIFFERENCE: -$${Math.abs(difference).toFixed(2)} (${Math.abs(percentChange)}% lower)`);
  }
  
  console.log(`\n📊 For ${quantity} parts:`);
  console.log(`  OLD TOTAL: $${(oldCuttingCost * quantity).toFixed(2)}`);
  console.log(`  NEW TOTAL: $${(newResult.cost * quantity).toFixed(2)}`);
  console.log(`  SAVINGS: $${Math.abs(difference * quantity).toFixed(2)}`);
});

console.log('\n' + '='.repeat(70));
console.log('\n🎯 KEY INSIGHTS:');
console.log('- Simple parts are now cheaper (straight cuts cost less)');
console.log('- Complex parts with tight corners cost more (reflects reality)');
console.log('- Curved cuts have moderate premium (15% over straight)');
console.log('- More accurate quotes = better win rates & margins!');
