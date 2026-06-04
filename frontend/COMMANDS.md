# 🎮 Command Reference - Sinhas Track

## Quick Commands

### Development
```bash
# Start frontend only
npm run dev

# Start backend only (from root)
npm run dev:backend

# Start both frontend and backend
npm run dev:all

# Run all at once using Docker
npm run docker:up

# Stop Docker services
npm run docker:down
```

### Building
```bash
# Build for production
npm run build

# Build in development mode
npm run build:dev

# Preview production build locally
npm run preview
```

### Testing & Linting
```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run ESLint
npm run lint
```

### Setup & Installation
```bash
# Run initial setup script (Linux/macOS)
bash setup.sh

# Install dependencies (one time)
npm install

# Install Python dependencies for backend
pip install -r backend/requirements.txt
```

---

## Backend Commands

### Python Environment

```bash
# Navigate to backend
cd backend

# Create virtual environment (one time)
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

# Deactivate virtual environment
deactivate
```

### Backend Execution

```bash
# Run development server
python app.py

# Run with debug mode
python -u app.py

# Run with gunicorn (production)
gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 app:app

# Run with specific port
PORT=8000 python app.py
```

### Dependency Management

```bash
# Install requirements
pip install -r requirements.txt

# Install single package
pip install package-name

# Update requirements
pip freeze > requirements.txt

# Check installed packages
pip list
```

---

## Database Commands

### MongoDB (Atlas or Local)

```bash
# Connect to MongoDB using mongosh
mongosh "mongodb+srv://username:password@cluster.mongodb.net/test"

# Connect to local MongoDB
mongosh localhost:27017

# List databases
show databases

# Use specific database
use workforce-vision

# List collections
show collections

# Find all profiles
db.profiles.find()

# Find specific profile
db.profiles.findOne({ email: "test@example.com" })

# Count documents
db.sessions.countDocuments()

# View indexes
db.sessions.getIndexes()

# Create index
db.profiles.createIndex({ email: 1 }, { unique: true })
```

---

## Docker Commands

### Build & Run

```bash
# Build backend image
docker build -t sinhas-backend:latest ./backend

# Build frontend image
docker build -t sinhas-frontend:latest -f Dockerfile.frontend .

# Run backend container
docker run -p 5000:5000 --env-file backend/.env sinhas-backend:latest

# Run frontend container
docker run -p 5173:5173 sinhas-frontend:latest

# Build and run with compose
docker-compose build
docker-compose up

# Run in background
docker-compose up -d

# View logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (careful!)
docker-compose down -v
```

### Docker Cleanup

```bash
# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Full cleanup (careful!)
docker system prune -a
```

---

## API Testing

### Using curl

```bash
# Check health
curl http://localhost:5000/api/health

# List profiles
curl http://localhost:5000/api/profiles

# Get specific profile
curl http://localhost:5000/api/profiles/test@example.com

# Create profile
curl -X POST http://localhost:5000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "fullName": "Test User",
    "employeeId": "EMP001"
  }'

# Update profile
curl -X POST http://localhost:5000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "fullName": "Updated Name"
  }'

# Delete profile
curl -X DELETE http://localhost:5000/api/profiles/test@example.com

# List sessions
curl "http://localhost:5000/api/sessions?email=test@example.com"

# Create session
curl -X POST http://localhost:5000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "clockIn": "2024-03-25T09:00:00Z",
    "date": "2024-03-25"
  }'

# Get session
curl http://localhost:5000/api/sessions/SESSION_ID

# Update session (clock-out)
curl -X PATCH http://localhost:5000/api/sessions/SESSION_ID \
  -H "Content-Type: application/json" \
  -d '{
    "clockOut": "2024-03-25T17:00:00Z"
  }'

# List audit logs
curl http://localhost:5000/api/audit

# Add audit log
curl -X POST http://localhost:5000/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "actor": "admin@example.com",
    "action": "test_action",
    "target": "test"
  }'
```

### Using Postman

1. Create new collection "Sinhas Track"
2. Add requests:
   - `GET /api/health`
   - `GET /api/profiles`
   - `POST /api/profiles`
   - `GET /api/sessions`
   - `POST /api/sessions`
   - `PATCH /api/sessions/{id}`
   - `GET /api/audit`

---

## Git Commands

```bash
# Check status
git status

# Add files
git add .

# Commit changes
git commit -m "Feature: description"

# Push to remote
git push origin main

# Pull from remote
git pull origin main

# View log
git log --oneline

# View branches
git branch -a

# Create new branch
git checkout -b feature/new-feature

# Switch branch
git checkout main

# Merge branch
git merge feature/new-feature

# Delete branch
git branch -d feature/new-feature
```

---

## Environment Variables

### Backend (.env)

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workforce-vision

# Google Drive
GOOGLE_DRIVE_FOLDER_ID=folder-id-here
GOOGLE_DRIVE_API_KEY=api-key-here

# Flask Configuration
FLASK_ENV=development    # or production
PORT=5000

# Admin Configuration
ADMIN_EMAILS=admin@sinhas.ch,admin2@sinhas.ch

# Firebase (for future auth)
FIREBASE_PROJECT_ID=project-id
FIREBASE_PRIVATE_KEY=private-key
FIREBASE_CLIENT_EMAIL=client-email
```

### Frontend (.env)

```bash
# Backend API
VITE_MONGODB_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000

# Google Drive Upload
VITE_GOOGLE_DRIVE_UPLOAD_URL=https://script.google.com/macros/s/ID/exec

# Admin Configuration
VITE_ADMIN_EMAILS=admin@sinhas.ch

# Supabase (if needed)
VITE_SUPABASE_PROJECT_ID=project-id
VITE_SUPABASE_PUBLISHABLE_KEY=key
VITE_SUPABASE_URL=https://url.supabase.co
```

---

## File Management

### Creating Backups

```bash
# Backup database
mongodump --uri "mongodb+srv://user:pass@cluster..." \
  --out ./backup_$(date +%Y%m%d)

# Backup .env files
cp backend/.env backend/.env.backup
cp .env .env.backup

# Create project archive
zip -r sinhas-track-backup-$(date +%Y%m%d).zip .
```

### Clearing Cache

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules
npm install

# Clear Python cache
find . -type d -name __pycache__ -exec rm -r {} +

# Remove dist folder
rm -rf dist
npm run build
```

---

## Troubleshooting Commands

### Frontend Issues

```bash
# Clear everything and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run lint

# Run tests
npm test

# Build with verbose output
npm run build -- --debug
```

### Backend Issues

```bash
# Check Python version
python --version

# List installed packages
pip list

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Test MongoDB connection
python -c "from pymongo import MongoClient; print(MongoClient('your-uri'))"

# Run with verbose logging
python -u app.py
```

### Port Issues (Windows)

```powershell
# Find process using port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess

# Find process using port 5173
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess

# Kill process
Stop-Process -Id PID -Force
```

### Port Issues (macOS/Linux)

```bash
# Find process using port 5000
lsof -i :5000

# Find process using port 5173
lsof -i :5173

# Kill process
kill -9 PID
```

---

## Deployment Commands

### Render.com

```bash
# Install Render CLI
npm install -g @render/cli

# Deploy
render deploy
```

### Railway.app

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

### Fly.io

```bash
# Install Flyctl
npm install -g flyctl

# Login
flyctl auth login

# Launch new app
flyctl launch

# Deploy
flyctl deploy

# View logs
flyctl logs
```

---

## Monitoring Commands

```bash
# Check API health
curl http://localhost:5000/api/health

# Monitor backend logs (Docker)
docker logs -f sinhas_track_backend

# Monitor MongoDB
mongosh --eval "db.serverStatus()"

# List active connections
mongosh --eval "db.currentOp()"

# Check database size
mongosh --eval "db.stats()"

# Monitor WebSocket connections
# View in browser console or check backend logs
```

---

## Performance Commands

```bash
# Analyze bundle size
npm run build -- --analyze

# Profile build time
time npm run build

# Check dependency tree
npm ls

# Find duplicate packages
npm ls --depth=0

# Audit security
npm audit

# Fix security issues
npm audit fix
```

---

## Database Optimization

```bash
# Create missing indexes
mongosh << EOF
db.profiles.createIndex({ email: 1 }, { unique: true })
db.sessions.createIndex([("email", 1), ("date", -1)])
db.sessions.createIndex({ status: 1 })
db.audit_logs.createIndex([("at", -1)])
EOF

# Rebuild indexes
mongosh --eval "db.profiles.reIndex()"

# Database repair (if corrupted)
mongosh --repair
```

---

## Useful Aliases (Optional)

Add to `.bashrc` or `.zshrc`:

```bash
alias dev='npm run dev'
alias devall='npm run dev:all'
alias build='npm run build'
alias backend='cd backend && source venv/bin/activate && python app.py'
alias mongodev='mongosh localhost:27017'
alias docker-dev='docker-compose up -d'
alias docker-stop='docker-compose down'
```

Then use: `dev`, `backend`, `docker-dev`, etc.

---

## Emergency Reset

```bash
# CAREFUL: Complete reset (loses all local data)
rm -rf node_modules dist backend/venv .env
npm install
# Then reconfigure .env files
```

---

This reference covers 95% of commands you'll need.
Keep this file open while developing! 📋
