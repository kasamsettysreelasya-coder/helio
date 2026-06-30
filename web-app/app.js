// Triage Demo Cases
const DEMO_CASES = {
    1: "Patient Rajesh, age 52, male. Complaining of severe crushing chest pain radiating to his left arm and heavy sweating since 2 hours. Extremely anxious.",
    2: "Baby Meera, 3 years old, female. High fever of 101 F and mild cough for 2 days. Rest of the physical exam is normal, drinking fluids and active.",
    3: "Suresh, 28 years old, male. Sustained a small superficial cut on his right thumb while slicing vegetables this morning. Bleeding stopped, minor pain.",
    4: "Lakshmi, 42yo, female. Accidental hot water burn on her face and neck 1 hour ago. Skin is blistering and red with severe pain.",
    5: "Elderly patient Joseph, 78yo, male. Running high fever and showing severe confusion. Not recognizing family members since yesterday.",
    6: "Sita, 25 years old, female, 6 months pregnant. Presenting with sudden onset of moderate vaginal bleeding and mild abdominal cramping for 3 hours."
};

let currentTriageRecord = null;
let isJsonVisible = false;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    refreshHistoryList();
});

// Switch Tab Navigation Views
function switchTab(tabName) {
    const triageView = document.getElementById("view-triage");
    const dashboardView = document.getElementById("view-dashboard");
    const triageTab = document.getElementById("tab-btn-triage");
    const dashboardTab = document.getElementById("tab-btn-dashboard");

    if (tabName === "triage") {
        triageView.classList.add("active-view");
        dashboardView.classList.remove("active-view");
        triageTab.classList.add("active");
        dashboardTab.classList.remove("active");
    } else if (tabName === "dashboard") {
        triageView.classList.remove("active-view");
        dashboardView.classList.add("active-view");
        triageTab.classList.remove("active");
        dashboardTab.classList.add("active");
        // Re-calculate and animate dashboard stats
        refreshHistoryList();
    }
}

// Load quick case
function loadDemoCase(id) {
    const notesInput = document.getElementById("clinical-notes");
    if (DEMO_CASES[id]) {
        notesInput.value = DEMO_CASES[id];
        showToast("Demo case loaded!");
    }
}

// Handle Form Submit
function handleTriageSubmit(e) {
    e.preventDefault();
    const notes = document.getElementById("clinical-notes").value.trim();
    if (!notes) return;

    // Run local CPU parser
    currentTriageRecord = parseNotes(notes);

    // Run backend offline risk scoring engine
    if (typeof fetchAndSaveRiskScore === 'function') {
        fetchAndSaveRiskScore(notes, currentTriageRecord.vitals);
    }

    // Hide welcome view & Show results
    const welcomeView = document.getElementById("welcome-view");
    if (welcomeView) welcomeView.style.display = "none";
    const resultsContainer = document.getElementById("triage-results");
    resultsContainer.style.display = "flex";

    // Update Urgency Level Badges
    const badge = document.getElementById("urgency-value");
    badge.innerText = currentTriageRecord.triageLevel.toUpperCase();

    // Style Urgency Badge
    badge.style.backgroundColor = getTriageColor(currentTriageRecord.triageLevel);
    document.getElementById("result-header-card").style.borderLeft = `6px solid ${getTriageColor(currentTriageRecord.triageLevel)}`;

    // Update Confidence
    document.getElementById("confidence-percentage").innerText = `${Math.round(currentTriageRecord.confidence * 100)}%`;

    // Red Flags Alert Section
    const redFlagsAlert = document.getElementById("red-flags-alert");
    const redFlagsList = document.getElementById("red-flags-list");
    redFlagsList.innerHTML = "";
    if (currentTriageRecord.redFlags.length === 0) {
        redFlagsAlert.style.display = "none";
    } else {
        redFlagsAlert.style.display = "block";
        currentTriageRecord.redFlags.forEach(flag => {
            const li = document.createElement("li");
            li.innerText = flag;
            redFlagsList.appendChild(li);
        });
    }

    // Recommended Action
    document.getElementById("action-text").innerText = currentTriageRecord.recommendedAction;

    // First Aid Checklist
    const firstAidList = document.getElementById("first-aid-list");
    firstAidList.innerHTML = "";
    if (currentTriageRecord.firstAid.length === 0) {
        const li = document.createElement("li");
        li.innerText = "No specific first aid required. Maintain comfort.";
        firstAidList.appendChild(li);
    } else {
        currentTriageRecord.firstAid.forEach(tip => {
            const li = document.createElement("li");
            li.innerText = tip;
            firstAidList.appendChild(li);
        });
    }

    // Supportive Medications Card
    const medsCardContainer = document.getElementById("meds-card-container");
    const medsList = document.getElementById("meds-list");
    medsList.innerHTML = "";
    if (currentTriageRecord.recommendedMedications.length === 0) {
        medsCardContainer.style.display = "none";
    } else {
        medsCardContainer.style.display = "block";
        currentTriageRecord.recommendedMedications.forEach(med => {
            const li = document.createElement("li");
            li.innerText = med;
            medsList.appendChild(li);
        });
    }

    // JSON Output
    document.getElementById("json-output-text").innerText = JSON.stringify(currentTriageRecord, null, 2);

    // Referral Slip text
    const referralNoteText = generateReferralCardText(currentTriageRecord, notes);
    document.getElementById("referral-text").innerText = referralNoteText;

    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Offline NLP Triage Parser Engine
function parseNotes(notes) {
    const record = {
        patientName: "Unknown",
        age: null,
        gender: "Unknown",
        symptoms: [],
        duration: "Unknown",
        triageLevel: "Low",
        recommendedAction: "Monitor symptoms at home",
        firstAid: [],
        redFlags: [],
        confidence: 0.5,
        vitals: {
            temp: null,
            spo2: null,
            hr: null,
            bp: null,
            weight: null,
            height: null
        }
    };

    const lowercase = notes.toLowerCase();

    // Read and assign patient vitals inputs
    const tempInput = document.getElementById("vital-temp").value.trim();
    const spo2Input = document.getElementById("vital-spo2").value.trim();
    const hrInput = document.getElementById("vital-hr").value.trim();
    const bpInput = document.getElementById("vital-bp").value.trim();
    const weightInput = document.getElementById("vital-weight").value.trim();
    const heightInput = document.getElementById("vital-height").value.trim();

    if (tempInput) record.vitals.temp = parseFloat(tempInput);
    if (spo2Input) record.vitals.spo2 = parseInt(spo2Input, 10);
    if (hrInput) record.vitals.hr = parseInt(hrInput, 10);
    if (bpInput) record.vitals.bp = bpInput;
    if (weightInput) record.vitals.weight = parseFloat(weightInput);
    if (heightInput) record.vitals.height = parseFloat(heightInput);

    // 1. Patient Name Extraction
    const namePattern1 = /name\s*:\s*([A-Za-z]+)/i;
    const namePattern2 = /patient\s+is\s+([A-Za-z]+)/i;
    const namePattern3 = /patient\s*:\s*([A-Za-z]+)/i;
    const namePattern4 = /\b(?:patient|baby|elderly patient|elderly)\s+([A-Z][a-z]+)\b/;
    const namePattern5 = /^([A-Z][a-z]+)\b/;
    const namePattern6 = /\bname\s+is\s+([A-Za-z]+)\b/i;
    const namePattern7 = /\bpatient\s+named\s+([A-Za-z]+)\b/i;
    const namePattern8 = /\bnamed\s+([A-Za-z]+)\b/i;

    let m = notes.match(namePattern1) || notes.match(namePattern2) || notes.match(namePattern3) || notes.match(namePattern6) || notes.match(namePattern7) || notes.match(namePattern8);
    if (m) {
        record.patientName = m[1].trim();
    } else {
        m = notes.match(namePattern4);
        if (m) {
            record.patientName = m[1].trim();
        } else {
            m = notes.match(namePattern5);
            if (m) {
                const name = m[1].trim();
                const ignores = ["baby", "elderly", "patient", "young", "the", "he", "she"];
                if (!ignores.includes(name.toLowerCase())) {
                    record.patientName = name;
                }
            }
        }
    }

    // 2. Age Extraction
    const agePattern1 = /age\s*:\s*([0-9]+)/i;
    const agePattern2 = /\b([0-9]+)\s*(years old|yo|y\.o\.|years of age|year old|yr old|years|yrs)\b/i;
    const agePattern3 = /aged\s+([0-9]+)/i;

    m = notes.match(agePattern1) || notes.match(agePattern2) || notes.match(agePattern3);
    if (m) {
        record.age = parseInt(m[1].trim(), 10);
    }

    // 3. Gender Extraction
    if (lowercase.includes("female") || lowercase.includes("woman") || lowercase.includes("girl") || lowercase.includes("she/her")) {
        record.gender = "Female";
    } else if (lowercase.includes("male") || lowercase.includes("man") || lowercase.includes("boy") || lowercase.includes("he/him")) {
        record.gender = "Male";
    }

    // 4. Duration Extraction
    const durPattern = /(\b[0-9]+\s*(days|weeks|months|hours|day|week|month|hour)\b)/i;
    m = notes.match(durPattern);
    if (m) {
        record.duration = m[1].trim();
    } else if (lowercase.includes("yesterday")) {
        record.duration = "1 day";
    } else if (lowercase.includes("today")) {
        record.duration = "less than 1 day";
    }

    // 5. Symptoms Keywords
    const symptomKeywords = ["fever", "cough", "chest pain", "breathing difficulty", "shortness of breath",
        "bleeding", "burn", "cut", "wound", "sweating", "confusion", "dizzy",
        "headache", "vomiting", "diarrhea", "rash", "seizure", "dehydration"];

    symptomKeywords.forEach(sym => {
        if (lowercase.includes(sym)) {
            record.symptoms.push(sym.charAt(0).toUpperCase() + sym.slice(1));
        }
    });

    // 6. Medical Red Flags Safety Rules
    const hasBreathingDifficulty = lowercase.includes("breathing difficulty") ||
        lowercase.includes("shortness of breath") ||
        lowercase.includes("difficulty breathing") ||
        lowercase.includes("cannot breathe");

    const hasChestPain = lowercase.includes("chest pain") ||
        lowercase.includes("heart pain") ||
        lowercase.includes("pressure in chest") ||
        (lowercase.includes("sweating") && lowercase.includes("chest"));

    const hasUnconsciousness = lowercase.includes("unconscious") ||
        lowercase.includes("fainted") ||
        lowercase.includes("passed out");

    const hasHeavyBleeding = (lowercase.includes("bleeding") &&
        (lowercase.includes("heavy") || lowercase.includes("severe") ||
            lowercase.includes("profuse") || lowercase.includes("uncontrolled")));

    const hasSevereBurn = lowercase.includes("burn") &&
        (lowercase.includes("severe") || lowercase.includes("third degree") ||
            lowercase.includes("face") || lowercase.includes("large area") ||
            lowercase.includes("genital"));

    const hasFeverWithConfusion = lowercase.includes("fever") &&
        (lowercase.includes("confusion") || lowercase.includes("confused") ||
            lowercase.includes("unresponsive"));

    const hasBleedingPregnancy = lowercase.includes("bleeding") &&
        (lowercase.includes("pregnant") || lowercase.includes("pregnancy"));

    const hasSeizure = lowercase.includes("seizure") || lowercase.includes("convulsion");

    const hasHypoxia = record.vitals.spo2 !== null && record.vitals.spo2 < 90;
    const hasExtremeTachycardia = record.vitals.hr !== null && record.vitals.hr > 130;
    const hasExtremeFever = record.vitals.temp !== null && record.vitals.temp >= 104.0;

    let bmi = null;
    let hasSevereMalnutrition = false;
    let hasSevereObesity = false;
    if (record.vitals.weight && record.vitals.height) {
        bmi = record.vitals.weight / Math.pow(record.vitals.height / 100, 2);
        record.vitals.bmi = bmi.toFixed(1);
        if (bmi < 18.5) hasSevereMalnutrition = true;
        if (bmi > 35) hasSevereObesity = true;
    }

    // Compute Red Flags Array
    if (hasBreathingDifficulty || hasHypoxia) record.redFlags.push("Difficulty breathing / Respiratory distress");
    if (hasHypoxia) record.redFlags.push(`Severe Hypoxia (SpO2: ${record.vitals.spo2}%)`);
    if (hasExtremeTachycardia) record.redFlags.push(`Extreme Tachycardia (Heart Rate: ${record.vitals.hr} bpm)`);
    if (hasExtremeFever) record.redFlags.push(`Critical Hyperpyrexia (Temperature: ${record.vitals.temp} °F)`);
    if (hasSevereMalnutrition) record.redFlags.push(`Severe Malnutrition (BMI: ${record.vitals.bmi})`);
    if (hasSevereObesity) record.redFlags.push(`High-Risk Obesity (BMI: ${record.vitals.bmi})`);
    if (hasChestPain) record.redFlags.push("Chest pain or pressure (possible cardiac event)");
    if (hasUnconsciousness) record.redFlags.push("Loss of consciousness or fainting");
    if (hasHeavyBleeding) record.redFlags.push("Heavy or uncontrolled bleeding");
    if (hasSevereBurn) record.redFlags.push("Severe/extensive burn or burn on sensitive area");
    if (hasFeverWithConfusion) record.redFlags.push("High fever accompanied by confusion or altered mental state");
    if (hasBleedingPregnancy) record.redFlags.push("Pregnancy-related bleeding");
    if (hasSeizure) record.redFlags.push("Seizure activity");

    // Urgency level & details mapping
    if (record.redFlags.length > 0) {
        record.triageLevel = "Urgent";
        record.recommendedAction = "Seek immediate medical attention / Go to Emergency Room";
        record.confidence = 0.95;

        if (hasHeavyBleeding) {
            record.firstAid.push("Apply firm, direct pressure to the wound with a clean cloth.");
            record.firstAid.push("Elevate the bleeding limb above the heart if possible.");
            record.firstAid.push("Keep the patient warm and lying down.");
        } else if (hasSevereBurn) {
            record.firstAid.push("Cool the burn immediately under cool running water for 10-20 minutes.");
            record.firstAid.push("Do not apply ice, butter, or ointments.");
            record.firstAid.push("Cover the burn loosely with a clean, non-stick dressing.");
        } else if (hasChestPain) {
            record.firstAid.push("Have the patient sit in a comfortable, relaxed position (semi-recumbent).");
            record.firstAid.push("Loosen tight clothing around the neck and chest.");
            record.firstAid.push("Keep the patient calm. If aspirin is prescribed, assist in taking it.");
        } else if (hasBreathingDifficulty || hasHypoxia) {
            record.firstAid.push("Help the patient sit upright in a comfortable position.");
            record.firstAid.push("Loosen tight clothing around the neck.");
            if (hasHypoxia) record.firstAid.push("Administer emergency oxygen if available.");
            record.firstAid.push("Help the patient use their rescue inhaler if they have one.");
        } else if (hasExtremeFever) {
            record.firstAid.push("Place cool, wet washcloths on the forehead, neck, and underarms.");
            record.firstAid.push("Encourage the patient to sip small amounts of cool water.");
            record.firstAid.push("Keep the room cool and loosen tight clothing.");
        } else {
            record.firstAid.push("Keep the patient calm and comfortable.");
            record.firstAid.push("Do not leave the patient unattended.");
            record.firstAid.push("Ensure a clear airway and loosen tight clothing.");
        }
    } else {
        const hasFever = lowercase.includes("fever");
        let hasDurationLong = false;

        const numMat = record.duration.match(/([0-9]+)/);
        if (numMat) {
            const val = parseInt(numMat[1], 10);
            if (record.duration.includes("day") && val >= 3) {
                hasDurationLong = true;
            } else if (record.duration.includes("week") || record.duration.includes("month")) {
                hasDurationLong = true;
            }
        }

        if (hasFever && hasDurationLong) {
            record.triageLevel = "High";
            record.recommendedAction = "Visit Primary Health Centre (PHC) / Clinic within 24 hours";
            record.redFlags.push("Fever lasting 3 or more days");
            record.firstAid.push("Drink plenty of fluids (water, ORS, soups).");
            record.firstAid.push("Rest in a cool room.");
            record.firstAid.push("Tepid sponging to help reduce temperature.");
            record.confidence = 0.88;
        } else if (lowercase.includes("burn")) {
            record.triageLevel = "Medium";
            record.recommendedAction = "Consult a health worker or clinic for evaluation";
            record.firstAid.push("Cool the burn with cool running water.");
            record.firstAid.push("Apply aloe vera gel or burn ointment if skin is intact.");
            record.firstAid.push("Do not pop blisters.");
            record.confidence = 0.85;
        } else if (lowercase.includes("cut") || lowercase.includes("wound") || lowercase.includes("scratch")) {
            record.triageLevel = "Low";
            record.recommendedAction = "Clean and monitor symptoms at home";
            record.firstAid.push("Clean the wound with mild soap and clean running water.");
            record.firstAid.push("Apply an antiseptic cream and cover with a sterile bandage.");
            record.firstAid.push("Watch for signs of infection (redness, pus, increased pain).");
            record.confidence = 0.90;
        } else {
            record.triageLevel = "Low";
            record.recommendedAction = "Monitor symptoms at home. Visit a clinic if they worsen.";
            record.firstAid.push("Ensure adequate rest and hydration.");
            record.firstAid.push("Monitor temperature and symptoms.");
            record.confidence = 0.75;
        }
    }

    // Generate recommended supportive medications (OTC)
    record.recommendedMedications = [];

    const lowerNotes = notes.toLowerCase();
    const syms = record.symptoms.map(s => s.toLowerCase());

    if (syms.includes("fever") || syms.includes("headache") || lowerNotes.includes("fever") || lowerNotes.includes("headache") || lowerNotes.includes("pain") || lowerNotes.includes("body pain")) {
        record.recommendedMedications.push("Paracetamol (500mg) - Take 1 tablet every 4-6 hours as needed for fever/pain (Max 4 tablets/day)");
    }
    if (syms.includes("cough") || lowerNotes.includes("cough") || lowerNotes.includes("cold")) {
        record.recommendedMedications.push("Cough Lozenges or Cough Syrup - symptomatic relief for throat irritation");
    }
    if (syms.includes("diarrhea") || syms.includes("vomiting") || syms.includes("dehydration") || lowerNotes.includes("diarrhea") || lowerNotes.includes("vomiting")) {
        record.recommendedMedications.push("Oral Rehydration Salts (ORS) - Dissolve 1 packet in 1L clean water, drink slowly");
    }
    if (syms.includes("cut") || syms.includes("wound") || lowerNotes.includes("cut") || lowerNotes.includes("wound") || lowerNotes.includes("scratch")) {
        record.recommendedMedications.push("Antiseptic Cream / Ointment - Apply locally to clean wound twice daily");
    }
    if (syms.includes("burn") || lowerNotes.includes("burn")) {
        record.recommendedMedications.push("Soothing Aloe Vera Gel or Burn Ointment - Apply locally for minor burns");
    }
    if (lowerNotes.includes("chest pain") && record.triageLevel === "Urgent") {
        record.recommendedMedications.push("Aspirin (325mg) - Chew 1 tablet immediately if advised by emergency services");
    }

    return record;
}

// Generate slip text
function generateReferralCardText(record, notes) {
    let sb = "";
    sb += "====================================\n";
    sb += "       HELIO AI REFERRAL CARD       \n";
    sb += "====================================\n";
    sb += `Patient: ${record.patientName}\n`;
    sb += `Age: ${record.age === null ? "Unknown" : record.age}\n`;
    sb += `Gender: ${record.gender}\n`;
    sb += `Duration: ${record.duration}\n`;
    if (record.location) {
        sb += `GPS Location: ${record.location}\n`;
    }

    if (record.vitals && (record.vitals.temp || record.vitals.spo2 || record.vitals.hr || record.vitals.bp || record.vitals.weight || record.vitals.height)) {
        sb += "------------------------------------\n";
        sb += "PATIENT VITAL SIGNS:\n";
        if (record.vitals.temp) sb += ` - Temp: ${record.vitals.temp} °F\n`;
        if (record.vitals.spo2) sb += ` - SpO2: ${record.vitals.spo2} %\n`;
        if (record.vitals.hr) sb += ` - Heart Rate: ${record.vitals.hr} bpm\n`;
        if (record.vitals.bp) sb += ` - Blood Pressure: ${record.vitals.bp} mmHg\n`;
        if (record.vitals.weight) sb += ` - Weight: ${record.vitals.weight} kg\n`;
        if (record.vitals.height) sb += ` - Height: ${record.vitals.height} cm\n`;
        if (record.vitals.bmi) sb += ` - BMI: ${record.vitals.bmi}\n`;
    }
    sb += "------------------------------------\n";
    sb += `TRIAGE LEVEL: ${record.triageLevel.toUpperCase()}\n`;

    if (record.redFlags.length > 0) {
        sb += "\nRED FLAGS DETECTED:\n";
        record.redFlags.forEach(rf => {
            sb += ` - ${rf}\n`;
        });
    }

    sb += "\nSYMPTOMS IDENTIFIED:\n";
    if (record.symptoms.length === 0) {
        sb += " - None identified (unstructured notes attached)\n";
    } else {
        record.symptoms.forEach(s => {
            sb += ` - ${s}\n`;
        });
    }

    sb += "\nRECOMMENDED ACTION:\n";
    sb += `${record.recommendedAction}\n`;

    if (record.recommendedMedications && record.recommendedMedications.length > 0) {
        sb += "\nSUPPORTIVE MEDICATIONS (OTC):\n";
        record.recommendedMedications.forEach(med => {
            sb += ` - ${med}\n`;
        });
    }

    sb += "------------------------------------\n";
    sb += "CLINICAL SUMMARY:\n";
    if (notes.length > 120) {
        sb += `${notes.substring(0, 117)}...\n`;
    } else {
        sb += `${notes}\n`;
    }
    sb += "------------------------------------\n";
    sb += "[Offline CPU Processing Complete]\n";
    sb += "====================================";
    return sb;
}

// Toggle JSON view
function toggleJsonView() {
    const jsonBlock = document.getElementById("json-block");
    const btn = document.getElementById("btn-toggle-json");
    isJsonVisible = !isJsonVisible;
    if (isJsonVisible) {
        jsonBlock.style.display = "block";
        btn.innerText = "Hide Structured JSON";
    } else {
        jsonBlock.style.display = "none";
        btn.innerText = "Show Structured JSON";
    }
}

// Save Record to LocalStorage
function saveRecord() {
    if (!currentTriageRecord) return;

    const notes = document.getElementById("clinical-notes").value.trim();
    const timestamp = new Date().toLocaleString();

    const recordToSave = {
        timestamp: timestamp,
        notes: notes,
        structured_json: JSON.stringify(currentTriageRecord),
        triage_level: currentTriageRecord.triageLevel
    };

    let history = [];
    const localData = localStorage.getItem("helio_records");
    if (localData) {
        try {
            history = JSON.parse(localData);
        } catch (e) {
            history = [];
        }
    }

    history.unshift(recordToSave);
    localStorage.setItem("helio_records", JSON.stringify(history));

    showToast("Record saved to Local Registry!");
    refreshHistoryList();
}

// Refresh History List and Dashboard Analytics
function refreshHistoryList() {
    const historyList = document.getElementById("history-list");
    const noHistory = document.getElementById("no-history-text");
    if (!historyList) return;
    historyList.innerHTML = "";

    let history = [];
    const localData = localStorage.getItem("helio_records");
    if (localData) {
        try {
            history = JSON.parse(localData);
        } catch (e) {
            history = [];
        }
    }

    // Dashboard Elements
    const totalEl = document.getElementById("stat-total");
    const urgentEl = document.getElementById("stat-urgent");
    const avgConfEl = document.getElementById("stat-avg-conf");
    const topSymptomsListEl = document.getElementById("top-symptoms-list");

    if (history.length === 0) {
        noHistory.style.display = "block";
        totalEl.innerText = "0";
        urgentEl.innerText = "0";
        avgConfEl.innerText = "0%";
        topSymptomsListEl.innerHTML = "<div class='no-history-text' style='text-align:left; padding:4px;'>No symptoms recorded yet.</div>";
        return;
    }

    noHistory.style.display = "none";

    let urgentCount = 0;
    let totalConfidenceSum = 0;
    const symptomCounts = {};

    history.forEach((rec, idx) => {
        let parsedJson = {};
        try {
            parsedJson = JSON.parse(rec.structured_json);
        } catch (e) {
            parsedJson = {};
        }

        // Dashboard Stats aggregation
        if (rec.triage_level === "Urgent") {
            urgentCount++;
        }
        totalConfidenceSum += (parsedJson.confidence || 0);

        if (parsedJson.symptoms && Array.isArray(parsedJson.symptoms)) {
            parsedJson.symptoms.forEach(sym => {
                symptomCounts[sym] = (symptomCounts[sym] || 0) + 1;
            });
        }

        const card = document.createElement("div");
        card.className = "history-card";
        card.onclick = () => {
            document.getElementById("clinical-notes").value = rec.notes;
            handleTriageSubmit({ preventDefault: () => { } });
            showToast("Loaded saved record details!");
        };

        const header = document.createElement("div");
        header.className = "history-header";

        const nameSpan = document.createElement("span");
        nameSpan.className = "history-name";
        nameSpan.innerText = `Patient: ${parsedJson.patientName || "Unknown"}`;

        const levelSpan = document.createElement("span");
        levelSpan.className = "history-level";
        levelSpan.innerText = rec.triage_level.toUpperCase();
        levelSpan.style.backgroundColor = getTriageColor(rec.triage_level);

        header.appendChild(nameSpan);
        header.appendChild(levelSpan);

        const timeDiv = document.createElement("div");
        timeDiv.className = "history-time";
        timeDiv.innerText = rec.timestamp;

        const excerptDiv = document.createElement("div");
        excerptDiv.className = "history-excerpt";
        excerptDiv.innerText = rec.notes;

        card.appendChild(header);
        card.appendChild(timeDiv);
        card.appendChild(excerptDiv);

        historyList.appendChild(card);
    });

    // Populate Dashboard stats
    totalEl.innerText = history.length;
    urgentEl.innerText = urgentCount;
    avgConfEl.innerText = `${Math.round((totalConfidenceSum / history.length) * 100)}%`;

    // Populate top symptoms layout
    topSymptomsListEl.innerHTML = "";
    const sortedSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);

    if (sortedSymptoms.length === 0) {
        topSymptomsListEl.innerHTML = "<div class='no-history-text' style='text-align:left; padding:4px;'>No symptoms recorded yet.</div>";
    } else {
        const maxCount = Math.max(...sortedSymptoms.map(x => x[1]));
        sortedSymptoms.forEach(([sym, count]) => {
            const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;

            const row = document.createElement("div");
            row.className = "symptom-row";

            const nameSpan = document.createElement("span");
            nameSpan.className = "symptom-name";
            nameSpan.innerText = sym;

            const barContainer = document.createElement("div");
            barContainer.className = "symptom-bar-container";

            const barFill = document.createElement("div");
            barFill.className = "symptom-bar-fill";

            barContainer.appendChild(barFill);

            const countSpan = document.createElement("span");
            countSpan.className = "symptom-count";
            countSpan.innerText = count;

            row.appendChild(nameSpan);
            row.appendChild(barContainer);
            row.appendChild(countSpan);

            topSymptomsListEl.appendChild(row);

            // Animate width
            setTimeout(() => {
                barFill.style.width = `${widthPct}%`;
            }, 50);
        });
    }
}

// Copy clipboard
function copyReferralText() {
    const refText = document.getElementById("referral-text").innerText;
    navigator.clipboard.writeText(refText).then(() => {
        showToast("Referral note copied to clipboard!");
    }).catch(err => {
        showToast("Copy failed, please highlight and copy manually.");
    });
}

// Print Triage Slip
function printReferral() {
    const slip = document.querySelector(".referral-slip");
    if (slip) {
        slip.setAttribute("data-print-date", new Date().toLocaleString());
        window.print();
    } else {
        showToast("No active referral slip to print. Run triage first!");
    }
}

// Helpers
function getTriageColor(level) {
    switch (level) {
        case "Urgent": return "#BA1A1A";
        case "High": return "#E65100";
        case "Medium": return "#006064";
        case "Low": return "#1B5E20";
        default: return "#757575";
    }
}

function showToast(msg) {
    const toast = document.createElement("div");
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.backgroundColor = "#323232";
    toast.style.color = "#FFFFFF";
    toast.style.padding = "12px 24px";
    toast.style.borderRadius = "4px";
    toast.style.fontSize = "13px";
    toast.style.fontWeight = "600";
    toast.style.zIndex = "9999";
    toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
    toast.innerText = msg;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.4s ease";
        setTimeout(() => toast.remove(), 400);
    }, 2000);
}

// Collapsible Vitals section toggle
function toggleVitalsSection() {
    const container = document.getElementById("vitals-inputs-container");
    const arrow = document.getElementById("vitals-toggle-arrow");
    if (container.style.display === "none") {
        container.style.display = "block";
        arrow.innerText = "▼";
    } else {
        container.style.display = "none";
        arrow.innerText = "▶";
    }
}

// Voice Dictation Client-Side Speech recognition
let recognition = null;
let isListening = false;

function toggleVoiceDictation() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast("Speech recognition is not supported in this browser.");
        return;
    }

    const micBtn = document.getElementById("mic-btn");
    const textarea = document.getElementById("clinical-notes");

    if (isListening) {
        if (recognition) {
            recognition.stop();
        }
        isListening = false;
        micBtn.classList.remove("recording");
        micBtn.innerText = "🎙️ Dictate";
        showToast("Stopped listening.");
    } else {
        if (!recognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const resultText = event.results[event.results.length - 1][0].transcript;
                textarea.value = (textarea.value ? textarea.value + " " : "") + resultText;
                showToast("Dictated notes appended.");
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                if (event.error === 'not-allowed') {
                    showToast("Microphone permission denied.");
                } else {
                    showToast("Voice recognition error: " + event.error);
                }
                isListening = false;
                micBtn.classList.remove("recording");
                micBtn.innerText = "🎙️ Dictate";
            };

            recognition.onend = () => {
                isListening = false;
                micBtn.classList.remove("recording");
                micBtn.innerText = "🎙️ Dictate";
            };
        }

        try {
            recognition.start();
            isListening = true;
            micBtn.classList.add("recording");
            micBtn.innerText = "🛑 Stop";
            showToast("Listening... Speak now.");
        } catch (e) {
            console.error("Start speech failed:", e);
        }
    }
}

// Append GPS Tag to active session
function tagGPSLocation() {
    if (!navigator.geolocation) {
        showToast("GPS is not supported by your browser.");
        return;
    }

    if (typeof currentTriageRecord === 'undefined' || !currentTriageRecord) {
        showToast("Please run triage first to generate a record.");
        return;
    }

    const btn = document.getElementById("btn-tag-gps");
    btn.innerText = "⏳ Locating...";

    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lng = position.coords.longitude.toFixed(4);
        currentTriageRecord.location = `${lat}, ${lng}`;
        showToast("GPS Location attached successfully.");
        btn.innerText = "📍 GPS Attached";
        btn.style.backgroundColor = "#1B5E20";
        btn.style.color = "#FFFFFF";

        // Regenerate the referral note text
        const notes = document.getElementById("clinical-notes").value.trim();
        const referralNoteText = generateReferralCardText(currentTriageRecord, notes);
        document.getElementById("referral-text").innerText = referralNoteText;

        // Also update JSON
        document.getElementById("json-output-text").innerText = JSON.stringify(currentTriageRecord, null, 2);
    }, (error) => {
        console.error("GPS Error: ", error);
        showToast("Failed to retrieve GPS location. Try outside.");
        btn.innerText = "📍 Tag GPS";
    }, { timeout: 10000 });
}

// Medical Report Scanner logic
async function handleReportUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const progressDiv = document.getElementById("scanner-progress");
    progressDiv.style.display = "block";

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("/api/scan", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Upload failed");
        }

        const data = await response.json();

        // Auto-fill the clinical notes and vitals with parsed data
        const d = data.structured_data;
        let notesStr = `Scanned ${d.report_type || "Medical Report"} for ${d.patient_name || "Unknown"} (Age: ${d.age}, Gender: ${d.gender}). `;
        if (d.doctor && d.doctor !== "Unknown") notesStr += `Doctor: ${d.doctor}. `;
        if (d.hospital && d.hospital !== "Unknown") notesStr += `Hospital: ${d.hospital}. `;

        if (d.hemoglobin && d.hemoglobin !== "Unknown") notesStr += `Hb: ${d.hemoglobin}. `;
        if (d.blood_sugar && d.blood_sugar !== "Unknown") notesStr += `Blood Sugar: ${d.blood_sugar}. `;
        if (d.remarks && d.remarks !== "None") notesStr += `Remarks: ${d.remarks}. `;

        const textarea = document.getElementById("clinical-notes");
        textarea.value = (textarea.value ? textarea.value + "\n\n" : "") + notesStr;

        // Vitals auto-fill
        if (d.blood_pressure && d.blood_pressure !== "Unknown") {
            document.getElementById("vital-bp").value = d.blood_pressure;
            const vitalsContainer = document.getElementById("vitals-inputs-container");
            if (vitalsContainer.style.display === "none" || vitalsContainer.style.display === "") {
                toggleVitalsSection();
            }
        }

        showToast("Report scanned successfully! Data auto-filled.");

    } catch (err) {
        console.error("Scanner Error:", err);
        showToast("OCR Error: " + err.message);
    } finally {
        progressDiv.style.display = "none";
        // Reset file input so same file can be uploaded again if needed
        event.target.value = "";
    }
}
