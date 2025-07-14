// diagnose-complex-bracket.js
// Diagnose issues with the complex-bracket.dxf file

const path = require('path');
const { parseDXF } = require('../backend/src/utils/quoteCalculator');

async function diagnoseComplexBracket() {
  console.log('🔍 Diagnosing complex-bracket.dxf\n');
  
  const testFile = path.join(__dirname, '..', 'test-files', 'complex-bracket.dxf');
  
  try {
    const result = await parseDXF(testFile);
    
    console.log('Parse Results:');
    console.log('- Area:', result.area, '(0 means no closed shapes found)');
    console.log('- Perimeter:', result.perimeter);
    console.log('- Entity Counts:', result.entityCounts);
    console.log('- Warnings:', result.warnings);
    
    console.log('\nDetailed Entity Analysis:');
    
    // Check polylines
    const polylines = result.entities.filter(e => e.type === 'LWPOLYLINE' || e.type === 'POLYLINE');
    console.log(`\nFound ${polylines.length} polylines:`);
    polylines.forEach((poly, i) => {
      console.log(`  Polyline ${i}:`);
      console.log(`    - Vertices: ${poly.vertices?.length || 0}`);
      console.log(`    - Closed: ${poly.shape || poly.closed || false}`);
      if (poly.vertices && poly.vertices.length > 0) {
        const first = poly.vertices[0];
        const last = poly.vertices[poly.vertices.length - 1];
        const distance = Math.sqrt(
          Math.pow(last.x - first.x, 2) + 
          Math.pow(last.y - first.y, 2)
        );
        console.log(`    - Distance between first and last vertex: ${distance.toFixed(3)}`);
        console.log(`    - Is effectively closed: ${distance < 0.001}`);
      }
    });
    
    // Check circles
    const circles = result.entities.filter(e => e.type === 'CIRCLE');
    console.log(`\nFound ${circles.length} circles:`);
    circles.forEach((circle, i) => {
      console.log(`  Circle ${i}: radius=${circle.radius}, center=(${circle.center.x}, ${circle.center.y})`);
    });
    
    // Try to calculate a bounding box manually
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    result.entities.forEach(entity => {
      if (entity.vertices) {
        entity.vertices.forEach(v => {
          minX = Math.min(minX, v.x);
          maxX = Math.max(maxX, v.x);
          minY = Math.min(minY, v.y);
          maxY = Math.max(maxY, v.y);
        });
      } else if (entity.center) {
        minX = Math.min(minX, entity.center.x - entity.radius);
        maxX = Math.max(maxX, entity.center.x + entity.radius);
        minY = Math.min(minY, entity.center.y - entity.radius);
        maxY = Math.max(maxY, entity.center.y + entity.radius);
      }
    });
    
    if (minX !== Infinity) {
      console.log('\nManual Bounding Box Calculation:');
      console.log(`  Min: (${minX.toFixed(2)}, ${minY.toFixed(2)})`);
      console.log(`  Max: (${maxX.toFixed(2)}, ${maxY.toFixed(2)})`);
      console.log(`  Width: ${(maxX - minX).toFixed(2)}`);
      console.log(`  Height: ${(maxY - minY).toFixed(2)}`);
      console.log(`  Estimated Area: ${((maxX - minX) * (maxY - minY)).toFixed(2)} sq in`);
    }
    
    // Test if we can still calculate costs even with area=0
    console.log('\n💡 Workaround Options:');
    console.log('1. Use bounding box area as estimate');
    console.log('2. Use total cut length for material estimation');
    console.log('3. Require manual area input for unclosed shapes');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

diagnoseComplexBracket();