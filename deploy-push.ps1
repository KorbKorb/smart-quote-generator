# Quick deployment push script

Write-Host "Pushing changes to trigger redeployment..." -ForegroundColor Green

# Add all changes
git add .

# Commit with deployment message
git commit -m "Update production configuration with Amplify URL"

# Push to GitHub
git push origin main

Write-Host "`nDeployment triggered!" -ForegroundColor Green
Write-Host "Check deployment status at:" -ForegroundColor Yellow
Write-Host "- Railway: https://railway.app/dashboard" -ForegroundColor Cyan
Write-Host "- Amplify: https://console.aws.amazon.com/amplify" -ForegroundColor Cyan

Write-Host "`nYour app URLs:" -ForegroundColor Yellow
Write-Host "- Frontend: https://main.dtpbc2f4zygku.amplifyapp.com" -ForegroundColor Green
Write-Host "- Backend: https://smart-quote-generator.up.railway.app" -ForegroundColor Green
Write-Host "- Customer Portal: https://main.dtpbc2f4zygku.amplifyapp.com/customer-portal" -ForegroundColor Green