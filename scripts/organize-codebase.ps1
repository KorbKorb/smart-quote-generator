# Smart Quote Generator - Codebase Organization Script
# This script helps organize the project structure

Write-Host "Smart Quote Generator - Codebase Organization" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Create backup tag
Write-Host "`nCreating git backup tag..." -ForegroundColor Yellow
git add .
git commit -m "Pre-cleanup checkpoint - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" 2>$null
git tag "pre-cleanup-$(Get-Date -Format 'yyyy-MM-dd')" 2>$null

# Function to move files safely
function Move-FilesSafely {
    param($Source, $Destination, $Pattern = "*")
    
    if (Test-Path $Source) {
        $files = Get-ChildItem -Path $Source -Filter $Pattern -File
        foreach ($file in $files) {
            $destPath = Join-Path $Destination $file.Name
            if (-not (Test-Path $destPath)) {
                Move-Item -Path $file.FullName -Destination $Destination -Force
                Write-Host "  Moved: $($file.Name)" -ForegroundColor Green
            } else {
                Write-Host "  Skipped (exists): $($file.Name)" -ForegroundColor Yellow
            }
        }
    }
}

# Organize scripts into subdirectories
Write-Host "`nOrganizing scripts directory..." -ForegroundColor Yellow

# Deployment scripts
Write-Host "  Moving deployment scripts..." -ForegroundColor Cyan
Move-FilesSafely -Source "scripts" -Destination "scripts\deployment" -Pattern "*deploy*.ps1"
Move-FilesSafely -Source "scripts" -Destination "scripts\deployment" -Pattern "*railway*.ps1"
Move-FilesSafely -Source "scripts" -Destination "scripts\deployment" -Pattern "check-server.sh"

# Development scripts
Write-Host "  Moving development scripts..." -ForegroundColor Cyan
Move-FilesSafely -Source "scripts" -Destination "scripts\development" -Pattern "start-*.bat"
Move-FilesSafely -Source "scripts" -Destination "scripts\development" -Pattern "generate-*.js"
Move-FilesSafely -Source "scripts" -Destination "scripts\development" -Pattern "debug-*.js"
Move-FilesSafely -Source "scripts" -Destination "scripts\development" -Pattern "inspect-*.js"

# Testing scripts
Write-Host "  Moving testing scripts..." -ForegroundColor Cyan
Move-FilesSafely -Source "scripts" -Destination "scripts\testing" -Pattern "test-*.js"
Move-FilesSafely -Source "scripts" -Destination "scripts\testing" -Pattern "test-*.ps1"

# Maintenance scripts
Write-Host "  Moving maintenance scripts..." -ForegroundColor Cyan
Move-FilesSafely -Source "scripts" -Destination "scripts\maintenance" -Pattern "cleanup*.ps1"
Move-FilesSafely -Source "scripts" -Destination "scripts\maintenance" -Pattern "cleanup*.bat"
Move-FilesSafely -Source "scripts" -Destination "scripts\maintenance" -Pattern "clear-*.ps1"
Move-FilesSafely -Source "scripts" -Destination "scripts\maintenance" -Pattern "fix-*.ps1"
Move-FilesSafely -Source "scripts" -Destination "scripts\maintenance" -Pattern "urgent-*.ps1"

# Archive old checkpoints
Write-Host "`nArchiving old checkpoint files..." -ForegroundColor Yellow
$checkpointDir = "docs\checkpoints"
if (-not (Test-Path $checkpointDir)) {
    New-Item -ItemType Directory -Path $checkpointDir -Force | Out-Null
}

$checkpoints = Get-ChildItem -Path . -Filter "CHECKPOINT*.md" -File
$checkpoints += Get-ChildItem -Path . -Filter "PROJECT_*.md" -File
foreach ($checkpoint in $checkpoints) {
    if ($checkpoint.Name -ne "CHECKPOINT.md") {
        Move-Item -Path $checkpoint.FullName -Destination $checkpointDir -Force
        Write-Host "  Archived: $($checkpoint.Name)" -ForegroundColor Green
    }
}

# Create consolidated checkpoint if it doesn't exist
if (-not (Test-Path "CHECKPOINT.md")) {
    Write-Host "`nCreating consolidated CHECKPOINT.md..." -ForegroundColor Yellow
    Write-Host "  Please update CHECKPOINT.md with the comprehensive checkpoint content" -ForegroundColor Cyan
}

# Clean up backend structure
Write-Host "`nChecking backend structure..." -ForegroundColor Yellow
$backendSrc = "backend\src"
$backendRoot = "backend"

# List potential duplicates
$srcDirs = @("models", "routes", "utils", "middleware")
foreach ($dir in $srcDirs) {
    $rootPath = Join-Path $backendRoot $dir
    $srcPath = Join-Path $backendSrc $dir
    
    if ((Test-Path $rootPath) -and (Test-Path $srcPath)) {
        Write-Host "  Warning: '$dir' exists in both backend root and src" -ForegroundColor Red
        Write-Host "    Root: $rootPath" -ForegroundColor Gray
        Write-Host "    Src:  $srcPath" -ForegroundColor Gray
    }
}

# Create test structure
Write-Host "`nCreating test directory structure..." -ForegroundColor Yellow
$testDirs = @(
    "backend\tests\unit\utils",
    "backend\tests\unit\models",
    "backend\tests\integration",
    "backend\tests\fixtures\sample-dxf-files"
)

foreach ($dir in $testDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  Created: $dir" -ForegroundColor Green
    }
}

# Summary
Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "Organization Summary:" -ForegroundColor Cyan
Write-Host "  - Scripts organized into subdirectories" -ForegroundColor Green
Write-Host "  - Old checkpoints archived to docs\checkpoints" -ForegroundColor Green
Write-Host "  - Test directory structure created" -ForegroundColor Green

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Review and resolve backend structure duplicates" -ForegroundColor White
Write-Host "  2. Update import paths if files were moved" -ForegroundColor White
Write-Host "  3. Run tests to ensure everything works" -ForegroundColor White
Write-Host "  4. Update CHECKPOINT.md with comprehensive content" -ForegroundColor White
Write-Host "  5. Commit the organized structure" -ForegroundColor White

Write-Host "`nTo commit changes:" -ForegroundColor Cyan
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Reorganized codebase structure'" -ForegroundColor White

Write-Host "`nOrganization complete!" -ForegroundColor Green
