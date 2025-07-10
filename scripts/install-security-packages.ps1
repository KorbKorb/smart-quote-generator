# Install all required security packages

Write-Host "📦 Installing missing security packages..." -ForegroundColor Green

cd backend

# Core security packages
Write-Host "Installing express-mongo-sanitize..." -ForegroundColor Yellow
npm install express-mongo-sanitize

Write-Host "Installing express-validator..." -ForegroundColor Yellow
npm install express-validator

Write-Host "Installing helmet..." -ForegroundColor Yellow
npm install helmet

Write-Host "Installing compression..." -ForegroundColor Yellow
npm install compression

# Logging
Write-Host "Installing winston and morgan..." -ForegroundColor Yellow
npm install winston morgan

# Rate limiting
Write-Host "Installing express-rate-limit..." -ForegroundColor Yellow
npm install express-rate-limit

# Additional packages that might be missing
Write-Host "Installing bcryptjs and jsonwebtoken..." -ForegroundColor Yellow
npm install bcryptjs jsonwebtoken

# Development dependencies
Write-Host "Installing test dependencies..." -ForegroundColor Yellow
npm install --save-dev jest supertest

Write-Host "`n✅ All packages installed!" -ForegroundColor Green
Write-Host "`n🚀 Now you can start the server with: npm start" -ForegroundColor Cyan

cd ..
