Write-Host "Deploying proper SPA redirect fix..." -ForegroundColor Green

git add amplify.yml frontend/public/_redirects
git commit -m "Fix: Use _redirects file for SPA routing instead of Amplify rewrites"
git push origin main

Write-Host "`nDeployed!" -ForegroundColor Green
Write-Host "`nThis fix:" -ForegroundColor Yellow
Write-Host "1. Removes problematic Amplify rewrite rules"
Write-Host "2. Uses Netlify-style _redirects file"
Write-Host "3. Copies _redirects to build output"
Write-Host "4. Should work with CSS/JS files properly"

Write-Host "`nWait 3-5 minutes for deployment" -ForegroundColor Cyan