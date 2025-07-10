// Test DXF parsing with the new realistic files
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3002/api';

async function testDXFFiles() {
  console.log('🧪 Testing DXF Parsing with Realistic Files\n');

  const testFiles = [
    'chassis-panel.dxf',
    'enclosure-flat.dxf', 
    'complex-bracket.dxf',
    'circular-flange.dxf'
  ];

  for (const filename of testFiles) {
    console.log(`\n📄 Testing: ${filename}`);
    console.log('─'.repeat(50));

    const filePath = path.join(__dirname, '../test-files', filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      console.log('   Run: node scripts/generate-realistic-dxf.js first');
      continue;
    }

    try {
      // Create form data
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));

      // Analyze DXF
      console.log('📤 Sending for analysis...');
      const response = await axios.post(
        `${API_URL}/quotes/analyze-dxf`,
        form,
        {
          headers: {
            ...form.getHeaders()
          }
        }
      );

      if (response.data.success) {
        const data = response.data.data;
        
        console.log('\n✅ Analysis Results:');
        console.log(`   Area: ${data.area.toFixed(2)} sq units (${(data.area/144).toFixed(2)} sq ft)`);
        console.log(`   Perimeter: ${data.perimeter.toFixed(2)} units`);
        console.log(`   Cut Length: ${data.cutLength.toFixed(2)} units`);
        console.log(`   Holes: ${data.holeCount || 0}`);
        console.log(`   Bend Lines: ${data.bendLines ? data.bendLines.length : 0}`);
        console.log(`   Complexity: ${data.complexity}`);
        console.log(`   Confidence: ${data.confidence || 'N/A'}`);
        
        // Check if entities exists before trying to iterate
        if (data.entities && typeof data.entities === 'object') {
          console.log('\n📊 Entity Count:');
          Object.entries(data.entities).forEach(([type, count]) => {
            if (count > 0) {
              console.log(`   ${type}: ${count}`);
            }
          });
        }

        // Show bounding box
        if (data.boundingBox) {
          console.log('\n📏 Bounding Box:');
          console.log(`   Width: ${data.boundingBox.width.toFixed(2)} units`);
          console.log(`   Height: ${data.boundingBox.height.toFixed(2)} units`);
        }

        // Show holes detail if any
        if (data.holes && data.holes.length > 0) {
          console.log('\n⭕ Holes Detail:');
          data.holes.forEach((hole, index) => {
            console.log(`   Hole ${index + 1}: Ø${hole.diameter.toFixed(2)} at (${hole.x.toFixed(1)}, ${hole.y.toFixed(1)})`);
          });
        }

        // Show bend lines detail if any
        if (data.bendLines && data.bendLines.length > 0) {
          console.log('\n📐 Bend Lines:');
          data.bendLines.forEach((bend, index) => {
            console.log(`   Bend ${index + 1}: Length ${bend.length ? bend.length.toFixed(2) : 'N/A'}`);
          });
        }

        if (data.warnings && data.warnings.length > 0) {
          console.log('\n⚠️  Warnings:');
          data.warnings.forEach(warning => {
            console.log(`   - ${warning}`);
          });
        }

        // Test quote calculation with DXF data
        console.log('\n💰 Calculating Quote...');
        const quoteResponse = await axios.post(`${API_URL}/quotes/calculate`, {
          material: 'cold-rolled-steel',
          thickness: 0.125,
          quantity: 10,
          finishType: 'powder-coat',
          urgency: 'standard',
          dxfData: data
        });

        if (quoteResponse.data.quote) {
          const quote = quoteResponse.data.quote;
          console.log(`   Material Cost: $${quote.breakdown.material.cost}`);
          console.log(`   Cutting Cost: $${quote.breakdown.operations.cutting.cost}`);
          console.log(`   Piercing Cost: $${quote.breakdown.operations.piercing.cost}`);
          console.log(`   Bending Cost: $${quote.breakdown.operations.bending.cost}`);
          console.log(`   Finish Cost: $${quote.breakdown.finishing.cost}`);
          console.log(`   Total: $${quote.pricing.total}`);
          console.log(`   Per Unit: $${quote.pricing.perUnit}`);
        }

      } else {
        console.log('❌ Analysis failed');
      }

    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      if (error.response?.data?.stack) {
        console.error('Stack trace:', error.response.data.stack);
      }
    }
  }

  console.log('\n✅ DXF testing complete!');
}

// Run tests
testDXFFiles().catch(console.error);
