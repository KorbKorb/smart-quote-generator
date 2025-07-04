@echo off
echo Starting Smart Quote Generator Backend...
echo.

cd backend

echo Installing dependencies...
call npm install

echo.
echo Starting server on port 3002...
npm run dev

pause