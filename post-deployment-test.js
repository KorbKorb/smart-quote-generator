// Post-Deployment Health Check
// Run this after both frontend and backend are deployed

const axios = require('axios');

// Update these URLs after deployment
const BACKEND_URL = process.env.BACKEND_URL || 'https://smart-quote-generator.up.railway.app';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://your-app.amplifyapp.com';

async function testDeployment() {
    console.log('🚀 Smart Quote Generator - Post-Deployment Test\n');
    
    // Test Backend Health
    console.log('Testing Backend...');
    try {
        const backendHealth = await axios.get(`${BACKEND_URL}/api/health`);
        console.log('✅ Backend is healthy:', backendHealth.data);
    } catch (error) {
        console.log('❌ Backend test failed:', error.message);
    }
    
    // Test Database Connection
    console.log('\nTesting Database Connection...');
    try {
        const dbTest = await axios.get(`${BACKEND_URL}/api/test/db`);
        console.log('✅ Database connected:', dbTest.data);
    } catch (error) {
        console.log('❌ Database test failed:', error.message);
    }
    
    // Test CORS
    console.log('\nTesting CORS Configuration...');
    try {
        const corsTest = await axios.get(`${BACKEND_URL}/api/health`, {
            headers: {
                'Origin': FRONTEND_URL
            }
        });
        console.log('✅ CORS is properly configured');
    } catch (error) {
        console.log('❌ CORS test failed:', error.message);
    }
    
    // Test Authentication Endpoints
    console.log('\nTesting Authentication Endpoints...');
    const endpoints = [
        '/api/auth/customer/register',
        '/api/auth/customer/login',
        '/api/quotes',
        '/api/package-quotes/parse-products'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.options(`${BACKEND_URL}${endpoint}`);
            console.log(`✅ ${endpoint} is accessible`);
        } catch (error) {
            console.log(`❌ ${endpoint} failed:`, error.response?.status || error.message);
        }
    }
    
    // Frontend Check
    console.log('\nTesting Frontend...');
    try {
        const frontendResponse = await axios.get(FRONTEND_URL);
        console.log('✅ Frontend is accessible');
        
        // Check if API URL is configured
        if (frontendResponse.data.includes('REACT_APP_API_URL')) {
            console.log('⚠️  Warning: API URL might not be configured properly');
        }
    } catch (error) {
        console.log('❌ Frontend test failed:', error.message);
    }
    
    console.log('\n📋 Deployment Checklist:');
    console.log('1. ✅ Backend deployed to Railway');
    console.log('2. ✅ Frontend deployed to Amplify');
    console.log('3. ⏳ Update Railway env with Amplify URL');
    console.log('4. ⏳ Test customer registration flow');
    console.log('5. ⏳ Test quote creation');
    console.log('6. ⏳ Test package quotes');
    console.log('7. ⏳ Test on mobile devices');
    
    console.log('\n🔗 Important URLs:');
    console.log(`Backend API: ${BACKEND_URL}`);
    console.log(`Frontend App: ${FRONTEND_URL}`);
    console.log(`Customer Portal: ${FRONTEND_URL}/customer-portal`);
}

// Run the tests
testDeployment().catch(console.error);