// test-api-complexity.js
// Quick test script to verify cutting complexity through the API

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3002/api/quotes';

async function testQuoteWithDXF(dxfFileName) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Testing: ${dxfFileName}`);
  console.log('='.repeat(50));
  
  const form = new FormData();
  const filePath = path.join(__dirname, '..', 'test-files', dxfFileName);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  form.append('files', fs.createReadStream(filePath));
  form.append('material', 'cold-rolled-steel');  // Use lowercase with hyphens
  form.append('thickness', '0.125');
  form.append('quantity', '10');
  form.append('finishType', 'none');
  form.append('toleranceLevel', 'standard');
  form.append('urgency', 'standard');
  form.append('bendComplexity', 'simple');  // Add this field

  try {
    const response = await axios.post(`${API_URL}/calculate`, form, {
      headers: form.getHeaders()
    });

    // Display key metrics
    console.log('\n📊 COST BREAKDOWN:');
    console.log(`   Total Cost: $${response.data.costs.total}`);
    console.log(`   Cutting Cost: $${response.data.costs.cuttingCost}`);
    console.log(`   Material Cost: $${response.data.costs.materialCost}`);
    console.log(`   Pierce Cost: $${response.data.costs.pierceCost}`);
    
    // Display part details
    console.log('\n📐 PART DETAILS:');
    console.log(`   Area: ${response.data.details.areaPerPart} sq in`);
    console.log(`   Cut Length: ${response.data.details.cutLengthPerPart} in`);
    console.log(`   Holes: ${response.data.details.holeCount}`);
    
    // Display complexity analysis if available
    if (response.data.details.cuttingComplexity) {
      const complexity = response.data.details.cuttingComplexity;
      console.log('\n🔍 COMPLEXITY ANALYSIS:');
      console.log(`   Complexity Score: ${complexity.score}/100`);
      console.log(`   Straight Cuts: ${complexity.straightCuts}`);
      console.log(`   Curved Cuts: ${complexity.curvedCuts}`);
      console.log(`   Tight Corners: ${complexity.tightCorners}`);
      console.log(`   Intricate Patterns: ${complexity.intricatePatterns}`);
      
      if (complexity.recommendations && complexity.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:');
        complexity.recommendations.forEach(rec => {
          console.log(`   [${rec.impact.toUpperCase()}] ${rec.message}`);
        });
      }
    } else {
      console.log('\n⚠️  No complexity analysis available - using simple calculation');
    }
    
    // Display hole distribution if available
    if (response.data.details.holeDistribution) {
      const dist = response.data.details.holeDistribution;
      console.log('\n🕳️  HOLE DISTRIBUTION:');
      console.log(`   Small (<0.25"): ${dist.small}`);
      console.log(`   Medium (0.25-0.75"): ${dist.medium}`);
      console.log(`   Large (0.75-2"): ${dist.large}`);
      console.log(`   Very Large (>2"): ${dist.veryLarge}`);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data?.error || error.message);
    if (error.response?.status === 404) {
      console.error('   API endpoint not found. Is the server running on port 3002?');
    } else if (error.response?.status === 400) {
      console.error('   Bad Request. Error details:', error.response?.data);
    }
  }
}

// Test comparison function
async function compareComplexity() {
  console.log('\n' + '='.repeat(70));
  console.log('COMPLEXITY COMPARISON TEST');
  console.log('='.repeat(70));
  
  const testCases = [
    { file: 'test-rectangle-10x10.dxf', expected: 'Simple (score < 20)' },
    { file: 'complex-bracket.dxf', expected: 'Complex (score > 50)' },
    { file: 'circular-flange.dxf', expected: 'Moderate (many curves)' },
    { file: 'chassis-panel.dxf', expected: 'Moderate (many holes)' }
  ];

  for (const testCase of testCases) {
    await testQuoteWithDXF(testCase.file);
    console.log(`\n   Expected: ${testCase.expected}`);
    console.log('\n' + '-'.repeat(70));
  }
}

// Run tests
async function main() {
  console.log('🚀 Starting Cutting Complexity API Tests...\n');
  console.log('⚠️  Make sure the backend server is running on port 3002!\n');
  
  // First check if server is running
  try {
    await axios.get('http://localhost:3002/api/health');
  } catch (error) {
    console.error('❌ Cannot connect to backend server!');
    console.error('   Please run: cd backend && npm start');
    process.exit(1);
  }
  
  await compareComplexity();
  
  console.log('\n✅ All tests completed!');
}

main().catch(console.error);