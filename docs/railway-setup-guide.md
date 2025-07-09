# Railway Backend Deployment Guide

## Quick Setup Steps:

1. **Go to Railway**: https://railway.app

2. **Create New Project**:
   - Click "Start a New Project"
   - Select "Deploy from GitHub repo"
   - Authorize GitHub if needed
   - Find and select: smart-quote-generator

3. **Configure Service**:
   - Service name: smart-quote-generator-backend
   - Root Directory: /backend
   - Build Command: npm ci
   - Start Command: npm start

4. **Add Environment Variables**:
   Click on Variables tab and add:
   ```
   MONGODB_URI=mongodb+srv://korbin:tNNVo2AYGFOHYJau@cluster0.3j07acq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=hfi_smart_quote_secret_key_2025_secure_production
   FRONTEND_URL=https://main.dtpbc2f4zygku.amplifyapp.com
   NODE_ENV=production
   PORT=3002
   ```

5. **Generate Domain**:
   - Go to Settings tab
   - Click "Generate Domain"
   - You'll get something like: https://smart-quote-generator-production.up.railway.app

6. **Wait for Deployment**:
   - Check the deploy logs
   - Look for "Server running on port 3002"
   - Look for "Connected to MongoDB"

## If Railway Isn't Working, Try These Alternatives:

### Option 1: Render.com (Free tier available)
1. Go to https://render.com
2. Connect GitHub
3. New → Web Service
4. Select your repo
5. Root Directory: backend
6. Build: npm install
7. Start: npm start

### Option 2: Heroku (if you have an account)
1. Create new app
2. Connect GitHub
3. Deploy from backend folder

### Option 3: Run Backend Locally (Temporary)
Update your frontend .env.production to use ngrok:
1. Run backend locally
2. Use ngrok to expose it: ngrok http 3002
3. Update frontend with ngrok URL