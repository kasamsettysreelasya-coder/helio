// auth.js
// Handles SPA View switching, registration, and login.

function switchView(hideId, showId) {
    document.getElementById(hideId).style.display = 'none';
    document.getElementById(showId).style.display = 'block';
}

function switchMainView(viewId) {
    // Hide all main views by removing active-view class and resetting inline display
    const views = document.querySelectorAll('.main-view');
    views.forEach(v => {
        v.classList.remove('active-view');
        v.style.display = 'none'; // Clear any inline displays
    });
    
    // Show requested by adding active-view class
    const reqView = document.getElementById(viewId);
    if (reqView) {
        reqView.classList.add('active-view');
        reqView.style.display = 'block'; // ensure it's visible
    }
    
    // Update navigation active state
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    // Attempt to activate matching tab
    const tabMap = {
        'view-dashboard': 'nav-dashboard',
        'view-triage': 'nav-triage',
        'view-history': 'nav-history',
        'view-profile': 'nav-profile',
        'view-admin': 'nav-admin'
    };
    if (tabMap[viewId]) {
        document.getElementById(tabMap[viewId]).classList.add('active');
    }

    // Toggle triage-sidebar-tools only for triage
    document.getElementById('triage-sidebar-tools').style.display = (viewId === 'view-triage') ? 'block' : 'none';
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerText = "Authenticating...";
    
    const req = {
        username: document.getElementById('login-username').value.trim(),
        password: document.getElementById('login-password').value
    };

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(req)
        });
        
        if (!res.ok) throw new Error("Invalid username or password");
        const data = await res.json();
        
        // Success
        switchView('auth-layout', 'app-layout');
        loadUserProfile();
        
        // If admin, show admin tab
        if (data.role === 'admin') {
            document.getElementById('nav-admin').style.display = 'block';
            switchMainView('view-admin');
            if (typeof loadAdminData === 'function') loadAdminData();
        } else {
            document.getElementById('nav-admin').style.display = 'none';
            switchMainView('view-dashboard');
            if (typeof loadDashboardData === 'function') loadDashboardData();
        }
        
    } catch(err) {
        document.getElementById('login-error').innerText = err.message;
    } finally {
        btn.innerText = "Login";
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const errBox = document.getElementById('reg-error');
    
    const pw = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    
    if (pw !== confirm) {
        errBox.innerText = "Passwords do not match!";
        return;
    }
    
    btn.innerText = "Registering...";
    
    const req = {
        full_name: document.getElementById('reg-fullname').value.trim(),
        username: document.getElementById('reg-username').value.trim(),
        age: parseInt(document.getElementById('reg-age').value),
        gender: document.getElementById('reg-gender').value,
        password: pw,
        phone: document.getElementById('reg-phone').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        emergency_contact: document.getElementById('reg-emergency').value.trim(),
        blood_group: document.getElementById('reg-blood').value
    };

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(req)
        });
        
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.detail || "Registration failed");
        }
        
        // Auto-login after register
        document.getElementById('login-username').value = req.username;
        document.getElementById('login-password').value = pw;
        handleLogin({preventDefault: ()=>{}, target: document.getElementById('login-form')});
        
    } catch(err) {
        errBox.innerText = err.message;
        btn.innerText = "Register & Login";
    }
}

async function loadUserProfile() {
    try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error("Not logged in");
        const data = await res.json();
        const u = data.user;
        
        document.getElementById('welcome-username').innerText = "Welcome, " + (u.role === 'admin' ? 'Admin' : u.user_id); // In real app, we fetch name
        
        // We'll hydrate the actual profile data in the Profile view later
    } catch(e) {
        console.error("Session missing");
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout', {method:'POST'});
    } catch(e){}
    
    // Clear forms and switch back to login
    document.getElementById('login-password').value = "";
    document.getElementById('login-error').innerText = "";
    switchView('app-layout', 'auth-layout');
    switchView('view-register', 'view-login');
}

// On page load, try to see if we already have a session
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
            const data = await res.json();
            switchView('auth-layout', 'app-layout');
            loadUserProfile();
            
            if (data.user.role === 'admin') {
                document.getElementById('nav-admin').style.display = 'block';
                switchMainView('view-admin');
                if (typeof loadAdminData === 'function') loadAdminData();
            } else {
                switchMainView('view-dashboard');
                if (typeof loadDashboardData === 'function') loadDashboardData();
            }
        }
    } catch(e) {
        // Stay on login screen
    }
});
