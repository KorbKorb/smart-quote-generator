Write-Host "Fixing Railway PORT configuration..." -ForegroundColor Yellow

git add backend/server.js
git commit -m "Fix: Use Railway's PORT and bind to 0.0.0.0"
git push origin main

Write-Host "`nFix pushed!" -ForegroundColor Green
Write-Host "`nIMPORTANT: Go to Railway and REMOVE PORT from environment variables" -ForegroundColor Red
Write-Host "Railway provides its own PORT - don't override it!" -ForegroundColor Yellow