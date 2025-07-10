// Debug DXF parsing to see what's actually happening
const path = require('path');
const fs = require('fs').promises;

// Import the DXF parser directly
const dxfParser = require('../backend/src/utils/dxfParser');

async function debugDXFParsing() {
  console.log('🔍 Debug DXF Parsing\n');

  const testFile = 'chassis-panel.dxf';
  const filePath = path.join(__dirname, '../test-files', testFile);

  try {
    console.log(`Reading ${testFile}...`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    console.log('\n📄 File Content Preview:');
    console.log(fileContent.substring(0, 500) + '...\n');

    console.log('Parsing DXF...');
    const result = await dxfParser.parse(filePath);

    console.log('\n🔍 Parser Result Structure:');
    console.log(JSON.stringify(result, null, 2));

    // Check what the parser is actually returning
    console.log('\n📊 Detailed Analysis:');
    console.log('Keys in result:', Object.keys(result));
    
    if (result.entities) {
      console.log('Entities structure:', result.entities);
    }
    
    if (result.holes) {
      console.log('Holes array length:', result.holes.length);
      if (result.holes.length > 0) {
        console.log('First hole:', result.holes[0]);
      }
    }
    
    if (result.bendLines) {
      console.log('Bend lines array length:', result.bendLines.length);
      if (result.bendLines.length > 0) {
        console.log('First bend line:', result.bendLines[0]);
      }
    }

  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  }
}

debugDXFParsing();
