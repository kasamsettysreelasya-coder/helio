from datetime import datetime
from database import get_db, log_activity

def calculate_risk_score(user_id: int, symptoms: str, duration_days: int, vitals: dict):
    """
    Offline Rule-Based Health Risk Engine
    Produces a risk score (0-100) based on age, symptoms, and vitals.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT age, medical_conditions FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    age = row['age']
    conditions = (row['medical_conditions'] or "").lower()
    symptoms = symptoms.lower()
    
    score = 0
    reasons = []
    
    # 1. Base Age Risk
    if age > 65:
        score += 15
        reasons.append("Senior citizen")
    elif age < 5:
        score += 10
        reasons.append("Infant/Toddler")
        
    # 2. Existing Conditions
    if "diabetes" in conditions or "asthma" in conditions or "heart" in conditions or "hypertension" in conditions:
        score += 20
        reasons.append("Pre-existing chronic conditions")

    # 3. Emergency Symptoms (Red Flags)
    emergency_keywords = ['chest pain', 'breathing difficulty', 'unconscious', 'seizure', 'bleeding', 'confusion', 'stroke']
    for kw in emergency_keywords:
        if kw in symptoms:
            score += 40
            reasons.append(f"Critical symptom detected: {kw}")
            
    # 4. Moderate Symptoms
    mod_keywords = ['fever', 'vomiting', 'diarrhea', 'dizzy', 'weakness']
    for kw in mod_keywords:
        if kw in symptoms:
            score += 10
            reasons.append(f"Moderate symptom: {kw}")
            
    # 5. Vitals check
    if vitals:
        # Temp
        temp = vitals.get('temp')
        if temp and (temp > 102 or temp < 95):
            score += 15
            reasons.append("Abnormal body temperature")
        # SpO2
        spo2 = vitals.get('spo2')
        if spo2 and spo2 < 92:
            score += 30
            reasons.append("Low oxygen saturation (SpO2)")
            
    # 6. Duration
    if duration_days > 7:
        score += 10
        reasons.append("Prolonged symptoms (>7 days)")

    # Cap score at 100
    score = min(score, 100)
    
    # Categorize
    if score >= 60:
        category = "High Risk"
        recommendation = "Immediate hospital visit recommended. Seek emergency care."
    elif score >= 30:
        category = "Medium Risk"
        recommendation = "Schedule a doctor appointment soon. Monitor symptoms."
    else:
        category = "Low Risk"
        recommendation = "Home care is sufficient. Rest and hydrate."

    reason_str = ", ".join(reasons) if reasons else "No severe risk factors identified."
    
    # Save to SQLite
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO health_scores (user_id, timestamp, risk_score, risk_category, reason, recommendation)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_id, datetime.now().isoformat(), score, category, reason_str, recommendation))
    conn.commit()
    conn.close()

    log_activity(user_id, "RISK_CALCULATION", f"Risk calculated: {score}% ({category})")
    
    return {
        "risk_score": score,
        "category": category,
        "reason": reason_str,
        "recommendation": recommendation
    }

def get_risk_history(user_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT timestamp, risk_score, risk_category FROM health_scores WHERE user_id = ? ORDER BY timestamp ASC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
