# Deployment Prompt for New Claude Conversation

Copy and paste this entire prompt into a new Claude conversation:

---

I need help deploying my Smart Quote Generator app to AWS for mobile access. Here's my current setup:

## Project Details
- **Project Path**: `C:\Users\Korbin\smart-quote-generator`
- **GitHub Repo**: [I need to create/push to GitHub]
- **Tech Stack**: React frontend (port 3000) + Node.js backend (port 3002) + MongoDB Atlas

## Current State
- Frontend and backend working locally
- MongoDB connected to Atlas cloud database
- Package Quoting feature recently added
- Pine Green theme implemented
- Environment variables configured in .env files

## File Structure
```
smart-quote-generator/
├── frontend/          # React app
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # Express API
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
└── .env files         # Environment configs
```

## What I Need
1. Deploy to AWS so I can access on mobile devices
2. Keep it simple and cost-effective
3. Ensure Package Quote feature works on mobile
4. HTTPS enabled for security
5. Easy to update when I make changes

## Preferred Approach
I'm thinking either:
- AWS Amplify for frontend + Railway/Heroku for backend (simpler)
- Single EC2 instance running everything (more control)

## Key Features That Must Work
1. File upload (DXF files)
2. Package quote text parsing
3. User authentication
4. Real-time pricing calculations

## My Experience Level
- Comfortable with Git basics
- Have AWS account
- New to deployment
- Need step-by-step instructions

Please provide:
1. Which deployment option you recommend
2. Pre-deployment checklist
3. Step-by-step deployment instructions
4. How to test on mobile
5. Troubleshooting common issues

## Additional Context
- This is for HFI (metal fabrication company)
- Will be used by sales team on tablets/phones
- Needs to be reliable during business hours
- Budget conscious (prefer under $20/month)

---

End of prompt. The AI assistant should now guide you through the deployment process step by step.
