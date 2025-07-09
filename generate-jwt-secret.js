// Generate a secure JWT_SECRET
const crypto = require('crypto');

console.log('🔐 Generating secure JWT_SECRET for Smart Quote Generator\n');

// Generate a cryptographically secure random string
const generateSecret = () => {
    return crypto.randomBytes(64).toString('hex');
};

const newSecret = generateSecret();

console.log('Your new JWT_SECRET:');
console.log('='.repeat(50));
console.log(newSecret);
console.log('='.repeat(50));

console.log('\n📋 What to do with this secret:\n');
console.log('1. Copy the secret above');
console.log('2. Update your backend/.env file');
console.log('3. Add it to Railway environment variables');
console.log('4. NEVER commit this to Git or share it publicly');

console.log('\n🚀 Update in Railway:');
console.log('1. Go to https://railway.app/dashboard');
console.log('2. Click on your project');
console.log('3. Go to Variables tab');
console.log('4. Add/Update: JWT_SECRET = [paste the secret]');

console.log('\n⚠️  Security Tips:');
console.log('- Keep this secret private');
console.log('- Use different secrets for development and production');
console.log('- Rotate (change) it periodically');
console.log('- If exposed, generate a new one immediately');