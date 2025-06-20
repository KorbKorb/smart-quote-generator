# Smart Quote Generator

AI-powered quote generation system for sheet metal fabrication.

## Features
- CAD file analysis (DXF, DWG, PDF support)
- Automatic cost estimation
- Material and process calculations
- Real-time 3D visualization
- PDF quote generation

## Setup
1. Install dependencies: `npm install`
2. Copy environment files: 
   - `cp frontend/.env.example frontend/.env`
   - `cp backend/.env.example backend/.env`
3. Start development: `npm run dev`

## Tech Stack
- Frontend: React, Three.js, AWS Amplify
- Backend: Node.js, Express, MongoDB
- AWS: S3, DynamoDB, Lambda, Cognito
