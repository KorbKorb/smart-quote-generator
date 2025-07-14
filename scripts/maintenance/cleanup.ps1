# PowerShell cleanup script for Smart Quote Generator
Write-Host "Starting Smart Quote Generator cleanup..." -ForegroundColor Green
Write-Host ""

$removedItems = @()

# Function to safely remove item
function Remove-ItemSafely {
    param($Path, $Type)
    if (Test-Path $Path) {
        try {
            if ($Type -eq "Directory") {
                Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
            } else {
                Remove-Item -Path $Path -Force -ErrorAction Stop
            }
            $script:removedItems += $Path
            Write-Host "✓ Removed: $Path" -ForegroundColor Green
        } catch {
            Write-Host "✗ Failed to remove: $Path" -ForegroundColor Red
        }
    }
}

# Remove empty directories
Write-Host "Removing empty directories..." -ForegroundColor Yellow
Remove-ItemSafely ".\shared\constants" "Directory"
Remove-ItemSafely ".\shared\types" "Directory"
Remove-ItemSafely ".\shared" "Directory"
Remove-ItemSafely ".\frontend\src\services" "Directory"
Remove-ItemSafely ".\frontend\src\utils" "Directory"
Remove-ItemSafely ".\frontend\src\context" "Directory"
Remove-ItemSafely ".\frontend\src\hooks" "Directory"
Remove-ItemSafely ".\backend\tests\unit" "Directory"
Remove-ItemSafely ".\backend\tests\integration" "Directory"
Remove-ItemSafely ".\backend\tests" "Directory"
Remove-ItemSafely ".\backend\backend" "Directory"
Remove-ItemSafely ".\database\migrations" "Directory"
Remove-ItemSafely ".\database\seeds" "Directory"
Remove-ItemSafely ".\database" "Directory"

# Remove setup scripts
Write-Host ""
Write-Host "Removing setup scripts..." -ForegroundColor Yellow
Remove-ItemSafely ".\create-all-components.ps1" "File"
Remove-ItemSafely ".\create-components.ps1" "File"
Remove-ItemSafely ".\create-test-files.js" "File"
Remove-ItemSafely ".\download-cad-samples.ps1" "File"
Remove-ItemSafely ".\find-api-folders.ps1" "File"

# Remove test and utility files
Write-Host ""
Write-Host "Removing test and utility files..." -ForegroundColor Yellow
Remove-ItemSafely ".\PROJECT_CONTEXT.md" "File"
Remove-ItemSafely ".\system-check.js" "File"
Remove-ItemSafely ".\test-api.js" "File"
Remove-ItemSafely ".\backend\test-mongodb-connection.js" "File"
Remove-ItemSafely ".\backend\setup-server.ps1" "File"
Remove-ItemSafely ".\backend\services\featureDetectionSimple.js" "File"
Remove-ItemSafely ".\backend\services" "Directory"

# Clean up temp directory if it exists
if (Test-Path ".\_temp_delete_constants") {
    Remove-ItemSafely ".\_temp_delete_constants" "Directory"
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Removed $($removedItems.Count) items:" -ForegroundColor Yellow
$removedItems | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }

Write-Host ""
Write-Host "Your project structure is now clean and organized!" -ForegroundColor Green
