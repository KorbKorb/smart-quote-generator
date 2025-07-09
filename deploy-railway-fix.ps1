Write-Host "Deploying critical Railway fix..." -ForegroundColor Red

# Add and commit
git add backend/server.js backend/railway.json
git commit -m "Critical fix: Start server before MongoDB, add Railway health check config"
git push origin main

Write-Host "`nFix deployed!" -ForegroundColor Green
Write-Host "`nThis fix:" -ForegroundColor Yellow
Write-Host "1. Starts the server BEFORE connecting to MongoDB"
Write-Host "2. Adds health check endpoint that works immediately"
Write-Host "3. Adds Railway-specific configuration"
Write-Host "4. Handles SIGTERM gracefully"

Write-Host "`nRailway should now:" -ForegroundColor Cyan
Write-Host "- Detect the app is running"
Write-Host "- Not kill it with SIGTERM"
Write-Host "- Show 'Connected to MongoDB' in logs"