from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Response, Depends
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import time

from database import init_db, save_report, get_reports, get_db
from auth import register_user, authenticate_user, get_session_user
from ocr_engine import extract_text_from_image
from parser import parse_medical_text

app = FastAPI(title="HELIO AI - Local Backend")

# Initialize SQLite database
init_db()

# Directories
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
WEB_APP_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "web-app")

# ---- Dependency ----
def get_current_user(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = get_session_user(token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return session

def get_current_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ---- Models ----
class LoginReq(BaseModel):
    username: str
    password: str

# ---- Auth Routes ----
@app.post("/api/auth/register")
def api_register(data: dict):
    try:
        user_id = register_user(data)
        return {"success": True, "user_id": user_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login")
def api_login(req: LoginReq, response: Response):
    token, role, user_id = authenticate_user(req.username, req.password)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Set a 24-hour cookie
    response.set_cookie(key="session_token", value=token, httponly=True, max_age=86400, samesite='lax')
    return {"success": True, "role": role}

@app.post("/api/auth/logout")
def api_logout(response: Response):
    response.delete_cookie("session_token")
    return {"success": True}

@app.get("/api/auth/me")
def api_me(user: dict = Depends(get_current_user)):
    return {"success": True, "user": user}

# ---- Feature Routes ----
@app.post("/api/scan")
async def scan_medical_report(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Must be an image.")
    
    image_bytes = await file.read()
    timestamp = str(int(time.time()))
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"scan_{timestamp}{ext}"
    image_path = os.path.join(UPLOADS_DIR, filename)
    with open(image_path, "wb") as f:
        f.write(image_bytes)

    # 1. OCR Extraction (Offline CPU)
    raw_text = extract_text_from_image(image_bytes)
    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Text could not be recognized.")

    # 2. Parse into Structured JSON
    structured_data = parse_medical_text(raw_text)

    # 3. Save to SQLite attached to this user
    user_id = user["user_id"]
    report_id = save_report(image_path, raw_text, structured_data, user_id=user_id)

    return {
        "success": True,
        "report_id": report_id,
        "raw_text": raw_text,
        "structured_data": structured_data
    }

@app.get("/api/reports")
def list_reports(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    return {"reports": get_reports(user_id=user_id)}

from risk_engine import calculate_risk_score, get_risk_history
from database import get_db

class TriageReq(BaseModel):
    symptoms: str
    duration_days: int
    vitals: dict

@app.post("/api/user/triage")
def api_triage(req: TriageReq, user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    risk = calculate_risk_score(user_id, req.symptoms, req.duration_days, req.vitals)
    
    # Save symptom history
    conn = get_db()
    cursor = conn.cursor()
    import datetime
    cursor.execute('''
        INSERT INTO symptom_history (user_id, timestamp, symptoms, notes)
        VALUES (?, ?, ?, ?)
    ''', (user_id, datetime.datetime.now().isoformat(), req.symptoms, "Triaged via app"))
    conn.commit()
    conn.close()
    
    return {"success": True, "risk": risk}

@app.get("/api/user/history")
def api_history(user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM symptom_history WHERE user_id = ? ORDER BY timestamp DESC", (user["user_id"],))
    sh = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM medical_reports WHERE user_id = ? ORDER BY timestamp DESC", (user["user_id"],))
    mr = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"success": True, "symptom_history": sh, "medical_reports": mr}

@app.get("/api/user/risk_trends")
def api_risk_trends(user: dict = Depends(get_current_user)):
    return {"success": True, "trends": get_risk_history(user["user_id"])}

@app.get("/api/admin/dashboard")
def api_admin_dash(admin: dict = Depends(get_current_admin)):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM symptom_history")
    total_scans = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM health_scores WHERE risk_category = 'High Risk'")
    high_risk = cursor.fetchone()[0]
    
    cursor.execute("SELECT id, full_name, username, age, registration_date FROM users ORDER BY id DESC")
    users_list = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    return {
        "success": True,
        "total_users": total_users,
        "total_scans": total_scans,
        "high_risk": high_risk,
        "users": users_list
    }

# Mount static files (this MUST be at the bottom)
app.mount("/", StaticFiles(directory=WEB_APP_DIR, html=True), name="web-app")
