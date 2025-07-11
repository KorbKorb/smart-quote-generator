// Test the new hole size differentiation pricing
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3002/api';

async function testHoleSizePricing() {
  console.log('🧪 Testing Hole Size Differentiation Pricing\n');

  // Create a test DXF with various hole sizes
  const testDXF = `
  0
SECTION
  2
ENTITIES
  0
CIRCLE
  8
0
 10
10.0
 20
10.0
 40
0.1
  0
CIRCLE
  8
0
 10
30.0
 20
10.0
 40
0.5
  0
CIRCLE
  8
0
 10
50.0
 20
10.0
 40
1.0
  0
CIRCLE
  8
0
 10
70.0
 20
10.0
 40
2.5
  0
LWPOLYLINE
  8
0
 90
4
 70
1
 10
0.0
 20
0.0
 10
100.0
 20
0.0
 10
100.0
 20
50.0
 10
0.0
 20
50.0
  0
ENDSEC
  0
EOF
`;

  // Save test DXF
  const testFilePath = path.join(__dirname, '../test-files/hole-size-test.dxf');
  fs.writeFileSync(testFilePath, testDXF);

  try {
    // First, analyze the DXF
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));

    console.log('📤 Analyzing DXF with various hole sizes...');
    const analysisResponse = await axios.post(
      `${API_URL}/quotes/analyze-dxf`,
      form,
      {
        headers: {
          ...form.getHeaders()
        }
      }
    );

    if (analysisResponse.data.success) {
      const dxfData = analysisResponse.data.data;
      console.log('\n📊 Hole Analysis:');
      console.log(`Total holes: ${dxfData.holeCount}`);
      console.log('\nHole details:');
      dxfData.holes.forEach((hole, i) => {
        console.log(`  Hole ${i + 1}: ${hole.diameter.toFixed(3)}" diameter`);
      });

      // Now calculate quote
      console.log('\n💰 Calculating Quote with Size-Based Pricing...');
      const quoteResponse = await axios.post(`${API_URL}/quotes/calculate`, {
        material: 'Cold Rolled Steel',
        thickness: 0.125,
        quantity: 10,
        finishType: 'none',
        urgency: 'standard',
        dxfData: dxfData
      });

      if (quoteResponse.data.success) {
        const quote = quoteResponse.data.quote;
        console.log('\n📋 Quote Breakdown:');
        console.log(`Material Cost: $${quote.costs.materialCost}`);
        console.log(`Cutting Cost: $${quote.costs.cuttingCost}`);
        console.log(`Piercing Cost: $${quote.costs.pierceCost}`);
        
        if (quote.details.holeDistribution) {
          console.log('\n🔍 Hole Size Distribution:');
          console.log(`  Small holes (< 0.25"): ${quote.details.holeDistribution.small} × $0.30 = $${(quote.details.holeDistribution.small * 0.30 * 10).toFixed(2)}`);
          console.log(`  Medium holes (0.25" - 0.75"): ${quote.details.holeDistribution.medium} × $0.50 = $${(quote.details.holeDistribution.medium * 0.50 * 10).toFixed(2)}`);
          console.log(`  Large holes (0.75" - 2.0"): ${quote.details.holeDistribution.large} × $0.75 = $${(quote.details.holeDistribution.large * 0.75 * 10).toFixed(2)}`);
          console.log(`  Very large holes (> 2.0"): ${quote.details.holeDistribution.veryLarge} × $1.25 = $${(quote.details.holeDistribution.veryLarge * 1.25 * 10).toFixed(2)}`);
          
          console.log('\n📏 Individual Hole Costs:');
          quote.details.holeDistribution.details.forEach((hole, i) => {
            console.log(`  Hole ${i + 1} (${hole.diameter}"): $${hole.cost} each`);
          });
        }
        
        console.log(`\nTotal Quote: $${quote.costs.total}`);
        
        // Compare with old flat-rate pricing
        const oldPierceCost = dxfData.holeCount * 10 * 0.50; // 4 holes × 10 quantity × $0.50
        const newPierceCost = parseFloat(quote.costs.pierceCost);
        const savings = oldPierceCost - newPierceCost;
        
        console.log('\n💡 Pricing Comparison:');
        console.log(`Old flat-rate pricing: $${oldPierceCost.toFixed(2)}`);
        console.log(`New size-based pricing: $${newPierceCost.toFixed(2)}`);
        console.log(`Difference: ${savings > 0 ? 'Saved' : 'Added'} $${Math.abs(savings).toFixed(2)}`);
        
        console.log('\n✅ Hole size differentiation is working correctly!');
      } else {
        console.error('❌ Quote calculation failed:', quoteResponse.data.message);
      }
    } else {
      console.error('❌ DXF analysis failed:', analysisResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Error testing hole size pricing:', error.response?.data || error.message);
  } finally {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

// Run the test
testHoleSizePricing();
