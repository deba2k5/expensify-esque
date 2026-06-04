# QUICK START GUIDE - Sinhas Track

## 🚀 Option 1: Docker (Recommended)

### Prerequisites
- Docker & Docker Compose installed
- MongoDB Atlas account (or use local MongoDB container)

### Steps
```bash
# 1. Copy environment template
cp backend/.env.example backend/.env

# 2. Edit backend/.env with your credentials
nano backend/.env
# Update:
# - MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workforce-vision
# - GOOGLE_DRIVE_FOLDER_ID=1i5eJ2S3LVEsnEYI8gpljk-E0eoq6rCSb

# 3. Start all services
docker-compose up

# Access:
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000/api
```

---

## 💻 Option 2: Local Development

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account or local MongoDB

### Step-by-Step Setup

**1. Clone and Navigate**
```bash
cd expensify-esque
```

**2. Setup Backend**
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

**3. Configure Backend (.env)**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workforce-vision
GOOGLE_DRIVE_FOLDER_ID=1i5eJ2S3LVEsnEYI8gpljk-E0eoq6rCSb
FLASK_ENV=development
PORT=5000
```

**4. Setup Frontend**
```bash
cd ../

# Install dependencies
npm install

# Update .env with backend URL
cat >> .env << EOF

VITE_MONGODB_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
EOF
```

**5. Run Development Servers**

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - Backend:
```bash
cd backend
source venv/bin/activate
python app.py
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Backend API: http://localhost:5000/api

---

## 🔧 MongoDB Setup (MongoDB Atlas)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create a project
4. Create a cluster (free tier M0)
5. Add your IP to whitelist
6. Create database user with credentials
7. Click "Connect" → "Drivers" → Copy connection string
8. Replace in `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster-name.mongodb.net/workforce-vision?retryWrites=true&w=majority
   ```

---

## 📁 Google Drive Folder for Uploads

1. Open https://drive.google.com
2. Create a new folder: "Sinhas Track Uploads"
3. Right-click → "Share" → Make it accessible
4. Note the folder ID from URL:
   ```
   https://drive.google.com/drive/folders/1i5eJ2S3LVEsnEYI8gpljk-E0eoq6rCSb
                                        ↑ This is the folder ID
   ```
5. Update `backend/.env`:
   ```
   GOOGLE_DRIVE_FOLDER_ID=1i5eJ2S3LVEsnEYI8gpljk-E0eoq6rCSb
   ```

---

## ✅ Testing the Setup

### 1. Check Backend Health
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-03-25T10:30:00.000Z"
}
```

### 2. Check Frontend
Open http://localhost:5173 in browser

### 3. Check WebSocket Connection
Open browser console and verify no WebSocket errors

### 4. Create Test Profile
```bash
curl -X POST http://localhost:5000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "fullName": "Test User",
    "employeeId": "EMP001",
    "mobile": "1234567890",
    "department": "Engineering",
    "employeeType": "permanent",
    "active": true
  }'
```

---

## 🌐 Production Deployment

### Quick Deployment to Render.com

1. **Push to GitHub first**
   ```bash
   git add .
   git commit -m "Add backend and deployment config"
   git push origin main
   ```

2. **Deploy Backend**
   - Go to https://render.com
   - Create → Web Service
   - Connect GitHub repo
   - Build Command: `pip install -r requirements.txt`
   - Start Command: 
     ```
     gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT app:app
     ```
   - Set environment variables (from your .env)
   - Deploy

3. **Get Backend URL**
   - After deployment, note the URL: `https://your-backend.onrender.com`

4. **Deploy Frontend**
   - Create → Static Site
   - Connect GitHub repo
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Add environment variable:
     ```
     VITE_MONGODB_API_URL=https://your-backend.onrender.com/api
     VITE_WS_URL=https://your-backend.onrender.com
     ```
   - Deploy

---

## 📊 Real-Time Updates

The system uses WebSocket for real-time updates:

- **Session updates**: Instant notifications for clock-in/out
- **Approvals**: Real-time admin approval notifications
- **Audit logs**: Instant audit trail updates
- **Profile changes**: Real-time profile synchronization

No page refresh needed!

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.10+

# Check if port 5000 is in use
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Install missing packages
pip install -r requirements.txt
```

### Frontend can't reach backend
```bash
# Check backend is running
curl http://localhost:5000/api/health

# Check VITE_MONGODB_API_URL in .env
cat .env | grep VITE_MONGODB_API_URL
```

### MongoDB connection error
```bash
# Test connection string
mongosh "YOUR_MONGODB_URI"

# If it fails:
# 1. Check credentials in URI
# 2. Whitelist your IP in MongoDB Atlas
# 3. Ensure /workforce-vision database exists
```

### WebSocket connection fails
```bash
# Check VITE_WS_URL in .env
# Ensure it matches backend URL
# Check browser console for detailed error
```

---

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start frontend
npm run dev:backend     # Start backend
npm run dev:all         # Start both (requires concurrently)

# Building
npm run build           # Production build

# Testing
npm test               # Run tests
npm run test:watch    # Watch mode

# Docker
npm run docker:up     # Start Docker services
npm run docker:down   # Stop Docker services

# Backend management
cd backend
pip install -r requirements.txt  # Install deps
source venv/bin/activate        # Activate venv
python app.py                   # Run server
```

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs in browser console (frontend) and terminal (backend)
3. Check MongoDB Atlas dashboard for database issues
4. Verify all environment variables are set correctly

---

## 🎯 Next Steps

1. ✅ Set up MongoDB Atlas
2. ✅ Configure Google Drive folder
3. ✅ Update environment files
4. ✅ Start development servers
5. 📋 Create admin account in Firebase
6. 📋 Create employee accounts
7. 📋 Test full workflow (clock-in/out, approvals, etc.)
8. 🚀 Deploy to production
