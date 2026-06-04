# Sinhas Track Backend API

A Python Flask backend for the Sinhas Track employee management system, providing REST APIs for profiles, sessions, and audit logging with MongoDB storage.

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file:
```bash
cp .env.example .env
```

Update with your values:
- `MONGODB_URI`: MongoDB Atlas connection string
- `GOOGLE_DRIVE_FOLDER_ID`: Your Google Drive folder ID
- `FLASK_ENV`: Set to `development` for local testing

### 3. Run Locally
```bash
python app.py
```

The API will be available at `http://localhost:5000`

### 4. Deploy to Production

**Option A: Render.com**
1. Push code to GitHub
2. Connect repo to Render.com
3. Set environment variables in Render dashboard
4. Deploy

**Option B: Railway.app**
1. `npm i -g railway`
2. `railway login`
3. `railway init`
4. `railway up`

**Option C: Fly.io**
1. `npm install -g flyctl`
2. `flyctl auth login`
3. `flyctl launch`
4. `flyctl deploy`

## API Endpoints

### Profiles
- `GET /api/profiles` - List all profiles
- `GET /api/profiles/<email>` - Get profile by email
- `POST /api/profiles` - Create/update profile
- `DELETE /api/profiles/<email>` - Soft delete profile

### Sessions
- `GET /api/sessions` - List sessions (with filters)
- `POST /api/sessions` - Create new session
- `GET /api/sessions/<id>` - Get session by ID
- `PATCH /api/sessions/<id>` - Update session
- `POST /api/sessions/<id>/breaks` - Add break
- `POST /api/sessions/<id>/locations` - Add location ping

### Audit Logs
- `GET /api/audit` - List audit logs
- `POST /api/audit` - Create audit log entry

### Health
- `GET /api/health` - Health check
- `GET /` - API info

## Real-Time Updates (WebSocket)

Connect to the WebSocket endpoint:
```javascript
const socket = io('http://localhost:5000', {
  query: { email: 'user@example.com' }
});

// Listen for real-time updates
socket.on('session_updated', (data) => console.log('Session updated:', data));
socket.on('session_created', (data) => console.log('Session created:', data));
socket.on('audit_log_created', (data) => console.log('Audit logged:', data));
```

## Database Schema

### Profiles Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  employeeId: String,
  fullName: String,
  mobile: String,
  department: String,
  employeeType: String, // "permanent" or "contractual"
  active: Boolean,
  createdAt: ISO String,
  updatedAt: ISO String
}
```

### Sessions Collection
```javascript
{
  _id: ObjectId,
  email: String,
  employeeId: String,
  fullName: String,
  date: String (YYYY-MM-DD),
  clockIn: ISO String,
  clockOut: ISO String,
  workType: String,
  description: String,
  breaks: [
    {
      id: String,
      type: String,
      start: ISO String,
      end: ISO String
    }
  ],
  locations: [
    {
      lat: Number,
      lng: Number,
      accuracy: Number,
      at: ISO String,
      outsideGeofence: Boolean
    }
  ],
  attachments: [
    {
      name: String,
      url: String,
      type: String
    }
  ],
  totalWorkMs: Number,
  totalBreakMs: Number,
  status: String, // "pending", "approved", "rejected"
  adminComment: String,
  reviewedBy: String,
  reviewedAt: ISO String,
  createdAt: ISO String,
  updatedAt: ISO String
}
```

### Audit Logs Collection
```javascript
{
  _id: ObjectId,
  actor: String (email),
  action: String,
  target: String,
  at: ISO String,
  meta: Object
}
```

## Security

- Add Firebase token verification in production
- Implement RBAC (admin vs employee)
- Add rate limiting
- Use HTTPS in production
- Validate all inputs
- Add comprehensive error handling
