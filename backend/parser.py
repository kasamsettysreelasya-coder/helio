"""Medical text parser utilizing regular expressions to extract structured fields from unstructured notes."""

import re

def parse_medical_text(raw_text: str) -> dict:
    text = raw_text.replace('\n', ' ')
    
    data = {
        "patient_name": "Unknown",
        "age": "Unknown",
        "gender": "Unknown",
        "report_type": "Unknown",
        "hemoglobin": "Unknown",
        "blood_sugar": "Unknown",
        "blood_pressure": "Unknown",
        "doctor": "Unknown",
        "hospital": "Unknown",
        "medicines": [],
        "remarks": "None",
        "date": "Unknown"
    }
    
    # Simple regex extractions
    name_match = re.search(r'(?:Name|Patient|Pt|Patient Name)[:\-]\s*([A-Za-z\s]+)(?:Age|Sex|Date|$)', text, re.IGNORECASE)
    if name_match:
        data["patient_name"] = name_match.group(1).strip()
        
    age_match = re.search(r'(?:Age)[:\-]\s*(\d+)', text, re.IGNORECASE)
    if age_match:
        data["age"] = int(age_match.group(1))
        
    gender_match = re.search(r'(?:Sex|Gender)[:\-]\s*(Male|Female|M|F)', text, re.IGNORECASE)
    if gender_match:
        g = gender_match.group(1).capitalize()
        data["gender"] = "Male" if g == "M" else "Female" if g == "F" else g
        
    dr_match = re.search(r'(?:Dr\.|Doctor)[:\-]\s*([A-Za-z\s\.]+)(?:Hospital|Clinic|Date|$)', text, re.IGNORECASE)
    if dr_match:
        data["doctor"] = dr_match.group(1).strip()
        
    hb_match = re.search(r'(?:Hemoglobin|Hb|Haemoglobin)[:\-]?\s*([\d\.]+\s*(?:g/dL|g/L|gm/dl)?)', text, re.IGNORECASE)
    if hb_match:
        data["hemoglobin"] = hb_match.group(1).strip()
        data["report_type"] = "Blood Test"
        
    bs_match = re.search(r'(?:Blood Sugar|FBS|PPBS|Glucose)[:\-]?\s*([\d\.]+\s*(?:mg/dL|mg/dl|mmol/L)?)', text, re.IGNORECASE)
    if bs_match:
        data["blood_sugar"] = bs_match.group(1).strip()
        data["report_type"] = "Blood Test"
        
    bp_match = re.search(r'(?:BP|Blood Pressure)[:\-]?\s*(\d{2,3}\s*/\s*\d{2,3})', text, re.IGNORECASE)
    if bp_match:
        data["blood_pressure"] = bp_match.group(1).strip()
        
    # Medicines
    meds_section = re.search(r'(?:Rx|Medicines|Medication|Prescription)[:\-]\s*(.*?)(?:Remarks|Advice|Follow up|$)', text, re.IGNORECASE)
    if meds_section:
        meds_text = meds_section.group(1).strip()
        # Splitting by commas or typical list markers
        meds = [m.strip() for m in re.split(r'[,;]|\d+\.', meds_text) if m.strip()]
        data["medicines"] = meds
        data["report_type"] = "Prescription" if data["report_type"] == "Unknown" else data["report_type"]
        
    remarks_match = re.search(r'(?:Remarks|Advice)[:\-]\s*(.*?)(?:Follow up|$)', text, re.IGNORECASE)
    if remarks_match:
        data["remarks"] = remarks_match.group(1).strip()

    return data
