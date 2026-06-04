# Backend - Sinhas Track API

This is the Flask backend for the Sinhas Track employee management system, deployed on Vercel.

## Structure

```
backend/
├── app.py               # Main Flask application
├── requirements.txt     # Python dependencies
├── vercel.json         # Vercel deployment config
└── README.md
```

## Local Development

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

API will be at: http://localhost:5000

## Deployment on Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Deploy backend to Vercel"
git push origin main
```

### Step 2: Deploy on Vercel
1. Go to https://vercel.com
2. Click "New Project"
3. Select your GitHub repository
4. Select the `backend` directory as root
5. Set environment variables (see below)
6. Click Deploy

### Step 3: Set Environment Variables in Vercel
Go to Settings → Environment Variables and add:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workforce-vision
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
ADMIN_EMAILS=admin@sinhas.ch
FLASK_ENV=production
```

## Environment Variables

Create `.env` file locally:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/workforce-vision
GOOGLE_DRIVE_FOLDER_ID=1i5eJ2S3LVEsnEYI8gpljk-E0eoq6rCSb
ADMIN_EMAILS=admin@sinhas.ch
FLASK_ENV=production
```

## API Endpoints

All endpoints available at deployed URL:

```
GET    /api/profiles              List profiles
GET    /api/profiles/:email       Get profile
POST   /api/profiles              Create/Update
DELETE /api/profiles/:email       Delete

GET    /api/sessions              List sessions
POST   /api/sessions              Create session
PATCH  /api/sessions/:id          Update session
POST   /api/sessions/:id/breaks   Add break
POST   /api/sessions/:id/locations  Add location

GET    /api/audit                 List audit logs
POST   /api/audit                 Create audit log

GET    /api/health                Health check
GET    /                          API info
```

## Database

- MongoDB Atlas integration
- Automatic indexing on deployment
- Collections: profiles, sessions, audit_logs

## Deployment

Vercel automatically deploys on GitHub push.

Check deployment status:
- Visit https://vercel.com dashboard
- Your backend URL will be: `https://sinhas-backend.vercel.app` (or custom domain)

## Troubleshooting

### Connection Error to MongoDB
- Verify MONGODB_URI in environment variables
- Whitelist Vercel IPs in MongoDB Atlas
- Check database credentials

### CORS Errors
- Ensure frontend URL is in CORS configuration
- Update `vercel.json` if needed

### Cold Start
- First request may be slower (Vercel cold starts)
- Subsequent requests will be faster
