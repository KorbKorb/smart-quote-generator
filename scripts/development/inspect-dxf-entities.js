// inspect-dxf-entities.js
// Inspect the actual structure of DXF entities

const path = require('path');
const { parseDXF } = require('../backend/src/utils/quoteCalculator');

async function inspectEntities() {
  console.log('🔍 Inspecting DXF Entity Structure\n');
  
  const testFile = path.join(__dirname, '..', 'test-files', 'test-rectangle-10x10.dxf');
  
  try {
    const result = await parseDXF(testFile);
    
    console.log('Total entities:', result.entities.length);
    console.log('\nDetailed entity inspection:\n');
    
    result.entities.forEach((entity, index) => {
      console.log(`Entity ${index} - Type: ${entity.type}`);
      console.log('Full structure:', JSON.stringify(entity, null, 2));
      console.log('-'.repeat(50));
    });
    
    // Also test the cutting complexity analyzer with the actual entities
    const { CuttingComplexityAnalyzer } = require('../backend/src/utils/cuttingComplexityAnalyzer');
    
    console.log('\n🧪 Testing Cutting Complexity Analyzer with real entities:\n');
    
    const analyzer = new CuttingComplexityAnalyzer({
      entities: result.entities,
      bounds: result.bounds
    });
    
    try {
      const analysis = analyzer.analyzeCuttingComplexity();
      console.log('✅ Analysis successful!');
      console.log('Complexity Score:', analysis.complexityScore);
      console.log('Segments found:', analysis.segments.length);
      console.log('Total cuts:', analysis.totalCuts);
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      console.error(error.stack);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

inspectEntities();