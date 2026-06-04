# DEPLOYMENT GUIDE

## Local Development

### Quick Start
```bash
# 1. Setup (one time)
chmod +x setup.sh
./setup.sh

# 2. Update backend/.env with your credentials

# 3. Start frontend (Terminal 1)
npm run dev

# 4. Start backend (Terminal 2)
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

### Using Docker Compose
```bash
docker-compose up
```

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- MongoDB: mongodb://localhost:27017

---

## Production Deployment

### Option 1: Render.com (Recommended)

1. **Backend Deployment**
   ```bash
   # Push your code to GitHub first
   cd backend
   ```
   
   - Go to https://render.com
   - Create new Web Service
   - Connect your GitHub repo
   - Set Environment Variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `GOOGLE_DRIVE_FOLDER_ID`: Your Google Drive folder ID
     - `FLASK_ENV`: `production`
     - `PORT`: `10000`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn --worker-class eventlet -w 1 app:app`

2. **Frontend Deployment**
   - Go to https://render.com
   - Create new Static Site
   - Connect your GitHub repo
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Set Environment Variables:
     - `VITE_MONGODB_API_URL`: `https://your-backend-url.onrender.com/api`
     - `VITE_WS_URL`: `https://your-backend-url.onrender.com`

---

### Option 2: Railway.app

1. **Backend**
   ```bash
   npm i -g @railway/cli
   railway login
   cd backend
   railway init
   railway up
   ```

2. **Configure in Railway Dashboard**
   - Set environment variables
   - Link to MongoDB

3. **Frontend**
   ```bash
   railway link
   railway up
   ```

---

### Option 3: Fly.io

1. **Backend**
   ```bash
   flyctl auth login
   cd backend
   flyctl launch
   flyctl secrets set MONGODB_URI="your-uri"
   flyctl deploy
   ```

2. **Frontend**
   ```bash
   cd ../
   flyctl launch
   flyctl deploy
   ```

---

### Option 4: AWS/DigitalOcean (with Docker)

1. **Build and Push Docker Image**
   ```bash
   docker build -t sinhas-backend:latest ./backend
   docker tag sinhas-backend:latest your-registry/sinhas-backend:latest
   docker push your-registry/sinhas-backend:latest
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Configure with environment variables**

---

## MongoDB Atlas Setup

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free tier cluster
3. Add your IP to whitelist
4. Create database user
5. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/workforce-vision`
6. Add to `.env` as `MONGODB_URI`

---

## Google Drive Setup

1. Open https://drive.google.com
2. Create a folder for uploads
3. Note the folder ID from URL: `https://drive.google.com/drive/folders/FOLDER_ID`
4. For automated upload integration:
   - Go to https://script.google.com
   - Create new project
   - Paste the Apps Script code (see BACKEND.md)
   - Deploy as web app
   - Note the deployment ID
   - Update `VITE_GOOGLE_DRIVE_UPLOAD_URL` in frontend

---

## Environment Variables Checklist

### Backend (.env)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/workforce-vision
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
FLASK_ENV=production
PORT=5000
ADMIN_EMAILS=admin@sinhas.ch
```

### Frontend (.env)
```
VITE_MONGODB_API_URL=https://your-backend.onrender.com/api
VITE_WS_URL=https://your-backend.onrender.com
VITE_GOOGLE_DRIVE_UPLOAD_URL=https://script.google.com/macros/s/YOUR_ID/exec
VITE_ADMIN_EMAILS=admin@sinhas.ch
```

---

## Monitoring & Logs

### Render.com
- Dashboard → Logs tab
- Real-time streaming

### Railway.app
- Dashboard → Deployments → View logs

### Fly.io
```bash
flyctl logs
```

---

## SSL/HTTPS

All recommended platforms provide free SSL certificates automatically.

---

## Database Backups

### MongoDB Atlas
- Automatic daily backups included
- Configure in Cluster Settings

### Manual Backup
```bash
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/workforce-vision" \
  --out ./backup_$(date +%Y%m%d)
```

---

## Performance Optimization

1. **Enable MongoDB indexes** (already configured in app.py)
2. **Configure CDN** for static assets
3. **Enable gzip compression** (auto with gunicorn)
4. **Set up caching headers**
5. **Monitor WebSocket connections**

---

## Security Checklist

- ✅ HTTPS enabled
- ✅ CORS configured
- ✅ MongoDB connection encrypted
- ✅ Environment variables not in code
- ✅ Input validation on backend
- ✅ Rate limiting (implement in production)
- ✅ Firebase token verification (in production)
- ✅ Admin email verification
- ✅ Audit logging enabled

---

## Troubleshooting

### Connection Refused
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check MongoDB connection
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/test"
```

### CORS Errors
- Frontend and Backend must be on same origin or properly configured
- Check `CORS()` settings in app.py

### WebSocket Connection Failed
- Check if WebSocket URL is correct
- Ensure backend is running
- Check firewall settings

### MongoDB Connection Timeout
- Whitelist your IP in MongoDB Atlas
- Check connection string format
- Verify user credentials
