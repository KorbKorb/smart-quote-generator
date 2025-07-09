# Railway 502 Error - Troubleshooting Guide

## Check Railway Logs First!
Go to: https://railway.app/dashboard → Your Project → View Logs

## Common Errors and Solutions:

### 1. "MongoDB connection error" or "bad auth"
**Solution**: Update MONGODB_URI in Railway Variables
```
mongodb+srv://korbin:7TVPNDteXClUVP2b@cluster0.3j07acq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

### 2. "Cannot find module" or "Module not found"
**Solution**: Check if package.json is in the /backend folder
- Make sure Railway's root directory is set to: /backend

### 3. "PORT is not defined" or "EADDRINUSE"
**Solution**: Let Railway handle the PORT
- Remove PORT from Railway variables (Railway assigns it automatically)
- Or set PORT=3002 if needed

### 4. "JWT_SECRET is not defined"
**Solution**: Add to Railway Variables:
```
JWT_SECRET=your_long_secure_secret_here
```

### 5. No logs showing at all
**Solution**: Check deployment settings
- Root Directory: /backend
- Build Command: npm ci --production
- Start Command: npm start

## Required Railway Environment Variables:
1. MONGODB_URI = mongodb+srv://korbin:7TVPNDteXClUVP2b@cluster0.3j07acq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
2. JWT_SECRET = (your secure secret)
3. FRONTEND_URL = https://main.dtpbc2f4zygku.amplifyapp.com
4. NODE_ENV = production

## Quick Fix Steps:
1. Check logs for specific error
2. Update missing environment variables
3. Trigger redeploy
4. Wait 2-3 minutes
5. Test: https://smart-quote-generator.up.railway.app/api/health