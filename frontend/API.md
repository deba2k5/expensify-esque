# API Documentation - Sinhas Track Backend

## Base URL
```
http://localhost:5000/api  (development)
https://your-backend.onrender.com/api  (production)
```

## Authentication
Currently, the API checks for `X-User-Email` header. In production, implement Firebase token verification.

## Response Format
All responses are JSON. Success returns data, errors return `{ error: "message" }`.

---

## Profiles Endpoints

### List All Profiles
```
GET /api/profiles
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "email": "employee@example.com",
    "fullName": "John Doe",
    "employeeId": "EMP001",
    "mobile": "1234567890",
    "department": "Engineering",
    "employeeType": "permanent",
    "active": true,
    "createdAt": "2024-03-25T10:00:00.000Z",
    "updatedAt": "2024-03-25T10:00:00.000Z"
  }
]
```

---

### Get Profile by Email
```
GET /api/profiles/:email
```

**Parameters:**
- `email` (path): User's email address

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "employee@example.com",
  "fullName": "John Doe",
  "employeeId": "EMP001",
  "mobile": "1234567890",
  "department": "Engineering",
  "employeeType": "permanent",
  "active": true,
  "createdAt": "2024-03-25T10:00:00.000Z",
  "updatedAt": "2024-03-25T10:00:00.000Z"
}
```

**Errors:**
- `404`: Profile not found
- `500`: Server error

---

### Create or Update Profile
```
POST /api/profiles
```

**Headers:**
```
Content-Type: application/json
X-User-Email: admin@example.com
```

**Request Body:**
```json
{
  "email": "employee@example.com",
  "fullName": "John Doe",
  "employeeId": "EMP001",
  "mobile": "1234567890",
  "department": "Engineering",
  "employeeType": "permanent",
  "active": true
}
```

**Response:** Updated profile object

---

### Delete Profile (Soft Delete)
```
DELETE /api/profiles/:email
```

**Response:**
```json
{ "success": true }
```

---

## Sessions Endpoints

### List Sessions
```
GET /api/sessions
```

**Query Parameters:**
- `email` (optional): Filter by employee email
- `status` (optional): Filter by status (pending, approved, rejected)
- `date` (optional): Filter by date (YYYY-MM-DD)

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "email": "employee@example.com",
    "employeeId": "EMP001",
    "fullName": "John Doe",
    "date": "2024-03-25",
    "clockIn": "2024-03-25T09:00:00.000Z",
    "clockOut": "2024-03-25T17:00:00.000Z",
    "workType": "office",
    "description": "Regular work",
    "breaks": [
      {
        "id": "break_1",
        "type": "lunch",
        "start": "2024-03-25T12:00:00.000Z",
        "end": "2024-03-25T13:00:00.000Z"
      }
    ],
    "locations": [
      {
        "lat": 40.7128,
        "lng": -74.0060,
        "accuracy": 10,
        "at": "2024-03-25T09:00:00.000Z",
        "outsideGeofence": false
      }
    ],
    "attachments": [],
    "totalWorkMs": 28800000,
    "totalBreakMs": 3600000,
    "status": "pending",
    "adminComment": null,
    "reviewedBy": null,
    "reviewedAt": null,
    "createdAt": "2024-03-25T09:00:00.000Z",
    "updatedAt": "2024-03-25T17:00:00.000Z"
  }
]
```

---

### Create New Session (Clock-In)
```
POST /api/sessions
```

**Headers:**
```
Content-Type: application/json
X-User-Email: employee@example.com
```

**Request Body:**
```json
{
  "email": "employee@example.com",
  "employeeId": "EMP001",
  "fullName": "John Doe",
  "date": "2024-03-25",
  "clockIn": "2024-03-25T09:00:00.000Z",
  "workType": "office",
  "description": "Regular work",
  "breaks": [],
  "locations": [],
  "attachments": [],
  "status": "pending"
}
```

**Response:** Created session object with `_id`

---

### Get Session by ID
```
GET /api/sessions/:session_id
```

**Response:** Session object

---

### Update Session (Clock-Out, Approve, etc.)
```
PATCH /api/sessions/:session_id
```

**Headers:**
```
Content-Type: application/json
X-User-Email: admin@example.com
```

**Request Body (examples):**

Clock-out:
```json
{
  "clockOut": "2024-03-25T17:00:00.000Z"
}
```

Admin approval:
```json
{
  "status": "approved",
  "reviewedBy": "admin@example.com",
  "reviewedAt": "2024-03-25T18:00:00.000Z",
  "adminComment": "Approved"
}
```

Update total work time:
```json
{
  "totalWorkMs": 28800000,
  "totalBreakMs": 3600000
}
```

**Response:** Updated session object

---

### Add Break to Session
```
POST /api/sessions/:session_id/breaks
```

**Request Body:**
```json
{
  "type": "lunch",
  "start": "2024-03-25T12:00:00.000Z",
  "end": "2024-03-25T13:00:00.000Z"
}
```

**Response:** Updated session object with new break added

---

### Add Location Ping to Session
```
POST /api/sessions/:session_id/locations
```

**Request Body:**
```json
{
  "lat": 40.7128,
  "lng": -74.0060,
  "accuracy": 10,
  "outsideGeofence": false
}
```

**Response:** Updated session object with new location added

---

## Audit Log Endpoints

### List Audit Logs
```
GET /api/audit
```

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 500, max: 1000)

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "actor": "admin@example.com",
    "action": "profile_updated",
    "target": "employee@example.com",
    "at": "2024-03-25T10:00:00.000Z",
    "meta": {
      "profile": {
        "fullName": "John Doe"
      }
    }
  },
  {
    "_id": "507f1f77bcf86cd799439014",
    "actor": "employee@example.com",
    "action": "session_created",
    "target": "507f1f77bcf86cd799439012",
    "at": "2024-03-25T09:00:00.000Z",
    "meta": {
      "session": { }
    }
  }
]
```

---

### Create Audit Log Entry
```
POST /api/audit
```

**Request Body:**
```json
{
  "actor": "admin@example.com",
  "action": "session_approved",
  "target": "507f1f77bcf86cd799439012",
  "meta": {
    "comment": "Good work"
  }
}
```

**Response:** Created audit log entry

---

## File Upload Endpoint

### Upload File
```
POST /api/upload
```

**Headers:**
```
Content-Type: multipart/form-data
X-User-Email: employee@example.com
```

**Form Data:**
- `file`: File to upload

**Response:**
```json
{
  "name": "document.pdf",
  "size": 102400,
  "url": "https://drive.google.com/file/d/...",
  "id": "file-id",
  "uploadedAt": "2024-03-25T10:00:00.000Z",
  "uploadedBy": "employee@example.com"
}
```

---

## Health Check

### Check API Status
```
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-03-25T10:00:00.000Z"
}
```

---

## Root Endpoint

### API Information
```
GET /
```

**Response:**
```json
{
  "name": "Sinhas Track - Backend API",
  "version": "1.0.0",
  "endpoints": {
    "profiles": "/api/profiles",
    "sessions": "/api/sessions",
    "audit": "/api/audit",
    "health": "/api/health"
  }
}
```

---

## WebSocket Events

Connect to the WebSocket endpoint:
```javascript
const socket = io('http://localhost:5000', {
  query: { email: 'user@example.com' }
});
```

### Incoming Events (Listen)

**session_created**
```javascript
socket.on('session_created', (session) => {
  console.log('New session created:', session);
});
```

**session_updated**
```javascript
socket.on('session_updated', (session) => {
  console.log('Session updated:', session);
});
```

**session_real_time_update**
```javascript
socket.on('session_real_time_update', (data) => {
  console.log('Real-time session update:', data);
});
```

**location_added**
```javascript
socket.on('location_added', (session) => {
  console.log('Location added to session:', session);
});
```

**break_added**
```javascript
socket.on('break_added', (session) => {
  console.log('Break added to session:', session);
});
```

**audit_log_created**
```javascript
socket.on('audit_log_created', (log) => {
  console.log('Audit log created:', log);
});
```

**profile_updated**
```javascript
socket.on('profile_updated', (profile) => {
  console.log('Profile updated:', profile);
});
```

**profile_real_time_update**
```javascript
socket.on('profile_real_time_update', (data) => {
  console.log('Real-time profile update:', data);
});
```

### Outgoing Events (Emit)

**session_update** - Broadcast session update
```javascript
socket.emit('session_update', {
  sessionId: '507f1f77bcf86cd799439012',
  status: 'approved'
});
```

**profile_update** - Broadcast profile update
```javascript
socket.emit('profile_update', {
  email: 'employee@example.com',
  fullName: 'John Doe Updated'
});
```

**join_admin_room** - Join admin broadcast room
```javascript
socket.emit('join_admin_room');
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required field: email"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "Profile not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently not implemented. In production:
- Implement rate limiting per IP/user
- Suggested: 100 requests per minute for regular users
- Suggested: 1000 requests per minute for admin users

---

## CORS

CORS is enabled for all origins by default. In production:
- Restrict to specific frontend domains
- Update `CORS()` configuration in app.py

---

## Security Notes

1. **Authentication**: Add Firebase token verification
2. **Authorization**: Implement role-based access control (RBAC)
3. **Validation**: All inputs are validated on the backend
4. **HTTPS**: Use HTTPS in production
5. **Secrets**: Never commit `.env` files
6. **Audit Logging**: All actions are logged

---

## Example Usage

### Create Employee Profile
```bash
curl -X POST http://localhost:5000/api/profiles \
  -H "Content-Type: application/json" \
  -H "X-User-Email: admin@example.com" \
  -d '{
    "email": "john@example.com",
    "fullName": "John Doe",
    "employeeId": "EMP001",
    "mobile": "1234567890",
    "department": "Engineering",
    "employeeType": "permanent",
    "active": true
  }'
```

### Clock In
```bash
curl -X POST http://localhost:5000/api/sessions \
  -H "Content-Type: application/json" \
  -H "X-User-Email: john@example.com" \
  -d '{
    "email": "john@example.com",
    "employeeId": "EMP001",
    "fullName": "John Doe",
    "date": "2024-03-25",
    "clockIn": "2024-03-25T09:00:00Z",
    "workType": "office",
    "description": "Regular work",
    "breaks": [],
    "locations": [],
    "status": "pending"
  }'
```

### Clock Out
```bash
curl -X PATCH http://localhost:5000/api/sessions/507f1f77bcf86cd799439012 \
  -H "Content-Type: application/json" \
  -H "X-User-Email: john@example.com" \
  -d '{
    "clockOut": "2024-03-25T17:00:00Z",
    "totalWorkMs": 28800000,
    "totalBreakMs": 3600000
  }'
```

### Approve Session
```bash
curl -X PATCH http://localhost:5000/api/sessions/507f1f77bcf86cd799439012 \
  -H "Content-Type: application/json" \
  -H "X-User-Email: admin@example.com" \
  -d '{
    "status": "approved",
    "reviewedBy": "admin@example.com",
    "adminComment": "Approved"
  }'
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-03-25 | Initial release |

