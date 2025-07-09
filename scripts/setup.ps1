# Smart Quote Generator - Setup Script for Windows PowerShell

Write-Host "Creating Smart Quote Generator project structure..." -ForegroundColor Green

# Create directory structure
$directories = @(
    "frontend\src\components\FileUpload",
    "frontend\src\components\QuoteForm",
    "frontend\src\components\QuoteDisplay",
    "frontend\src\components\PartViewer",
    "frontend\src\components\common",
    "frontend\src\pages",
    "frontend\src\services",
    "frontend\src\utils",
    "frontend\src\hooks",
    "frontend\src\context",
    "frontend\public",
    "backend\src\controllers",
    "backend\src\models",
    "backend\src\routes",
    "backend\src\services",
    "backend\src\middleware",
    "backend\src\utils",
    "backend\tests\unit",
    "backend\tests\integration",
    "infrastructure\cdk\lib",
    "infrastructure\cdk\bin",
    "infrastructure\scripts",
    "shared\types",
    "shared\constants",
    "database\migrations",
    "database\seeds",
    "docs",
    ".github\workflows",
    ".vscode"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    Write-Host "Created: $dir" -ForegroundColor Yellow
}

# Create root package.json
$rootPackageJson = @'
{
  "name": "smart-quote-generator",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend",
    "infrastructure"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm start",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "test": "npm run test:frontend && npm run test:backend",
    "test:frontend": "cd frontend && npm test",
    "test:backend": "cd backend && npm test"
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
}
'@

# Create .gitignore
$gitignore = @'
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json

# AWS
.aws-sam/
cdk.out/

# Misc
*.pem
.cache/
'@

# Create VSCode settings
$vscodeSettings = @'
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact"],
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/dist": true,
    "**/build": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/package-lock.json": true,
    "**/yarn.lock": true
  }
}
'@

# Create frontend package.json
$frontendPackageJson = @'
{
  "name": "smart-quote-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0",
    "three": "^0.149.0",
    "@react-three/fiber": "^8.10.0",
    "@react-three/drei": "^9.50.0",
    "aws-amplify": "^5.0.0",
    "react-dropzone": "^14.2.0",
    "recharts": "^2.4.0",
    "react-hook-form": "^7.43.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "react-scripts": "5.0.1",
    "eslint": "^8.0.0",
    "prettier": "^2.8.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}
'@

# Create backend package.json
$backendPackageJson = @'
{
  "name": "smart-quote-backend",
  "version": "1.0.0",
  "private": true,
  "main": "src/app.js",
  "dependencies": {
    "express": "^4.18.0",
    "aws-sdk": "^2.1300.0",
    "@aws-sdk/client-s3": "^3.250.0",
    "@aws-sdk/client-dynamodb": "^3.250.0",
    "mongoose": "^6.9.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.0",
    "multer": "^1.4.5",
    "multer-s3": "^3.0.0",
    "cors": "^2.8.0",
    "dotenv": "^16.0.0",
    "joi": "^17.7.0",
    "puppeteer": "^19.6.0",
    "nodemailer": "^6.9.0",
    "dxf-parser": "^1.0.0",
    "pdf-parse": "^1.1.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.0",
    "jest": "^29.3.0",
    "supertest": "^6.3.0",
    "eslint": "^8.0.0"
  },
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
'@

# Create frontend .env.example
$frontendEnv = @'
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_AWS_REGION=us-east-1
REACT_APP_S3_BUCKET=smart-quote-uploads
REACT_APP_COGNITO_USER_POOL_ID=
REACT_APP_COGNITO_CLIENT_ID=
'@

# Create backend .env.example
$backendEnv = @'
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://localhost:27017/smart-quote
JWT_SECRET=your-secret-key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=smart-quote-uploads
DYNAMODB_TABLE_PREFIX=smart-quote
EMAIL_FROM=noreply@smartquote.com
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
'@

# Create README.md
$readme = @'
# Smart Quote Generator

AI-powered quote generation system for sheet metal fabrication.

## Features
- CAD file analysis (DXF, DWG, PDF support)
- Automatic cost estimation
- Material and process calculations
- Real-time 3D visualization
- PDF quote generation

## Setup
1. Install dependencies: `npm install`
2. Copy environment files: 
   - `cp frontend/.env.example frontend/.env`
   - `cp backend/.env.example backend/.env`
3. Start development: `npm run dev`

## Tech Stack
- Frontend: React, Three.js, AWS Amplify
- Backend: Node.js, Express, MongoDB
- AWS: S3, DynamoDB, Lambda, Cognito
'@

# Write files
Write-Host "`nCreating configuration files..." -ForegroundColor Green

Set-Content -Path "package.json" -Value $rootPackageJson
Write-Host "Created: package.json" -ForegroundColor Yellow

Set-Content -Path ".gitignore" -Value $gitignore
Write-Host "Created: .gitignore" -ForegroundColor Yellow

Set-Content -Path ".vscode\settings.json" -Value $vscodeSettings
Write-Host "Created: .vscode\settings.json" -ForegroundColor Yellow

Set-Content -Path "frontend\package.json" -Value $frontendPackageJson
Write-Host "Created: frontend\package.json" -ForegroundColor Yellow

Set-Content -Path "backend\package.json" -Value $backendPackageJson
Write-Host "Created: backend\package.json" -ForegroundColor Yellow

Set-Content -Path "frontend\.env.example" -Value $frontendEnv
Write-Host "Created: frontend\.env.example" -ForegroundColor Yellow

Set-Content -Path "backend\.env.example" -Value $backendEnv
Write-Host "Created: backend\.env.example" -ForegroundColor Yellow

Set-Content -Path "README.md" -Value $readme
Write-Host "Created: README.md" -ForegroundColor Yellow

# Copy env files
Copy-Item "frontend\.env.example" "frontend\.env"
Write-Host "Created: frontend\.env" -ForegroundColor Yellow

Copy-Item "backend\.env.example" "backend\.env"
Write-Host "Created: backend\.env" -ForegroundColor Yellow

Write-Host "`nProject structure created successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Run 'npm install' to install root dependencies" -ForegroundColor White
Write-Host "2. Run 'cd frontend && npm install' to install frontend dependencies" -ForegroundColor White
Write-Host "3. Run 'cd ../backend && npm install' to install backend dependencies" -ForegroundColor White
Write-Host "4. Run 'npm run dev' from the root to start development servers" -ForegroundColor White