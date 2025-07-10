#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('\n🔐 Security Configuration Checker\n');

// Check if .env exists
const envPath = path.join(__dirname, '../backend/.env');
const envExamplePath = path.join(__dirname, '../backend/.env.example');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('Creating .env from .env.example...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file. Please update it with your values.');
  }
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');
const envVars = {};

envLines.forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

console.log('🔍 Checking environment variables...\n');

// Security checks
const securityIssues = [];

// 1. Check JWT_SECRET
if (!envVars.JWT_SECRET) {
  securityIssues.push('JWT_SECRET is missing');
} else if (envVars.JWT_SECRET.length < 32) {
  securityIssues.push('JWT_SECRET is too short (must be at least 32 characters)');
} else if (envVars.JWT_SECRET.includes('your-jwt-secret')) {
  securityIssues.push('JWT_SECRET contains default value');
}

// 2. Check MongoDB URI
if (!envVars.MONGODB_URI) {
  securityIssues.push('MONGODB_URI is missing');
} else {
  // Check for exposed password
  if (envVars.MONGODB_URI.includes('7TVPNDteXClUVP2b')) {
    securityIssues.push('⚠️  CRITICAL: MongoDB password is exposed! Change it immediately!');
  }
  if (envVars.MONGODB_URI.includes('your-mongodb-connection')) {
    securityIssues.push('MongoDB URI contains placeholder value');
  }
}

// 3. Check NODE_ENV
if (!envVars.NODE_ENV) {
  securityIssues.push('NODE_ENV is not set');
}

// 4. Check email configuration (optional)
if (envVars.SMTP_USER && envVars.SMTP_USER.includes('your-email')) {
  // This is optional, so we'll just warn
  console.log('ℹ️  Email configuration uses placeholder values');
  console.log('   Update SMTP settings when you need email functionality\n');
}

// Report findings
if (securityIssues.length > 0) {
  console.log('❌ Security issues found:\n');
  securityIssues.forEach(issue => {
    console.log(`   • ${issue}`);
  });
  
  console.log('\n📝 Recommendations:\n');
  
  // Generate new JWT secret if needed
  if (securityIssues.some(issue => issue.includes('JWT_SECRET'))) {
    const newSecret = crypto.randomBytes(64).toString('hex');
    console.log('1. Update JWT_SECRET with this value:');
    console.log(`   JWT_SECRET=${newSecret}\n`);
  }
  
  // MongoDB password recommendation
  if (securityIssues.some(issue => issue.includes('MongoDB'))) {
    const newPassword = crypto.randomBytes(16).toString('hex');
    console.log('2. Change your MongoDB password:');
    console.log('   a. Go to MongoDB Atlas');
    console.log('   b. Database Access > Edit user');
    console.log(`   c. Set new password: ${newPassword}`);
    console.log(`   d. Update MONGODB_URI with the new password\n`);
  }
  
} else {
  console.log('✅ No critical security issues found!\n');
}

// Check .gitignore
const gitignorePath = path.join(__dirname, '../.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  if (!gitignoreContent.includes('.env')) {
    console.log('⚠️  WARNING: .env is not in .gitignore!');
    console.log('   Add these lines to .gitignore:');
    console.log('   .env');
    console.log('   .env.local');
    console.log('   .env.*.local\n');
  }
}

// Check for other security files
console.log('📁 Checking security files...\n');

const requiredFiles = [
  'backend/src/middleware/auth.js',
  'backend/src/middleware/validators.js',
  'backend/src/middleware/rateLimiter.js',
  'backend/src/config/validateEnv.js'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - Missing!`);
  }
});

console.log('\n✨ Security check complete!\n');

// Final recommendations
if (securityIssues.length > 0) {
  console.log('⚠️  Please fix the security issues before deploying to production.');
  process.exit(1);
} else {
  console.log('👍 Your application security configuration looks good!');
  console.log('   Remember to:');
  console.log('   • Keep your dependencies updated');
  console.log('   • Monitor your logs regularly');
  console.log('   • Set up alerts for suspicious activity');
  console.log('   • Review security regularly\n');
}