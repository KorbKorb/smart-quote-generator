# Fix Frontend API Connection - Complete Solution

Write-Host "🔧 Fixing Frontend API Connection to Port 3002" -ForegroundColor Green
Write-Host ("=" * 50) -ForegroundColor Green

# Step 1: Stop all Node processes
Write-Host "`n1. Stopping all Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "   Stopping process $($_.Id)..." -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force
}
Start-Sleep -Seconds 2

# Step 2: Verify backend is running
Write-Host "`n2. Checking backend status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Backend is running on port 3002" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend is NOT running!" -ForegroundColor Red
    Write-Host "   Please start the backend first:" -ForegroundColor Yellow
    Write-Host "   cd backend" -ForegroundColor White
    Write-Host "   npm start" -ForegroundColor White
    Exit 1
}

# Step 3: Clear all caches
Write-Host "`n3. Clearing all caches..." -ForegroundColor Yellow
Set-Location -Path "frontend" -ErrorAction Stop

# Clear various caches
$cacheDirs = @(".cache", "node_modules\.cache", "build")
foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Write-Host "   Removing $dir..." -ForegroundColor Gray
        Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Clear npm cache
Write-Host "   Clearing npm cache..." -ForegroundColor Gray
npm cache clean --force 2>$null

# Step 4: Verify environment file
Write-Host "`n4. Verifying .env file..." -ForegroundColor Yellow
$envContent = Get-Content .env -Raw
if ($envContent -match "3002") {
    Write-Host "   ✅ .env file correctly set to port 3002" -ForegroundColor Green
} else {
    Write-Host "   ❌ .env file incorrect, fixing..." -ForegroundColor Red
    Set-Content -Path .env -Value "REACT_APP_API_URL=http://localhost:3002/api"
    Write-Host "   ✅ Fixed .env file" -ForegroundColor Green
}

# Step 5: Clear browser data
Write-Host "`n5. Browser cleanup instructions:" -ForegroundColor Yellow
Write-Host "   a. Open Chrome DevTools (F12)" -ForegroundColor White
Write-Host "   b. Right-click the Refresh button" -ForegroundColor White
Write-Host "   c. Select 'Empty Cache and Hard Reload'" -ForegroundColor White
Write-Host "   d. Go to Application tab, then Storage, then Clear site data" -ForegroundColor White

# Step 6: Start frontend
Write-Host "`n6. Starting frontend server..." -ForegroundColor Yellow
Write-Host "   Running: npm start" -ForegroundColor Gray
Write-Host "`n✨ Frontend will start in a new window" -ForegroundColor Green
Write-Host "Look for this in the browser console:" -ForegroundColor Cyan
Write-Host "API Base URL: http://localhost:3002/api" -ForegroundColor White

# Start in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

Write-Host "`n✅ Fix complete! The frontend should now connect to port 3002" -ForegroundColor Green
Write-Host "If you still see port 5000 errors, try:" -ForegroundColor Yellow
Write-Host "1. Use an incognito/private browser window" -ForegroundColor White
Write-Host "2. Try a different browser" -ForegroundColor White
Write-Host "3. Disable browser extensions" -ForegroundColor White

cd ..