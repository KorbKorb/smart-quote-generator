# PowerShell script to find API folders and files in smart-quote-generator project

Write-Host "=== Searching for API folders and files in smart-quote-generator ===" -ForegroundColor Cyan
Write-Host ""

# Set the root directory
$rootPath = "C:\Users\Korbin\smart-quote-generator"

# Check if the root directory exists
if (-not (Test-Path $rootPath)) {
    Write-Host "ERROR: Root directory not found at $rootPath" -ForegroundColor Red
    exit
}

Write-Host "Searching in: $rootPath" -ForegroundColor Yellow
Write-Host ""

# Search for folders named 'api' or containing 'api' in the name
Write-Host "1. FOLDERS containing 'api' in name:" -ForegroundColor Green
Get-ChildItem -Path $rootPath -Directory -Recurse -ErrorAction SilentlyContinue | 
    Where-Object { $_.Name -like "*api*" } | 
    ForEach-Object {
        Write-Host "   Folder: $($_.FullName)" -ForegroundColor White
    }

Write-Host ""

# Search for routes folders (common API location)
Write-Host "2. ROUTES folders (common API location):" -ForegroundColor Green
Get-ChildItem -Path $rootPath -Directory -Recurse -ErrorAction SilentlyContinue | 
    Where-Object { $_.Name -eq "routes" } | 
    ForEach-Object {
        Write-Host "   Folder: $($_.FullName)" -ForegroundColor White
        # List files in routes folder
        Get-ChildItem -Path $_.FullName -File | ForEach-Object {
            Write-Host "      File: $($_.Name)" -ForegroundColor Gray
        }
    }

Write-Host ""

# Search for files that might contain API routes
Write-Host "3. FILES that might contain API endpoints:" -ForegroundColor Green
Write-Host "   (searching for app.js, server.js, index.js in backend)" -ForegroundColor DarkGray

$backendPath = Join-Path $rootPath "backend"
if (Test-Path $backendPath) {
    Get-ChildItem -Path $backendPath -Recurse -Include "app.js", "server.js", "index.js" -File | 
        ForEach-Object {
            Write-Host "   File: $($_.FullName)" -ForegroundColor White
        }
}

Write-Host ""

# Check backend structure
Write-Host "4. BACKEND FOLDER STRUCTURE:" -ForegroundColor Green
if (Test-Path $backendPath) {
    Write-Host "   Backend folder exists at: $backendPath" -ForegroundColor White
    
    # Show backend src structure
    $srcPath = Join-Path $backendPath "src"
    if (Test-Path $srcPath) {
        Write-Host "   backend/src/" -ForegroundColor White
        Get-ChildItem -Path $srcPath -Directory | ForEach-Object {
            Write-Host "      $($_.Name)/" -ForegroundColor Gray
            # Show files in each subdirectory
            Get-ChildItem -Path $_.FullName -File | Select-Object -First 5 | ForEach-Object {
                Write-Host "         $($_.Name)" -ForegroundColor DarkGray
            }
        }
    }
} else {
    Write-Host "   Backend folder not found!" -ForegroundColor Red
}

Write-Host ""

# Check if quotes.js exists
Write-Host "5. CHECKING quotes.js for API routes:" -ForegroundColor Green
$quotesPath = Join-Path $rootPath "backend\src\routes\quotes.js"
if (Test-Path $quotesPath) {
    Write-Host "   OK: quotes.js exists at: $quotesPath" -ForegroundColor White
    
    # Check how it's mounted in app.js
    $appJsPath = Join-Path $rootPath "backend\src\app.js"
    if (Test-Path $appJsPath) {
        Write-Host "   Checking app.js for route mounting..." -ForegroundColor Yellow
        $appContent = Get-Content $appJsPath -ErrorAction SilentlyContinue
        $quotesLines = $appContent | Select-String "quotes" | Select-Object -First 3
        if ($quotesLines) {
            Write-Host "   Found in app.js:" -ForegroundColor Yellow
            foreach ($line in $quotesLines) {
                Write-Host "      Line $($line.LineNumber): $($line.Line.Trim())" -ForegroundColor DarkGray
            }
        }
    }
} else {
    Write-Host "   ERROR: quotes.js not found!" -ForegroundColor Red
}

Write-Host ""

# Quick check for API usage in frontend
Write-Host "6. FRONTEND API CALLS:" -ForegroundColor Green
$frontendPath = Join-Path $rootPath "frontend\src"
if (Test-Path $frontendPath) {
    $apiCalls = Get-ChildItem -Path $frontendPath -Recurse -Include "*.js", "*.jsx" -File -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notlike "*node_modules*" } |
        ForEach-Object {
            $content = Get-Content $_.FullName -ErrorAction SilentlyContinue
            $matches = $content | Select-String "localhost:5000" -ErrorAction SilentlyContinue
            if ($matches) {
                [PSCustomObject]@{
                    File = $_.FullName
                    Matches = $matches
                }
            }
        }
    
    if ($apiCalls) {
        $apiCalls | ForEach-Object {
            Write-Host "   File: $($_.File)" -ForegroundColor White
            $_.Matches | Select-Object -First 2 | ForEach-Object {
                Write-Host "      $($_.Line.Trim())" -ForegroundColor DarkGray
            }
        }
    }
}

Write-Host ""
Write-Host "=== Search Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- Your API routes should be in: backend/src/routes/" -ForegroundColor White
Write-Host "- They should be mounted in: backend/src/app.js" -ForegroundColor White
Write-Host "- URLs will be like: http://localhost:5000/api/quotes/..." -ForegroundColor White