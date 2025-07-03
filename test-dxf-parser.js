// test-dxf-parser.js
const dxfParser = require('./backend/src/utils/dxfParser');
const path = require('path');

async function testDXFParser() {
  console.log('Testing DXF Parser...\n');

  try {
    // Test with the sample DXF file
    const dxfPath = path.join(__dirname, 'test-files', 'test-rectangle-10x10.dxf');
    console.log(`Parsing: ${dxfPath}`);
    
    const result = await dxfParser.parse(dxfPath);
    
    console.log('\n=== DXF Analysis Results ===');
    console.log(`Area: ${result.area.toFixed(2)} sq in`);
    console.log(`Perimeter: ${result.perimeter.toFixed(2)} in`);
    console.log(`Cut Length: ${result.cutLength.toFixed(2)} in`);
    console.log(`Holes: ${result.holeCount}`);
    console.log(`Bend Lines: ${result.bendLines.length}`);
    console.log(`Complexity: ${result.complexity}`);
    console.log(`Confidence: ${result.confidence}`);
    
    console.log('\nBounding Box:');
    console.log(`  Width: ${result.boundingBox.width.toFixed(2)} in`);
    console.log(`  Height: ${result.boundingBox.height.toFixed(2)} in`);
    
    if (result.holes.length > 0) {
      console.log('\nHoles:');
      result.holes.forEach((hole, i) => {
        console.log(`  Hole ${i + 1}: Diameter ${hole.diameter.toFixed(3)}" at (${hole.x.toFixed(2)}, ${hole.y.toFixed(2)})`);
      });
    }
    
    if (result.bendLines.length > 0) {
      console.log('\nBend Lines:');
      result.bendLines.forEach((bend, i) => {
        console.log(`  Bend ${i + 1}: Length ${bend.length.toFixed(2)}" from (${bend.startPoint.x.toFixed(2)}, ${bend.startPoint.y.toFixed(2)}) to (${bend.endPoint.x.toFixed(2)}, ${bend.endPoint.y.toFixed(2)})`);
      });
    }
    
    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }
    
    // Test weight calculation
    const weight = dxfParser.calculateWeight(result.area, 0.125, 'Cold Rolled Steel');
    console.log(`\nWeight (0.125" Cold Rolled Steel): ${weight.toFixed(2)} lbs`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDXFParser();
