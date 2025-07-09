// Smart Quote Generator - Production Test Script
// Run this to verify your deployment is working correctly

const axios = require('axios');

const FRONTEND_URL = 'https://main.dtpbc2f4zygku.amplifyapp.com';
const BACKEND_URL = 'https://smart-quote-generator.up.railway.app';

async function testDeployment() {
    console.log('🚀 Smart Quote Generator - Production Test\n');
    console.log('Frontend:', FRONTEND_URL);
    console.log('Backend:', BACKEND_URL);
    console.log('\n' + '='.repeat(50) + '\n');
    
    let passedTests = 0;
    let failedTests = 0;
    
    // Test 1: Backend Health Check
    console.log('1. Testing Backend Health...');
    try {
        const health = await axios.get(`${BACKEND_URL}/api/health`);
        console.log('✅ Backend is healthy:', health.data);
        passedTests++;
    } catch (error) {
        console.log('❌ Backend health check failed:', error.message);
        failedTests++;
    }
    
    // Test 2: CORS from Frontend Domain
    console.log('\n2. Testing CORS Configuration...');
    try {
        const corsTest = await axios.get(`${BACKEND_URL}/api/health`, {
            headers: {
                'Origin': FRONTEND_URL,
                'Referer': FRONTEND_URL
            }
        });
        console.log('✅ CORS is properly configured');
        passedTests++;
    } catch (error) {
        console.log('❌ CORS test failed:', error.message);
        failedTests++;
    }
    
    // Test 3: Authentication Endpoints
    console.log('\n3. Testing Authentication Endpoints...');
    const authEndpoints = [
        { path: '/api/auth/customer/register', method: 'OPTIONS' },
        { path: '/api/auth/customer/login', method: 'OPTIONS' }
    ];
    
    for (const endpoint of authEndpoints) {
        try {
            await axios({
                method: endpoint.method,
                url: `${BACKEND_URL}${endpoint.path}`,
                headers: { 'Origin': FRONTEND_URL }
            });
            console.log(`✅ ${endpoint.path} is accessible`);
            passedTests++;
        } catch (error) {
            console.log(`❌ ${endpoint.path} failed:`, error.response?.status || error.message);
            failedTests++;
        }
    }
    
    // Test 4: Quote Endpoints
    console.log('\n4. Testing Quote Endpoints...');
    const quoteEndpoints = [
        '/api/quotes',
        '/api/package-quotes/parse-products'
    ];
    
    for (const endpoint of quoteEndpoints) {
        try {
            await axios.options(`${BACKEND_URL}${endpoint}`, {
                headers: { 'Origin': FRONTEND_URL }
            });
            console.log(`✅ ${endpoint} is accessible`);
            passedTests++;
        } catch (error) {
            console.log(`❌ ${endpoint} failed:`, error.response?.status || error.message);
            failedTests++;
        }
    }
    
    // Test 5: Frontend Accessibility
    console.log('\n5. Testing Frontend...');
    try {
        const frontend = await axios.get(FRONTEND_URL);
        if (frontend.data.includes('Smart Quote Generator') || frontend.data.includes('React')) {
            console.log('✅ Frontend is loading correctly');
            passedTests++;
        } else {
            console.log('⚠️  Frontend loaded but content might be incorrect');
        }
    } catch (error) {
        console.log('❌ Frontend test failed:', error.message);
        failedTests++;
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    
    if (failedTests === 0) {
        console.log('\n🎉 All tests passed! Your deployment is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Check the errors above.');
    }
    
    // Manual test instructions
    console.log('\n📋 Manual Testing Checklist:');
    console.log('1. Open ' + FRONTEND_URL);
    console.log('2. Try the quote generator (upload a DXF or enter manual measurements)');
    console.log('3. Visit customer portal: ' + FRONTEND_URL + '/customer-portal');
    console.log('4. Register a new customer account');
    console.log('5. Log in and create a quote');
    console.log('6. Test package quotes feature');
    
    console.log('\n🔧 If you see errors:');
    console.log('1. Check Railway logs for backend errors');
    console.log('2. Check browser console for frontend errors');
    console.log('3. Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0');
    console.log('4. Make sure Railway has all environment variables set');
}

// Run the test
testDeployment().catch(console.error);