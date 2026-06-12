import os
import json
from datetime import datetime
from functools import wraps
from dotenv import load_dotenv
from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from pymongo import MongoClient, DESCENDING, ReturnDocument
from pymongo.errors import DuplicateKeyError
from bson.objectid import ObjectId
import requests

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# MongoDB Connection
MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://sinhasapp:sinhasapp123@sinhasapp.mhknlyr.mongodb.net/?appName=sinhasapp",
)
MONGODB_DB = os.getenv("MONGODB_DB", "sinhasapp")
client = MongoClient(MONGODB_URI)
db = client[MONGODB_DB]
profiles_collection = db["profiles"]
sessions_collection = db["sessions"]
audit_collection = db["audit_logs"]

# Google Drive Configuration
GOOGLE_DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "1i5eJ2S3LVEsnEYI8gpljk-E0eoq6rCSb")
GOOGLE_DRIVE_API_KEY = os.getenv("GOOGLE_DRIVE_API_KEY", "")

# Create indexes
try:
    profiles_collection.create_index("email", unique=True)
    sessions_collection.create_index([("email", 1), ("date", -1)])
    sessions_collection.create_index("status")
    audit_collection.create_index([("at", -1)])
except Exception as e:
    print(f"Index creation warning: {e}")

DEFAULT_EMPLOYEES = [
    {
        "employeeId": "EMP001",
        "fullName": "Debangshu",
        "email": "debangshu@sinhas.ch",
        "mobile": "",
        "department": "Administration",
        "employeeType": "permanent",
        "active": True,
    },
    {
        "employeeId": "EMP002",
        "fullName": "Nirmalya",
        "email": "nirmalya@sinhas.ch",
        "mobile": "",
        "department": "Administration",
        "employeeType": "permanent",
        "active": True,
    },
    {
        "employeeId": "EMP003",
        "fullName": "Rishu",
        "email": "rishu@sinhas.ch",
        "mobile": "",
        "department": "Administration",
        "employeeType": "permanent",
        "active": True,
    },
    {
        "employeeId": "EMP004",
        "fullName": "Rajeev",
        "email": "rajeev@sinhas.ch",
        "mobile": "",
        "department": "Administration",
        "employeeType": "permanent",
        "active": True,
    },
    {
        "employeeId": "EMP005",
        "fullName": "Soumika",
        "email": "soumika@sinhas.ch",
        "mobile": "",
        "department": "Operations",
        "employeeType": "permanent",
        "active": True,
    },
    {
        "employeeId": "EMP006",
        "fullName": "Sushmita",
        "email": "sushmita@sinhas.ch",
        "mobile": "",
        "department": "Operations",
        "employeeType": "permanent",
        "active": True,
    },
    {
        "employeeId": "EMP007",
        "fullName": "Megha",
        "email": "megha@sinhas.ch",
        "mobile": "",
        "department": "Operations",
        "employeeType": "permanent",
        "active": True,
    },
]


def ensure_default_profiles():
    """Keep required employee profiles available in local/prod data."""
    now = datetime.utcnow().isoformat()
    for profile in DEFAULT_EMPLOYEES:
        insert_profile = {k: v for k, v in profile.items() if k != "active"}
        profiles_collection.update_one(
            {"email": profile["email"]},
            {
                "$setOnInsert": {**insert_profile, "createdAt": now},
                "$set": {"active": True, "updatedAt": now},
            },
            upsert=True,
        )


try:
    ensure_default_profiles()
except Exception as e:
    print(f"Default profile bootstrap warning: {e}")

# Utility Functions
def json_response(obj):
    """Convert MongoDB ObjectId to string for JSON serialization."""
    if isinstance(obj, dict):
        return {k: json_response(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [json_response(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    return obj


def log_audit(actor, action, target, meta=None):
    """Log an action to the audit trail."""
    entry = {
        "actor": actor,
        "action": action,
        "target": target,
        "at": datetime.utcnow().isoformat(),
        "meta": meta or {},
    }
    audit_collection.insert_one(entry)
    safe_emit("audit_log_created", json_response(entry))
    return entry


def safe_emit(event, payload):
    """Broadcast real-time updates without failing the API request."""
    try:
        socketio.emit(event, payload)
    except Exception as e:
        print(f"Socket emit warning for {event}: {e}")


def session_lookup(session_id):
    """Find sessions by app id first, then Mongo _id for compatibility."""
    query = {"id": session_id}
    if ObjectId.is_valid(session_id):
        query = {"$or": [{"id": session_id}, {"_id": ObjectId(session_id)}]}
    return query


def require_auth(f):
    """Decorator to verify Firebase token (can be enhanced)."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # For now, just verify the email header is present
        # In production, verify Firebase ID token
        email = request.headers.get("X-User-Email")
        if not email:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function


# ============ PROFILE ENDPOINTS ============

@app.get("/api/profiles")
def list_profiles():
    """List all employee profiles."""
    try:
        profiles = list(profiles_collection.find({}))
        return jsonify([json_response(p) for p in profiles]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/profiles/<email>")
def get_profile(email):
    """Fetch a single profile by email."""
    try:
        profile = profiles_collection.find_one({"email": email})
        if not profile:
            return jsonify({"error": "Profile not found"}), 404
        return jsonify(json_response(profile)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/profiles")
def upsert_profile():
    """Create or update a profile by email."""
    try:
        data = request.get_json()
        email = data.get("email")
        
        if not email:
            return jsonify({"error": "email is required"}), 400
        
        # Add timestamps
        if "_id" not in data:
            data["createdAt"] = datetime.utcnow().isoformat()
        data["updatedAt"] = datetime.utcnow().isoformat()
        
        result = profiles_collection.find_one_and_update(
            {"email": email},
            {"$set": data},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        
        # Log audit
        actor = request.headers.get("X-User-Email", "system")
        log_audit(actor, "profile_updated", email, {"profile": data})
        
        return jsonify(json_response(result)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.delete("/api/profiles/<email>")
def delete_profile(email):
    """Soft delete a profile."""
    try:
        profiles_collection.update_one(
            {"email": email},
            {"$set": {"active": False, "updatedAt": datetime.utcnow().isoformat()}}
        )
        actor = request.headers.get("X-User-Email", "system")
        log_audit(actor, "profile_deleted", email)
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============ SESSION ENDPOINTS ============

@app.get("/api/sessions")
def list_sessions():
    """List sessions with optional filters."""
    try:
        email = request.args.get("email")
        status = request.args.get("status")
        date = request.args.get("date")
        
        query = {}
        if email:
            query["email"] = email
        if status:
            query["status"] = status
        if date:
            query["date"] = date
        
        sessions = list(sessions_collection.find(query).sort("clockIn", DESCENDING).limit(1000))
        return jsonify([json_response(s) for s in sessions]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/sessions")
def create_session():
    """Create a new session (clock-in)."""
    try:
        data = request.get_json()
        data["createdAt"] = datetime.utcnow().isoformat()
        data["updatedAt"] = datetime.utcnow().isoformat()
        
        result = sessions_collection.insert_one(data)
        session = sessions_collection.find_one({"_id": result.inserted_id})
        
        actor = request.headers.get("X-User-Email", data.get("email", "system"))
        log_audit(actor, "session_created", str(result.inserted_id), {"session": data})
        
        safe_emit("session_created", json_response(session))
        
        return jsonify(json_response(session)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/sessions/<session_id>")
def get_session(session_id):
    """Fetch a single session."""
    try:
        session = sessions_collection.find_one(session_lookup(session_id))
        if not session:
            return jsonify({"error": "Session not found"}), 404
        return jsonify(json_response(session)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.patch("/api/sessions/<session_id>")
def update_session(session_id):
    """Patch a session."""
    try:
        data = request.get_json()
        data["updatedAt"] = datetime.utcnow().isoformat()
        
        result = sessions_collection.find_one_and_update(
            session_lookup(session_id),
            {"$set": data},
            return_document=ReturnDocument.AFTER,
        )
        
        if not result:
            return jsonify({"error": "Session not found"}), 404
        
        actor = request.headers.get("X-User-Email", "system")
        log_audit(actor, "session_updated", session_id, {"updates": data})
        
        safe_emit("session_updated", json_response(result))
        
        return jsonify(json_response(result)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/sessions/<session_id>/breaks")
def add_break(session_id):
    """Add a break to a session."""
    try:
        data = request.get_json()
        break_entry = {
            "id": data.get("id", "break_" + str(ObjectId())),
            "type": data.get("type", "lunch"),
            "start": data.get("start", datetime.utcnow().isoformat()),
            "end": data.get("end"),
        }
        
        result = sessions_collection.find_one_and_update(
            session_lookup(session_id),
            {
                "$push": {"breaks": break_entry},
                "$set": {"updatedAt": datetime.utcnow().isoformat()},
            },
            return_document=ReturnDocument.AFTER,
        )
        
        if not result:
            return jsonify({"error": "Session not found"}), 404
        
        actor = request.headers.get("X-User-Email", "system")
        log_audit(actor, "break_added", session_id, {"break": break_entry})
        
        safe_emit("break_added", json_response(result))
        
        return jsonify(json_response(result)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/sessions/<session_id>/locations")
def add_location(session_id):
    """Add a location ping to a session."""
    try:
        data = request.get_json()
        location_entry = {
            "lat": data.get("lat"),
            "lng": data.get("lng"),
            "accuracy": data.get("accuracy"),
            "at": data.get("at", datetime.utcnow().isoformat()),
            "outsideGeofence": data.get("outsideGeofence", False),
        }
        
        result = sessions_collection.find_one_and_update(
            session_lookup(session_id),
            {
                "$push": {"locations": location_entry},
                "$set": {"updatedAt": datetime.utcnow().isoformat()},
            },
            return_document=ReturnDocument.AFTER,
        )
        
        if not result:
            return jsonify({"error": "Session not found"}), 404
        
        safe_emit("location_added", json_response(result))
        
        return jsonify(json_response(result)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============ AUDIT LOG ENDPOINTS ============

@app.get("/api/audit")
def list_audit_logs():
    """List audit logs (newest first)."""
    try:
        limit = int(request.args.get("limit", 500))
        logs = list(audit_collection.find({}).sort("at", DESCENDING).limit(limit))
        return jsonify([json_response(log) for log in logs]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/audit")
def create_audit_log():
    """Create an audit log entry."""
    try:
        data = request.get_json()
        data["at"] = data.get("at", datetime.utcnow().isoformat())
        
        result = audit_collection.insert_one(data)
        log_entry = audit_collection.find_one({"_id": result.inserted_id})
        
        safe_emit("audit_log_created", json_response(log_entry))
        
        return jsonify(json_response(log_entry)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============ FILE UPLOAD (Google Drive) ============

@app.post("/api/upload")
def upload_file():
    """Upload a file to Google Drive."""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400
        
        # For Google Drive upload using Apps Script
        # You would need to implement this based on your Apps Script deployment
        # For now, return a mock response
        
        file_data = {
            "name": file.filename,
            "size": len(file.read()),
            "url": f"https://drive.google.com/file/d/mock-{ObjectId()}/view",
            "id": f"mock-{ObjectId()}",
            "uploadedAt": datetime.utcnow().isoformat(),
            "uploadedBy": request.headers.get("X-User-Email", "unknown"),
        }
        
        return jsonify(file_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============ REAL-TIME WEBSOCKET ENDPOINTS ============

@socketio.on("connect")
def handle_connect():
    """Handle client connection."""
    user_email = request.args.get("email", "anonymous")
    join_room(f"user_{user_email}")
    emit("connect_response", {"status": "connected", "email": user_email})
    print(f"Client connected: {user_email}")


@socketio.on("disconnect")
def handle_disconnect():
    """Handle client disconnection."""
    print("Client disconnected")


@socketio.on("join_admin_room")
def handle_join_admin():
    """Admin joins the admin broadcast room."""
    user_email = request.args.get("email", "admin")
    join_room("admin_room")
    emit("admin_joined", {"email": user_email})
    print(f"Admin joined: {user_email}")


@socketio.on("session_update")
def handle_session_update(data):
    """Broadcast real-time session update."""
    socketio.emit("session_real_time_update", data)


@socketio.on("profile_update")
def handle_profile_update(data):
    """Broadcast real-time profile update."""
    socketio.emit("profile_real_time_update", data)


# ============ HEALTH CHECK ============

@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    try:
        # Check MongoDB connection
        db.command("ping")
        return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()}), 200
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500


@app.get("/")
def index():
    """Root endpoint - redirect to frontend."""
    frontend_url = os.getenv("FRONTEND_URL", "https://sinhas-frontend1.vercel.app")
    return redirect(frontend_url, code=302)


# ============ ERROR HANDLERS ============

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    socketio.run(app, host="0.0.0.0", port=port, debug=debug, allow_unsafe_werkzeug=True)
