Write-Host "MongoDB Authentication Fix Helper" -ForegroundColor Red
Write-Host "=================================" -ForegroundColor Red

Write-Host "`nYour backend is DOWN due to MongoDB authentication failure!" -ForegroundColor Red

Write-Host "`nImmediate Actions Required:" -ForegroundColor Yellow
Write-Host "1. Open: https://cloud.mongodb.com" -ForegroundColor Cyan
Write-Host "2. Go to Database Access" -ForegroundColor Cyan
Write-Host "3. Create new user or reset password" -ForegroundColor Cyan
Write-Host "4. Update Railway environment variable" -ForegroundColor Cyan

Write-Host "`nYour current connection string in Railway:" -ForegroundColor Yellow
Write-Host "mongodb+srv://korbin:tNNVo2AYGFOHYJau@cluster0.3j07acq.mongodb.net/" -ForegroundColor Gray

Write-Host "`nThis password appears to be incorrect!" -ForegroundColor Red

Write-Host "`nOnce you have a new password:" -ForegroundColor Green
Write-Host "1. Go to: https://railway.app/dashboard"
Write-Host "2. Click your project"
Write-Host "3. Go to Variables tab"
Write-Host "4. Update MONGODB_URI"
Write-Host "5. Railway will auto-redeploy"

Write-Host "`nYour app will not work until this is fixed!" -ForegroundColor Red