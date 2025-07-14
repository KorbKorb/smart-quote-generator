// test-full-flow.js
// Test the complete flow from DXF parsing to quote calculation with complexity

const path = require('path');
const { parseDXF, calculateQuote } = require('../backend/src/utils/quoteCalculator');
const { CuttingComplexityAnalyzer } = require('../backend/src/utils/cuttingComplexityAnalyzer');

async function testFullFlow() {
  console.log('🔄 Testing Complete Flow: DXF → Quote with Complexity Analysis\n');
  
  const testFiles = [
    'test-rectangle-10x10.dxf',
    'complex-bracket.dxf'
  ];
  
  for (const fileName of testFiles) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${fileName}`);
    console.log('='.repeat(60));
    
    const testFile = path.join(__dirname, '..', 'test-files', fileName);
    
    try {
      // Parse DXF
      const dxfData = await parseDXF(testFile);
      
      console.log('\n📐 DXF Parse Results:');
      console.log(`  Area: ${dxfData.area} sq in`);
      console.log(`  Perimeter: ${dxfData.perimeter} in`);
      console.log(`  Entities: ${dxfData.entities?.length || 0}`);
      console.log(`  Entity types: ${JSON.stringify(dxfData.entityCounts)}`);
      
      // Test complexity analyzer directly
      if (dxfData.entities && dxfData.entities.length > 0) {
        console.log('\n🔍 Direct Complexity Analysis:');
        const analyzer = new CuttingComplexityAnalyzer({
          entities: dxfData.entities,
          bounds: dxfData.bounds
        });
        
        const analysis = analyzer.analyzeCuttingComplexity();
        console.log(`  Complexity Score: ${analysis.complexityScore}/100`);
        console.log(`  Total Segments: ${analysis.segments.length}`);
        console.log(`  Weighted Cost: $${analysis.weightedCuttingCost.toFixed(2)}`);
        
        // Show segment breakdown
        const segmentTypes = analysis.segments.reduce((acc, seg) => {
          acc[seg.type] = (acc[seg.type] || 0) + 1;
          return acc;
        }, {});
        console.log(`  Segment Types:`, segmentTypes);
      }
      
      // Calculate quote
      console.log('\n💰 Quote Calculation:');
      const quoteData = {
        material: 'Cold Rolled Steel',
        thickness: 0.125,
        quantity: 10,
        finishType: 'none',
        toleranceLevel: 'standard',
        urgency: 'standard',
        bendComplexity: 'simple',
        dxfData: dxfData
      };
      
      // Temporarily disable console logging in quoteCalculator
      const originalLog = console.log;
      console.log = () => {};
      
      const result = calculateQuote(quoteData);
      
      // Restore console.log
      console.log = originalLog;
      
      console.log(`  Total Cost: $${result.costs.total}`);
      console.log(`  Material Cost: $${result.costs.materialCost}`);
      console.log(`  Cutting Cost: $${result.costs.cuttingCost}`);
      
      if (result.details.cuttingComplexity) {
        console.log('\n✅ Cutting Complexity in Quote:');
        console.log(`  Score: ${result.details.cuttingComplexity.score}`);
        console.log(`  Cut Types: Straight=${result.details.cuttingComplexity.straightCuts}, ` +
                    `Curved=${result.details.cuttingComplexity.curvedCuts}, ` +
                    `Tight=${result.details.cuttingComplexity.tightCorners}`);
        
        // Compare old vs new cutting cost
        const oldCuttingCost = 25 + (dxfData.cutLength * 10 * 0.25 * 1.2); // Old calculation
        const savings = oldCuttingCost - parseFloat(result.costs.cuttingCost);
        console.log(`\n💡 Cost Comparison:`);
        console.log(`  Old Method: $${oldCuttingCost.toFixed(2)}`);
        console.log(`  New Method: $${result.costs.cuttingCost}`);
        console.log(`  Difference: $${savings.toFixed(2)} (${(savings/oldCuttingCost*100).toFixed(1)}%)`);
      } else {
        console.log('\n❌ No cutting complexity analysis in quote!');
      }
      
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
  
  console.log('\n✅ Test completed!');
}

testFullFlow();