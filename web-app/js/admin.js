// admin.js
// Handles Admin Dashboard

let adminChartInstance = null;

async function loadAdminData() {
    try {
        const res = await fetch('/api/admin/dashboard');
        if (!res.ok) return;
        const data = await res.json();
        
        document.getElementById('admin-total-users').innerText = data.total_users;
        document.getElementById('admin-total-scans').innerText = data.total_scans;
        document.getElementById('admin-high-risk').innerText = data.high_risk;
        
        // Render Users Table
        const tbody = document.querySelector('#admin-users-table tbody');
        tbody.innerHTML = "";
        
        let ageData = { '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0 };
        
        data.users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${u.id}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${u.full_name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${u.username}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${u.age}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(u.registration_date).toLocaleDateString()}</td>
            `;
            tbody.appendChild(tr);
            
            // Calc age buckets
            if (u.age <= 18) ageData['0-18']++;
            else if (u.age <= 35) ageData['19-35']++;
            else if (u.age <= 50) ageData['36-50']++;
            else if (u.age <= 65) ageData['51-65']++;
            else ageData['65+']++;
        });
        
        renderAdminChart(ageData);
        
    } catch(e) {
        console.error("Admin load error", e);
    }
}

function renderAdminChart(ageData) {
    const ctx = document.getElementById('adminAgeChart').getContext('2d');
    
    if (adminChartInstance) {
        adminChartInstance.destroy();
    }
    
    adminChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(ageData),
            datasets: [{
                label: 'Users per Age Group',
                data: Object.values(ageData),
                backgroundColor: '#4CAF50'
            }]
        },
        options: {
            responsive: true
        }
    });
}
