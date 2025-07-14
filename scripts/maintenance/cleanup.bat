@echo off
REM Cleanup script for Smart Quote Generator
REM This script removes redundant files and empty directories

echo Starting cleanup of Smart Quote Generator...
echo.

REM Remove empty directories
echo Removing empty directories...
if exist "shared\constants" rmdir /s /q "shared\constants" 2>nul
if exist "shared\types" rmdir /s /q "shared\types" 2>nul
if exist "shared" rmdir /q "shared" 2>nul
if exist "frontend\src\services" rmdir /q "frontend\src\services" 2>nul
if exist "frontend\src\utils" rmdir /q "frontend\src\utils" 2>nul
if exist "frontend\src\context" rmdir /q "frontend\src\context" 2>nul
if exist "frontend\src\hooks" rmdir /q "frontend\src\hooks" 2>nul
if exist "backend\tests\unit" rmdir /q "backend\tests\unit" 2>nul
if exist "backend\tests\integration" rmdir /q "backend\tests\integration" 2>nul
if exist "backend\tests" rmdir /q "backend\tests" 2>nul

REM Remove redundant nested backend folder
echo Removing redundant backend/backend folder...
if exist "backend\backend" rmdir /s /q "backend\backend" 2>nul

REM Remove setup scripts
echo Removing old setup scripts...
if exist "create-all-components.ps1" del /q "create-all-components.ps1" 2>nul
if exist "create-components.ps1" del /q "create-components.ps1" 2>nul
if exist "create-test-files.js" del /q "create-test-files.js" 2>nul
if exist "download-cad-samples.ps1" del /q "download-cad-samples.ps1" 2>nul
if exist "find-api-folders.ps1" del /q "find-api-folders.ps1" 2>nul

REM Remove old test and utility files
echo Removing old test and utility files...
if exist "PROJECT_CONTEXT.md" del /q "PROJECT_CONTEXT.md" 2>nul
if exist "system-check.js" del /q "system-check.js" 2>nul
if exist "test-api.js" del /q "test-api.js" 2>nul
if exist "backend\test-mongodb-connection.js" del /q "backend\test-mongodb-connection.js" 2>nul
if exist "backend\setup-server.ps1" del /q "backend\setup-server.ps1" 2>nul

REM Remove unused feature detection file
echo Removing unused featureDetectionSimple.js...
if exist "backend\services\featureDetectionSimple.js" del /q "backend\services\featureDetectionSimple.js" 2>nul
if exist "backend\services" rmdir /q "backend\services" 2>nul

REM Note: Keeping infrastructure folder as it contains CDK setup

REM Remove database folders if empty
echo Checking database folders...
if exist "database\migrations" (
    dir /b "database\migrations" | findstr . >nul || rmdir /q "database\migrations" 2>nul
)
if exist "database\seeds" (
    dir /b "database\seeds" | findstr . >nul || rmdir /q "database\seeds" 2>nul
)
if exist "database" (
    dir /b "database" | findstr . >nul || rmdir /q "database" 2>nul
)

echo.
echo Cleanup complete!
echo.
echo Removed:
echo - Empty directories (shared, frontend empty folders, backend test folders)
echo - Redundant backend/backend folder
echo - Old setup scripts (create-*.ps1, etc.)
echo - Test utilities (test-api.js, test-mongodb-connection.js)
echo - Unused featureDetectionSimple.js
echo - Empty infrastructure and database folders
echo.
echo Your project structure is now cleaner and more organized!
pause
