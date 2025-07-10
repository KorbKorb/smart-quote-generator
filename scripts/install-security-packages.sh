#!/bin/bash
# Install all required security packages

cd backend

echo "📦 Installing missing security packages..."

# Core security packages
npm install express-mongo-sanitize express-validator helmet compression

# Logging
npm install winston morgan

# Rate limiting
npm install express-rate-limit

# Additional packages that might be missing
npm install bcryptjs jsonwebtoken

# Development dependencies
npm install --save-dev jest supertest

echo "✅ All packages installed!"
echo ""
echo "🚀 Now you can start the server with: npm start"
