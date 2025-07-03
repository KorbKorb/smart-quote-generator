# Cleanup Script for Smart Quote Generator

## Files and Directories to Remove

Based on my analysis, here are the redundant files and directories that can be safely removed:

### 1. **Empty Directories**
These directories are empty and serve no purpose:
- `/shared/constants/` - Empty directory
- `/shared/types/` - Empty directory  
- `/frontend/src/services/` - Empty directory
- `/frontend/src/utils/` - Empty directory
- `/frontend/src/context/` - Empty directory
- `/frontend/src/hooks/` - Empty directory
- `/backend/tests/unit/` - Empty directory
- `/backend/tests/integration/` - Empty directory

### 2. **Redundant Nested Directory**
- `/backend/backend/` - This is a nested backend folder that only contains an uploads directory

### 3. **Setup/Utility Scripts** 
These were likely used during initial setup and are no longer needed:
- `create-all-components.ps1` - Component creation script (components already exist)
- `create-components.ps1` - Another component creation script
- `create-test-files.js` - Test file generator (test files already created)
- `download-cad-samples.ps1` - Sample downloader (samples already in test-files)
- `find-api-folders.ps1` - API folder finder utility

### 4. **Old/Redundant Files**
- `PROJECT_CONTEXT.md` - Empty file
- `system-check.js` - Basic system check, not needed for production
- `test-api.js` - Basic API test, functionality covered by actual app
- `/backend/test-mongodb-connection.js` - One-off MongoDB test
- `/backend/setup-server.ps1` - Server setup script (server already set up)

### 5. **Potentially Redundant**
- `/backend/services/featureDetectionSimple.js` - Check if this is used anywhere, likely superseded by dxfParser.js

### 6. **Empty Test Directories**
Since there are no actual tests yet:
- `/backend/tests/` - Empty test structure

## Files to KEEP
- `test-dxf-parser.js` - Useful for testing DXF parser
- `/test-files/` - Contains actual test DXF files
- `setup.ps1` - Main setup script might be useful for new developers
- `mcp.json` - MCP configuration
- All files in `/docs/` - Documentation is important

## Cleanup Commands

To clean up, run these commands from the project root:

```bash
# Remove empty directories
rmdir /s /q shared\constants
rmdir /s /q shared\types
rmdir /s /q frontend\src\services
rmdir /s /q frontend\src\utils
rmdir /s /q frontend\src\context
rmdir /s /q frontend\src\hooks
rmdir /s /q backend\tests\unit
rmdir /s /q backend\tests\integration
rmdir /s /q backend\tests

# Remove redundant backend folder
rmdir /s /q backend\backend

# Remove setup scripts
del create-all-components.ps1
del create-components.ps1
del create-test-files.js
del download-cad-samples.ps1
del find-api-folders.ps1

# Remove old test files
del PROJECT_CONTEXT.md
del system-check.js
del test-api.js
del backend\test-mongodb-connection.js
del backend\setup-server.ps1

# Check if featureDetectionSimple.js is used
# If not used, delete it:
# del backend\services\featureDetectionSimple.js
```

## After Cleanup

Your structure will be cleaner:
```
smart-quote-generator/
├── backend/
│   ├── src/
│   ├── uploads/
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
├── docs/
├── test-files/
├── .git/
├── .gitignore
├── README.md
├── package.json
├── setup.ps1
├── test-dxf-parser.js
└── mcp.json
```

This removes ~15 unnecessary files/directories, making the project cleaner and easier to navigate!
