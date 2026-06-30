// dashboard.js
// Handles user dashboard, history, and risk trends

let riskChartInstance = null;

async function loadDashboardData() {
    try {
        const res = await fetch('/api/user/risk_trends');
        if (!res.ok) return;
        const data = await res.json();
        const trends = data.trends;
        
        // Update stats
        document.getElementById('dash-total-scans').innerText = trends.length;
        
        if (trends.length > 0) {
            const latest = trends[trends.length - 1];
            document.getElementById('risk-score-display').innerText = `${latest.risk_score}%`;
            document.getElementById('risk-category-display').innerText = latest.risk_category;
            
            const fill = document.getElementById('risk-meter-fill');
            fill.style.width = `${latest.risk_score}%`;
            
            // Colors
            if (latest.risk_score < 30) fill.style.background = '#4CAF50';
            else if (latest.risk_score < 60) fill.style.background = '#FF9800';
            else fill.style.background = '#F44336';
            
            renderRiskChart(trends);
        }
        
        // Load history as well
        loadHistoryData();
        
    } catch(e) {
        console.error("Dashboard error", e);
    }
}

function renderRiskChart(trends) {
    const ctx = document.getElementById('riskTrendChart').getContext('2d');
    
    const labels = trends.map(t => new Date(t.timestamp).toLocaleDateString());
    const dataPoints = trends.map(t => t.risk_score);
    
    if (riskChartInstance) {
        riskChartInstance.destroy();
    }
    
    riskChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Health Risk %',
                data: dataPoints,
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { min: 0, max: 100 }
            }
        }
    });
}

async function loadHistoryData() {
    try {
        const res = await fetch('/api/user/history');
        if (!res.ok) return;
        const data = await res.json();
        
        const list = document.getElementById('global-history-list');
        list.innerHTML = "";
        
        if (data.symptom_history.length === 0 && data.medical_reports.length === 0) {
            list.innerHTML = "<p>No history found.</p>";
            return;
        }
        
        // Combine and sort
        const all = [...data.symptom_history, ...data.medical_reports];
        all.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        all.forEach(item => {
            const div = document.createElement('div');
            div.style.padding = "15px";
            div.style.marginBottom = "10px";
            div.style.background = "white";
            div.style.border = "1px solid #ddd";
            div.style.borderRadius = "8px";
            
            const d = new Date(item.timestamp).toLocaleString();
            
            if (item.symptoms) {
                // Symptom history
                div.innerHTML = `<strong>🩺 Symptom Check</strong> <span style="float:right; color:#777;">${d}</span>
                                 <p style="margin:8px 0; font-size:0.95em;">${item.symptoms}</p>`;
            } else {
                // Report
                div.innerHTML = `<strong>📄 Uploaded Report</strong> <span style="float:right; color:#777;">${d}</span>
                                 <p style="margin:8px 0; font-size:0.95em;">Extracted: ${item.structured_data.report_type || 'Unknown'}</p>`;
            }
            list.appendChild(div);
        });
        
    } catch(e) {
        console.error(e);
    }
}

function exportHistoryPDF() {
    const element = document.getElementById('global-history-list');
    html2pdf().from(element).save('My_Medical_History.pdf');
}
