#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 Generating self-signed SSL certificate for local development\n');

const certsDir = path.join(__dirname, '../backend/certs');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Check if OpenSSL is available
try {
  execSync('openssl version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ OpenSSL is not installed or not in PATH');
  console.log('Please install OpenSSL first:');
  console.log('  Windows: Download from https://slproweb.com/products/Win32OpenSSL.html');
  console.log('  Mac: brew install openssl');
  console.log('  Linux: sudo apt-get install openssl');
  process.exit(1);
}

// Generate certificate
const keyPath = path.join(certsDir, 'key.pem');
const certPath = path.join(certsDir, 'cert.pem');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('✅ SSL certificates already exist');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
} else {
  console.log('Generating new SSL certificate...\n');
  
  const command = `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`;
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log('\n✅ SSL certificate generated successfully!');
    console.log(`   Key: ${keyPath}`);
    console.log(`   Cert: ${certPath}`);
  } catch (error) {
    console.error('❌ Failed to generate SSL certificate');
    process.exit(1);
  }
}

// Create HTTPS server configuration
const httpsConfig = `
// HTTPS configuration for local development
const https = require('https');
const fs = require('fs');
const path = require('path');

const getHttpsOptions = () => {
  const keyPath = path.join(__dirname, '../certs/key.pem');
  const certPath = path.join(__dirname, '../certs/cert.pem');
  
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
  }
  
  return null;
};

module.exports = { getHttpsOptions };
`;

const configPath = path.join(__dirname, '../backend/src/config/https.js');
fs.writeFileSync(configPath, httpsConfig.trim());

console.log('\n📝 To use HTTPS in development:');
console.log('1. Update your server.js to use HTTPS');
console.log('2. Access your app at https://localhost:3002');
console.log('3. Accept the self-signed certificate warning in your browser\n');

// Update .gitignore
const gitignorePath = path.join(__dirname, '../.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  if (!gitignoreContent.includes('certs/')) {
    fs.appendFileSync(gitignorePath, '\n# SSL certificates\ncerts/\n*.pem\n');
    console.log('✅ Added certs/ to .gitignore\n');
  }
}