Write-Host "Forcing Amplify rebuild..." -ForegroundColor Yellow

git add frontend/src/rebuild-marker.js
git commit -m "Force rebuild: Fix API URL configuration"
git push origin main

Write-Host "`nAmplify will rebuild with correct environment variables" -ForegroundColor Green
Write-Host "This takes 2-3 minutes" -ForegroundColor Gray

Write-Host "`nWhile waiting:" -ForegroundColor Cyan
Write-Host "1. Clear your browser cache completely"
Write-Host "2. Try incognito/private browsing mode"
Write-Host "3. Check: https://smart-quote-generator.up.railway.app/api/health"