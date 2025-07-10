// Test script to verify DXF parsing functionality
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const FormData = require('form-data');

// Add the dxfParser directly for isolated testing
const dxfParser = require('../backend/src/utils/dxfParser');

const API_URL = 'http://localhost:3002/api';

// Test 1: Direct DXF Parser Test
async function testDirectDXFParser() {
  console.log('🧪 Test 1: Direct DXF Parser Test\n');
  
  // Create a simple DXF file for testing
  const simpleDXF = `0
SECTION
2
ENTITIES
0
LWPOLYLINE
8
0
90
4
70
1
0
VERTEX
10
0.0
20
0.0
0
VERTEX
10
100.0
20
0.0
0
VERTEX
10
100.0
20
50.0
0
VERTEX
10
0.0
20
50.0
0
CIRCLE
8
0
10
25.0
20
25.0
40
5.0
0
CIRCLE
8
0
10
75.0
20
25.0
40
5.0
0
ENDSEC
0
EOF`;

  const testFilePath = path.join(__dirname, 'test-rectangle.dxf');
  
  try {
    // Write test DXF file
    await fs.writeFile(testFilePath, simpleDXF);
    console.log('✅ Created test DXF file');
    
    // Test the parser
    const result = await dxfParser.parse(testFilePath);
    
    console.log('📊 Parser Results:');
    console.log('  Area:', result.area.toFixed(2), 'sq units');
    console.log('  Perimeter:', result.perimeter.toFixed(2), 'units');
    console.log('  Cut Length:', result.cutLength.toFixed(2), 'units');
    console.log('  Holes:', result.holeCount);
    console.log('  Complexity:', result.complexity);
    console.log('  Entities:', JSON.stringify(result.entities, null, 2));
    
    if (result.warnings.length > 0) {
      console.log('  ⚠️  Warnings:', result.warnings);
    }
    
    console.log('\n✅ Direct parser test passed!\n');
    
    // Clean up
    await fs.unlink(testFilePath);
    
    return true;
  } catch (error) {
    console.error('❌ Direct parser test failed:', error.message);
    return false;
  }
}

// Test 2: API Endpoint Test
async function testAPIEndpoint() {
  console.log('🧪 Test 2: API Endpoint Test (Quote Calculation with DXF)\n');
  
  // Create a more complex DXF for API testing
  const complexDXF = `0
SECTION
2
ENTITIES
0
LWPOLYLINE
8
0
90
8
70
1
0
VERTEX
10
0.0
20
0.0
0
VERTEX
10
200.0
20
0.0
0
VERTEX
10
200.0
20
100.0
0
VERTEX
10
150.0
20
100.0
0
VERTEX
10
150.0
20
50.0
0
VERTEX
10
50.0
20
50.0
0
VERTEX
10
50.0
20
100.0
0
VERTEX
10
0.0
20
100.0
0
CIRCLE
8
0
10
25.0
20
25.0
40
6.35
0
CIRCLE
8
0
10
175.0
20
25.0
40
6.35
0
CIRCLE
8
0
10
100.0
20
75.0
40
10.0
0
LINE
8
BEND
10
50.0
20
50.0
11
150.0
21
50.0
0
ENDSEC
0
EOF`;

  const testFilePath = path.join(__dirname, 'test-complex-part.dxf');
  
  try {
    // Write test DXF file
    await fs.writeFile(testFilePath, complexDXF);
    console.log('✅ Created complex test DXF file');
    
    // Create form data for API request
    const form = new FormData();
    form.append('file', await fs.readFile(testFilePath), 'test-complex-part.dxf');
    
    // Test analyze-dxf endpoint
    console.log('📤 Testing /api/quotes/analyze-dxf endpoint...');
    const analyzeResponse = await axios.post(
      `${API_URL}/quotes/analyze-dxf`,
      form,
      {
        headers: {
          ...form.getHeaders()
        }
      }
    );
    
    console.log('✅ DXF Analysis Response:');
    console.log(JSON.stringify(analyzeResponse.data, null, 2));
    
    // Now test quote calculation with the DXF data
    console.log('\n📤 Testing quote calculation with DXF data...');
    
    const quoteData = {
      items: [{
        material: 'Cold Rolled Steel',
        thickness: 0.125, // 1/8 inch
        quantity: 10,
        finishType: 'powder-coat',
        urgency: 'standard',
        toleranceLevel: 'standard',
        bendComplexity: 'moderate',
        dxfData: analyzeResponse.data.data
      }]
    };
    
    const quoteResponse = await axios.post(
      `${API_URL}/quotes/calculate`,
      quoteData
    );
    
    console.log('\n✅ Quote Calculation Response:');
    const item = quoteResponse.data.items[0];
    console.log('  Material Cost: $', item.pricing.costs.materialCost);
    console.log('  Cutting Cost: $', item.pricing.costs.cuttingCost);
    console.log('  Pierce Cost: $', item.pricing.costs.pierceCost);
    console.log('  Bend Cost: $', item.pricing.costs.bendCost);
    console.log('  Finish Cost: $', item.pricing.costs.finishCost);
    console.log('  Total: $', item.pricing.costs.total);
    console.log('  Measurement Source:', item.pricing.details.measurementSource);
    
    console.log('\n✅ API endpoint test passed!\n');
    
    // Clean up
    await fs.unlink(testFilePath);
    
    return true;
  } catch (error) {
    console.error('❌ API endpoint test failed:', error.response?.data || error.message);
    // Try to clean up even on error
    try {
      await fs.unlink(testFilePath);
    } catch (e) {}
    return false;
  }
}

// Test 3: Error Handling Test
async function testErrorHandling() {
  console.log('🧪 Test 3: Error Handling Test\n');
  
  // Test with invalid DXF
  const invalidDXF = `This is not a valid DXF file`;
  const testFilePath = path.join(__dirname, 'test-invalid.dxf');
  
  try {
    await fs.writeFile(testFilePath, invalidDXF);
    
    console.log('Testing parser with invalid DXF...');
    try {
      await dxfParser.parse(testFilePath);
      console.error('❌ Parser should have thrown an error for invalid DXF');
      return false;
    } catch (error) {
      console.log('✅ Parser correctly rejected invalid DXF:', error.message);
    }
    
    // Clean up
    await fs.unlink(testFilePath);
    
    console.log('\n✅ Error handling test passed!\n');
    return true;
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting DXF Functionality Tests\n');
  console.log('Make sure the backend is running on port 3002\n');
  console.log('=' .repeat(50) + '\n');
  
  let allPassed = true;
  
  // Run tests
  allPassed &= await testDirectDXFParser();
  allPassed &= await testAPIEndpoint();
  allPassed &= await testErrorHandling();
  
  console.log('=' .repeat(50) + '\n');
  
  if (allPassed) {
    console.log('🎉 All tests passed! DXF functionality is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
  }
}

// Run tests
runAllTests().catch(console.error);
