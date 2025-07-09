# API Connection Troubleshooting

## Issue: ERR_BLOCKED_BY_CLIENT Errors

### Problem
Frontend making requests to wrong port (5000 instead of 3002) causing connection failures.

### Solution Applied

1. **Updated Frontend Environment Variable**
   - Changed `REACT_APP_API_URL` in `/frontend/.env` from port 5000 to 3002
   - Now: `REACT_APP_API_URL=http://localhost:3002/api`

2. **Fixed Hardcoded URLs**
   - Removed hardcoded URL in Dashboard.jsx
   - Changed from: `axios.get('http://localhost:5000/api/quotes')`
   - To: `axios.get('/api/quotes')`

3. **Ensured Consistent Port Usage**
   - Backend: Port 3002 (confirmed in backend/.env)
   - Frontend: Port 3000 (React default)
   - API calls: Now correctly routing to 3002

### Steps to Fix

1. **Restart Frontend** (REQUIRED after .env change):
   ```bash
   cd frontend
   # Stop the server (Ctrl+C)
   npm start
   ```

2. **Verify Backend is Running**:
   ```bash
   cd backend
   npm start
   # Should show: Server running on port 3002
   ```

3. **Clear Browser Cache**:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or open DevTools → Network tab → check "Disable cache"

4. **Check for Ad Blockers**:
   - Temporarily disable ad blockers or privacy extensions
   - Add localhost to whitelist if needed

### Verification

After restarting, you should see:
- API calls going to `http://localhost:3002/api/*`
- No more ERR_BLOCKED_BY_CLIENT errors
- Dashboard loading quote data successfully

### API Endpoints

All API calls should now use these patterns:
- Quotes: `/api/quotes`
- Materials: `/api/quotes/materials`
- Package Quotes: `/api/package-quotes/*`
- Customer Auth: `/api/customer/*`

### Note on Proxy

The frontend `package.json` has a proxy setting:
```json
"proxy": "http://localhost:3002"
```

This allows using relative URLs like `/api/quotes` in development, which will be proxied to the backend server.
