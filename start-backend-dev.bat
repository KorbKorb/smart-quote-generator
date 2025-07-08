@echo off
echo Starting Smart Quote Generator Backend...
echo.

REM Check if MongoDB is running
echo Checking MongoDB status...
sc query MongoDB >nul 2>&1
if %errorlevel% == 0 (
    echo MongoDB service found. Starting if not running...
    net start MongoDB >nul 2>&1
) else (
    echo MongoDB service not found. Make sure MongoDB is installed and running.
    echo You can start MongoDB manually with: mongod
)

echo.
echo Starting backend server on port 3002...
cd backend

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo.
echo Starting server...
echo Press Ctrl+C to stop the server
echo.

REM Run the server
call npm run dev

pause
