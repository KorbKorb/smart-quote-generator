# Troubleshooting Guide

## Current Issues and Solutions

### 1. Backend Server Not Running (ERR_CONNECTION_REFUSED)

**Problem**: The backend server on port 3002 is not running.

**Solution**:
```bash
# Option 1: Use the batch file (Windows)
double-click start-backend.bat

# Option 2: Manual start
cd backend
npm install
npm run dev
```

### 2. Port Mismatch Issues

**Problem**: Some API calls were using port 5000 instead of 3002.

**Status**: FIXED - All API calls now use the centralized API configuration.

### 3. Missing Backend Routes

**Problem**: Some routes like `/api/quotes/analyze-dxf` were missing.

**Status**: FIXED - Added the following routes:
- GET `/api/quotes` - Get all quotes
- GET `/api/quotes/materials` - Get materials list
- POST `/api/quotes/calculate` - Calculate quote
- POST `/api/quotes/analyze-dxf` - Analyze DXF file

## Complete Setup Instructions

### 1. Environment Setup

Create `.env` file in backend folder:
```env
PORT=3002
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smart-quote-generator
JWT_SECRET=your-admin-jwt-secret-here
JWT_SECRET_CUSTOMER=your-customer-jwt-secret-here
```

### 2. Start MongoDB

Make sure MongoDB is running:
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo service mongod start
```

### 3. Start Backend Server

```bash
cd backend
npm install
npm run dev
```

You should see:
```
Server is running on port 3002
Connected to MongoDB
```

### 4. Start Frontend

In a new terminal:
```bash
cd frontend
npm install
npm start
```

## Verifying Everything Works

### 1. Check Backend Health
Visit: http://localhost:3002/api/health

Should return:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### 2. Check Materials Endpoint
Visit: http://localhost:3002/api/quotes/materials

Should return materials list.

### 3. Test File Upload
1. Go to http://localhost:3000/admin/new-quote
2. Upload a DXF file
3. Fill in the form
4. Click "Calculate Price"

## Common Issues

### Issue: MongoDB Connection Failed
**Solution**: 
- Ensure MongoDB is installed and running
- Check if port 27017 is not blocked
- Verify MONGODB_URI in .env file

### Issue: JWT Errors
**Solution**:
- Add proper JWT secrets to .env file
- Clear browser localStorage
- Restart backend server

### Issue: CORS Errors
**Solution**:
- Backend already has CORS enabled
- Check if frontend URL is correct in .env

### Issue: File Upload Fails
**Solution**:
- Check file size (default limit: 10MB)
- Ensure file is a valid DXF
- Check browser console for errors

## API Endpoints Summary

### Admin API
- GET `/api/quotes` - List all quotes
- POST `/api/quotes` - Create new quote
- GET `/api/quotes/:id` - Get specific quote
- PATCH `/api/quotes/:id/status` - Update quote status
- DELETE `/api/quotes/:id` - Delete quote
- GET `/api/quotes/materials` - Get materials
- POST `/api/quotes/calculate` - Calculate pricing
- POST `/api/quotes/analyze-dxf` - Analyze DXF file

### Customer API
- POST `/api/auth/customer/login` - Customer login
- POST `/api/auth/customer/register` - Customer registration
- GET `/api/customer/quotes` - Customer's quotes
- POST `/api/customer/quotes/:id/accept` - Accept quote
- POST `/api/customer/quotes/:id/reject` - Reject quote

## Development Tips

1. **Use Nodemon**: Backend uses nodemon for auto-restart
2. **Check Logs**: Always check browser console and terminal for errors
3. **API Testing**: Use Postman or Thunder Client to test APIs
4. **Database GUI**: Use MongoDB Compass to view data

## Need More Help?

1. Check browser DevTools Network tab
2. Look at backend terminal for error logs
3. Verify all services are running
4. Clear browser cache and localStorage