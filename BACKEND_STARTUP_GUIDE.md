# Backend Server Startup Guide

## Quick Start

### Option 1: Use the Batch File (Recommended)
```bash
# From the project root directory
start-backend-dev.bat
```

### Option 2: Manual Start
```bash
# Terminal 1 - Start MongoDB (if not running as service)
mongod

# Terminal 2 - Start Backend
cd backend
npm install  # First time only
npm run dev
```

## Troubleshooting ECONNREFUSED Error

### 1. Check if Backend is Running
Open a new terminal and run:
```bash
netstat -ano | findstr :3002
```

If nothing shows up, the backend is not running.

### 2. Check for Port Conflicts
Another application might be using port 3002:
```bash
netstat -ano | findstr :3002
```

If something is using it, either:
- Stop that application, or
- Change the port in `backend/server.js`

### 3. Check MongoDB
The backend needs MongoDB to start properly:
```bash
# Check if MongoDB is running
sc query MongoDB

# Or try to connect
mongosh
```

### 4. Check for Errors
When starting the backend, look for error messages like:
- "MongoDB connection error"
- "Port already in use"
- "Cannot find module"

## Complete Startup Sequence

1. **Start MongoDB** (if not running as a service):
   ```bash
   mongod
   ```

2. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
   
   You should see:
   ```
   Server is running on port 3002
   Connected to MongoDB
   ```

3. **Verify it's working**:
   ```bash
   curl http://localhost:3002/api/health
   ```
   
   Should return: `{"status":"OK","message":"Server is running"}`

4. **Run migrations** (if needed):
   ```bash
   cd backend
   node migrations/001_add_products_and_categories.js
   ```

5. **Start Frontend**:
   ```bash
   cd frontend
   npm start
   ```

## Common Issues and Solutions

### Issue: "Cannot connect to MongoDB"
**Solution**: 
- Start MongoDB: `mongod` or `net start MongoDB`
- Check MongoDB is installed: `mongod --version`

### Issue: "Port 3002 already in use"
**Solution**:
- Find what's using it: `netstat -ano | findstr :3002`
- Kill the process or change the port in server.js

### Issue: "Module not found"
**Solution**:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Issue: "nodemon: command not found"
**Solution**:
```bash
cd backend
npm install --save-dev nodemon
# Or run without nodemon
npm start
```

## Environment Variables
Create `backend/.env` file if it doesn't exist:
```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/smart-quote-generator
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

## Verify Everything is Working
Run the test script:
```bash
node test-package-quotes-api.js
```

This should show:
- ✓ Health check: OK
- ✓ Products in database
- ✓ Parse products working
- ✓ Calculate pricing working
