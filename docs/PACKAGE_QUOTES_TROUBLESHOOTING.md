# Package Quotes API Troubleshooting Guide

## Current Issue
The frontend is getting a 404 error when trying to call the package quotes API endpoints.

## Steps to Fix

### 1. Verify Backend is Running
Make sure the backend server is running on port 3002:
```bash
cd backend
npm run dev
```

You should see: `Server is running on port 3002`

### 2. Test the API Directly
Run the test script to verify the API is working:
```bash
node test-package-quotes-api.js
```

### 3. Check MongoDB Connection
Ensure MongoDB is running and the database has been seeded with products:
```bash
cd backend
node migrations/001_add_products_and_categories.js
```

### 4. Restart Frontend
After adding the proxy to package.json, you need to restart the React development server:
```bash
cd frontend
# Stop the server (Ctrl+C)
npm start
```

### 5. Clear Browser Cache
Sometimes the browser caches API calls. Try:
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Open Developer Tools > Network tab > Disable cache

### 6. Check Console for Errors
In the browser's Developer Tools:
1. Go to Console tab
2. Look for any CORS errors or connection refused errors
3. Go to Network tab
4. Try the parse action again
5. Check the failed request details

## Common Issues and Solutions

### Issue: CORS Error
**Solution**: The backend already has CORS enabled. If you still get CORS errors, check if you're accessing the app through the correct URL (http://localhost:3000)

### Issue: Connection Refused
**Solution**: 
1. Make sure backend is running on port 3002
2. Check if another service is using that port: `netstat -ano | findstr :3002`
3. Try changing the port in backend/server.js

### Issue: Products Not Found
**Solution**: 
1. Run the migration script to populate products
2. Check MongoDB to ensure products exist:
   ```bash
   mongosh
   use smart-quote-generator
   db.products.find()
   ```

### Issue: Proxy Not Working
**Solution**:
1. Make sure you've restarted the frontend after adding proxy to package.json
2. The proxy only works in development mode
3. Check if you're using relative URLs in API calls (e.g., `/api/...` not `http://localhost:3002/api/...`)

## Testing Checklist
- [ ] Backend server is running (port 3002)
- [ ] MongoDB is running
- [ ] Products exist in database
- [ ] Frontend server restarted after proxy added
- [ ] Browser cache cleared
- [ ] No CORS errors in console
- [ ] API test script works successfully

## API Endpoints to Test
1. Health Check: `GET http://localhost:3002/api/health`
2. Parse Products: `POST http://localhost:3002/api/package-quotes/parse-products`
3. Calculate Pricing: `POST http://localhost:3002/api/package-quotes/calculate-pricing`

## Still Having Issues?
If the problem persists:
1. Check the backend logs for any errors
2. Verify all dependencies are installed: `npm install` in both frontend and backend
3. Check if the packageQuotes route is properly imported in server.js
4. Ensure all model files exist (Product.js, PackageQuote.js, DiscountRule.js)
