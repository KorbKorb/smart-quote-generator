// Test rate limiting
const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

async function testRateLimiting() {
  console.log('🧪 Testing Rate Limiting...\n');
  
  // Test auth endpoint (limit: 5 requests per 15 minutes)
  console.log('Testing auth rate limit (5 requests allowed):');
  
  for (let i = 1; i <= 7; i++) {
    try {
      const response = await axios.post(`${API_URL}/auth/customer/login`, {
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response) {
        console.log(`Request ${i}: ${error.response.status} - ${error.response.data.message || error.response.data.error}`);
        
        if (error.response.status === 429) {
          console.log('✅ Rate limiting is working!');
          break;
        }
      }
    }
  }
  
  console.log('\n📊 Testing general API rate limit:');
  
  // Test general endpoint
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await axios.get(`${API_URL}/quotes/materials`);
      console.log(`Request ${i}: ${response.status} - OK`);
    } catch (error) {
      console.log(`Request ${i}: ${error.response?.status} - ${error.response?.data?.message}`);
    }
  }
}

testRateLimiting().catch(console.error);
