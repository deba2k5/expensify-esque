# 📋 Deployment Checklist - Sinhas Track

## Pre-Deployment Setup

### ✅ Database Setup
- [ ] Create MongoDB Atlas account (free tier available)
- [ ] Create a project in MongoDB Atlas
- [ ] Create a free M0 cluster
- [ ] Add your IP to the whitelist
- [ ] Create database user with credentials
- [ ] Get connection string
- [ ] Update `backend/.env`: `MONGODB_URI=mongodb+srv://user:pass@...`
- [ ] Test connection: `mongosh "your-connection-string"`

### ✅ Google Drive Setup
- [ ] Create folder in Google Drive: "Sinhas Track Uploads"
- [ ] Open folder and copy ID from URL
- [ ] Update `backend/.env`: `GOOGLE_DRIVE_FOLDER_ID=your-folder-id`
- [ ] Share folder with appropriate permissions

### ✅ Firebase Setup (Authentication)
- [ ] Create Firebase project at https://console.firebase.google.com
- [ ] Enable Email/Password authentication
- [ ] Create admin account (e.g., admin@sinhas.ch)
- [ ] Create test employee accounts
- [ ] Get Firebase config (for future auth integration)

### ✅ Local Testing
- [ ] Run `npm install`
- [ ] Run `npm run build` (verify no errors)
- [ ] Copy `backend/.env.example` to `backend/.env`
- [ ] Update backend environment variables
- [ ] Start frontend: `npm run dev`
- [ ] Start backend: `cd backend && python app.py`
- [ ] Test API: `curl http://localhost:5000/api/health`
- [ ] Test WebSocket connection in browser console
- [ ] Create test profile via API
- [ ] Verify real-time updates work

---

## Production Deployment

### Choose Your Platform

#### Option A: Render.com (RECOMMENDED - Easiest)

**Backend Deployment:**
- [ ] Push code to GitHub
- [ ] Create new Web Service on https://render.com
- [ ] Connect GitHub repository
- [ ] Set build command: `pip install -r requirements.txt`
- [ ] Set start command: `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT app:app`
- [ ] Add environment variables:
  - [ ] `MONGODB_URI`: Your MongoDB connection string
  - [ ] `GOOGLE_DRIVE_FOLDER_ID`: Your folder ID
  - [ ] `FLASK_ENV`: `production`
  - [ ] `PORT`: `10000`
- [ ] Deploy
- [ ] Note the backend URL (e.g., `https://sinhas-backend.onrender.com`)
- [ ] Test: `curl https://sinhas-backend.onrender.com/api/health`

**Frontend Deployment:**
- [ ] Create new Static Site on https://render.com
- [ ] Connect GitHub repository
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `dist`
- [ ] Add environment variables:
  - [ ] `VITE_MONGODB_API_URL`: `https://sinhas-backend.onrender.com/api`
  - [ ] `VITE_WS_URL`: `https://sinhas-backend.onrender.com`
  - [ ] `VITE_GOOGLE_DRIVE_UPLOAD_URL`: Your Google Apps Script URL
  - [ ] `VITE_ADMIN_EMAILS`: `admin@sinhas.ch`
- [ ] Deploy
- [ ] Test frontend loads at provided URL

#### Option B: Railway.app

**Backend:**
- [ ] Install Railway CLI: `npm i -g @railway/cli`
- [ ] Login: `railway login`
- [ ] Navigate to backend: `cd backend`
- [ ] Initialize: `railway init`
- [ ] Set environment variables via dashboard
- [ ] Deploy: `railway up`

**Frontend:**
- [ ] Navigate to frontend: `cd ../`
- [ ] Initialize: `railway init`
- [ ] Set environment variables
- [ ] Deploy: `railway up`

#### Option C: AWS/DigitalOcean

- [ ] Build Docker images:
  ```bash
  docker build -t sinhas-backend:latest ./backend
  docker build -t sinhas-frontend:latest -f Dockerfile.frontend .
  ```
- [ ] Tag and push to registry (Docker Hub, ECR, etc.)
- [ ] Deploy using docker-compose.prod.yml
- [ ] Set up reverse proxy (nginx)
- [ ] Configure SSL certificate (Let's Encrypt)
- [ ] Set up custom domain

---

## Post-Deployment Verification

### ✅ Backend Verification
- [ ] Health check endpoint responds: `GET /api/health`
- [ ] List profiles endpoint works: `GET /api/profiles`
- [ ] Create profile works: `POST /api/profiles`
- [ ] WebSocket connects without errors
- [ ] CORS headers present in responses
- [ ] Error handling works (test with invalid data)

### ✅ Frontend Verification
- [ ] Frontend loads successfully
- [ ] No console errors
- [ ] WebSocket connects to backend
- [ ] Login page loads
- [ ] API calls use production backend URL
- [ ] Real-time updates work

### ✅ Database Verification
- [ ] MongoDB connection works
- [ ] Collections are created
- [ ] Indexes are created
- [ ] Can view data in MongoDB Atlas

### ✅ Security Verification
- [ ] Backend uses HTTPS
- [ ] Frontend uses HTTPS
- [ ] CORS is properly configured
- [ ] Environment variables not exposed
- [ ] Database credentials not in code

---

## Ongoing Maintenance

### 📊 Monitoring
- [ ] Set up backend logs monitoring (Render Dashboard)
- [ ] Set up error tracking (Sentry.io)
- [ ] Monitor MongoDB usage
- [ ] Set up uptime monitoring (StatusPage)

### 🔄 Backups
- [ ] Enable MongoDB Atlas automatic backups
- [ ] Test backup restoration process
- [ ] Document backup procedure

### 📈 Performance
- [ ] Monitor API response times
- [ ] Check database query performance
- [ ] Monitor WebSocket connections
- [ ] Optimize if needed

### 🔐 Security
- [ ] Update dependencies regularly
- [ ] Review audit logs
- [ ] Check for security vulnerabilities
- [ ] Implement rate limiting if needed

---

## Troubleshooting

### Backend Won't Start
```bash
# Check Python version
python --version  # Should be 3.9+

# Check dependencies
pip list

# Run with verbose output
python -u app.py
```

### MongoDB Connection Error
```bash
# Test connection string
mongosh "your-connection-string"

# Check credentials in .env
cat backend/.env | grep MONGODB_URI

# Whitelist IP in MongoDB Atlas
```

### WebSocket Connection Fails
```bash
# Check WebSocket URL in frontend
console.log(import.meta.env.VITE_WS_URL)

# Check backend is running
curl https://your-backend-url/api/health

# Check browser console for errors
```

### Build Fails
```bash
# Clear node modules and rebuild
rm -rf node_modules
npm install
npm run build

# Check for TypeScript errors
npm run lint
```

---

## Rollback Plan

If something goes wrong in production:

1. **Frontend Issues**
   - [ ] Render: Redeploy previous version
   - [ ] Railway: Revert to previous deployment
   - [ ] AWS: Use load balancer to rollback

2. **Backend Issues**
   - [ ] Render: Redeploy previous version
   - [ ] Railway: Revert to previous deployment
   - [ ] AWS: Use load balancer to rollback

3. **Database Issues**
   - [ ] Restore from latest backup in MongoDB Atlas
   - [ ] Verify backup integrity before restore
   - [ ] Update backend environment if needed

---

## Go-Live Checklist

Final verification before going live:

### 24 Hours Before Launch
- [ ] All environment variables set correctly
- [ ] Database backups configured
- [ ] Monitoring and logging active
- [ ] SSL certificates valid
- [ ] Load testing completed
- [ ] Security audit completed

### At Launch
- [ ] Announce to users
- [ ] Monitor error logs closely
- [ ] Monitor performance metrics
- [ ] Have support team ready
- [ ] Document any issues

### After Launch
- [ ] Collect user feedback
- [ ] Monitor system performance
- [ ] Fix any critical issues
- [ ] Plan optimization if needed

---

## Emergency Contacts

When issues arise, check these in order:

1. **Local Testing**
   - Reproduce locally to narrow down issue
   - Check browser console and terminal logs

2. **Platform Support**
   - Render: https://render.com/support
   - Railway: https://railway.app/support
   - AWS: https://aws.amazon.com/support

3. **Database Support**
   - MongoDB Atlas: https://www.mongodb.com/support

4. **Documentation**
   - API.md - API reference
   - DEPLOYMENT.md - Deployment guide
   - QUICKSTART.md - Setup help

---

## Timeline Estimate

| Task | Time |
|------|------|
| MongoDB Atlas setup | 15 min |
| Google Drive setup | 10 min |
| Firebase setup | 20 min |
| Local testing | 30 min |
| Deploy backend | 15 min |
| Deploy frontend | 15 min |
| Post-deployment verification | 20 min |
| **Total** | **~2 hours** |

---

## Success Criteria

✅ You're done when:
- [ ] Backend API responds to requests
- [ ] Frontend loads without errors
- [ ] WebSocket connects successfully
- [ ] Real-time updates work
- [ ] Database stores data
- [ ] All environment variables configured
- [ ] SSL/HTTPS working
- [ ] Users can log in and use the app
- [ ] Audit logs are being recorded
- [ ] Admin can approve sessions
- [ ] Employees can see real-time updates

---

**You're ready to launch!** 🚀

For any issues, refer to DEPLOYMENT.md or API.md for detailed guidance.
