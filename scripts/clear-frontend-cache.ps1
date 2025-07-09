# Clear frontend cache and restart
Write-Host "🧹 Clearing React cache and restarting frontend..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location -Path "frontend" -ErrorAction Stop

# Kill any running Node processes
Write-Host "Stopping any running React processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Remove React cache directories
Write-Host "Removing cache directories..." -ForegroundColor Yellow
Remove-Item -Path ".cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue

# Clear build directory
Write-Host "Clearing build directory..." -ForegroundColor Yellow
Remove-Item -Path "build" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "✅ Cache cleared!" -ForegroundColor Green
Write-Host ""
Write-Host "Now start the frontend with:" -ForegroundColor Cyan
Write-Host "npm start" -ForegroundColor White
Write-Host ""
Write-Host "The browser console should show:" -ForegroundColor Cyan
Write-Host "API Base URL: http://localhost:3002/api" -ForegroundColor White

# Return to root directory
Set-Location -Path ".."
