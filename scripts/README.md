# Scripts Directory

This directory contains all utility scripts for the Smart Quote Generator project.

## Directory Structure

- `/scripts/` - Main scripts for deployment, setup, and utilities
- `/scripts/tests/` - Test scripts for various components

## Usage

All scripts should be run from the project root directory:

```bash
# From the project root
node scripts/health-check.js
node scripts/generate-jwt-secret.js

# PowerShell scripts
./scripts/deployment-checklist.ps1
./scripts/quick-status.ps1

# Batch files
./scripts/start-backend.bat
```

## Script Descriptions

### Utility Scripts
- `generate-jwt-secret.js` - Generate a secure JWT secret
- `health-check.js` - Comprehensive project health check
- `check-backend-env.js` - Verify backend environment setup

### Deployment Scripts
- `deployment-checklist.ps1` - Pre-deployment checklist
- `deploy-push.ps1` - Deploy to production
- `railway-vars-checklist.ps1` - Verify Railway variables

### Development Scripts
- `start-backend.bat` - Start backend server
- `start-backend-dev.bat` - Start backend with MongoDB check
- `test-build.ps1` - Test production build

### Test Scripts (in `/tests/`)
- `test-mongodb.js` - Test MongoDB connection
- `test-deployment.js` - Test deployment configuration
- `test-csv-export.js` - Test CSV export functionality

## Notes

- All paths in scripts are relative to the project root
- Health check reports are saved to `/config/health-check-report.json`
- Scripts assume standard project structure with `/frontend` and `/backend` directories
