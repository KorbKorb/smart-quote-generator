// system-check.js - Run this from the project root
// Save this file in the root of your smart-quote-generator folder

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}\n`)
};

async function checkSystem() {
  log.header('SMART QUOTE GENERATOR - SYSTEM CHECK');
  
  // Check Node.js version
  log.header('Environment Check');
  try {
    const { stdout: nodeVersion } = await execPromise('node --version');
    log.success(`Node.js version: ${nodeVersion.trim()}`);
  } catch (error) {
    log.error('Node.js not found');
  }

  try {
    const { stdout: npmVersion } = await execPromise('npm --version');
    log.success(`npm version: ${npmVersion.trim()}`);
  } catch (error) {
    log.error('npm not found');
  }

  // Check project structure
  log.header('Project Structure Check');
  const requiredDirs = [
    'backend',
    'backend/src',
    'backend/src/routes',
    'backend/src/models',
    'backend/src/controllers',
    'frontend',
    'frontend/src',
    'frontend/src/pages',
    'frontend/src/components',
    'frontend/src/components/FileUpload',
    'frontend/src/components/QuoteForm',
    'frontend/src/components/QuoteDisplay'
  ];

  for (const dir of requiredDirs) {
    if (fs.existsSync(path.join(__dirname, dir))) {
      log.success(`Directory exists: ${dir}`);
    } else {
      log.error(`Directory missing: ${dir}`);
    }
  }

  // Check critical files
  log.header('Critical Files Check');
  const criticalFiles = [
    { path: 'backend/server.js', type: 'Backend entry point' },
    { path: 'backend/package.json', type: 'Backend dependencies' },
    { path: 'frontend/package.json', type: 'Frontend dependencies' },
    { path: 'frontend/src/App.jsx', type: 'Main React component' },
    { path: 'frontend/src/App.css', type: 'Main styles' },
    { path: 'frontend/src/pages/Dashboard.jsx', type: 'Dashboard page' },
    { path: 'frontend/src/pages/NewQuote.jsx', type: 'New Quote page' },
    { path: 'frontend/src/pages/QuoteHistory.jsx', type: 'Quote History page' }
  ];

  for (const file of criticalFiles) {
    if (fs.existsSync(path.join(__dirname, file.path))) {
      log.success(`${file.type}: ${file.path}`);
    } else {
      log.error(`${file.type} missing: ${file.path}`);
    }
  }

  // Check new component files
  log.header('Component Files Check');
  const componentFiles = [
    'frontend/src/components/FileUpload/FileUpload.jsx',
    'frontend/src/components/QuoteForm/QuoteForm.jsx',
    'frontend/src/components/QuoteDisplay/QuoteDisplay.jsx'
  ];

  for (const file of componentFiles) {
    if (fs.existsSync(path.join(__dirname, file))) {
      log.success(`Component exists: ${file}`);
    } else {
      log.warning(`Component missing: ${file} - Need to create this file`);
    }
  }

  // Check dependencies
  log.header('Dependencies Check');
  
  // Backend dependencies
  try {
    const backendPackage = JSON.parse(fs.readFileSync(path.join(__dirname, 'backend/package.json'), 'utf8'));
    const backendDeps = ['express', 'cors', 'dotenv', 'mongoose'];
    
    log.info('Backend dependencies:');
    for (const dep of backendDeps) {
      if (backendPackage.dependencies && backendPackage.dependencies[dep]) {
        log.success(`  ${dep}: ${backendPackage.dependencies[dep]}`);
      } else {
        log.error(`  ${dep}: Not found in package.json`);
      }
    }
  } catch (error) {
    log.error('Could not read backend package.json');
  }

  // Frontend dependencies
  try {
    const frontendPackage = JSON.parse(fs.readFileSync(path.join(__dirname, 'frontend/package.json'), 'utf8'));
    const frontendDeps = ['react', 'react-dom', 'react-router-dom', 'axios', 'react-dropzone'];
    
    log.info('\nFrontend dependencies:');
    for (const dep of frontendDeps) {
      if (frontendPackage.dependencies && frontendPackage.dependencies[dep]) {
        log.success(`  ${dep}: ${frontendPackage.dependencies[dep]}`);
      } else {
        log.error(`  ${dep}: Not found in package.json`);
      }
    }
  } catch (error) {
    log.error('Could not read frontend package.json');
  }

  // Check if servers are running
  log.header('Server Status Check');
  
  // Check if axios is available for server checks
  let axios;
  try {
    axios = require('axios');
  } catch (error) {
    log.warning('axios not available for server checks - install it globally with: npm install -g axios');
    log.info('Skipping server status checks...');
  }

  if (axios) {
    // Check backend
    try {
      const backendResponse = await axios.get('http://localhost:5000/health');
      log.success('Backend server is running on port 5000');
      log.info(`  Status: ${backendResponse.data.status}`);
    } catch (error) {
      log.warning('Backend server is not running on port 5000');
      log.info('  Start with: cd backend && npm run dev');
    }

    // Check frontend
    try {
      await axios.get('http://localhost:3000');
      log.success('Frontend server is running on port 3000');
    } catch (error) {
      log.warning('Frontend server is not running on port 3000');
      log.info('  Start with: cd frontend && npm start');
    }
  }

  // Configuration check
  log.header('Configuration Check');
  
  const envPath = path.join(__dirname, 'backend/.env');
  if (fs.existsSync(envPath)) {
    log.success('Backend .env file exists');
    // Check for required env variables
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = ['PORT', 'MONGODB_URI'];
    for (const varName of requiredVars) {
      if (envContent.includes(varName)) {
        log.success(`  ${varName} is defined`);
      } else {
        log.warning(`  ${varName} is not defined`);
      }
    }
  } else {
    log.warning('Backend .env file missing');
    log.info('  Create backend/.env with:');
    log.info('    PORT=5000');
    log.info('    MONGODB_URI=mongodb://localhost:27017/smart-quote-generator');
  }

  // Summary
  log.header('NEXT STEPS');
  
  console.log('\n1. If component files are missing, create them:');
  console.log('   - Copy the FileUpload component code to frontend/src/components/FileUpload/FileUpload.jsx');
  console.log('   - Copy the QuoteForm component code to frontend/src/components/QuoteForm/QuoteForm.jsx');
  console.log('   - Copy the QuoteDisplay component code to frontend/src/components/QuoteDisplay/QuoteDisplay.jsx');
  
  console.log('\n2. Update the page files:');
  console.log('   - Replace frontend/src/pages/NewQuote.jsx with the updated version');
  console.log('   - Replace frontend/src/pages/QuoteHistory.jsx with the updated version');
  
  console.log('\n3. If dependencies are missing, install them:');
  console.log('   - cd frontend && npm install react-dropzone');
  
  console.log('\n4. Start both servers:');
  console.log('   - Terminal 1: cd backend && npm run dev');
  console.log('   - Terminal 2: cd frontend && npm start');
  
  console.log('\n5. Test the application:');
  console.log('   - Navigate to http://localhost:3000');
  console.log('   - Check all three pages work');
  console.log('   - Try creating a new quote');
  
  log.header('END OF SYSTEM CHECK');
}

// Run the check
checkSystem().catch(console.error);
