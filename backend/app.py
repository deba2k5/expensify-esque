import os
from datetime import datetime
from functools import wraps
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient, DESCENDING
from pymongo.errors import DuplicateKeyError
from bson.objectid import ObjectId

load_dotenv()

app = Flask(__name__)

# CORS configuration for Vercel frontend
CORS(app, resources={r"/api/*": {
    "origins": [
        "https://*.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ]
}})

# MongoDB Connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://username:password@cluster.mongodb.net/workforce-vision")
client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
db = client["workforce-vision"]
profiles_collection = db["profiles"]
sessions_collection = db["sessions"]
audit_collection = db["audit_logs"]

# Create indexes
try:
    profiles_collection.create_index("email", unique=True)
    sessions_collection.create_index([("email", 1), ("date", -1)])
    sessions_collection.create_index("status")
    audit_collection.create_index([("at", -1)])
except Exception as e:
    print(f"Index creation warning: {e}")

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
    return entry


def require_auth(f):
    """Decorator to verify Firebase token (can be enhanced)."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
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
        
        if "_id" not in data:
            data["createdAt"] = datetime.utcnow().isoformat()
        data["updatedAt"] = datetime.utcnow().isoformat()
        
        result = profiles_collection.find_one_and_update(
            {"email": email},
            {"$set": data},
            upsert=True,
            return_document=True,
        )
        
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
        
        return jsonify(json_response(session)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/sessions/<session_id>")
def get_session(session_id):
    """Fetch a single session."""
    try:
        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
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
            {"_id": ObjectId(session_id)},
            {"$set": data},
            return_document=True,
        )
        
        if not result:
            return jsonify({"error": "Session not found"}), 404
        
        actor = request.headers.get("X-User-Email", "system")
        log_audit(actor, "session_updated", session_id, {"updates": data})
        
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
            {"_id": ObjectId(session_id)},
            {
                "$push": {"breaks": break_entry},
                "$set": {"updatedAt": datetime.utcnow().isoformat()},
            },
            return_document=True,
        )
        
        if not result:
            return jsonify({"error": "Session not found"}), 404
        
        actor = request.headers.get("X-User-Email", "system")
        log_audit(actor, "break_added", session_id, {"break": break_entry})
        
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
            {"_id": ObjectId(session_id)},
            {
                "$push": {"locations": location_entry},
                "$set": {"updatedAt": datetime.utcnow().isoformat()},
            },
            return_document=True,
        )
        
        if not result:
            return jsonify({"error": "Session not found"}), 404
        
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
        
        return jsonify(json_response(log_entry)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============ HEALTH CHECK ============

@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    try:
        db.command("ping")
        return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()}), 200
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500


@app.get("/")
def index():
    """Root endpoint."""
    return jsonify({
        "name": "Sinhas Track - Backend API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "profiles": "/api/profiles",
            "sessions": "/api/sessions",
            "audit": "/api/audit",
            "health": "/api/health",
        }
    }), 200


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
    app.run(host="0.0.0.0", port=port, debug=debug)
