@echo off
echo Fixing Frontend Connection to Port 3002...
echo.

cd frontend

echo Killing all Node processes...
taskkill /F /IM node.exe >nul 2>&1

echo Clearing caches...
rmdir /S /Q .cache >nul 2>&1
rmdir /S /Q node_modules\.cache >nul 2>&1
rmdir /S /Q build >nul 2>&1

echo Verifying .env file...
type .env
echo.

echo Starting frontend server...
echo.
echo IMPORTANT: When browser opens, press F12 and look for:
echo "API Base URL: http://localhost:3002/api"
echo.
echo If you still see port 5000, use Ctrl+Shift+R to hard refresh
echo.

npm start