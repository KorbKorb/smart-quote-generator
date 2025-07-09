# Smart Quote Generator - Live Application Test Checklist

Write-Host "🚀 Smart Quote Generator - Live Application Test" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

$frontendUrl = "https://main.dtpbc2f4zygku.amplifyapp.com"
$backendUrl = "https://smart-quote-generator.up.railway.app"

Write-Host "`n📍 Your Live URLs:" -ForegroundColor Yellow
Write-Host "Frontend: $frontendUrl" -ForegroundColor Cyan
Write-Host "Backend: $backendUrl" -ForegroundColor Cyan
Write-Host "Customer Portal: $frontendUrl/customer-portal" -ForegroundColor Cyan

Write-Host "`n✅ Quick Health Checks:" -ForegroundColor Yellow

# Test backend
Write-Host "`n1. Testing Backend API..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/health" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Backend is running!" -ForegroundColor Green
        Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Backend health check failed!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host "`n📱 Manual Test Checklist:" -ForegroundColor Yellow
Write-Host "
[ ] 1. Main Application ($frontendUrl)
    - [ ] Page loads without errors
    - [ ] Pine Green theme is visible
    - [ ] Navigation menu works
    - [ ] No console errors (F12 → Console)

[ ] 2. Quote Generator
    - [ ] Click 'New Quote' or 'Create Quote'
    - [ ] Try manual measurement input
    - [ ] Enter test dimensions (e.g., 12x12 inches)
    - [ ] Generate quote successfully
    - [ ] 3D preview works (if using DXF)

[ ] 3. Customer Portal ($frontendUrl/customer-portal)
    - [ ] Portal page loads
    - [ ] Register new account:
        Email: test@example.com
        Password: Test123!
        Company: Test Company
    - [ ] Login works
    - [ ] Can view quotes (once created)

[ ] 4. Package Quotes
    - [ ] Navigate to Package Quotes
    - [ ] Enter test products:
        'Steel Plate 12x12x0.25 qty 5
         Aluminum Sheet 24x24x0.125 qty 10
         Brass Rod 1x36 qty 20'
    - [ ] Parse products successfully
    - [ ] Calculate pricing with discounts
    - [ ] Generate package quote

[ ] 5. Mobile Responsiveness
    - [ ] Open on mobile device or use F12 → Mobile view
    - [ ] Navigation menu collapses properly
    - [ ] Forms are usable on mobile
    - [ ] Buttons are tap-friendly

[ ] 6. Error Handling
    - [ ] Try invalid login credentials
    - [ ] Try uploading non-DXF file
    - [ ] Enter invalid measurements (negative numbers)
    - [ ] Proper error messages display
" -ForegroundColor White

Write-Host "`n🔍 Troubleshooting Commands:" -ForegroundColor Yellow
Write-Host "1. Check browser console: F12 → Console tab"
Write-Host "2. Check network requests: F12 → Network tab"
Write-Host "3. Railway logs: https://railway.app/dashboard → View Logs"
Write-Host "4. Test API directly: curl $backendUrl/api/health"

Write-Host "`n🎯 Common Issues & Fixes:" -ForegroundColor Red
Write-Host "- 'Network Error' → Check Railway backend is running"
Write-Host "- 'CORS Error' → Verify FRONTEND_URL in Railway vars"
Write-Host "- 'Cannot login' → Check JWT_SECRET in Railway"
Write-Host "- 'Database Error' → Verify MongoDB IP whitelist"

Write-Host "`n📊 Performance Metrics to Check:" -ForegroundColor Magenta
Write-Host "- Page load time (should be < 3 seconds)"
Write-Host "- API response time (should be < 500ms)"
Write-Host "- 3D render smooth (should be 30+ FPS)"

Write-Host "`n✨ Success Indicators:" -ForegroundColor Green
Write-Host "✅ Can create quotes without errors"
Write-Host "✅ Customer registration and login work"
Write-Host "✅ Package quotes calculate correctly"
Write-Host "✅ Mobile experience is smooth"
Write-Host "✅ No console errors in browser"

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "`n🕒 Test performed at: $timestamp" -ForegroundColor Gray