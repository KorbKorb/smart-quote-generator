// Test script for Package Quotes API
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002';

async function testPackageQuotesAPI() {
  console.log('Testing Package Quotes API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/api/health`);
    console.log('✓ Health check:', healthResponse.data);
    console.log('');

    // Test 2: Debug products endpoint
    console.log('2. Testing debug products endpoint...');
    const debugResponse = await axios.get(`${API_BASE_URL}/api/package-quotes/debug/products`);
    console.log('✓ Products in database:', debugResponse.data.count);
    if (debugResponse.data.products.length > 0) {
      console.log('Sample product:', JSON.stringify(debugResponse.data.products[0], null, 2));
    } else {
      console.log('⚠ No products found in database! Run the migration script.');
    }
    console.log('');

    // Test 3: Parse products
    console.log('3. Testing parse products endpoint...');
    const parseResponse = await axios.post(`${API_BASE_URL}/api/package-quotes/parse-products`, {
      text: `Mild Steel Sheet 4x8 x 5
I-Beam 6" - 20
Hex Bolt 1/2" x 2" (200)`
    });
    console.log('✓ Parse products response:', JSON.stringify(parseResponse.data, null, 2));
    console.log('');

    // Test 4: Calculate pricing (if products were found)
    if (parseResponse.data.success && parseResponse.data.data.found.length > 0) {
      console.log('4. Testing calculate pricing endpoint...');
      const pricingResponse = await axios.post(`${API_BASE_URL}/api/package-quotes/calculate-pricing`, {
        items: parseResponse.data.data.found
      });
      console.log('✓ Calculate pricing response:', JSON.stringify(pricingResponse.data, null, 2));
    } else {
      console.log('⚠ No products found to test pricing calculation');
    }

  } catch (error) {
    console.error('✗ Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testPackageQuotesAPI();
