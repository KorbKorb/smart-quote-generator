Write-Host "Fixing customer portal routing..." -ForegroundColor Yellow

git add amplify.yml frontend/public/redirects.json frontend/public/_redirects
git commit -m "Fix: Add comprehensive SPA routing rules for Amplify"
git push origin main

Write-Host "`nChanges pushed!" -ForegroundColor Green
Write-Host "`nIMPORTANT: For immediate fix:" -ForegroundColor Red
Write-Host "1. Go to AWS Amplify Console"
Write-Host "2. Click 'Rewrites and redirects'"
Write-Host "3. Add the rewrite rule manually"
Write-Host "4. This fixes it instantly without waiting for deployment"