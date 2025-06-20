// Test script to verify server endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

async function testEndpoint(method, url, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      ...(data && { data })
    };
    
    const response = await axios(config);
    console.log(`${colors.green}✓ ${method} ${url}${colors.reset}`);
    console.log(`  Response: ${JSON.stringify(response.data, null, 2)}\n`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ ${method} ${url}${colors.reset}`);
    console.log(`  Error: ${error.message}\n`);
    return false;
  }
}

async function runTests() {
  console.log(`${colors.cyan}Starting server tests...${colors.reset}\n`);
  
  // Test health endpoint
  await testEndpoint('GET', '/health');
  
  // Test materials endpoints
  await testEndpoint('GET', '/api/materials');
  await testEndpoint('GET', '/api/materials/categories/list');
  
  // Test quotes endpoints
  await testEndpoint('GET', '/api/quotes');
  await testEndpoint('POST', '/api/quotes', {
    material: 'Stainless Steel 304',
    thickness: 0.125,
    quantity: 10
  });
  
  // Test auth endpoints
  await testEndpoint('POST', '/api/auth/login', {
    email: 'test@example.com',
    password: 'password123'
  });
  
  console.log(`${colors.cyan}Tests complete!${colors.reset}`);
}

// Wait for server to start
console.log(`${colors.yellow}Waiting for server to start...${colors.reset}`);
setTimeout(runTests, 2000);

// Exit after tests
setTimeout(() => process.exit(0), 5000);