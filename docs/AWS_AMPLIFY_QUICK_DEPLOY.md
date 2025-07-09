# Quick AWS Amplify Deployment (Easier Mobile Access)

## Why AWS Amplify?
- One-click deployment
- Automatic HTTPS
- Built-in mobile optimization
- Continuous deployment from Git
- Free tier available

## Quick Setup Steps

### 1. Prepare Your Code

#### Backend Changes
Create `backend/server.js` update for production:
```javascript
// Add CORS for your Amplify domain
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://main.YOUR-APP-ID.amplifyapp.com',
    process.env.FRONTEND_URL
  ],
  credentials: true
};
app.use(cors(corsOptions));
```

#### Frontend Changes
Update `frontend/src/utils/axios.js`:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://your-backend-domain.com' 
    : 'http://localhost:3002');

axios.defaults.baseURL = API_URL;
```

### 2. Deploy Backend First

#### Option A: Heroku (Simplest)
```bash
# Install Heroku CLI
# In backend directory
heroku create your-app-name-backend
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your-mongodb-uri"
heroku config:set JWT_SECRET="your-secret"
git push heroku main
```

#### Option B: Railway.app (Modern Alternative)
1. Go to railway.app
2. Connect GitHub repo
3. Select backend directory
4. Add environment variables
5. Deploy automatically

### 3. Deploy Frontend with Amplify

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for AWS deployment"
git push origin main
```

#### Step 2: AWS Amplify Console
1. Go to AWS Amplify Console
2. Click "New app" > "Host web app"
3. Choose GitHub and authorize
4. Select your repository and branch
5. Configure build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/build
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

6. Add environment variable:
   - `REACT_APP_API_URL` = Your backend URL

7. Deploy!

### 4. Mobile Access Setup

#### Enable on Mobile
1. Your app will be at: `https://main.YOUR-APP-ID.amplifyapp.com`
2. Add to home screen on mobile for app-like experience
3. Works offline with service worker

#### Custom Domain (Optional)
1. In Amplify Console > Domain management
2. Add custom domain
3. Follow DNS instructions
4. HTTPS included automatically

## Complete Mobile-Ready Checklist

### Frontend Updates Needed
```javascript
// frontend/src/App.css - Add mobile styles
@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
  }
  
  .package-builder {
    padding: 1rem;
  }
  
  .btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}

// frontend/public/index.html - Add PWA tags
<link rel="manifest" href="%PUBLIC_URL%/manifest.json">
<meta name="theme-color" content="#1A4D46">
```

### Test Mobile Features
```bash
# Local mobile testing
npm start
# Access via: http://YOUR-IP:3000 on mobile device
```

## 5-Minute Deployment Commands

```bash
# Backend (using Railway)
# 1. Push to GitHub
git push origin main

# 2. Go to railway.app
# 3. Import from GitHub
# 4. Add env variables
# 5. Get deployment URL

# Frontend (using Amplify)
# 1. Go to AWS Amplify
# 2. Connect GitHub
# 3. Add env variable: REACT_APP_API_URL=railway-url
# 4. Deploy

# Total time: ~5 minutes
```

## Cost Estimate
- AWS Amplify: Free tier (1GB storage, 15GB transfer)
- Railway/Heroku: ~$5-7/month for backend
- MongoDB Atlas: Free tier (512MB)
- **Total: ~$5-7/month**

## After Deployment
1. Test on multiple devices
2. Add to phone home screen
3. Share link: `https://your-app.amplifyapp.com`
4. Monitor in Amplify Console

---

**Quick Test URLs:**
- Frontend: `https://main.YOUR-APP-ID.amplifyapp.com`
- Backend Health: `https://your-backend.up.railway.app/api/health`
- Package Quote: `https://main.YOUR-APP-ID.amplifyapp.com/admin/package-quote`
