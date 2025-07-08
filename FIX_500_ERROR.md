# Fixing the 500 Internal Server Error

## The Issue
The backend is returning a 500 error when trying to parse products. This is likely because:
1. MongoDB might not be connected
2. Products might not exist in the database
3. There might be a code error in the parsing logic

## Steps to Fix

### 1. Check MongoDB Connection
First, ensure MongoDB is running:
```bash
# Windows
net start MongoDB

# Or if using MongoDB as a service
mongod
```

### 2. Run the Debug Test
Test if the backend can access the database:
```bash
node test-package-quotes-api.js
```

### 3. If No Products Exist
If the test shows 0 products, run the migration script:
```bash
cd backend
node migrations/001_add_products_and_categories.js
```

### 4. Check Backend Logs
When you make a request, check the backend console for error messages. The updated code now includes better logging.

### 5. Test with curl
Test the API directly:
```bash
# Test debug endpoint
curl http://localhost:3002/api/package-quotes/debug/products

# Test parse endpoint
curl -X POST http://localhost:3002/api/package-quotes/parse-products \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Steel Plate 1/2\\\" 4x8 - 10\"}"
```

## What Was Fixed

1. **Updated packagePricing.js**:
   - Fixed the Product model import location
   - Corrected the response structure to match frontend expectations
   - Added proper error handling
   - Fixed the `unit` field mapping (was `priceUnit` in the model)

2. **Added Debug Endpoint**:
   - `/api/package-quotes/debug/products` to check if products exist

3. **Enhanced Error Logging**:
   - Added console.log statements to track the parsing process
   - Include stack traces in development mode

## Quick Checklist
- [ ] MongoDB is running
- [ ] Backend server is running on port 3002
- [ ] Products exist in the database (run migration if needed)
- [ ] Frontend has been restarted after proxy changes
- [ ] No TypeErrors in backend console

## If Still Having Issues

1. **Check MongoDB connection string**:
   Look in `backend/.env` for `MONGODB_URI` or it defaults to `mongodb://localhost:27017/smart-quote-generator`

2. **Verify Product Schema**:
   The products need these fields: name, category, basePrice, priceUnit

3. **Clear and Restart**:
   ```bash
   # Stop both servers
   # Clear node_modules if needed
   cd backend && npm install
   cd ../frontend && npm install
   # Start backend first
   cd ../backend && npm run dev
   # Then frontend
   cd ../frontend && npm start
   ```
