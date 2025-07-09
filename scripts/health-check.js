// Smart Quote Generator - Health Check Script
// Run this from the root directory: node health-check.js

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

// Test results storage
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(50));
  log(title, 'blue');
  console.log('='.repeat(50));
}

async function testExists(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      log(`✓ ${description}`, 'green');
      results.passed.push(description);
      return true;
    } else {
      log(`✗ ${description} - File not found: ${filePath}`, 'red');
      results.failed.push(`${description} - Missing: ${filePath}`);
      return false;
    }
  } catch (error) {
    log(`✗ ${description} - Error: ${error.message}`, 'red');
    results.failed.push(`${description} - Error: ${error.message}`);
    return false;
  }
}

async function checkJSON(filePath, description) {
  try {
    if (!fs.existsSync(filePath)) {
      log(`✗ ${description} - File not found`, 'red');
      results.failed.push(`${description} - Missing file`);
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    log(`✓ ${description}`, 'green');
    results.passed.push(description);
    return true;
  } catch (error) {
    log(`✗ ${description} - Invalid JSON: ${error.message}`, 'red');
    results.failed.push(`${description} - Invalid JSON`);
    return false;
  }
}

async function checkEnvFile(filePath, requiredVars, description) {
  try {
    if (!fs.existsSync(filePath)) {
      log(`⚠ ${description} - File not found (using defaults)`, 'yellow');
      results.warnings.push(`${description} - Missing .env file`);
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const missingVars = [];
    
    requiredVars.forEach(varName => {
      if (!content.includes(`${varName}=`)) {
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length > 0) {
      log(`⚠ ${description} - Missing variables: ${missingVars.join(', ')}`, 'yellow');
      results.warnings.push(`${description} - Missing: ${missingVars.join(', ')}`);
    } else {
      log(`✓ ${description}`, 'green');
      results.passed.push(description);
    }
    return missingVars.length === 0;
  } catch (error) {
    log(`✗ ${description} - Error: ${error.message}`, 'red');
    results.failed.push(`${description} - Error: ${error.message}`);
    return false;
  }
}

async function checkNpmPackages(directory, description) {
  try {
    const packageJsonPath = path.join(directory, 'package.json');
    const packageLockPath = path.join(directory, 'package-lock.json');
    const nodeModulesPath = path.join(directory, 'node_modules');
    
    if (!fs.existsSync(packageJsonPath)) {
      log(`✗ ${description} - package.json not found`, 'red');
      results.failed.push(`${description} - Missing package.json`);
      return false;
    }
    
    if (!fs.existsSync(packageLockPath)) {
      log(`⚠ ${description} - package-lock.json not found`, 'yellow');
      results.warnings.push(`${description} - Missing package-lock.json`);
    }
    
    if (!fs.existsSync(nodeModulesPath)) {
      log(`⚠ ${description} - node_modules not found (run npm install)`, 'yellow');
      results.warnings.push(`${description} - Missing node_modules`);
      return false;
    }
    
    // Check if package.json and package-lock.json are in sync
    try {
      const { stdout, stderr } = await execPromise('npm ls --depth=0', { cwd: directory });
      if (stderr && stderr.includes('npm ERR!')) {
        log(`⚠ ${description} - Dependencies may be out of sync`, 'yellow');
        results.warnings.push(`${description} - Dependencies out of sync`);
      } else {
        log(`✓ ${description}`, 'green');
        results.passed.push(description);
      }
    } catch (error) {
      // npm ls returns non-zero exit code if there are issues
      log(`⚠ ${description} - Some dependencies may have issues`, 'yellow');
      results.warnings.push(`${description} - Dependency issues`);
    }
    
    return true;
  } catch (error) {
    log(`✗ ${description} - Error: ${error.message}`, 'red');
    results.failed.push(`${description} - Error: ${error.message}`);
    return false;
  }
}

async function testServerConnection() {
  logSection('Testing Local Server Connections');
  
  try {
    // Test if backend is running
    const backendUrl = 'http://localhost:3002/api/health';
    const frontendUrl = 'http://localhost:3000';
    
    log('Checking if servers are running locally...', 'blue');
    log('Note: Start servers with "npm start" in both frontend and backend directories', 'yellow');
    
    // Simple port check
    const net = require('net');
    
    // Check backend port
    const backendRunning = await new Promise((resolve) => {
      const client = new net.Socket();
      client.setTimeout(1000);
      client.on('connect', () => {
        client.destroy();
        resolve(true);
      });
      client.on('timeout', () => {
        client.destroy();
        resolve(false);
      });
      client.on('error', () => {
        resolve(false);
      });
      client.connect(3002, 'localhost');
    });
    
    if (backendRunning) {
      log('✓ Backend server is running on port 3002', 'green');
      results.passed.push('Backend server running');
    } else {
      log('✗ Backend server is not running on port 3002', 'red');
      results.failed.push('Backend server not running');
    }
    
    // Check frontend port
    const frontendRunning = await new Promise((resolve) => {
      const client = new net.Socket();
      client.setTimeout(1000);
      client.on('connect', () => {
        client.destroy();
        resolve(true);
      });
      client.on('timeout', () => {
        client.destroy();
        resolve(false);
      });
      client.on('error', () => {
        resolve(false);
      });
      client.connect(3000, 'localhost');
    });
    
    if (frontendRunning) {
      log('✓ Frontend server is running on port 3000', 'green');
      results.passed.push('Frontend server running');
    } else {
      log('✗ Frontend server is not running on port 3000', 'red');
      results.failed.push('Frontend server not running');
    }
    
  } catch (error) {
    log(`Error testing connections: ${error.message}`, 'red');
  }
}

// Main health check function
async function runHealthCheck() {
  console.clear();
  log('\n🏥 Smart Quote Generator - Health Check\n', 'blue');
  log(`Running from: ${process.cwd()}`, 'blue');
  log(`Time: ${new Date().toLocaleString()}\n`, 'blue');
  
  // 1. Check Project Structure
  logSection('1. Project Structure Check');
  
  await testExists('frontend', 'Frontend directory exists');
  await testExists('backend', 'Backend directory exists');
  await testExists('.git', 'Git repository initialized');
  await testExists('.gitignore', '.gitignore file exists');
  await testExists('amplify.yml', 'Amplify configuration exists');
  
  // 2. Check Backend Files
  logSection('2. Backend Health Check');
  
  await testExists('backend/server.js', 'Server.js exists');
  await testExists('backend/package.json', 'Backend package.json exists');
  await checkJSON('backend/package.json', 'Backend package.json is valid JSON');
  await testExists('backend/railway.json', 'Railway configuration exists');
  await checkEnvFile('backend/.env', [
    'MONGODB_URI',
    'JWT_SECRET',
    'NODE_ENV'
  ], 'Backend environment variables');
  
  // Check backend directories
  await testExists('backend/models', 'Models directory exists');
  await testExists('backend/routes', 'Routes directory exists');
  await testExists('backend/middleware', 'Middleware directory exists');
  await testExists('backend/utils', 'Utils directory exists');
  
  // 3. Check Frontend Files
  logSection('3. Frontend Health Check');
  
  await testExists('frontend/package.json', 'Frontend package.json exists');
  await checkJSON('frontend/package.json', 'Frontend package.json is valid JSON');
  await testExists('frontend/public/index.html', 'Frontend index.html exists');
  await testExists('frontend/public/manifest.json', 'PWA manifest exists');
  await testExists('frontend/src/App.jsx', 'App.jsx exists');
  await testExists('frontend/src/utils/axios.js', 'Axios configuration exists');
  
  await checkEnvFile('frontend/.env', [
    'REACT_APP_API_URL'
  ], 'Frontend environment variables');
  
  // 4. Check Dependencies
  logSection('4. Dependencies Check');
  
  await checkNpmPackages('backend', 'Backend dependencies');
  await checkNpmPackages('frontend', 'Frontend dependencies');
  
  // 5. Check Git Status
  logSection('5. Git Repository Check');
  
  try {
    const { stdout: gitStatus } = await execPromise('git status --porcelain');
    if (gitStatus.trim()) {
      log('⚠ Uncommitted changes detected:', 'yellow');
      console.log(gitStatus);
      results.warnings.push('Uncommitted changes in repository');
    } else {
      log('✓ All changes committed', 'green');
      results.passed.push('Git repository clean');
    }
    
    // Check if remote is set
    const { stdout: gitRemote } = await execPromise('git remote -v');
    if (gitRemote.includes('origin')) {
      log('✓ Git remote repository configured', 'green');
      results.passed.push('Git remote configured');
    } else {
      log('✗ No git remote repository configured', 'red');
      results.failed.push('No git remote');
    }
  } catch (error) {
    log('⚠ Git not initialized or error checking status', 'yellow');
    results.warnings.push('Git status check failed');
  }
  
  // 6. Test Server Connections
  await testServerConnection();
  
  // 7. Summary
  logSection('Health Check Summary');
  
  const total = results.passed.length + results.failed.length + results.warnings.length;
  
  log(`\nTotal checks: ${total}`, 'blue');
  log(`✓ Passed: ${results.passed.length}`, 'green');
  log(`✗ Failed: ${results.failed.length}`, 'red');
  log(`⚠ Warnings: ${results.warnings.length}`, 'yellow');
  
  if (results.failed.length > 0) {
    log('\n❌ Critical Issues to Fix:', 'red');
    results.failed.forEach(issue => {
      log(`  - ${issue}`, 'red');
    });
  }
  
  if (results.warnings.length > 0) {
    log('\n⚠️  Warnings to Address:', 'yellow');
    results.warnings.forEach(warning => {
      log(`  - ${warning}`, 'yellow');
    });
  }
  
  // Deployment Readiness
  logSection('Deployment Readiness');
  
  if (results.failed.length === 0) {
    log('✅ Your application is ready for deployment!', 'green');
    log('\nNext steps:', 'blue');
    log('1. Fix any warnings if needed', 'blue');
    log('2. Run "npm install" in both frontend and backend if needed', 'blue');
    log('3. Commit all changes to git', 'blue');
    log('4. Push to GitHub', 'blue');
    log('5. Deploy to Railway (backend) and Amplify (frontend)', 'blue');
  } else {
    log('❌ Please fix the critical issues before deploying', 'red');
    log('\nPriority fixes:', 'yellow');
    if (results.failed.some(f => f.includes('package-lock.json'))) {
      log('- Run "npm install" in directories with missing package-lock.json', 'yellow');
    }
    if (results.failed.some(f => f.includes('git remote'))) {
      log('- Set up GitHub repository and add remote', 'yellow');
    }
  }
  
  // Create health report file
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: total,
      passed: results.passed.length,
      failed: results.failed.length,
      warnings: results.warnings.length
    },
    results: results,
    deploymentReady: results.failed.length === 0
  };
  
  // Save report to config directory
  const reportPath = path.join(__dirname, '..', 'config', 'health-check-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 Detailed report saved to: ${reportPath}`, 'blue');
}

// Run the health check
runHealthCheck().catch(error => {
  log(`\n❌ Health check failed with error: ${error.message}`, 'red');
  process.exit(1);
});