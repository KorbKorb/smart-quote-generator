# Smart Quote Generator - Deployment Checklist

Write-Host "Smart Quote Generator Deployment Checklist" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check current branch
Write-Host "`nGit Status:" -ForegroundColor Yellow
git branch --show-current
git status --short

# Environment check
Write-Host "`nEnvironment Variables:" -ForegroundColor Yellow

# Backend env check
if (Test-Path "backend\.env") {
    Write-Host "OK: Backend .env exists" -ForegroundColor Green
    $backendEnv = Get-Content "backend\.env"
    if ($backendEnv -match "JWT_SECRET") {
        Write-Host "OK: JWT_SECRET is set" -ForegroundColor Green
    } else {
        Write-Host "ERROR: JWT_SECRET is missing!" -ForegroundColor Red
    }
    if ($backendEnv -match "MONGODB_URI") {
        Write-Host "OK: MONGODB_URI is set" -ForegroundColor Green
    } else {
        Write-Host "ERROR: MONGODB_URI is missing!" -ForegroundColor Red
    }
} else {
    Write-Host "ERROR: Backend .env is missing!" -ForegroundColor Red
}

# Frontend env check
if (Test-Path "frontend\.env.production") {
    Write-Host "OK: Frontend .env.production exists" -ForegroundColor Green
} else {
    Write-Host "ERROR: Frontend .env.production is missing!" -ForegroundColor Red
}

# Railway check
Write-Host "`nRailway Deployment:" -ForegroundColor Yellow
if (Test-Path "backend\railway.json") {
    Write-Host "OK: railway.json exists" -ForegroundColor Green
} else {
    Write-Host "ERROR: railway.json is missing!" -ForegroundColor Red
}

# Amplify check
Write-Host "`nAWS Amplify:" -ForegroundColor Yellow
if (Test-Path "amplify.yml") {
    Write-Host "OK: amplify.yml exists" -ForegroundColor Green
} else {
    Write-Host "ERROR: amplify.yml is missing!" -ForegroundColor Red
}

# Package lock check
Write-Host "`nPackage Lock Files:" -ForegroundColor Yellow
if (Test-Path "backend\package-lock.json") {
    Write-Host "OK: Backend package-lock.json exists" -ForegroundColor Green
} else {
    Write-Host "ERROR: Backend package-lock.json missing!" -ForegroundColor Red
}

if (Test-Path "frontend\package-lock.json") {
    Write-Host "OK: Frontend package-lock.json exists" -ForegroundColor Green
} else {
    Write-Host "ERROR: Frontend package-lock.json missing!" -ForegroundColor Red
}

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Push to GitHub: git push origin main"
Write-Host "2. Check Railway deployment: https://railway.app/dashboard"
Write-Host "3. Set up AWS Amplify:"
Write-Host "   - Go to https://console.aws.amazon.com/amplify"
Write-Host "   - Connect your GitHub repo"
Write-Host "   - Select frontend as the root directory"
Write-Host "   - Deploy!"
Write-Host "4. Update Railway environment variables with Amplify URL"
Write-Host "5. Test both customer portal and admin interface"

Write-Host "`nImportant URLs to save:" -ForegroundColor Magenta
Write-Host "- Railway Backend: https://smart-quote-generator.up.railway.app"
Write-Host "- Amplify Frontend: (will be generated after deployment)"
Write-Host "- MongoDB Atlas: https://cloud.mongodb.com"