# Setup script for backend server

Write-Host "Setting up Smart Quote Generator Backend..." -ForegroundColor Green

# Create necessary directories
$directories = @(
    "uploads",
    "logs"
)

foreach ($dir in $directories) {
    $path = Join-Path $PSScriptRoot $dir
    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Force -Path $path | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Yellow
    }
}

# Create .gitkeep files to ensure directories are tracked
$gitkeepPaths = @(
    "uploads/.gitkeep",
    "logs/.gitkeep"
)

foreach ($file in $gitkeepPaths) {
    $path = Join-Path $PSScriptRoot $file
    if (!(Test-Path $path)) {
        New-Item -ItemType File -Force -Path $path | Out-Null
        Write-Host "Created file: $file" -ForegroundColor Yellow
    }
}

# Check if node_modules exists
if (!(Test-Path (Join-Path $PSScriptRoot "node_modules"))) {
    Write-Host "`nInstalling dependencies..." -ForegroundColor Cyan
    npm install
} else {
    Write-Host "`nDependencies already installed" -ForegroundColor Green
}

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host "`nTo start the server:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host "`nOr to start without nodemon:" -ForegroundColor Cyan
Write-Host "  npm start" -ForegroundColor White