# Fix MongoDB Auth - Remove .env from Git

Write-Host "Fixing MongoDB authentication issue..." -ForegroundColor Red

# Check if .env is tracked by git
Write-Host "`nChecking if .env files are in git..." -ForegroundColor Yellow
git ls-files | Select-String "\.env$"

# Remove .env files from git (but keep them locally)
Write-Host "`nRemoving .env files from git tracking..." -ForegroundColor Yellow
git rm --cached backend/.env 2>$null
git rm --cached frontend/.env 2>$null

# Ensure .gitignore has .env
Write-Host "`nChecking .gitignore..." -ForegroundColor Yellow
$gitignoreContent = Get-Content .gitignore -Raw
if ($gitignoreContent -notmatch "\.env") {
    Add-Content .gitignore "`n# Environment files`n.env`n.env.local"
    Write-Host "Added .env to .gitignore" -ForegroundColor Green
}

# Commit and push
Write-Host "`nCommitting fix..." -ForegroundColor Yellow
git add .gitignore
git commit -m "Fix: Remove .env from git, use Railway environment variables"
git push origin main

Write-Host "`n✅ Fix deployed!" -ForegroundColor Green
Write-Host "`nRailway will now use environment variables instead of .env file" -ForegroundColor Cyan
Write-Host "Deployment will take 2-3 minutes" -ForegroundColor Gray

Write-Host "`n⚠️ IMPORTANT: Verify in Railway:" -ForegroundColor Red
Write-Host "1. Go to Variables tab"
Write-Host "2. Make sure MONGODB_URI is set to:"
Write-Host "   mongodb+srv://korbin:7TVPNDteXClUVP2b@cluster0.3j07acq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"