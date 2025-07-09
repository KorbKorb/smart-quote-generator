Write-Host "MongoDB Password Updated!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

Write-Host "`nNew password: 7TVPNDteXClUVP2b" -ForegroundColor Yellow

Write-Host "`nChecklist:" -ForegroundColor Cyan
Write-Host "[?] Did you update Railway MONGODB_URI variable?"
Write-Host "[?] Is Railway redeploying?"
Write-Host "[?] Local .env file updated"

Write-Host "`nTo check Railway deployment:" -ForegroundColor Yellow
Write-Host "1. Go to: https://railway.app/dashboard"
Write-Host "2. Click your project"
Write-Host "3. Click View Logs"
Write-Host "4. Look for: Connected to MongoDB"

Write-Host "`nDeployment usually takes 2-3 minutes" -ForegroundColor Gray

Write-Host "`nOnce deployed, test your app:" -ForegroundColor Green
Write-Host "- API Health: https://smart-quote-generator.up.railway.app/api/health"
Write-Host "- Main App: https://main.dtpbc2f4zygku.amplifyapp.com"
Write-Host "- Customer Portal: https://main.dtpbc2f4zygku.amplifyapp.com/customer-portal"

Write-Host "`nYour app should now be fully functional!" -ForegroundColor Green