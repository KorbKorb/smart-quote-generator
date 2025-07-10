#!/bin/bash
# Quick server health check

echo "Checking server status..."
echo ""

# Check if server is running
curl -s http://localhost:3002/api/health | python -m json.tool

echo ""
echo "If you see the health check response above, the server is running."
echo "If not, restart the server with: cd backend && npm start"
