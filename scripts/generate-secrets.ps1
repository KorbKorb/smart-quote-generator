# Environment Variables Security Script
# Run this to generate secure secrets

Write-Host "🔐 Generating Secure Environment Variables" -ForegroundColor Green
Write-Host ""

# Generate JWT Secret
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})
Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor Yellow
Write-Host ""

# Generate MongoDB Password
$mongoPassword = -join ((65..90) + (97..122) + (48..57) + (33..47) | Get-Random -Count 24 | % {[char]$_})
Write-Host "Suggested MongoDB Password: $mongoPassword" -ForegroundColor Yellow
Write-Host ""

Write-Host "⚠️  IMPORTANT STEPS:" -ForegroundColor Red
Write-Host "1. Copy the JWT_SECRET above and update your .env file"
Write-Host "2. Change your MongoDB Atlas password to the suggested password"
Write-Host "3. Update MONGODB_URI with the new password"
Write-Host "4. Never commit .env to git"
Write-Host "5. Add .env to .gitignore if not already there"
Write-Host ""
Write-Host "📝 Your new MongoDB URI format:" -ForegroundColor Cyan
Write-Host "mongodb+srv://korbin:$mongoPassword@cluster0.3j07acq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"