Write-Host "Fixing customer portal routing issue..." -ForegroundColor Green

git status --short

git add amplify.yml
git add frontend/public/_redirects

git commit -m "Fix: Add SPA routing configuration for customer portal"

git push origin main

Write-Host "Fix deployed! Check Amplify console for deployment status." -ForegroundColor Green