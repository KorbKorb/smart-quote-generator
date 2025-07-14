// test-api-complexity-fixed.js
// Corrected test script that properly handles DXF analysis then quote calculation

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3002/api/quotes';

async function testQuoteWithDXF(dxfFileName) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Testing: ${dxfFileName}`);
  console.log('='.repeat(50));
  
  const filePath = path.join(__dirname, '..', 'test-files', dxfFileName);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  try {
    // Step 1: Analyze the DXF file
    console.log('\n📁 Step 1: Analyzing DXF file...');
    const analyzeForm = new FormData();
    analyzeForm.append('file', fs.createReadStream(filePath));
    
    const analyzeResponse = await axios.post(`${API_URL}/analyze-dxf`, analyzeForm, {
      headers: analyzeForm.getHeaders()
    });
    
    if (!analyzeResponse.data.success) {
      throw new Error('DXF analysis failed');
    }
    
    const dxfData = analyzeResponse.data.data;
    console.log('✅ DXF analyzed successfully');
    console.log(`   Area: ${dxfData.area?.toFixed(2) || 'N/A'} sq in`);
    console.log(`   Entities: ${dxfData.entities?.length || 0}`);
    
    // Step 2: Calculate quote with the analyzed data
    console.log('\n💰 Step 2: Calculating quote...');
    const quoteData = {
      material: 'cold-rolled-steel',
      thickness: 0.125,
      quantity: 10,
      finishType: 'none',
      toleranceLevel: 'standard',
      urgency: 'standard',
      bendComplexity: 'simple',
      dxfData: dxfData  // Include the parsed DXF data
    };
    
    const quoteResponse = await axios.post(`${API_URL}/calculate`, quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Display results
    const { quote } = quoteResponse.data;
    
    console.log('\n📊 COST BREAKDOWN:');
    console.log(`   Total Cost: $${quote.pricing.total}`);
    console.log(`   Per Unit: $${quote.pricing.perUnit}`);
    console.log(`   Material Cost: $${quote.breakdown.material.cost}`);
    console.log(`   Cutting Cost: $${quote.breakdown.operations.cutting.cost}`);
    console.log(`   Piercing Cost: $${quote.breakdown.operations.piercing.cost}`);
    
    console.log('\n📐 PART DETAILS:');
    console.log(`   Area: ${quote.measurements.area} sq ft`);
    console.log(`   Cut Length: ${quote.measurements.cutLength} in`);
    console.log(`   Holes: ${quote.measurements.holes}`);
    console.log(`   Complexity: ${quote.measurements.complexity}`);
    
    // Check if complexity analysis is available in the response
    // Note: The current API structure doesn't include cuttingComplexity in the response
    // We would need to modify the calculateQuote function to include this data
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data?.error || error.message);
    if (error.response?.status === 404) {
      console.error('   API endpoint not found. Is the server running on port 3002?');
    } else if (error.response?.status === 400) {
      console.error('   Bad Request. Error details:', error.response?.data);
    }
  }
}

// Alternative: Test with mock DXF data (no file upload needed)
async function testWithMockData(testName, mockDxfData) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Testing: ${testName} (Mock Data)`);
  console.log('='.repeat(50));
  
  try {
    const quoteData = {
      material: 'cold-rolled-steel',
      thickness: 0.125,
      quantity: 10,
      finishType: 'none',
      toleranceLevel: 'standard',
      urgency: 'standard',
      bendComplexity: 'simple',
      dxfData: mockDxfData
    };
    
    const response = await axios.post(`${API_URL}/calculate`, quoteData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const { quote } = response.data;
    
    console.log('\n📊 Results:');
    console.log(`   Total Cost: $${quote.pricing.total}`);
    console.log(`   Cutting Cost: $${quote.breakdown.operations.cutting.cost}`);
    console.log(`   Complexity: ${quote.measurements.complexity}`);
    
    // Check for cutting complexity data if available
    if (quote.measurements.cuttingComplexity) {
      console.log('\n🔍 COMPLEXITY ANALYSIS:');
      console.log(`   Score: ${quote.measurements.cuttingComplexity.score}/100`);
      console.log(`   Straight Cuts: ${quote.measurements.cuttingComplexity.straightCuts}`);
      console.log(`   Curved Cuts: ${quote.measurements.cuttingComplexity.curvedCuts}`);
      console.log(`   Tight Corners: ${quote.measurements.cuttingComplexity.tightCorners}`);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data?.error || error.message);
  }
}

// Run tests
async function main() {
  console.log('🚀 Starting Cutting Complexity API Tests (Fixed Version)...\n');
  console.log('⚠️  Make sure the backend server is running on port 3002!\n');
  
  // First check if server is running
  try {
    await axios.get('http://localhost:3002/api');
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('❌ Cannot connect to backend server!');
      console.error('   Please run: cd backend && npm start');
      process.exit(1);
    }
  }
  
  // Test with real DXF files
  console.log('\n=== TESTING WITH REAL DXF FILES ===');
  const testFiles = ['test-rectangle-10x10.dxf', 'complex-bracket.dxf'];
  
  for (const file of testFiles) {
    await testQuoteWithDXF(file);
  }
  
  // Test with mock data to verify complexity analysis
  console.log('\n\n=== TESTING WITH MOCK DATA ===');
  
  // Simple rectangle mock
  await testWithMockData('Simple Rectangle', {
    area: 100,
    perimeter: 40,
    cutLength: 40,
    holeCount: 0,
    holes: [],
    bendLines: [],
    complexity: 'simple',
    entities: [
      { type: 'LINE', startPoint: { x: 0, y: 0 }, endPoint: { x: 10, y: 0 } },
      { type: 'LINE', startPoint: { x: 10, y: 0 }, endPoint: { x: 10, y: 10 } },
      { type: 'LINE', startPoint: { x: 10, y: 10 }, endPoint: { x: 0, y: 10 } },
      { type: 'LINE', startPoint: { x: 0, y: 10 }, endPoint: { x: 0, y: 0 } }
    ],
    bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 },
    entityCounts: { lines: 4, circles: 0, arcs: 0, polylines: 0 }
  });
  
  // Complex part mock
  await testWithMockData('Complex Part with Curves', {
    area: 80,
    perimeter: 35,
    cutLength: 45,
    holeCount: 4,
    holes: [
      { diameter: 0.5, x: 2, y: 2 },
      { diameter: 0.5, x: 8, y: 2 },
      { diameter: 0.5, x: 2, y: 8 },
      { diameter: 0.5, x: 8, y: 8 }
    ],
    bendLines: [],
    complexity: 'moderate',
    entities: [
      { type: 'ARC', center: { x: 5, y: 5 }, radius: 5, startAngle: 0, endAngle: 360 },
      { type: 'CIRCLE', center: { x: 2, y: 2 }, radius: 0.25 },
      { type: 'CIRCLE', center: { x: 8, y: 2 }, radius: 0.25 },
      { type: 'CIRCLE', center: { x: 2, y: 8 }, radius: 0.25 },
      { type: 'CIRCLE', center: { x: 8, y: 8 }, radius: 0.25 }
    ],
    bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 },
    entityCounts: { lines: 0, circles: 4, arcs: 1, polylines: 0 }
  });
  
  console.log('\n✅ All tests completed!');
}

main().catch(console.error);