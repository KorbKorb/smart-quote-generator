#!/bin/bash
# Clear frontend cache and restart

echo "🧹 Clearing React cache and restarting frontend..."

cd frontend

# Kill any running React processes
echo "Stopping any running React processes..."
taskkill //F //IM node.exe 2>nul || true

# Clear node modules cache
echo "Clearing npm cache..."
npm cache clean --force

# Remove React cache
echo "Removing .cache directory..."
rm -rf .cache 2>nul || true
rm -rf node_modules/.cache 2>nul || true

# Clear build directory
echo "Clearing build directory..."
rm -rf build 2>nul || true

echo "✅ Cache cleared!"
echo ""
echo "Now start the frontend with:"
echo "cd frontend"
echo "npm start"
echo ""
echo "The browser console should show:"
echo "API Base URL: http://localhost:3002/api"
