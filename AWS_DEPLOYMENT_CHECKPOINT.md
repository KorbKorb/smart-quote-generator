# Smart Quote Generator - AWS Deployment Checkpoint

## Project Current State Summary

### Application Overview
- **Project**: Smart Quote Generator with Package Quoting System
- **Location**: `C:\Users\Korbin\smart-quote-generator`
- **Tech Stack**: 
  - Frontend: React 18 with Pine Green theme
  - Backend: Node.js/Express with MongoDB
  - Database: MongoDB (currently using MongoDB Atlas)

### Key Features Implemented
1. **Basic Quote Generation** - DXF file parsing, manual measurements
2. **Customer Portal** - Registration, login, quote history
3. **Package Quoting System** - Multi-product quotes with automatic discounts
4. **Pine Green Theme** - Professional UI with consistent branding

### Current Configuration
- **Frontend**: Runs on port 3000
- **Backend**: Runs on port 3002
- **MongoDB**: Connected to Atlas cluster
- **Environment**: Development mode with proxy setup

## AWS Deployment Instructions

### Prerequisites Checklist
- [ ] AWS Account with billing enabled
- [ ] AWS CLI installed locally
- [ ] Node.js 18+ installed
- [ ] Git repository (GitHub/GitLab/Bitbucket)

### Step 1: Prepare for Deployment

#### 1.1 Environment Variables
Create production env files:

**Backend (.env.production)**
```env
PORT=3002
NODE_ENV=production
MONGODB_URI=mongodb+srv://korbin:tNNVo2AYGFOHYJau@cluster0.3j07acq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-production-secret-key-here
FRONTEND_URL=https://your-domain.com

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
COMPANY_NAME=HFI
```

**Frontend (.env.production)**
```env
REACT_APP_API_URL=https://api.your-domain.com
```

#### 1.2 Update Package.json Scripts

**Backend package.json**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'No build needed for backend'"
  }
}
```

**Frontend package.json**
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

### Step 2: AWS Architecture Options

#### Option A: Simple EC2 Deployment (Recommended for Start)
- Single EC2 instance running both frontend and backend
- Nginx as reverse proxy
- PM2 for process management
- Let's Encrypt for SSL

#### Option B: Scalable Architecture
- Frontend: S3 + CloudFront
- Backend: Elastic Beanstalk or ECS
- Database: MongoDB Atlas (keep existing)
- Load Balancer: ALB

### Step 3: EC2 Deployment Steps

#### 3.1 Launch EC2 Instance
```bash
# Use Amazon Linux 2 or Ubuntu 20.04
# Instance type: t3.small (minimum)
# Security Group: Open ports 22, 80, 443, 3002
```

#### 3.2 Connect and Setup
```bash
# Connect to EC2
ssh -i your-key.pem ec2-user@your-instance-ip

# Install dependencies
sudo yum update -y  # or sudo apt update for Ubuntu
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install nodejs nginx git -y

# Install PM2 globally
sudo npm install -g pm2

# Clone your repository
git clone https://github.com/yourusername/smart-quote-generator.git
cd smart-quote-generator
```

#### 3.3 Setup Backend
```bash
cd backend
npm install --production
pm2 start server.js --name "quote-backend"
pm2 save
pm2 startup
```

#### 3.4 Build and Setup Frontend
```bash
cd ../frontend
npm install
npm run build

# Copy build to nginx directory
sudo cp -r build/* /usr/share/nginx/html/
```

#### 3.5 Configure Nginx
```nginx
# /etc/nginx/nginx.conf
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 4: Mobile Access Setup

#### 4.1 Domain Setup
1. Purchase domain (Route 53 or external)
2. Point domain to EC2 Elastic IP
3. Setup SSL with Certbot

#### 4.2 Mobile Optimizations
```javascript
// Add to frontend/public/index.html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
```

#### 4.3 Progressive Web App (Optional)
```json
// frontend/public/manifest.json
{
  "short_name": "HFI Quotes",
  "name": "Smart Quote Generator",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#1A4D46",
  "background_color": "#ffffff"
}
```

### Step 5: Deployment Script
Create `deploy.sh`:
```bash
#!/bin/bash
# Deploy script for Smart Quote Generator

echo "Deploying Smart Quote Generator..."

# Pull latest code
git pull origin main

# Deploy backend
cd backend
npm install --production
pm2 restart quote-backend

# Deploy frontend
cd ../frontend
npm install
npm run build
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r build/* /usr/share/nginx/html/

# Restart nginx
sudo systemctl restart nginx

echo "Deployment complete!"
```

### Step 6: Monitoring & Maintenance

#### 6.1 Setup CloudWatch
```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm
```

#### 6.2 Backup Strategy
- MongoDB Atlas handles database backups
- Use AWS S3 for file backups
- Git for code versioning

### Step 7: Security Checklist
- [ ] Change default JWT secret
- [ ] Enable AWS Security Groups
- [ ] Setup SSL/TLS
- [ ] Configure CORS properly
- [ ] Enable MongoDB IP whitelist
- [ ] Setup AWS IAM roles
- [ ] Enable CloudWatch monitoring
- [ ] Configure fail2ban

## Quick Start Commands

### Local Development
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Production Deployment
```bash
ssh -i your-key.pem ec2-user@your-instance-ip
cd smart-quote-generator
./deploy.sh
```

### Check Status
```bash
# Check backend
pm2 status

# Check nginx
sudo systemctl status nginx

# Check logs
pm2 logs quote-backend
```

## Troubleshooting

### Common Issues
1. **502 Bad Gateway**: Backend not running, check PM2
2. **White screen**: Check nginx root directory
3. **API calls failing**: Check proxy configuration
4. **MongoDB connection**: Whitelist EC2 IP in Atlas

### Useful Commands
```bash
# Restart everything
pm2 restart all
sudo systemctl restart nginx

# View logs
pm2 logs
sudo tail -f /var/log/nginx/error.log

# Check ports
sudo netstat -tlnp
```

## Cost Optimization
- Use t3.small instance (~$15/month)
- Stop instance when not in use
- Use AWS Free Tier if eligible
- Consider Reserved Instances for long-term

## Next Steps After Deployment
1. Test all features on mobile
2. Setup custom domain
3. Enable HTTPS
4. Setup automated backups
5. Configure monitoring alerts
6. Create staging environment

---

**Important Files to Backup Before Deployment:**
- All .env files
- MongoDB connection strings
- AWS keys and credentials
- Any custom configurations
