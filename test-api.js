// test-api.js - Save this in your project root and run with: node test-api.js
const axios = require('axios');

async function testAPI() {
  console.log('Testing Smart Quote Generator API...\n');

  const baseURL = 'http://localhost:5000';

  // Test 1: Health Check
  try {
    console.log('1. Testing /health endpoint...');
    const health = await axios.get(`${baseURL}/health`);
    console.log('✓ Health check:', health.data);
  } catch (error) {
    console.log('✗ Health check failed:', error.message);
  }

  // Test 2: Materials Endpoint
  try {
    console.log('\n2. Testing /api/materials endpoint...');
    const materials = await axios.get(`${baseURL}/api/materials`);
    console.log('✓ Materials response:');
    console.log('  Type:', typeof materials.data);
    console.log('  Is Array:', Array.isArray(materials.data));
    console.log('  Data:', JSON.stringify(materials.data, null, 2));
  } catch (error) {
    console.log('✗ Materials endpoint failed:', error.message);
  }

  // Test 3: Quotes Endpoint
  try {
    console.log('\n3. Testing /api/quotes endpoint...');
    const quotes = await axios.get(`${baseURL}/api/quotes`);
    console.log('✓ Quotes response:');
    console.log('  Type:', typeof quotes.data);
    console.log('  Is Array:', Array.isArray(quotes.data));
    console.log('  Count:', Array.isArray(quotes.data) ? quotes.data.length : 'N/A');
  } catch (error) {
    console.log('✗ Quotes endpoint failed:', error.message);
  }

  // Test 4: Create Quote
  try {
    console.log('\n4. Testing POST /api/quotes...');
    const testQuote = {
      material: 'Mild Steel',
      thickness: '0.125',
      quantity: 10,
      finishType: 'powder-coat',
      bendComplexity: 'simple',
      toleranceLevel: 'standard',
      urgency: 'standard',
      notes: 'Test quote from API test',
      files: [
        {
          name: 'test.dxf',
          size: 1024,
          type: 'application/dxf'
        }
      ]
    };
    
    const newQuote = await axios.post(`${baseURL}/api/quotes`, testQuote);
    console.log('✓ Quote created successfully:');
    console.log('  ID:', newQuote.data.id || newQuote.data._id);
    console.log('  Status:', newQuote.status);
  } catch (error) {
    console.log('✗ Create quote failed:', error.message);
    if (error.response) {
      console.log('  Response:', error.response.data);
    }
  }

  console.log('\n✅ API test complete!');
}

// Run the test
testAPI().catch(console.error);
