# Smart Quote Generator

AI-powered quote generation system for sheet metal fabrication with package quoting capabilities.

## 🚀 Features

- **DXF File Analysis**: Upload and automatically analyze CAD files
- **3D Visualization**: Interactive 3D preview of parts
- **Package Quoting**: Multi-product quotes with automatic discounts
- **Customer Portal**: Self-service access for customers
- **Professional PDFs**: Automated quote generation
- **Mobile Optimized**: Responsive design for field use

## 🛠️ Tech Stack

- **Frontend**: React 18 with Three.js
- **Backend**: Node.js/Express with MongoDB
- **Authentication**: JWT-based secure access
- **Deployment**: AWS Amplify + Railway

## 📱 Live Demo

- **Production URL**: Coming soon
- **Customer Portal**: `/customer-portal`
- **Admin Interface**: `/`

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/smart-quote-generator.git
cd smart-quote-generator
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Configure environment variables:

Backend `.env`:
```env
PORT=3002
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret_key
FRONTEND_URL=http://localhost:3000
```

Frontend `.env`:
```env
REACT_APP_API_URL=http://localhost:3002
```

4. Start the development servers:
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🚢 Deployment

### Backend (Railway)
1. Connect GitHub repository to Railway
2. Set root directory to `/backend`
3. Add environment variables
4. Deploy

### Frontend (AWS Amplify)
1. Connect GitHub repository to Amplify
2. Set root directory to `/frontend`
3. Configure build settings (use amplify.yml)
4. Deploy

## 📊 Project Structure

```
smart-quote-generator/
├── frontend/              # React application
├── backend/               # Express API
├── docs/                  # Documentation
├── test-files/           # Sample DXF files
└── infrastructure/       # Deployment configs
```

## 🎨 Design System

- **Primary Color**: Pine Green (#1A4D46)
- **Accent Warm**: Terracotta (#D97559)
- **Accent Cool**: Sky Blue (#6FA3A0)

## 🔐 Security

- JWT authentication
- Bcrypt password hashing
- Rate limiting enabled
- CORS configured for production
- MongoDB Atlas with IP whitelist

## 📝 License

Private - HFI Metal Fabrication

## 👥 Contributors

- Korbin - Lead Developer

---

Built with ❤️ for HFI Metal Fabrication