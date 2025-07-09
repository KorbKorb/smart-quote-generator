# Check deployment status

Write-Host "Checking deployment setup..." -ForegroundColor Green

# Check git remotes
Write-Host "`nGit Remotes:" -ForegroundColor Yellow
git remote -v

# Check for Railway CLI
Write-Host "`nRailway CLI:" -ForegroundColor Yellow
if (Get-Command railway -ErrorAction SilentlyContinue) {
    Write-Host "Railway CLI is installed" -ForegroundColor Green
    Write-Host "Running 'railway status':" -ForegroundColor Yellow
    railway status
} else {
    Write-Host "Railway CLI not installed" -ForegroundColor Red
    Write-Host "Install from: https://docs.railway.app/develop/cli" -ForegroundColor Cyan
}

# Check current directory
Write-Host "`nCurrent Directory:" -ForegroundColor Yellow
Get-Location

# Check if logged into Railway
Write-Host "`nTo deploy with Railway CLI:" -ForegroundColor Cyan
Write-Host "1. Install Railway CLI"
Write-Host "2. Run: railway login"
Write-Host "3. Run: railway link"
Write-Host "4. Run: railway up"