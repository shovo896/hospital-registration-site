console.log('🏥 IbneSina Hospital System Loading...');
// GLOBAL VARIABLES
let currentUser = null;
let currentRole = null;
let selectedRoleForAuth = null;
let selectedDoctor = null;
let selectedDiagnostic = null;
let selectedWard = null;
let paymentContext = null;
// User databases
let userData = {
    patients: [],
    donors: [],
    employees: [],
    admins: []
};
// Admin credentials
const adminCredentials = {
    username: 'admin',
    password: 'admin123'
};
// Hospital data
let hospitalData = {
    doctors: [],
    patients: [],
    appointments: [],
    diagnosticBookings: [],
    wardAdmissions: [],
    bloodBank: {
        stock: {
            'A+': 15, 'A-': 8, 'B+': 12, 'B-': 5,
            'O+': 20, 'O-': 6, 'AB+': 10, 'AB-': 4
        },
        donations: [],
        requests: []
    },
    payments: [],
    alerts: []
};
// Maximum appointments allowed per time slot
const MAX_APPOINTMENTS_PER_SLOT = 3;
const diagnosticPrices = {
    'Blood Test': 800,
    'X-Ray': 600,
    'ECG': 700,
    'MRI': 3000,
    'Ultrasound': 1200,
    'CT Scan': 2500
};
const wardPricing = {
    'General': 500,
    'Cabin': 1500,
    'ICU': 4000
};
// ============================================
// DATA MANAGEMENT
// ============================================

function saveData() {
    // Persist hospital dataset to localStorage so state survives refreshes.
    localStorage.setItem('hospitalData', JSON.stringify(hospitalData));
}

function loadData() {
    // Load saved state or seed with sample data if nothing exists.
    const saved = localStorage.getItem('hospitalData');
    if (saved) {
        try {
            hospitalData = JSON.parse(saved);
            console.log('✅ Data loaded');
        } catch (e) {
            initializeSampleData();
        }
    } else {
        initializeSampleData();
    }
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
        try {
            userData = JSON.parse(savedUserData);
        } catch (e) {}
    }
    hydrateSessionFromStorage();
}

function saveUserData() {
    localStorage.setItem('userData', JSON.stringify(userData));
}

function saveSession() {
    if (currentUser && currentRole) {
        localStorage.setItem('currentSession', JSON.stringify({
            user: currentUser,
            role: currentRole
        }));
    }
}

function hydrateSessionFromStorage() {
    const savedSession = localStorage.getItem('currentSession');
    if (!savedSession) return;
    try {
        const session = JSON.parse(savedSession);
        const roleBuckets = {
            patient: userData.patients,
            donor: userData.donors,
            employee: userData.employees,
            admin: userData.admins
        };
        const pool = roleBuckets[session.role] || [];
        const matchedUser = pool.find(u => u.id === session.user?.id || u.phone === session.user?.phone);
        if (matchedUser) {
            currentUser = matchedUser;
            currentRole = session.role;
        } else {
            clearSession();
        }
    } catch (e) {
        clearSession();
    }
}

function clearSession() {
    localStorage.removeItem('currentSession');
    currentUser = null;
    currentRole = null;
    updateNavigationForRole();
}

function initializeSampleData() {
    hospitalData.doctors = [
        { id: 'D001', name: 'Dr. Ahmed Khan', specialization: 'Cardiologist', phone: '01711-123456', photo: '', fee: 800 },
        { id: 'D002', name: 'Dr. Fatima Rahman', specialization: 'Pediatrician', phone: '01811-234567', photo: '', fee: 600 },
        { id: 'D003', name: 'Dr. Kamal Hossain', specialization: 'Neurologist', phone: '01911-345678', photo: '', fee: 1000 },
        { id: 'D004', name: 'Dr. Nazia Sultana', specialization: 'Gynecologist', phone: '01611-456789', photo: '', fee: 700 },
        { id: 'D005', name: 'Dr. Rafiq Ahmed', specialization: 'Orthopedic', phone: '01511-567890', photo: '', fee: 900 }
    ];
    hospitalData.bloodBank.requests = [
        { id: 'REQ101', bloodGroup: 'O+', units: 2, contact: '01711-998877', location: 'ICU Block', priority: 'critical' },
        { id: 'REQ102', bloodGroup: 'A-', units: 1, contact: '01818-445566', location: 'Emergency Desk', priority: 'urgent' }
    ];
    hospitalData.bloodBank.donations = [
        { id: 'DON1001', donorName: 'Community Donor', bloodGroup: 'B+', units: 1, date: new Date().toISOString(), location: 'IbneSina Blood Center' }
    ];
    saveData();
}
// ============================================
// AUTH FUNCTIONS
// ============================================

function selectRole(role) {
    // Toggle to the login view for the chosen role.
    selectedRoleForAuth = role;
    document.getElementById('role-selection').style.display = 'none';
    document.getElementById('login-form-section').style.display = 'block';
    const titles = {
        'patient': 'Patient Login',
        'donor': 'Blood Donor Login',
        'employee': 'Employee Login',
        'admin': 'Admin Login'
    };
    document.getElementById('login-role-title').textContent = titles[role];
    const passwordField = document.getElementById('password-field');
    const loginPassword = document.getElementById('login-password');
    const showPasswordField = true;
    const mustProvidePassword = true;
    if (passwordField) {
        passwordField.style.display = showPasswordField ? 'block' : 'none';
    }
    if (loginPassword) {
        loginPassword.required = mustProvidePassword;
        if (!showPasswordField) {
            loginPassword.value = '';
        }
    }
const registerLink = document.getElementById('register-link');
    if (role === 'admin') {
        registerLink.style.display = 'none';
    } else {
        registerLink.style.display = 'block';
    }
}

function backToRoleSelection() {
    document.getElementById('role-selection').style.display = 'block';
    document.getElementById('login-form-section').style.display = 'none';
    document.getElementById('register-form-section').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('login-form-section').style.display = 'none';
    document.getElementById('register-form-section').style.display = 'block';
    const titles = {
        'patient': 'Patient Registration',
        'donor': 'Blood Donor Registration',
        'employee': 'Employee Registration'
    };
    document.getElementById('register-role-title').textContent = titles[selectedRoleForAuth];
    const employeeIdField = document.getElementById('employee-id-field');
    const departmentField = document.getElementById('department-field');
    if (selectedRoleForAuth === 'employee') {
        employeeIdField.style.display = 'block';
        departmentField.style.display = 'block';
    } else {
        employeeIdField.style.display = 'none';
        departmentField.style.display = 'none';
    }
}

function backToLogin() {
    document.getElementById('login-form-section').style.display = 'block';
    document.getElementById('register-form-section').style.display = 'none';
}

function updateHomeCta() {
    const homeCta = document.getElementById('home-auth-cta');
    const heroSubtitle = document.getElementById('hero-subtitle');
    if (!homeCta) return;
    if (currentRole && currentUser) {
        homeCta.textContent = 'Go to Dashboard';
        homeCta.onclick = () => showSection(getDashboardForRole(currentRole));
        if (heroSubtitle) {
            heroSubtitle.textContent = `Welcome back, ${currentUser.name}! Head to your dashboard to continue.`;
        }
    } else {
        homeCta.textContent = 'Login / Register';
        homeCta.onclick = () => showSection('login');
        if (heroSubtitle) {
            heroSubtitle.textContent = 'Quality Healthcare Services at Your Fingertips';
        }
    }
}

function updateNavigationForRole() {
    document.getElementById('patient-nav').style.display = 'none';
    document.getElementById('donor-nav').style.display = 'none';
    document.getElementById('employee-nav').style.display = 'none';
    document.getElementById('admin-nav').style.display = 'none';
    const homeCta = document.getElementById('home-auth-cta');
    const authBlocks = ['role-selection', 'login-form-section', 'register-form-section'];
    if (currentRole) {
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'block';
        authBlocks.forEach(id => {
            const block = document.getElementById(id);
            if (block) block.style.display = 'none';
        });
        const navButtons = {
            'patient': 'patient-nav',
            'donor': 'donor-nav',
            'employee': 'employee-nav',
            'admin': 'admin-nav'
        };
        document.getElementById(navButtons[currentRole]).style.display = 'block';
        if (homeCta) {
            homeCta.textContent = 'Go to Dashboard';
            homeCta.onclick = () => showSection(getDashboardForRole(currentRole));
        }
    } else {
        document.getElementById('login-btn').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'none';
        const roleSelection = document.getElementById('role-selection');
        const loginFormSection = document.getElementById('login-form-section');
        const registerFormSection = document.getElementById('register-form-section');
        if (roleSelection) roleSelection.style.display = 'block';
        if (loginFormSection) loginFormSection.style.display = 'none';
        if (registerFormSection) registerFormSection.style.display = 'none';
        if (homeCta) {
            homeCta.textContent = 'Login / Register';
            homeCta.onclick = () => showSection('login');
        }
    }
    updateHomeCta();
    refreshAccessDenials();
}

function getDashboardForRole(role) {
    const dash = {
        'patient': 'patient-dashboard',
        'donor': 'donor-dashboard',
        'employee': 'employee-dashboard',
        'admin': 'admin'
    };
    return dash[role] || 'home';
}

function refreshAccessDenials() {
    const blocks = document.querySelectorAll('.access-denied');
    blocks.forEach(block => {
        const message = block.querySelector('p');
        const button = block.querySelector('button');
        if (!message || !button) return;
        if (currentRole && currentUser) {
            const roleName = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);
            message.textContent = `You are logged in as ${roleName} ${currentUser.name || ''}. Go straight to your dashboard.`.trim();
            button.textContent = 'Go to Dashboard';
            button.onclick = () => showSection(getDashboardForRole(currentRole));
        } else {
            message.textContent = 'Please login to continue.';
            button.textContent = 'Go to Login';
            button.onclick = () => showSection('login');
        }
    });
}

function setAvatar(container, fallbackEl, photo, name) {
    if (!container || !fallbackEl) return;
    if (photo) {
        container.style.backgroundImage = `url(${photo})`;
        fallbackEl.style.display = 'none';
    } else {
        container.style.backgroundImage = 'none';
        fallbackEl.style.display = 'flex';
        fallbackEl.textContent = (name?.charAt(0) || '?').toUpperCase();
    }
}

function getDashboardForRole(role) {
    const dash = {
        'patient': 'patient-dashboard',
        'donor': 'donor-dashboard',
        'employee': 'employee-dashboard',
        'admin': 'admin'
    };
    return dash[role] || 'home';
}

function checkAuthAndShow(sectionId) {
    const requiredRoles = {
        'patient-dashboard': 'patient',
        'donor-dashboard': 'donor',
        'employee-dashboard': 'employee',
        'admin': 'admin'
    };
    if (!currentUser || currentRole !== requiredRoles[sectionId]) {
        showToast('Please login first!');
        showSection('login');
        return;
    }
    showSection(sectionId);
}

function logout() {
    if (confirm('Are you sure?')) {
        clearSession();
        showToast('Logged out');
        showSection('home');
    }
}

function resetSystem() {
    if (confirm('⚠️ This will clear ALL data!')) {
        localStorage.clear();
        location.reload();
    }
}
// ============================================
// UI
// ============================================

function showSection(sectionId) {
    if (sectionId === 'login' && currentRole) {
        showSection(getDashboardForRole(currentRole));
        showToast('You are already logged in.');
        return;
    }
    console.log('📍 Showing section:', sectionId);
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none'; // Force hide
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block'; // Force show
        console.log('✅ Section displayed:', sectionId);
    } else {
        console.error('❌ Section not found:', sectionId);
    }
    if (sectionId === 'patient-dashboard') {
        loadPatientDashboard();
    } else if (sectionId === 'donor-dashboard') {
        loadDonorDashboard();
    } else if (sectionId === 'admin') {
        loadAdminDashboard();
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#1e40af;color:white;padding:15px 25px;border-radius:8px;z-index:10000;';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showPatientTab(tabId) {
    document.querySelectorAll('#patient-dashboard .dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.add('active');
    if (tabId === 'patient-profile') {
        loadPatientProfile();
    } else if (tabId === 'patient-doctors') {
        loadPatientDoctors();
    } else if (tabId === 'patient-appointments') {
        loadPatientAppointments();
    }
}

function showDonorTab(tabId) {
    document.querySelectorAll('#donor-dashboard .dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.add('active');
    document.querySelectorAll('#donor-dashboard .sub-nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(document.querySelectorAll('#donor-dashboard .sub-nav-btn')).find(btn => btn.getAttribute('onclick')?.includes(tabId));
    if (activeBtn) activeBtn.classList.add('active');
    if (tabId === 'donor-profile') {
        loadDonorProfile();
    } else if (tabId === 'donor-donate') {
        updateDonorEligibility();
    } else if (tabId === 'donor-requests') {
        renderDonorRequests();
    } else if (tabId === 'donor-history') {
        renderDonorHistory();
    }
}

function showEmployeeTab(tabId) {
    document.querySelectorAll('#employee-dashboard .dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.add('active');
}
// ============================================
// PATIENT DASHBOARD
// ============================================

function loadPatientDashboard() {
    if (!currentUser) return;
    loadPatientProfile();
}
// ============================================
// DONOR DASHBOARD
// ============================================

function ensureDonorRecord() {
    if (!currentUser || currentRole !== 'donor') return;
    const donorIndex = userData.donors.findIndex(d => d.id === currentUser.id || d.phone === currentUser.phone);
    if (donorIndex >= 0) {
        if (!userData.donors[donorIndex].donations) {
            userData.donors[donorIndex].donations = currentUser.donations || [];
        }
        currentUser = userData.donors[donorIndex];
    }
    if (!currentUser.donations) {
        currentUser.donations = [];
    }
}

function loadDonorDashboard() {
    if (!currentUser) return;
    ensureDonorRecord();
    loadDonorProfile();
    renderDonorHistory();
    renderDonorRequests();
    updateDonorEligibility();
}

function loadDonorProfile() {
    ensureDonorRecord();
    if (!currentUser || currentRole !== 'donor') return;
    const donations = currentUser.donations || [];
    const totalUnits = donations.reduce((sum, d) => sum + (Number(d.units) || 0), 0);
    const lastIndex = latestDonationIndex(donations);
    const lastDonation = lastIndex >= 0 ? donations[lastIndex] : null;
    const nextBooking = donations.find(d => new Date(d.date) >= new Date());
    document.getElementById('donor-avatar').textContent = currentUser.name?.charAt(0) || 'D';
    document.getElementById('donor-name-display').textContent = currentUser.name || 'Donor';
    document.getElementById('donor-id-display').textContent = 'ID: ' + (currentUser.id || 'D' + Date.now());
    document.getElementById('donor-blood-tag').textContent = 'Blood Group: ' + (currentUser.bloodGroup || '-');
    document.getElementById('donor-total-donations').textContent = donations.length;
    document.getElementById('donor-total-units').textContent = totalUnits;
    document.getElementById('donor-next-booking').textContent = nextBooking ? formatDateTime(nextBooking.date) : 'None';
    if (lastDonation) {
        document.getElementById('donor-last-donation').textContent = 'Last donation: ' + formatDateTime(lastDonation.date);
    } else {
        document.getElementById('donor-last-donation').textContent = 'Last donation: N/A';
    }
}

function renderDonorHistory() {
    ensureDonorRecord();
    const container = document.getElementById('donor-donations-list');
    if (!container) return;
    const donations = currentUser?.donations || [];
    container.innerHTML = '';
    if (!donations.length) {
        container.innerHTML = '<p style="color:#64748b;">No donations recorded yet. Schedule your first donation to begin tracking.</p>';
        return;
    }
    donations
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(donation => {
            const card = document.createElement('div');
            card.className = 'data-card';
            card.innerHTML = `
                <h4 style="margin:0 0 6px 0;">${donation.date ? formatDateTime(donation.date) : 'Scheduled'}</h4>
                <p style="margin:0; color:#475569;">${donation.units || 1} unit(s) • ${currentUser.bloodGroup || 'Group'}</p>
                <p style="margin:4px 0 0 0; color:#475569;">${donation.location || 'IbneSina Blood Center'}</p>
            `;
            container.appendChild(card);
        });
}

function renderDonorRequests() {
    const container = document.getElementById('donor-requests-list');
    if (!container) return;
    const requests = hospitalData.bloodBank.requests || [];
    container.innerHTML = '';
    if (!requests.length) {
        container.innerHTML = '<p style="color:#64748b;">No emergency requests at the moment.</p>';
        return;
    }
    requests.forEach((req, index) => {
        if (!req.id) req.id = 'REQ' + (index + 1);
        const card = document.createElement('div');
        card.className = 'request-card';
        card.innerHTML = `
            <h4 style="margin:0 0 6px 0;">${req.bloodGroup || 'Blood'} needed</h4>
            <p style="margin:0; color:#475569;">Units: ${req.units || 1} | Contact: ${req.contact || 'N/A'}</p>
            <div class="request-meta">
                <span>Location: ${req.location || 'Hospital blood bank'}</span>
                <span>Urgency: ${req.priority || 'urgent'}</span>
            </div>
            <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
                <button class="btn btn-secondary btn-small" onclick="respondToBloodRequest('${req.id}')">I'll donate</button>
                ${req.volunteer ? `<span style="color:#16a34a; font-weight:600;">Volunteer: ${req.volunteer.name}</span>` : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

function respondToBloodRequest(requestId) {
    if (!currentUser || currentRole !== 'donor') {
        showToast('Please login as donor first');
        return;
    }
    const request = hospitalData.bloodBank.requests.find(r => r.id === requestId);
    if (!request) return;
    request.volunteer = {
        name: currentUser.name,
        phone: currentUser.phone
    };
    saveData();
    renderDonorRequests();
    showToast('Thanks for responding!');
}

function updateDonorEligibility() {
    ensureDonorRecord();
    const pill = document.getElementById('donor-next-eligible');
    if (!pill) return;
    const donations = currentUser?.donations || [];
    if (!donations.length) {
        pill.textContent = 'Next eligible: Today';
        return;
    }
    const lastDonation = donations[latestDonationIndex(donations)];
    const lastDate = new Date(lastDonation.date);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 90);
    pill.textContent = 'Next eligible: ' + nextDate.toLocaleDateString('en-GB');
}

function loadPatientProfile() {
    if (!currentUser) return;
    if (!currentUser.medicalHistory) currentUser.medicalHistory = [];
    setAvatar(
        document.getElementById('patient-avatar'),
        document.getElementById('patient-avatar-fallback'),
        currentUser.photo,
        currentUser.name
    );
    document.getElementById('patient-name-display').textContent = currentUser.name;
    document.getElementById('patient-id-display').textContent = 'ID: ' + currentUser.id;
    document.getElementById('view-phone').textContent = currentUser.phone;
    document.getElementById('view-age').textContent = currentUser.age + ' years';
    document.getElementById('view-blood').textContent = currentUser.bloodGroup || 'N/A';
    document.getElementById('view-registered').textContent = formatDateTime(currentUser.registrationDate);
    renderPatientHistory();
}

function renderPatientHistory() {
    const list = document.getElementById('patient-history-list');
    if (!list) return;
    const history = currentUser?.medicalHistory || [];
    list.innerHTML = '';
    if (!history.length) {
        list.innerHTML = '<p class="muted">No history added yet. Save a diagnosis to see it here.</p>';
        return;
    }
    history
        .slice()
        .sort((a, b) => new Date(b.loggedAt || b.date || 0) - new Date(a.loggedAt || a.date || 0))
        .forEach(item => {
            const div = document.createElement('div');
            div.className = 'profile-item';
            div.innerHTML = `
                <div>
                    <h4>${item.condition}</h4>
                    <p class="muted">${item.date ? formatDateTime(item.date) : 'Date not set'}</p>
                    <p>${item.notes || ''}</p>
                </div>
            `;
            list.appendChild(div);
        });
}

function loadPatientDoctors() {
    const grid = document.getElementById('patient-doctors-grid');
    if (!grid) return;
    grid.innerHTML = '';
    hospitalData.doctors.forEach(doctor => {
        const card = document.createElement('div');
        card.className = 'doctor-card';
        card.onclick = () => openAppointmentModal(doctor);
        card.innerHTML = `
            <div class="doctor-photo">👨‍⚕️</div>
            <div class="doctor-info">
                <h3>${doctor.name}</h3>
                <p>${doctor.specialization}</p>
                <p>Fee: ৳${doctor.fee}</p>
                <button class="btn btn-primary">Book</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function loadPatientAppointments() {
    const aptList = document.getElementById('patient-appointments-list');
    const diagList = document.getElementById('patient-diagnostics-list');
    const wardList = document.getElementById('patient-admissions-list');
    if (!aptList || !diagList || !wardList) return;
    const myApts = hospitalData.appointments.filter(a => a.patientId === currentUser.id);
    const myDiagnostics = hospitalData.diagnosticBookings.filter(b => b.patientId === currentUser.id);
    const myAdmissions = hospitalData.wardAdmissions.filter(w => w.patientId === currentUser.id);
    aptList.innerHTML = myApts.length ? '' : '<p>No appointments</p>';
    diagList.innerHTML = myDiagnostics.length ? '' : '<p>No diagnostic bookings</p>';
    wardList.innerHTML = myAdmissions.length ? '' : '<p>No ward admissions</p>';
    myApts.forEach(apt => {
        const div = document.createElement('div');
        div.className = 'profile-item';
        div.innerHTML = `
            <div>
                <h4>Dr. ${apt.doctorName}</h4>
                <p>${apt.date} - ${apt.slot}</p>
                <p class="muted">Token: ${apt.tokenNumber}  Fee: ৳${apt.fee}</p>
            </div>
            <div class="chip-row">
                <span class="status-pill ${apt.paymentStatus === 'paid' ? 'paid' : 'due'}">${apt.paymentStatus === 'paid' ? 'Paid' : 'Payment Due'}</span>
            </div>
        `;
        // No pay button in My Appointments; payment is handled at booking time.
        aptList.appendChild(div);
    });
    myDiagnostics.forEach(booking => {
        const div = document.createElement('div');
        div.className = 'profile-item';
        const price = booking.price || diagnosticPrices[booking.type] || 1000;
        div.innerHTML = `
            <div>
                <h4>${booking.type}</h4>
                <p>${booking.date} - ${booking.slot}</p>
                <p class="muted">Ref: ${booking.id}  Fee: ৳${price}</p>
            </div>
            <div class="chip-row">
                <span class="status-pill ${booking.paymentStatus === 'paid' ? 'paid' : 'due'}">${booking.paymentStatus === 'paid' ? 'Paid' : 'Payment Due'}</span>
            </div>
        `;
        if (booking.paymentStatus !== 'paid') {
            const payBtn = document.createElement('button');
            payBtn.className = 'btn btn-primary btn-compact';
            payBtn.textContent = `Pay ৳${price}`;
            payBtn.onclick = () => openPaymentFor('diagnostic', booking.id, price, `${booking.type} booking`);
            div.appendChild(payBtn);
        }
        diagList.appendChild(div);
    });
    myAdmissions.forEach(request => {
        const div = document.createElement('div');
        div.className = 'profile-item';
        const price = wardPricing[request.ward] || 500;
        div.innerHTML = `
            <div>
                <h4>${request.ward} Ward</h4>
                <p>${request.reason || 'Admission requested'}</p>
                <p class="muted">Status: ${request.status || 'pending'} • Fee: ৳${price}/day</p>
            </div>
            <div class="chip-row">
                <span class="status-pill ${request.paymentStatus === 'paid' ? 'paid' : 'due'}">${request.paymentStatus === 'paid' ? 'Paid' : 'Payment Due'}</span>
            </div>
        `;
        if (request.paymentStatus !== 'paid') {
            const payBtn = document.createElement('button');
            payBtn.className = 'btn btn-primary btn-compact';
            payBtn.textContent = `Pay ৳${price}`;
            payBtn.onclick = () => openPaymentFor('ward', request.id, price, `${request.ward} admission`);
            div.appendChild(payBtn);
        }
        wardList.appendChild(div);
    });
}

function toggleProfileEdit() {
    const view = document.getElementById('profile-view-mode');
    const edit = document.getElementById('profile-edit-mode');
    const btn = document.getElementById('edit-profile-btn');
    if (edit.style.display === 'none') {
        view.style.display = 'none';
        edit.style.display = 'block';
        btn.textContent = '❌ Cancel';
        document.getElementById('edit-name').value = currentUser.name;
        const photoInput = document.getElementById('edit-photo');
        if (photoInput) {
            photoInput.value = '';
        }
        document.getElementById('edit-phone').value = currentUser.phone;
        document.getElementById('edit-age').value = currentUser.age;
        document.getElementById('edit-blood').value = currentUser.bloodGroup || '';
    } else {
        cancelProfileEdit();
    }
}

function cancelProfileEdit() {
    document.getElementById('profile-view-mode').style.display = 'grid';
    document.getElementById('profile-edit-mode').style.display = 'none';
    document.getElementById('edit-profile-btn').textContent = '✏️ Edit Profile';
}

function loadEmployeeDashboard() {
    if (!currentUser) return;
}

function loadAdminDashboard() {
    if (!currentUser || currentRole !== 'admin') return;
    console.log('📊 Loading admin dashboard...');
    renderAdminDoctors();
    renderDiagnosticQueues();
    renderWardRequests();
    renderAdminBloodPanels();
    const defaultTab = document.querySelector('#admin .tab-btn.active')?.dataset.tab || 'doctors-mgmt';
    showAdminTab(defaultTab);
}

function showAdminTab(tabId) {
    if (!currentUser || currentRole !== 'admin') return;
    document.querySelectorAll('#admin .admin-tab').forEach(tab => {
        const isActive = tab.id === tabId;
        tab.classList.toggle('active', isActive);
        tab.style.display = isActive ? 'block' : 'none';
    });
    document.querySelectorAll('#admin .tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('active', isActive);
    });
    if (tabId === 'doctors-mgmt') {
        renderAdminDoctors();
    } else if (tabId === 'blood-mgmt') {
        renderAdminBloodPanels();
    } else if (tabId === 'diagnostics-mgmt') {
        renderDiagnosticQueues();
    } else if (tabId === 'wards-mgmt') {
        renderWardRequests();
    }
}

function renderAdminDoctors() {
    const container = document.getElementById('doctors-list-admin');
    if (!container) return;
    container.innerHTML = '';
    if (!hospitalData.doctors.length) {
        container.innerHTML = '<p style="color:#64748b;">No doctors added yet.</p>';
        return;
    }
    hospitalData.doctors.forEach(doctor => {
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
                <div>
                    <h3 style="margin:0 0 6px 0;">${doctor.name}</h3>
                    <p style="margin:0; color:#0f172a; font-weight:600;">${doctor.specialization}</p>
                    <p style="margin:4px 0 0 0; color:#475569;">Fee: ৳${doctor.fee}</p>
                </div>
                <div style="text-align:right; color:#475569;">
                    <p style="margin:0;">📞 ${doctor.phone}</p>
                    <p style="margin:4px 0 0 0;">ID: ${doctor.id}</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderDiagnosticQueues() {
    const container = document.getElementById('diagnostic-queues');
    if (!container) return;
    container.innerHTML = '';
    if (!hospitalData.diagnosticBookings.length) {
        container.innerHTML = '<p style="color:#64748b;">No diagnostic bookings yet.</p>';
        return;
    }
    hospitalData.diagnosticBookings.forEach(booking => {
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <h4 style="margin:0 0 6px 0;">${booking.type}</h4>
            <p style="margin:0; color:#475569;">Patient: ${booking.patientName} (${booking.patientPhone})</p>
            <p style="margin:4px 0 0 0; color:#475569;">Status: ${booking.status || 'pending'}</p>
        `;
        container.appendChild(card);
    });
}

function renderWardRequests() {
    const container = document.getElementById('ward-requests-admin');
    if (!container) return;
    container.innerHTML = '';
    if (!hospitalData.wardAdmissions.length) {
        container.innerHTML = '<p style="color:#64748b;">No ward admissions requested.</p>';
        return;
    }
    hospitalData.wardAdmissions.forEach(request => {
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <h4 style="margin:0 0 6px 0;">${request.ward}</h4>
            <p style="margin:0; color:#475569;">Patient: ${request.patientName}</p>
            <p style="margin:4px 0 0 0; color:#475569;">Status: ${request.status || 'pending'}</p>
        `;
        container.appendChild(card);
    });
}

function renderAdminBloodPanels() {
    const stockContainer = document.getElementById('admin-blood-stock');
    const donationsContainer = document.getElementById('admin-all-donations');
    const requestsContainer = document.getElementById('admin-blood-requests');
    if (stockContainer) {
        stockContainer.innerHTML = '';
        Object.entries(hospitalData.bloodBank.stock).forEach(([group, units]) => {
            const card = document.createElement('div');
            card.className = 'blood-card';
            card.innerHTML = `<h4>${group}</h4><p>${units} units</p>`;
            stockContainer.appendChild(card);
        });
    }
    if (donationsContainer) {
        donationsContainer.innerHTML = '';
        if (!hospitalData.bloodBank.donations.length) {
            donationsContainer.innerHTML = '<p style="color:#64748b;">No donations recorded.</p>';
        } else {
            hospitalData.bloodBank.donations.forEach(donation => {
                const card = document.createElement('div');
                card.className = 'data-card';
                card.innerHTML = `
                    <h4 style="margin:0 0 6px 0;">${donation.donorName}</h4>
                    <p style="margin:0; color:#475569;">Group: ${donation.bloodGroup} | Units: ${donation.units}</p>
                `;
                donationsContainer.appendChild(card);
            });
        }
    }
    if (requestsContainer) {
        requestsContainer.innerHTML = '';
        if (!hospitalData.bloodBank.requests.length) {
            requestsContainer.innerHTML = '<p style="color:#64748b;">No emergency requests yet.</p>';
        } else {
            hospitalData.bloodBank.requests.forEach(req => {
                const card = document.createElement('div');
                card.className = 'data-card';
                card.innerHTML = `
                    <h4 style="margin:0 0 6px 0;">${req.bloodGroup} needed</h4>
                    <p style="margin:0; color:#475569;">Units: ${req.units} | Contact: ${req.contact}</p>
                `;
                requestsContainer.appendChild(card);
            });
        }
    }
}

function resetDailyData() {
    hospitalData.appointments = [];
    hospitalData.diagnosticBookings = [];
    hospitalData.wardAdmissions = [];
    saveData();
    showToast('Daily data reset');
}

function exportData() {
    const payload = { hospitalData, userData };
    console.log('Export data:', payload);
    showToast('Data export printed to console');
}

function showAddDoctorForm() {
    const form = document.getElementById('add-doctor-form');
    if (form) {
        form.style.display = 'block';
    }
}

function cancelAddDoctor() {
    const form = document.getElementById('add-doctor-form');
    const doctorForm = document.getElementById('doctor-form');
    if (doctorForm) doctorForm.reset();
    if (form) form.style.display = 'none';
}

function renderAdminDoctors() {
    const container = document.getElementById('doctors-list-admin');
    if (!container) return;
    container.innerHTML = '';
    if (!hospitalData.doctors.length) {
        container.innerHTML = '<p style="color:#64748b;">No doctors added yet.</p>';
        return;
    }
    hospitalData.doctors.forEach(doctor => {
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
                <div>
                    <h3 style="margin:0 0 6px 0;">${doctor.name}</h3>
                    <p style="margin:0; color:#0f172a; font-weight:600;">${doctor.specialization}</p>
                    <p style="margin:4px 0 0 0; color:#475569;">Fee: ৳${doctor.fee}</p>
                </div>
                <div style="text-align:right; color:#475569;">
                    <p style="margin:0;">📞 ${doctor.phone}</p>
                    <p style="margin:4px 0 0 0;">ID: ${doctor.id}</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderDiagnosticQueues() {
    const container = document.getElementById('diagnostic-queues');
    if (!container) return;
    container.innerHTML = '';
    if (!hospitalData.diagnosticBookings.length) {
        container.innerHTML = '<p style="color:#64748b;">No diagnostic bookings yet.</p>';
        return;
    }
    hospitalData.diagnosticBookings.forEach(booking => {
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <h4 style="margin:0 0 6px 0;">${booking.type}</h4>
            <p style="margin:0; color:#475569;">Patient: ${booking.patientName} (${booking.patientPhone})</p>
            <p style="margin:4px 0 0 0; color:#475569;">Status: ${booking.status || 'pending'}</p>
        `;
        container.appendChild(card);
    });
}

function renderWardRequests() {
    const container = document.getElementById('ward-requests-admin');
    if (!container) return;
    container.innerHTML = '';
    if (!hospitalData.wardAdmissions.length) {
        container.innerHTML = '<p style="color:#64748b;">No ward admissions requested.</p>';
        return;
    }
    hospitalData.wardAdmissions.forEach(request => {
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <h4 style="margin:0 0 6px 0;">${request.ward}</h4>
            <p style="margin:0; color:#475569;">Patient: ${request.patientName}</p>
            <p style="margin:4px 0 0 0; color:#475569;">Status: ${request.status || 'pending'}</p>
        `;
        container.appendChild(card);
    });
}

function renderNoticeBoard() {
    const board = document.getElementById('notice-board');
    if (!board) return;
    if (!hospitalData.alerts.length) {
        board.innerHTML = '<p class="muted">No notices right now.</p>';
        return;
    }
    const sorted = [...hospitalData.alerts].sort((a, b) => new Date(b.time) - new Date(a.time));
    board.innerHTML = '';
    sorted.slice(0, 4).forEach(alert => {
        const card = document.createElement('div');
        card.className = `notice-card notice-${alert.type || 'info'}`;
        const badge = alert.highlight || '🌸';
        card.innerHTML = `
            <div class="notice-header">
                <span class="notice-icon">${badge}</span>
                <div>
                    <p class="notice-title">${alert.title}</p>
                    <p class="notice-time">${formatDateTime(alert.time)}</p>
                </div>
            </div>
            <p class="notice-message">${alert.message}</p>
            ${alert.image ? `<img class="notice-photo" src="${alert.image}" alt="notice image">` : ''}
        `;
        board.appendChild(card);
    });
}

function bookDiagnostic(type) {
    if (!currentUser) {
        showToast('Please login!');
        return;
    }
    selectedDiagnostic = type;
    const info = document.getElementById('selected-diagnostic-info');
    if (info) {
        const price = diagnosticPrices[type] || 1000;
        info.innerHTML = `<p class="muted">Selected: <strong>${type}</strong> • Estimated fee: ৳${price}</p>`;
    }
    document.getElementById('diagnostic-modal').classList.add('active');
}

function requestAdmission(ward) {
    if (!currentUser) {
        showToast('Please login!');
        return;
    }
    selectedWard = ward;
    const info = document.getElementById('selected-ward-info');
    if (info) {
        const price = wardPricing[ward] || 500;
        info.innerHTML = `<p class="muted">Selected: <strong>${ward}</strong> • Rate: ৳${price} / day</p>`;
    }
    document.getElementById('ward-modal').classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function openPaymentFor(type, targetId, amount, description) {
    paymentContext = { type, targetId, amount, description };
    const info = document.getElementById('payment-info');
    if (info) {
        info.innerHTML = `
            <h3 style="margin-bottom:8px;">${description}</h3>
            <p style="margin:0; color:#475569;">Amount payable: <strong>৳${amount}</strong></p>
        `;
    }
    const form = document.getElementById('payment-form');
    if (form) {
        form.reset();
    }
    updatePaymentFields();
    document.getElementById('payment-modal').classList.add('active');
}

function updatePaymentFields() {
    const method = document.getElementById('payment-method')?.value;
    const mobile = document.getElementById('mobile-payment-fields');
    const visa = document.getElementById('visa-fields');
    const savings = document.getElementById('savings-fields');
    [mobile, visa, savings].forEach(section => section && (section.style.display = 'none'));
    if (method === 'bkash' || method === 'nagad') {
        mobile.style.display = 'block';
    } else if (method === 'visa') {
        visa.style.display = 'block';
    } else if (method === 'savings') {
        savings.style.display = 'block';
    }
}
// ============================================
// UTILS
// ============================================

function formatDateTime(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('en-GB');
}

function latestDonationIndex(list) {
    if (!list.length) return -1;
    return list.reduce((bestIdx, item, idx) => {
        const bestDate = new Date(list[bestIdx].date || 0);
        const nextDate = new Date(item.date || 0);
        return nextDate > bestDate ? idx : bestIdx;
    }, 0);
}

function generateToken() {
    return 'T' + Date.now().toString().slice(-6);
}
// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Login
    const loginForm = document.getElementById('unified-login-form');
    if (loginForm) {
        console.log('📝 Login form found - attaching event listener');
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('====================================');
            console.log('🔐 LOGIN ATTEMPT');
            console.log('====================================');
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            console.log('Selected role:', selectedRoleForAuth);
            console.log('Username:', username);
            console.log('Password entered:', password ? 'Yes' : 'No');
            let user = null;
            let authenticated = false;
            if (selectedRoleForAuth === 'admin') {
                console.log('Checking admin credentials...');
                if (username === 'admin' && password === 'admin123') {
                    user = { name: 'Admin' };
                    authenticated = true;
                    console.log('✅ Admin authenticated');
                } else {
                    console.log('❌ Admin credentials wrong');
                }
            } else if (selectedRoleForAuth === 'patient') {
                console.log('Checking patient database...');
                console.log('Total patients:', userData.patients.length);
                user = userData.patients.find(p => p.phone === username);
                if (user) {
                    const passwordOk = !user.password || user.password === password;
                    authenticated = !!passwordOk;
                    if (authenticated && password && !user.password) {
                        user.password = password;
                        saveUserData();
                    }
                    console.log(passwordOk ? '✅ Patient found:' : '❌ Wrong password', user.name);
                } else {
                    console.log('❌ Patient not found');
                }
            } else if (selectedRoleForAuth === 'donor') {
                console.log('Checking donor database...');
                console.log('Total donors:', userData.donors.length);
                user = userData.donors.find(d => d.phone === username);
                if (user) {
                    const passwordOk = !user.password || user.password === password;
                    authenticated = !!passwordOk;
                    if (authenticated && password && !user.password) {
                        user.password = password;
                        saveUserData();
                    }
                    console.log(passwordOk ? '✅ Donor found:' : '❌ Wrong password', user.name);
                } else {
                    console.log('❌ Donor not found');
                }
            } else if (selectedRoleForAuth === 'employee') {
                console.log('Checking employee database...');
                console.log('Total employees:', userData.employees.length);
                user = userData.employees.find(e => e.phone === username);
                if (user) {
                    const passwordOk = !user.password || user.password === password;
                    authenticated = !!passwordOk;
                    if (authenticated && password && !user.password) {
                        user.password = password;
                        saveUserData();
                    }
                    console.log(passwordOk ? "?o. Employee found:" : "??O Wrong password", user.name);
                } else {
                    console.log("??O Employee not found");
                }
            }
            if (authenticated) {
                console.log('✅ Authentication successful!');
                currentUser = user;
                currentRole = selectedRoleForAuth;
                saveSession();
                console.log('Session saved');
                showToast('Welcome ' + user.name + '!');
                updateNavigationForRole();
                console.log('Navigation updated');
                const dash = {
                    'patient': 'patient-dashboard',
                    'donor': 'donor-dashboard',
                    'employee': 'employee-dashboard',
                    'admin': 'admin'
                };
                console.log('Redirecting to:', dash[selectedRoleForAuth]);
                showSection(dash[selectedRoleForAuth]);
                this.reset();
                console.log('====================================');
            } else {
                console.log('❌ Authentication failed');
                showToast('Invalid credentials!');
                console.log('====================================');
            }
        });
    } else {
        console.warn('⚠️ Login form NOT found!');
    }
    // Register
    const registerForm = document.getElementById('unified-register-form');
    if (registerForm) {
        console.log('📝 Register form found - attaching event listener');
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('====================================');
            console.log('📋 REGISTRATION ATTEMPT');
            console.log('====================================');
            const phone = document.getElementById('register-phone').value;
            console.log('Role:', selectedRoleForAuth);
            console.log('Phone:', phone);
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-password-confirm').value;
            if (!password) {
                showToast('Please enter a password.');
                return;
            }
            if (password !== confirmPassword) {
                showToast('Passwords do not match.');
                return;
            }
            const newUser = {
                id: selectedRoleForAuth.charAt(0).toUpperCase() + Date.now(),
                name: document.getElementById('register-name').value,
                photo: '',
                phone: phone,
                age: document.getElementById('register-age').value,
                bloodGroup: document.getElementById('register-blood').value,
                registrationDate: new Date().toISOString(),
                medicalHistory: []
            };
console.log('New user data:', newUser);
            newUser.password = password;
            if (selectedRoleForAuth === 'patient') {
                userData.patients.push(newUser);
                hospitalData.patients.push(newUser);
                console.log('✅ Patient added. Total:', userData.patients.length);
            } else if (selectedRoleForAuth === 'donor') {
                userData.donors.push(newUser);
                console.log('✅ Donor added. Total:', userData.donors.length);
            } else if (selectedRoleForAuth === 'employee') {
                userData.employees.push(newUser);
                console.log('✅ Employee added. Total:', userData.employees.length);
            }
            saveUserData();
            saveData();
            console.log('✅ Data saved to localStorage');
            showToast('Registration successful!');
            this.reset();
            console.log('Redirecting to login in 2 seconds...');
            setTimeout(backToLogin, 2000);
            console.log('====================================');
        });
    } else {
        console.warn('⚠️ Register form NOT found!');
    }
    // Admin - Add doctor
    const doctorForm = document.getElementById('doctor-form');
    if (doctorForm) {
        doctorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('doctor-name').value.trim();
            const specialization = document.getElementById('doctor-specialization').value.trim();
            const phone = document.getElementById('doctor-phone').value.trim();
            const photo = document.getElementById('doctor-photo').value.trim();
            const fee = Number(document.getElementById('doctor-fee').value) || 0;
            if (!name || !specialization || !phone) {
                showToast('Please fill all required doctor fields.');
                return;
            }
            const newDoctor = {
                id: 'D' + String(hospitalData.doctors.length + 1).padStart(3, '0'),
                name,
                specialization,
                phone,
                photo,
                fee
            };
            hospitalData.doctors.push(newDoctor);
            saveData();
            renderAdminDoctors();
            loadPatientDoctors();
            showToast('Doctor added to roster');
            cancelAddDoctor();
        });
    }
    // Profile edit
    const profileForm = document.getElementById('profile-edit-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!currentUser) {
                showToast('Please login first.');
                return;
            }
            const name = document.getElementById('edit-name').value;
            const phone = document.getElementById('edit-phone').value;
            const age = document.getElementById('edit-age').value;
            const bloodGroup = document.getElementById('edit-blood').value;
            const photoInput = document.getElementById('edit-photo');
            const file = photoInput?.files?.[0];
            const applySave = (photoValue) => {
                currentUser.name = name;
                currentUser.photo = photoValue || currentUser.photo || "";
                currentUser.phone = phone;
                currentUser.age = age;
                currentUser.bloodGroup = bloodGroup;
                saveUserData();
                saveData();
                saveSession();
                syncPatientRecord();
                showToast('Profile updated!');
                loadPatientProfile();
                cancelProfileEdit();
            };
            if (file) {
                const readFileAsDataUrl = (f) => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(f);
                });
                try {
                    const dataUrl = await readFileAsDataUrl(file);
                    applySave(dataUrl);
                } catch (err) {
                    console.error('Photo upload failed', err);
                    showToast('Photo upload failed. Saved without updating photo.');
                    applySave(currentUser.photo || "");
                }
            } else {
                applySave("");
            }
        });
    }
    }
    const historyForm = document.getElementById('patient-history-form');
    if (historyForm) {
        historyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!currentUser) return;
            const entry = {
                condition: document.getElementById('history-condition').value,
                date: document.getElementById('history-date').value,
                notes: document.getElementById('history-notes').value,
                loggedAt: new Date().toISOString()
            };
            if (!currentUser.medicalHistory) currentUser.medicalHistory = [];
            currentUser.medicalHistory.push(entry);
            saveUserData();
            syncPatientRecord();
            saveData();
            renderPatientHistory();
            showToast('History saved');
            this.reset();
        });
    }
    const passwordForm = document.getElementById('password-update-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!currentUser) return;
            const current = document.getElementById('current-password').value;
            const next = document.getElementById('new-password').value;
            const confirm = document.getElementById('confirm-password').value;
            if (currentUser.password && currentUser.password !== current) {
                showToast('Current password is incorrect.');
                return;
            }
            if (!next || next !== confirm) {
                showToast('New passwords do not match.');
                return;
            }
            currentUser.password = next;
            saveUserData();
            syncPatientRecord();
            saveData();
            showToast('Password saved for your account');
            this.reset();
        });
    }
    // Appointment form
    const appointmentForm = document.getElementById('appointment-form');
    if (appointmentForm) {
        console.log('📝 Appointment form found');
        appointmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📋 Booking appointment...');
            const date = document.getElementById('appointment-date').value;
            const slot = document.getElementById('appointment-slot').value;
            if (!date || !slot) {
                showToast('Please select date and time slot!');
                return;
            }

    const diagnosticForm = document.getElementById('diagnostic-form');
    if (diagnosticForm) {
        diagnosticForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!currentUser) {
                showToast('Please login first.');
                return;
            }
            if (!selectedDiagnostic) {
                showToast('Please choose a diagnostic test.');
                return;
            }
            const date = document.getElementById('diagnostic-date').value;
            const slot = document.getElementById('diagnostic-slot').value;
            if (!date || !slot) {
                showToast('Select date and slot.');
                return;
            }
            const price = diagnosticPrices[selectedDiagnostic] || 1000;
            const booking = {
                id: 'DIA' + Date.now(),
                patientId: currentUser.id,
                patientName: currentUser.name,
                patientPhone: currentUser.phone,
                type: selectedDiagnostic,
                date,
                slot,
                price,
                paymentStatus: 'due',
                status: 'scheduled',
                createdAt: new Date().toISOString()
            };
            hospitalData.diagnosticBookings.push(booking);
            saveData();
            showToast('Diagnostic booked.');
            closeModal('diagnostic-modal');
            diagnosticForm.reset();
            loadPatientAppointments();
            openPaymentFor('diagnostic', booking.id, price, `${booking.type} booking`);
        });
    }

    const wardForm = document.getElementById('ward-form');
    if (wardForm) {
        wardForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!currentUser) {
                showToast('Please login first.');
                return;
            }
            if (!selectedWard) {
                showToast('Please select a ward.');
                return;
            }
            const reason = document.getElementById('admission-reason').value.trim();
            const emergency = document.getElementById('emergency-status').value;
            const duration = Number(document.getElementById('expected-duration').value) || 1;
            if (!reason) {
                showToast('Please enter a reason.');
                return;
            }
            const price = wardPricing[selectedWard] || 500;
            const request = {
                id: 'WARD' + Date.now(),
                patientId: currentUser.id,
                patientName: currentUser.name,
                patientPhone: currentUser.phone,
                ward: selectedWard,
                reason,
                emergency,
                duration,
                price,
                status: 'pending',
                paymentStatus: 'due',
                createdAt: new Date().toISOString()
            };
            hospitalData.wardAdmissions.push(request);
            saveData();
            showToast('Ward request submitted.');
            closeModal('ward-modal');
            wardForm.reset();
            loadPatientAppointments();
            openPaymentFor('ward', request.id, price, `${request.ward} admission`);
        });
    }

            const bookingsForSlot = hospitalData.appointments.filter(apt =>
                apt.doctorId === selectedDoctor.id &&
                apt.date === date &&
                apt.slot === slot
            ).length;
            if (bookingsForSlot >= MAX_APPOINTMENTS_PER_SLOT) {
                showToast('Selected slot is full. Please choose another time.');
                loadAvailableTimeSlots();
                return;
            }
            const appointment = {
                id: 'APT' + Date.now(),
                patientId: currentUser.id,
                patientName: currentUser.name,
                patientPhone: currentUser.phone,
                doctorId: selectedDoctor.id,
                doctorName: selectedDoctor.name,
                date: date,
                slot: slot,
                fee: selectedDoctor.fee,
                paymentStatus: 'unpaid',
                status: 'scheduled',
                bookingTime: new Date().toISOString(),
                tokenNumber: generateToken()
            };
            hospitalData.appointments.push(appointment);
            saveData();
            console.log('✅ Appointment booked:', appointment.tokenNumber);
            showToast(`Appointment booked! Token: ${appointment.tokenNumber}`);
            loadAvailableTimeSlots();
            closeModal('appointment-modal');
            this.reset();
            openPaymentFor('appointment', appointment.id, appointment.fee, `Consultation with Dr. ${appointment.doctorName}`);
            // Reload appointments if on that tab
            if (document.getElementById('patient-appointments').classList.contains('active')) {
                loadPatientAppointments();
            }
        });
    } else {
        console.warn('⚠️ Appointment form NOT found');
    }
    const donationForm = document.getElementById('donation-form');
    if (donationForm) {
        donationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!currentUser || currentRole !== 'donor') {
                showToast('Please login as a donor first.');
                return;
            }
            const date = document.getElementById('donation-date').value;
            const units = Number(document.getElementById('donation-units').value) || 1;
            const location = document.getElementById('donation-location').value.trim();
            const notes = document.getElementById('donation-notes').value.trim();
            if (!date || units <= 0) {
                showToast('Please pick a date and units.');
                return;
            }
            const donation = {
                id: 'DON' + Date.now(),
                donorId: currentUser.id,
                donorName: currentUser.name,
                bloodGroup: currentUser.bloodGroup || 'N/A',
                units,
                date,
                location: location || 'IbneSina Blood Center',
                notes,
                status: 'Scheduled',
                createdAt: new Date().toISOString()
            };
            ensureDonorRecord();
            currentUser.donations.push(donation);
            const donorIdx = userData.donors.findIndex(d => d.id === currentUser.id);
            if (donorIdx >= 0) {
                userData.donors[donorIdx] = currentUser;
            }
            hospitalData.bloodBank.donations.push(donation);
            if (!hospitalData.bloodBank.stock[donation.bloodGroup]) {
                hospitalData.bloodBank.stock[donation.bloodGroup] = 0;
            }
            hospitalData.bloodBank.stock[donation.bloodGroup] += units;
            saveUserData();
            saveData();
            showToast('Donation booked. Thank you!');
            renderDonorHistory();
            loadDonorProfile();
            renderAdminBloodPanels();
            donationForm.reset();
            updateDonorEligibility();
        });
    }
// ============================================
// INIT
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    console.log('====================================');
    console.log('🚀 HOSPITAL SYSTEM STARTING...');
    console.log('====================================');
    // FORCE: Hide all sections except home initially
    document.querySelectorAll('.section').forEach(section => {
        if (section.id !== 'home') {
            section.style.display = 'none';
        }
    });
    console.log('🔒 All sections hidden except home');
    // EMERGENCY FIX: Hide any stray "Our Doctors" content
    const allH2 = document.querySelectorAll('h2');
    allH2.forEach(h2 => {
        if (h2.textContent.includes('Our Doctors')) {
            console.log('⚠️ Found stray "Our Doctors" - hiding it');
            const parent = h2.closest('.container') || h2.closest('div');
            if (parent) parent.style.display = 'none';
        }
    });
    console.log('Step 1: Loading data...');
    try {
        loadData();
        console.log('✅ Step 1 complete - Data loaded');
        renderNoticeBoard();
    } catch (e) {
        console.error('❌ Step 1 failed:', e);
    }
    console.log('Step 2: Updating navigation...');
    try {
        updateNavigationForRole();
        console.log('✅ Step 2 complete - Navigation updated');
        console.log('   - Current User:', currentUser);
        console.log('   - Current Role:', currentRole);
    } catch (e) {
        console.error('❌ Step 2 failed:', e);
    }
    console.log('Step 3: Showing start section...');
    try {
        const startSection = currentRole ? getDashboardForRole(currentRole) : 'home';
        showSection(startSection);
        console.log('✅ Step 3 complete - Section shown:', startSection);
    } catch (e) {
        console.error('❌ Step 3 failed:', e);
    }
    console.log('Step 4: Setting up event listeners...');
    try {
        setupEventListeners();
        console.log('✅ Step 4 complete - Event listeners ready');
    } catch (e) {
        console.error('❌ Step 4 failed:', e);
    }
    console.log('====================================');
    console.log('✅ SYSTEM READY!');
    console.log('====================================');
});
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Expose functions used by inline HTML handlers to avoid scope issues.
window.showSection = showSection;
window.selectRole = selectRole;
window.showRegisterForm = showRegisterForm;
window.backToRoleSelection = backToRoleSelection;
window.backToLogin = backToLogin;
window.checkAuthAndShow = checkAuthAndShow;
window.logout = logout;
window.logoutAdmin = logoutAdmin;
window.showPatientTab = showPatientTab;
window.toggleProfileEdit = toggleProfileEdit;
window.cancelProfileEdit = cancelProfileEdit;
window.bookDiagnostic = bookDiagnostic;
window.requestAdmission = requestAdmission;
window.showDonorTab = showDonorTab;
window.closeModal = closeModal;
window.showAdminTab = showAdminTab;
window.showAddDoctorForm = showAddDoctorForm;
window.cancelAddDoctor = cancelAddDoctor;
window.resetDailyData = resetDailyData;
window.exportData = exportData;
window.openAppointmentModal = openAppointmentModal;
console.log('✅ Script loaded!');

function loadAvailableTimeSlots() {
    // Build the dropdown of open slots for the selected doctor and date.
    const date = document.getElementById('appointment-date').value;
    const slotSelect = document.getElementById('appointment-slot');
    const info = document.getElementById('slots-info');
    slotSelect.innerHTML = '<option value="">Select Time Slot</option>';
    if (!date || !selectedDoctor) {
        info.textContent = 'Select a date to see available slots';
        info.style.background = '#f0f9ff';
        info.style.color = '#0c4a6e';
        return;
    }
    const timeSlots = [
        '09:00 AM - 09:30 AM',
        '09:30 AM - 10:00 AM',
        '10:00 AM - 10:30 AM',
        '10:30 AM - 11:00 AM',
        '11:00 AM - 11:30 AM',
        '11:30 AM - 12:00 PM',
        '02:00 PM - 02:30 PM',
        '02:30 PM - 03:00 PM',
        '03:00 PM - 03:30 PM',
        '03:30 PM - 04:00 PM',
        '04:00 PM - 04:30 PM',
        '04:30 PM - 05:00 PM'
    ];
    const existingBookings = hospitalData.appointments.filter(apt =>
        apt.doctorId === selectedDoctor.id && apt.date === date
    );
    let availableCount = 0;
    timeSlots.forEach(slot => {
        const bookingsInSlot = existingBookings.filter(apt => apt.slot === slot).length;
        const available = MAX_APPOINTMENTS_PER_SLOT - bookingsInSlot;
        if (available > 0) {
            const option = document.createElement('option');
            option.value = slot;
            option.textContent = `${slot} (${available} slots available)`;
            slotSelect.appendChild(option);
            availableCount++;
        }
    });
    if (availableCount > 0) {
        info.textContent = `✅ ${availableCount} time slots available for ${date}`;
        info.style.background = '#d1fae5';
        info.style.color = '#065f46';
    } else {
        info.textContent = '❌ No slots available for this date';
        info.style.background = '#fee2e2';
        info.style.color = '#991b1b';
    }
}


function openAppointmentModal(doctor) {
    selectedDoctor = doctor;
    const modal = document.getElementById('appointment-modal');
    if (modal) {
        modal.classList.add('active');
    }
    const title = document.getElementById('appointment-doctor-name');
    if (title) title.textContent = doctor?.name || 'Selected Doctor';
    const info = document.getElementById('selected-doctor-info');
    if (info) {
        info.innerHTML = `
            <p style="margin:0;font-weight:600;">${doctor?.name || 'Doctor'}</p>
            <p style="margin:0;color:#475569;">${doctor?.specialization || ''}</p>
            <p style="margin:0;color:#0f172a;">Fee: ৳${doctor?.fee || '-'}</p>
        `;
    }
    const dateInput = document.getElementById('appointment-date');
    if (dateInput && !dateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    loadAvailableTimeSlots();
}
