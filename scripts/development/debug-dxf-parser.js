// debug-dxf-parser.js
// Debug script to see what the DXF parser is actually returning

const path = require('path');
const { parseDXF } = require('../backend/src/utils/quoteCalculator');

async function debugDXFParser() {
  console.log('🔍 DXF Parser Debug\n');
  
  const testFile = path.join(__dirname, '..', 'test-files', 'test-rectangle-10x10.dxf');
  
  try {
    console.log('Parsing:', testFile);
    const result = await parseDXF(testFile);
    
    console.log('\n📊 Parser Output:');
    console.log('Area:', result.area);
    console.log('Perimeter:', result.perimeter);
    console.log('Cut Length:', result.cutLength);
    console.log('Entities array length:', result.entities?.length || 0);
    console.log('Entity Counts:', result.entityCounts);
    console.log('Bounds:', result.bounds);
    
    if (result.entities && result.entities.length > 0) {
      console.log('\n🔧 First few entities:');
      result.entities.slice(0, 5).forEach((entity, i) => {
        console.log(`Entity ${i}:`, {
          type: entity.type,
          startPoint: entity.startPoint || entity.start,
          endPoint: entity.endPoint || entity.end,
          center: entity.center,
          radius: entity.radius
        });
      });
    } else {
      console.log('\n⚠️  No entities found in the result!');
    }
    
    // Also check if raw DXF file has entities
    const DxfParser = require('dxf-parser');
    const fs = require('fs');
    const parser = new DxfParser();
    const fileContent = fs.readFileSync(testFile, 'utf8');
    const rawDxf = parser.parseSync(fileContent);
    
    console.log('\n📄 Raw DXF parse:');
    console.log('Raw entities count:', rawDxf.entities?.length || 0);
    if (rawDxf.entities && rawDxf.entities.length > 0) {
      console.log('First raw entity:', rawDxf.entities[0]);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugDXFParser();