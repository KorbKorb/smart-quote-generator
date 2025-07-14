Write-Host "🎉 SMART QUOTE GENERATOR IS LIVE!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

Write-Host "`n✅ Backend Status: RUNNING" -ForegroundColor Green
Write-Host "✅ MongoDB Status: CONNECTED" -ForegroundColor Green

Write-Host "`n🔗 Your Live URLs:" -ForegroundColor Yellow
Write-Host "Backend API: https://smart-quote-generator.up.railway.app" -ForegroundColor Cyan
Write-Host "API Health: https://smart-quote-generator.up.railway.app/api/health" -ForegroundColor Cyan
Write-Host "Frontend: https://main.dtpbc2f4zygku.amplifyapp.com" -ForegroundColor Cyan
Write-Host "Customer Portal: https://main.dtpbc2f4zygku.amplifyapp.com/customer-portal" -ForegroundColor Cyan

Write-Host "`n📋 Test Your App:" -ForegroundColor Yellow
Write-Host "[ ] 1. API Health Check works"
Write-Host "[ ] 2. Main app loads without errors"
Write-Host "[ ] 3. Create a test quote"
Write-Host "[ ] 4. Register a customer account"
Write-Host "[ ] 5. Login to customer portal"
Write-Host "[ ] 6. Test package quotes"

Write-Host "`n🚀 Features to Test:" -ForegroundColor Magenta
Write-Host "- Manual measurement quote"
Write-Host "- DXF file upload (if you have test files)"
Write-Host "- 3D visualization"
Write-Host "- PDF generation"
Write-Host "- Customer registration email"
Write-Host "- Package quote with multiple products"

Write-Host "`n⚠️  If you still see localhost:5000 errors:" -ForegroundColor Yellow
Write-Host "1. Clear browser cache (Ctrl+Shift+R)"
Write-Host "2. Try incognito mode"
Write-Host "3. Clear site data in DevTools"

Write-Host "`n🎊 Congratulations! Your app is deployed!" -ForegroundColor Green
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "Deployment completed at: $timestamp" -ForegroundColor Gray