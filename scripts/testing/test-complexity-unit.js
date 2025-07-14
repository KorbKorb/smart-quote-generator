// test-complexity-unit.js
// Unit tests for the Cutting Complexity Analyzer (no server required)

const { CuttingComplexityAnalyzer, enhancedCalculateCuttingCost } = require('../backend/src/utils/cuttingComplexityAnalyzer');

console.log('🧪 Cutting Complexity Analyzer Unit Tests\n');

// Test 1: Simple rectangle (should have low complexity)
console.log('=== Test 1: Simple Rectangle ===');
const simpleRect = {
  entities: [
    { type: 'LINE', startPoint: { x: 0, y: 0 }, endPoint: { x: 10, y: 0 } },
    { type: 'LINE', startPoint: { x: 10, y: 0 }, endPoint: { x: 10, y: 5 } },
    { type: 'LINE', startPoint: { x: 10, y: 5 }, endPoint: { x: 0, y: 5 } },
    { type: 'LINE', startPoint: { x: 0, y: 5 }, endPoint: { x: 0, y: 0 } }
  ],
  bounds: { minX: 0, maxX: 10, minY: 0, maxY: 5 }
};

const analyzer1 = new CuttingComplexityAnalyzer(simpleRect);
const result1 = analyzer1.analyzeCuttingComplexity();
console.log('Complexity Score:', result1.complexityScore);
console.log('Expected: 0-10 (very simple)');
console.log('Total Cut Length:', (10 + 5 + 10 + 5), 'inches');
console.log('Weighted Cutting Cost: $' + result1.weightedCuttingCost.toFixed(2));
console.log('✅ Pass:', result1.complexityScore < 20 ? 'Yes' : 'No');
console.log('');

// Test 2: Part with tight corners
console.log('=== Test 2: Part with Tight Corners ===');
const tightCornerPart = {
  entities: [
    { type: 'LINE', startPoint: { x: 0, y: 0 }, endPoint: { x: 5, y: 0 } },
    { type: 'ARC', center: { x: 5, y: 0.1 }, radius: 0.1, startAngle: 270, endAngle: 0 },
    { type: 'LINE', startPoint: { x: 5.1, y: 0.1 }, endPoint: { x: 5.1, y: 3 } },
    { type: 'ARC', center: { x: 5, y: 3 }, radius: 0.1, startAngle: 0, endAngle: 90 },
    { type: 'LINE', startPoint: { x: 5, y: 3.1 }, endPoint: { x: 0, y: 3.1 } },
    { type: 'ARC', center: { x: 0, y: 3 }, radius: 0.1, startAngle: 90, endAngle: 180 }
  ],
  bounds: { minX: 0, maxX: 5.1, minY: 0, maxY: 3.1 }
};

const analyzer2 = new CuttingComplexityAnalyzer(tightCornerPart);
const result2 = analyzer2.analyzeCuttingComplexity();
console.log('Complexity Score:', result2.complexityScore);
console.log('Tight Corners Found:', result2.tightCorners);
console.log('Recommendations:', result2.recommendations.length);
result2.recommendations.forEach(rec => {
  console.log(`  - [${rec.impact}] ${rec.message}`);
});
console.log('✅ Pass:', result2.tightCorners >= 3 ? 'Yes' : 'No');
console.log('');

// Test 3: Circle (all curves)
console.log('=== Test 3: Circle Part ===');
const circlePart = {
  entities: [
    { type: 'CIRCLE', center: { x: 5, y: 5 }, radius: 4 },
    { type: 'CIRCLE', center: { x: 5, y: 5 }, radius: 1 },  // Inner hole
    { type: 'CIRCLE', center: { x: 3, y: 3 }, radius: 0.5 },
    { type: 'CIRCLE', center: { x: 7, y: 3 }, radius: 0.5 }
  ],
  bounds: { minX: 1, maxX: 9, minY: 1, maxY: 9 }
};

const analyzer3 = new CuttingComplexityAnalyzer(circlePart);
const result3 = analyzer3.analyzeCuttingComplexity();
console.log('Complexity Score:', result3.complexityScore);
console.log('Curved Cuts:', result3.curvedCuts);
console.log('Expected: All curved cuts, moderate complexity');
console.log('✅ Pass:', result3.curvedCuts === 4 ? 'Yes' : 'No');
console.log('');

// Test 4: Complex part with spline
console.log('=== Test 4: Complex Part with Spline ===');
const complexPart = {
  entities: [
    { type: 'SPLINE', controlPoints: [
      { x: 0, y: 0 }, { x: 2, y: 3 }, { x: 4, y: 1 }, { x: 6, y: 4 }
    ]},
    { type: 'LINE', startPoint: { x: 6, y: 4 }, endPoint: { x: 0, y: 4 } },
    { type: 'LINE', startPoint: { x: 0, y: 4 }, endPoint: { x: 0, y: 0 } }
  ],
  bounds: { minX: 0, maxX: 6, minY: 0, maxY: 4 }
};

const analyzer4 = new CuttingComplexityAnalyzer(complexPart);
const result4 = analyzer4.analyzeCuttingComplexity();
console.log('Complexity Score:', result4.complexityScore);
console.log('Intricate Patterns:', result4.intricatePatterns);
console.log('Expected: High complexity due to spline');
console.log('✅ Pass:', result4.intricatePatterns > 0 ? 'Yes' : 'No');
console.log('');

// Test 5: Cost calculation with different materials
console.log('=== Test 5: Material Cost Multipliers ===');
const materials = [
  { name: 'aluminum-6061', expected: 0.8 },
  { name: 'cold-rolled-steel', expected: 1.0 },
  { name: 'stainless-steel-304', expected: 1.3 },
  { name: 'stainless-steel-316', expected: 1.4 }
];

console.log('Base part: Simple rectangle, 0.125" thick');
materials.forEach(mat => {
  const result = enhancedCalculateCuttingCost(simpleRect, 0.125, mat.name);
  console.log(`${mat.name}: $${result.cost.toFixed(2)} (multiplier: ${mat.expected}x)`);
});
console.log('');

// Test 6: Thickness multipliers
console.log('=== Test 6: Thickness Multipliers ===');
const thicknesses = [0.0625, 0.125, 0.25, 0.375, 0.5];
console.log('Material: Cold Rolled Steel');
thicknesses.forEach(thickness => {
  const result = enhancedCalculateCuttingCost(simpleRect, thickness, 'cold-rolled-steel');
  console.log(`${thickness}" thick: $${result.cost.toFixed(2)}`);
});

console.log('\n✅ All unit tests completed!');