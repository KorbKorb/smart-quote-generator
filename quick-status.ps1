# Quick way to share project status with Claude
# Run: ./quick-status.ps1

Write-Host "=== Smart Quote Generator Status ===" -ForegroundColor Cyan
Write-Host "Generated: $(Get-Date)" -ForegroundColor Gray

Write-Host "`n📁 Git Status:" -ForegroundColor Yellow
git status --short

Write-Host "`n🔧 Current Branch:" -ForegroundColor Yellow  
git branch --show-current

Write-Host "`n📝 Recent Commits:" -ForegroundColor Yellow
git log --oneline -5

Write-Host "`n⚠️ Last Error (if any):" -ForegroundColor Red
if (Test-Path .claude/last-error.txt) {
    Get-Content .claude/last-error.txt -Tail 20
} else {
    Write-Host "No recent errors" -ForegroundColor Green
}

Write-Host "`n✅ Health Check Summary:" -ForegroundColor Green
if (Test-Path health-check-report.json) {
    $report = Get-Content health-check-report.json | ConvertFrom-Json
    Write-Host "Passed: $($report.summary.passed)" -ForegroundColor Green
    Write-Host "Failed: $($report.summary.failed)" -ForegroundColor Red  
    Write-Host "Warnings: $($report.summary.warnings)" -ForegroundColor Yellow
}

# Save output for sharing
$output = @"
=== Status Report Generated $(Get-Date) ===
Git Status: $(git status --porcelain | Measure-Object -Line | Select-Object -ExpandProperty Lines) uncommitted changes
Branch: $(git branch --show-current)
Last Commit: $(git log -1 --pretty=format:"%h - %s")
"@

$output | Out-File -FilePath ".claude/last-status.txt"
Write-Host "`n📋 Status saved to .claude/last-status.txt" -ForegroundColor Blue