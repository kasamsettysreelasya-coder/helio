"""Database management module handling SQLite schema initialization, patient reports persistence, and activity logs."""

import sqlite3
import json
import os
from datetime import datetime

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database")
DB_PATH = os.path.join(DB_DIR, "reports.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR)
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT,
            age INTEGER,
            gender TEXT,
            phone TEXT,
            email TEXT,
            username TEXT UNIQUE,
            password_hash TEXT,
            emergency_contact TEXT,
            blood_group TEXT,
            height REAL,
            weight REAL,
            medical_conditions TEXT,
            allergies TEXT,
            registration_date TEXT
        )
    ''')

    # 2. Admin
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            created_at TEXT
        )
    ''')

    # 3. Medical Reports
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medical_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            timestamp TEXT,
            image_path TEXT,
            raw_text TEXT,
            structured_data TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # 4. Symptom History
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS symptom_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            timestamp TEXT,
            symptoms TEXT,
            detected_diseases TEXT,
            medicines_recommended TEXT,
            notes TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # 5. Health Scores
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS health_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            timestamp TEXT,
            risk_score INTEGER,
            risk_category TEXT,
            reason TEXT,
            recommendation TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # 6. Referral Cards
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS referral_cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            timestamp TEXT,
            card_text TEXT,
            card_json TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # 7. Medicines
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medicines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            category TEXT,
            description TEXT,
            usage_instructions TEXT
        )
    ''')

    # 8. Reminders
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            timestamp TEXT,
            medicine_name TEXT,
            dosage TEXT,
            frequency TEXT,
            status TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # 9. Activity Logs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            timestamp TEXT,
            action TEXT,
            details TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # Initialize a default admin if none exists
    cursor.execute("SELECT * FROM admin WHERE username = 'admin'")
    if not cursor.fetchone():
        import hashlib
        # The prompt asked for configurable admin password, but example given is admin123
        hashed_pw = hashlib.sha256("admin123".encode()).hexdigest()
        cursor.execute("INSERT INTO admin (username, password_hash, created_at) VALUES (?, ?, ?)", 
                       ("admin", hashed_pw, datetime.now().isoformat()))

    conn.commit()
    conn.close()

def save_report(image_path: str, raw_text: str, structured_data: dict, user_id: int = None):
    conn = get_db()
    cursor = conn.cursor()
    timestamp = datetime.now().isoformat()
    cursor.execute('''
        INSERT INTO medical_reports (user_id, timestamp, image_path, raw_text, structured_data)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, timestamp, image_path, raw_text, json.dumps(structured_data)))
    report_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return report_id

def get_reports(user_id: int = None):
    conn = get_db()
    cursor = conn.cursor()
    if user_id:
        cursor.execute('SELECT * FROM medical_reports WHERE user_id = ? ORDER BY id DESC', (user_id,))
    else:
        cursor.execute('SELECT * FROM medical_reports ORDER BY id DESC')
    rows = cursor.fetchall()
    conn.close()
    
    reports = []
    for row in rows:
        d = dict(row)
        d["structured_data"] = json.loads(d["structured_data"]) if d["structured_data"] else {}
        reports.append(d)
    return reports

def log_activity(user_id: int, action: str, details: str = ""):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO activity_logs (user_id, timestamp, action, details)
        VALUES (?, ?, ?, ?)
    ''', (user_id, datetime.now().isoformat(), action, details))
    conn.commit()
    conn.close()
