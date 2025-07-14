// Quick test to verify backend is running
const axios = require('axios');

const API_URL = 'http://localhost:3002';

async function testBackend() {
  console.log('Testing backend connection...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_URL}/api/health`);
    console.log('✓ Health check passed:', healthResponse.data);
    console.log('');

    // Test materials endpoint
    console.log('2. Testing materials endpoint...');
    const materialsResponse = await axios.get(`${API_URL}/api/quotes/materials`);
    console.log('✓ Materials endpoint working');
    console.log(`  Found ${materialsResponse.data.data.length} materials`);
    console.log('');

    // Test quotes endpoint
    console.log('3. Testing quotes endpoint...');
    const quotesResponse = await axios.get(`${API_URL}/api/quotes`);
    console.log('✓ Quotes endpoint working');
    console.log(`  Response:`, quotesResponse.data);
    console.log('');

    console.log('✅ All backend tests passed!');
    console.log('Backend is running correctly on port 3002');
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nBackend server is not running!');
      console.error('Please start it with: cd backend && npm start');
    } else {
      console.error('\nError details:', error.response?.data || error);
    }
  }
}

testBackend();
