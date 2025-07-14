// test-integration.js
// Test the full integration from DXF parsing to cutting complexity

const path = require('path');
const { parseDXF, calculateQuote } = require('../backend/src/utils/quoteCalculator');

async function testIntegration() {
  console.log('🧪 Testing Full Integration: DXF → Parser → Complexity Analyzer → Quote\n');
  
  const testFile = path.join(__dirname, '..', 'test-files', 'test-rectangle-10x10.dxf');
  
  try {
    // Step 1: Parse DXF
    console.log('Step 1: Parsing DXF file...');
    const dxfData = await parseDXF(testFile);
    
    console.log('\nParsed DXF Data:');
    console.log('- Area:', dxfData.area, 'sq in');
    console.log('- Perimeter:', dxfData.perimeter, 'in');
    console.log('- Cut Length:', dxfData.cutLength, 'in');
    console.log('- Entities:', dxfData.entities?.length || 0);
    console.log('- Entity Counts:', JSON.stringify(dxfData.entityCounts));
    console.log('- Bounds:', JSON.stringify(dxfData.bounds));
    
    // Step 2: Calculate quote with DXF data
    console.log('\nStep 2: Calculating quote...');
    const quoteData = {
      material: 'Cold Rolled Steel',
      thickness: 0.125,
      quantity: 1,
      finishType: 'none',
      toleranceLevel: 'standard',
      urgency: 'standard',
      bendComplexity: 'simple',
      dxfData: dxfData
    };
    
    const result = calculateQuote(quoteData);
    
    console.log('\nQuote Results:');
    console.log('- Total Cost: $' + result.costs.total);
    console.log('- Material Cost: $' + result.costs.materialCost);
    console.log('- Cutting Cost: $' + result.costs.cuttingCost);
    
    if (result.details.cuttingComplexity) {
      console.log('\n✅ Cutting Complexity Analysis:');
      console.log('- Complexity Score:', result.details.cuttingComplexity.score);
      console.log('- Straight Cuts:', result.details.cuttingComplexity.straightCuts);
      console.log('- Curved Cuts:', result.details.cuttingComplexity.curvedCuts);
      console.log('- Recommendations:', result.details.cuttingComplexity.recommendations.length);
    } else {
      console.log('\n❌ No cutting complexity analysis found!');
      console.log('   Using simple calculation instead.');
    }
    
    // Step 3: Test with mock entities to verify complexity analyzer works
    console.log('\n\nStep 3: Testing with mock entities...');
    const mockDxfData = {
      ...dxfData,
      entities: [
        { type: 'LINE', startPoint: { x: 0, y: 0 }, endPoint: { x: 10, y: 0 } },
        { type: 'LINE', startPoint: { x: 10, y: 0 }, endPoint: { x: 10, y: 10 } },
        { type: 'LINE', startPoint: { x: 10, y: 10 }, endPoint: { x: 0, y: 10 } },
        { type: 'LINE', startPoint: { x: 0, y: 10 }, endPoint: { x: 0, y: 0 } }
      ],
      bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 }
    };
    
    const mockQuoteData = { ...quoteData, dxfData: mockDxfData };
    const mockResult = calculateQuote(mockQuoteData);
    
    console.log('\nMock Quote Results:');
    console.log('- Cutting Cost: $' + mockResult.costs.cuttingCost);
    
    if (mockResult.details.cuttingComplexity) {
      console.log('- Complexity Score:', mockResult.details.cuttingComplexity.score);
      console.log('✅ Complexity analyzer is working with mock data!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testIntegration();