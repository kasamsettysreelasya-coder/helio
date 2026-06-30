"""Authentication helper module managing user registrations, password hashing, session tokens, and access control."""

import hashlib
import secrets
from datetime import datetime
from database import get_db, log_activity

# In-memory session storage: token -> {"user_id": int, "role": str}
ACTIVE_SESSIONS = {}

def hash_password(password: str) -> str:
    # A simple SHA-256 hash for offline demo purposes
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_session(user_id: int, role: str) -> str:
    token = secrets.token_hex(32)
    ACTIVE_SESSIONS[token] = {"user_id": user_id, "role": role}
    return token

def get_session_user(token: str):
    return ACTIVE_SESSIONS.get(token)

def register_user(data: dict):
    conn = get_db()
    cursor = conn.cursor()
    
    # Check duplicate
    cursor.execute("SELECT id FROM users WHERE username = ?", (data['username'],))
    if cursor.fetchone():
        conn.close()
        raise ValueError("Username already exists")
    
    hashed_pw = hash_password(data['password'])
    reg_date = datetime.now().isoformat()
    
    cursor.execute('''
        INSERT INTO users (
            full_name, age, gender, phone, email, username, 
            password_hash, emergency_contact, blood_group, 
            height, weight, medical_conditions, allergies, registration_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['full_name'], data['age'], data['gender'], data.get('phone', ''),
        data.get('email', ''), data['username'], hashed_pw, data.get('emergency_contact', ''),
        data.get('blood_group', ''), data.get('height', 0), data.get('weight', 0),
        data.get('medical_conditions', ''), data.get('allergies', ''), reg_date
    ))
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    log_activity(user_id, "REGISTER", "User registered successfully.")
    return user_id

def authenticate_user(username, password):
    conn = get_db()
    cursor = conn.cursor()
    
    # Check users table
    cursor.execute("SELECT id, password_hash FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    if row and verify_password(password, row['password_hash']):
        conn.close()
        user_id = row['id']
        log_activity(user_id, "LOGIN", "User logged in.")
        return create_session(user_id, "user"), "user", user_id
    
    # Check admin table
    cursor.execute("SELECT id, password_hash FROM admin WHERE username = ?", (username,))
    row = cursor.fetchone()
    if row and verify_password(password, row['password_hash']):
        conn.close()
        # Admin activity logs can use user_id = 0 for system logs
        return create_session(0, "admin"), "admin", 0
        
    conn.close()
    return None, None, None
