// Connection Test Script
// Tests MongoDB connection and API endpoints
// Run with: node test-connections.js

const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load backend environment variables
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testMongoConnection() {
  log('\n📊 Testing MongoDB Connection...', 'blue');
  
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-quote-generator';
    log(`Connecting to: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`, 'yellow');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    log('✅ MongoDB connection successful!', 'green');
    
    // Test database access
    const collections = await mongoose.connection.db.listCollections().toArray();
    log(`\nCollections found: ${collections.length}`, 'blue');
    collections.forEach(col => {
      log(`  - ${col.name}`, 'blue');
    });
    
    await mongoose.connection.close();
    return true;
  } catch (error) {
    log('❌ MongoDB connection failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

async function testBackendAPI() {
  log('\n🔌 Testing Backend API Endpoints...', 'blue');
  
  const baseURL = 'http://localhost:3002';
  const endpoints = [
    { method: 'GET', path: '/api/health', description: 'Health Check' },
    { method: 'POST', path: '/api/auth/customer/register', description: 'Registration Endpoint', skipTest: true },
    { method: 'POST', path: '/api/auth/customer/login', description: 'Login Endpoint', skipTest: true },
    { method: 'GET', path: '/api/quotes', description: 'Quotes List (Protected)', expectAuth: true },
    { method: 'GET', path: '/api/package-quotes', description: 'Package Quotes List', expectAuth: true }
  ];
  
  for (const endpoint of endpoints) {
    try {
      if (endpoint.skipTest) {
        log(`⏭️  ${endpoint.description} - ${endpoint.method} ${endpoint.path} (Skipped - requires data)`, 'yellow');
        continue;
      }
      
      const response = await axios({
        method: endpoint.method,
        url: `${baseURL}${endpoint.path}`,
        timeout: 5000,
        validateStatus: () => true // Don't throw on any status
      });
      
      if (response.status === 200) {
        log(`✅ ${endpoint.description} - ${endpoint.method} ${endpoint.path} (${response.status})`, 'green');
        if (response.data) {
          log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`, 'blue');
        }
      } else if (response.status === 401 && endpoint.expectAuth) {
        log(`🔒 ${endpoint.description} - ${endpoint.method} ${endpoint.path} (${response.status} - Auth required)`, 'yellow');
      } else {
        log(`⚠️  ${endpoint.description} - ${endpoint.method} ${endpoint.path} (${response.status})`, 'yellow');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        log(`❌ Backend server not running! Start it with: cd backend && npm start`, 'red');
        return false;
      }
      log(`❌ ${endpoint.description} - ${endpoint.method} ${endpoint.path} - Error: ${error.message}`, 'red');
    }
  }
  
  return true;
}

async function testFrontendServer() {
  log('\n🎨 Testing Frontend Server...', 'blue');
  
  try {
    const response = await axios.get('http://localhost:3000', {
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      log('✅ Frontend server is running on port 3000', 'green');
      return true;
    } else {
      log(`⚠️  Frontend returned status: ${response.status}`, 'yellow');
      return true;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('❌ Frontend server not running! Start it with: cd frontend && npm start', 'red');
    } else {
      log(`❌ Frontend test error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function checkEnvironmentVariables() {
  log('\n🔐 Checking Environment Variables...', 'blue');
  
  const required = {
    'MONGODB_URI': process.env.MONGODB_URI,
    'JWT_SECRET': process.env.JWT_SECRET,
    'NODE_ENV': process.env.NODE_ENV
  };
  
  let allPresent = true;
  
  for (const [key, value] of Object.entries(required)) {
    if (value) {
      log(`✅ ${key} is set`, 'green');
      if (key === 'MONGODB_URI') {
        log(`   Value: ${value.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`, 'blue');
      }
    } else {
      log(`❌ ${key} is not set`, 'red');
      allPresent = false;
    }
  }
  
  return allPresent;
}

async function runAllTests() {
  console.clear();
  log('🧪 Smart Quote Generator - Connection Tests\n', 'blue');
  log(`Time: ${new Date().toLocaleString()}`, 'blue');
  
  const results = {
    env: await checkEnvironmentVariables(),
    mongo: await testMongoConnection(),
    backend: await testBackendAPI(),
    frontend: await testFrontendServer()
  };
  
  log('\n📋 Test Summary:', 'blue');
  log('─'.repeat(40), 'blue');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${test.padEnd(10)} : ${status}`, color);
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    log('\n🎉 All tests passed! Your app is ready.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please fix the issues above.', 'yellow');
    log('\nCommon fixes:', 'blue');
    log('1. Start backend: cd backend && npm start', 'blue');
    log('2. Start frontend: cd frontend && npm start', 'blue');
    log('3. Check .env file in backend directory', 'blue');
    log('4. Verify MongoDB connection string', 'blue');
  }
}

// Check if axios is installed
try {
  require.resolve('axios');
  runAllTests().catch(error => {
    log(`\n❌ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  });
} catch(e) {
  log('❌ Axios not installed. Run: npm install axios', 'red');
  log('Or run from backend directory where axios is already installed', 'yellow');
}