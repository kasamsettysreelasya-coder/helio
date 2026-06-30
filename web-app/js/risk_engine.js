// risk_engine.js
// Handles fetching risk score from backend and updating the Dashboard risk meter

async function fetchAndSaveRiskScore(notes, vitals) {
    try {
        const req = {
            symptoms: notes,
            duration_days: 1, // simplified for now
            vitals: vitals
        };
        
        const res = await fetch('/api/user/triage', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(req)
        });
        
        if (res.ok) {
            // Update Dashboard data in background so it's ready when user switches tabs
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            }
        }
    } catch(e) {
        console.error("Risk score calc failed", e);
    }
}
