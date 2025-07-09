Write-Host "Testing local build..." -ForegroundColor Yellow

cd frontend

# Clean previous build
if (Test-Path "build") {
    Remove-Item -Recurse -Force build
}

# Run build
Write-Host "`nRunning build..." -ForegroundColor Cyan
npm run build

# Check build output
Write-Host "`nBuild contents:" -ForegroundColor Green
Get-ChildItem -Path build -Recurse | Select-Object FullName

# Check specifically for static files
Write-Host "`nStatic directory contents:" -ForegroundColor Yellow
if (Test-Path "build/static") {
    Get-ChildItem -Path build/static -Recurse
} else {
    Write-Host "NO STATIC DIRECTORY FOUND!" -ForegroundColor Red
}

cd ..