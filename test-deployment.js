// Quick deployment test with your actual URLs

const FRONTEND_URL = 'https://main.dtpbc2f4zygku.amplifyapp.com';
const BACKEND_URL = 'https://smart-quote-generator.up.railway.app'; // Update this with your Railway URL

console.log('🚀 Testing Smart Quote Generator Deployment\n');

console.log('Frontend URL:', FRONTEND_URL);
console.log('Backend URL:', BACKEND_URL);

console.log('\n📋 Quick Tests:');
console.log('1. Frontend: ' + FRONTEND_URL);
console.log('2. Customer Portal: ' + FRONTEND_URL + '/customer-portal');
console.log('3. Backend Health: ' + BACKEND_URL + '/api/health');

console.log('\n⚡ To test in browser:');
console.log('1. Open', FRONTEND_URL);
console.log('2. Try creating a quote');
console.log('3. Visit customer portal at', FRONTEND_URL + '/customer-portal');

console.log('\n🔧 If you see connection errors:');
console.log('1. Make sure Railway backend is deployed');
console.log('2. Add FRONTEND_URL to Railway environment variables');
console.log('3. Check MongoDB Atlas IP whitelist');
console.log('4. Verify the backend URL in frontend .env.production');