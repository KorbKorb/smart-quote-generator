# Railway Environment Variables Checklist

Write-Host "Railway Environment Variables Setup Guide" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`n📋 Required Variables for Railway:" -ForegroundColor Yellow

Write-Host "`n1. JWT_SECRET" -ForegroundColor Cyan
Write-Host "   - Generate using: node generate-jwt-secret.js"
Write-Host "   - Example format: 64+ character hex string"

Write-Host "`n2. MONGODB_URI" -ForegroundColor Cyan
Write-Host "   - Your value: mongodb+srv://korbin:tNNVo2AYGFOHYJau@cluster0.3j07acq.mongodb.net/"
Write-Host "   - Make sure MongoDB Atlas allows access from anywhere (0.0.0.0/0)"

Write-Host "`n3. FRONTEND_URL" -ForegroundColor Cyan
Write-Host "   - Your value: https://main.dtpbc2f4zygku.amplifyapp.com"

Write-Host "`n4. NODE_ENV" -ForegroundColor Cyan
Write-Host "   - Your value: production"

Write-Host "`n5. PORT" -ForegroundColor Cyan
Write-Host "   - Your value: 3002 (or leave empty, Railway assigns automatically)"

Write-Host "`n🚀 How to add to Railway:" -ForegroundColor Green
Write-Host "1. Go to: https://railway.app/dashboard"
Write-Host "2. Click your project"
Write-Host "3. Click Variables tab"
Write-Host "4. Add each variable above"
Write-Host "5. Railway will auto-redeploy"

Write-Host "`n⚠️  Common Issues:" -ForegroundColor Red
Write-Host "- Missing JWT_SECRET = Users can't login"
Write-Host "- Wrong MONGODB_URI = Backend crashes"
Write-Host "- Missing FRONTEND_URL = CORS errors"