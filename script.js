
let currentUser = null;
let currentRole = null;
let selectedRoleForAuth = null;

// User databases by role
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

// ============================================
// DATA STORAGE & INITIALIZATION
// ============================================

let hospitalData = {
    patients: [],
    doctors: [],
    appointments: [],
    diagnosticBookings: [],
    wardAdmissions: [],
    queues: {
        doctors: {},
        diagnostics: {}
    },
    bloodBank: {
        stock: {
            'A+': 15,
            'A-': 8,
            'B+': 12,
            'B-': 5,
            'O+': 20,
            'O-': 6,
            'AB+': 10,
            'AB-': 4
        },
        donations: [],
        requests: []
    },
    analytics: {
        totalPatients: 0,
        todayAppointments: 0,
        completedServices: 0,
        averageWaitTime: 0,
        averageServiceTime: 0
    },
    alerts: []
};

// Current logged-in patient
let currentPatient = null;

// Timer intervals
let timerIntervals = {};

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('hospitalData');
    if (saved) {
        hospitalData = JSON.parse(saved);
        initializeTimers();
    } else {
        initializeSampleData();
    }
    
    // Load user data
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
        userData = JSON.parse(savedUserData);
    }
    
    // Restore session
    const savedSession = localStorage.getItem('currentSession');
    if (savedSession) {
        const session = JSON.parse(savedSession);
        currentUser = session.user;
        currentRole = session.role;
        updateNavigationForRole();
    }
}

// Save user data
function saveUserData() {
    localStorage.setItem('userData', JSON.stringify(userData));
}

// Save session
function saveSession() {
    if (currentUser && currentRole) {
        localStorage.setItem('currentSession', JSON.stringify({
            user: currentUser,
            role: currentRole
        }));
    }
}

// Clear session
function clearSession() {
    localStorage.removeItem('currentSession');
    currentUser = null;
    currentRole = null;
}

// ============================================
// ROLE SELECTION & AUTHENTICATION
// ============================================

function selectRole(role) {
    selectedRoleForAuth = role;
    
    // Hide role selection
    document.getElementById('role-selection').style.display = 'none';
    document.getElementById('login-form-section').style.display = 'block';
    
    // Update title
    const titles = {
        'patient': 'Patient Login',
        'donor': 'Blood Donor Login',
        'employee': 'Employee Login',
        'admin': 'Admin Login'
    };
    document.getElementById('login-role-title').textContent = titles[role];
    
    // Show/hide password field
    if (role === 'employee' || role === 'admin') {
        document.getElementById('password-field').style.display = 'block';
        document.getElementById('login-password').required = true;
    } else {
        document.getElementById('password-field').style.display = 'none';
        document.getElementById('login-password').required = false;
    }
    
    // Show/hide register link (admin can't register)
    if (role === 'admin') {
        document.getElementById('register-link').style.display = 'none';
    } else {
        document.getElementById('register-link').style.display = 'block';
    }
}

function backToRoleSelection() {
    document.getElementById('role-selection').style.display = 'block';
    document.getElementById('login-form-section').style.display = 'none';
    document.getElementById('register-form-section').style.display = 'none';
    selectedRoleForAuth = null;
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
    
    // Show/hide fields based on role
    if (selectedRoleForAuth === 'employee') {
        document.getElementById('employee-id-field').style.display = 'block';
        document.getElementById('department-field').style.display = 'block';
        document.getElementById('password-register-field').style.display = 'block';
        document.getElementById('register-employee-id').required = true;
        document.getElementById('register-department').required = true;
        document.getElementById('register-password').required = true;
    } else {
        document.getElementById('employee-id-field').style.display = 'none';
        document.getElementById('department-field').style.display = 'none';
        document.getElementById('password-register-field').style.display = 'none';
        document.getElementById('register-employee-id').required = false;
        document.getElementById('register-department').required = false;
        document.getElementById('register-password').required = false;
    }
}

function backToLogin() {
    document.getElementById('login-form-section').style.display = 'block';
    document.getElementById('register-form-section').style.display = 'none';
}

// Unified Login Handler
document.getElementById('unified-login-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    let user = null;
    let authenticated = false;
    
    if (selectedRoleForAuth === 'admin') {
        // Admin login
        if (username === adminCredentials.username && password === adminCredentials.password) {
            user = { username: 'admin', role: 'admin' };
            authenticated = true;
        }
    } else if (selectedRoleForAuth === 'employee') {
        // Employee login (phone + password)
        const employee = userData.employees.find(e => e.phone === username && e.password === password);
        if (employee) {
            user = employee;
            authenticated = true;
        }
    } else if (selectedRoleForAuth === 'patient') {
        // Patient login (phone only)
        const patient = userData.patients.find(p => p.phone === username);
        if (patient) {
            user = patient;
            authenticated = true;
        }
    } else if (selectedRoleForAuth === 'donor') {
        // Donor login (phone only)
        const donor = userData.donors.find(d => d.phone === username);
        if (donor) {
            user = donor;
            authenticated = true;
        }
    }
    
    if (authenticated) {
        currentUser = user;
        currentRole = selectedRoleForAuth;
        saveSession();
        
        showToast(`Welcome ${user.name || 'Admin'}!`);
        updateNavigationForRole();
        
        // Redirect to appropriate dashboard
        const dashboards = {
            'patient': 'patient-dashboard',
            'donor': 'donor-dashboard',
            'employee': 'employee-dashboard',
            'admin': 'admin'
        };
        showSection(dashboards[selectedRoleForAuth]);
        
        this.reset();
    } else {
        const statusDiv = document.getElementById('auth-status');
        statusDiv.className = 'status-message error';
        statusDiv.textContent = '❌ Invalid credentials!';
        statusDiv.style.display = 'block';
    }
});

// Unified Register Handler
document.getElementById('unified-register-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const phone = document.getElementById('register-phone').value;
    
    // Check if phone exists
    let exists = false;
    if (selectedRoleForAuth === 'patient') {
        exists = userData.patients.find(p => p.phone === phone);
    } else if (selectedRoleForAuth === 'donor') {
        exists = userData.donors.find(d => d.phone === phone);
    } else if (selectedRoleForAuth === 'employee') {
        exists = userData.employees.find(e => e.phone === phone);
    }
    
    if (exists) {
        const statusDiv = document.getElementById('auth-status');
        statusDiv.className = 'status-message error';
        statusDiv.textContent = 'Phone number already registered!';
        statusDiv.style.display = 'block';
        return;
    }
    
    const newUser = {
        id: selectedRoleForAuth.charAt(0).toUpperCase() + Date.now(),
        name: document.getElementById('register-name').value,
        phone: phone,
        age: document.getElementById('register-age').value,
        bloodGroup: document.getElementById('register-blood').value,
        registrationDate: new Date().toISOString()
    };
    
    if (selectedRoleForAuth === 'employee') {
        newUser.employeeId = document.getElementById('register-employee-id').value;
        newUser.department = document.getElementById('register-department').value;
        newUser.password = document.getElementById('register-password').value;
    }
    
    // Add to appropriate database
    if (selectedRoleForAuth === 'patient') {
        userData.patients.push(newUser);
        hospitalData.patients.push(newUser); // Also add to main patients array
    } else if (selectedRoleForAuth === 'donor') {
        userData.donors.push(newUser);
    } else if (selectedRoleForAuth === 'employee') {
        userData.employees.push(newUser);
    }
    
    saveUserData();
    saveData();
    
    const statusDiv = document.getElementById('auth-status');
    statusDiv.className = 'status-message success';
    statusDiv.textContent = `✓ Registration successful! Your ID: ${newUser.id}`;
    statusDiv.style.display = 'block';
    
    showToast('Registration successful! Please login.');
    
    this.reset();
    setTimeout(() => {
        backToLogin();
    }, 2000);
});

// Update navigation based on role
function updateNavigationForRole() {
    // Hide all role buttons
    document.getElementById('patient-nav').style.display = 'none';
    document.getElementById('donor-nav').style.display = 'none';
    document.getElementById('employee-nav').style.display = 'none';
    document.getElementById('admin-nav').style.display = 'none';
    
    if (currentRole) {
        // Show login button, hide logout
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'block';
        
        // Show appropriate role button
        const navButtons = {
            'patient': 'patient-nav',
            'donor': 'donor-nav',
            'employee': 'employee-nav',
            'admin': 'admin-nav'
        };
        document.getElementById(navButtons[currentRole]).style.display = 'block';
    } else {
        // Show login button, hide logout
        document.getElementById('login-btn').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'none';
    }
}

// Check authentication before showing sections
function checkAuthAndShow(sectionId) {
    const requiredRoles = {
        'patient-dashboard': 'patient',
        'donor-dashboard': 'donor',
        'employee-dashboard': 'employee',
        'admin-dashboard': 'admin',
        'admin': 'admin'
    };
    
    const required = requiredRoles[sectionId];
    
    if (!currentUser || currentRole !== required) {
        showToast('Please login to access this section!');
        showSection('login');
        return;
    }
    
    showSection(sectionId);
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        clearSession();
        currentUser = null;
        currentRole = null;
        updateNavigationForRole();
        showToast('Logged out successfully');
        showSection('home');
    }
}

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('hospitalData');
    if (saved) {
        hospitalData = JSON.parse(saved);
        initializeTimers();
    } else {
        // Initialize with sample doctors
        initializeSampleData();
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('hospitalData', JSON.stringify(hospitalData));
}

// Initialize sample doctors
function initializeSampleData() {
    hospitalData.doctors = [
        {
            id: 'D001',
            name: 'Dr. Ahmed Khan',
            specialization: 'Cardiologist',
            phone: '01711-123456',
            photo: '',
            fee: 800
        },
        {
            id: 'D002',
            name: 'Dr. Fatima Rahman',
            specialization: 'Pediatrician',
            phone: '01811-234567',
            photo: '',
            fee: 600
        },
        {
            id: 'D003',
            name: 'Dr. Karim Hossain',
            specialization: 'Neurologist',
            phone: '01911-345678',
            photo: '',
            fee: 1000
        },
        {
            id: 'D004',
            name: 'Dr. Nadia Islam',
            specialization: 'Gynecologist',
            phone: '01611-456789',
            photo: '',
            fee: 700
        },
        {
            id: 'D005',
            name: 'Dr. Mahmud Ali',
            specialization: 'Orthopedic',
            phone: '01511-567890',
            photo: '',
            fee: 900
        }
    ];

    // Initialize queues for each doctor
    hospitalData.doctors.forEach(doctor => {
        hospitalData.queues.doctors[doctor.id] = [];
    });

    // Initialize diagnostic queues
    const diagnosticTypes = ['Blood Test', 'X-Ray', 'ECG', 'MRI', 'Ultrasound', 'CT Scan'];
    diagnosticTypes.forEach(type => {
        hospitalData.queues.diagnostics[type] = [];
    });

    saveData();
}

// ============================================
// UI NAVIGATION
// ============================================

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Load section-specific data
    if (sectionId === 'patient-dashboard') {
        loadPatientDashboard();
    } else if (sectionId === 'donor-dashboard') {
        loadDonorDashboard();
    } else if (sectionId === 'employee-dashboard') {
        loadEmployeeDashboard();
    } else if (sectionId === 'admin') {
        loadAdminDashboard();
    }
}

// Patient Dashboard Functions
function showPatientTab(tabId) {
    document.querySelectorAll('#patient-dashboard .dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('#patient-dashboard .sub-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
    
    if (tabId === 'patient-profile') {
        loadPatientProfile();
    } else if (tabId === 'patient-doctors') {
        loadPatientDoctors();
    } else if (tabId === 'patient-appointments') {
        loadPatientAppointments();
    }
}

function loadPatientDashboard() {
    if (!currentUser || currentRole !== 'patient') return;
    loadPatientProfile();
}

function loadPatientProfile() {
    if (!currentUser) return;
    
    // Display mode
    document.getElementById('patient-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('patient-name-display').textContent = currentUser.name;
    document.getElementById('patient-id-display').textContent = `ID: ${currentUser.id}`;
    document.getElementById('view-phone').textContent = currentUser.phone;
    document.getElementById('view-age').textContent = `${currentUser.age} years`;
    document.getElementById('view-blood').textContent = currentUser.bloodGroup || 'Not specified';
    document.getElementById('view-registered').textContent = formatDateTime(currentUser.registrationDate);
}

function toggleProfileEdit() {
    const viewMode = document.getElementById('profile-view-mode');
    const editMode = document.getElementById('profile-edit-mode');
    const editBtn = document.getElementById('edit-profile-btn');
    
    if (editMode.style.display === 'none') {
        // Switch to edit mode
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
        editBtn.textContent = '❌ Cancel';
        
        // Fill form with current data
        document.getElementById('edit-name').value = currentUser.name;
        document.getElementById('edit-phone').value = currentUser.phone;
        document.getElementById('edit-age').value = currentUser.age;
        document.getElementById('edit-blood').value = currentUser.bloodGroup || '';
    } else {
        // Switch to view mode
        cancelProfileEdit();
    }
}

function cancelProfileEdit() {
    document.getElementById('profile-view-mode').style.display = 'grid';
    document.getElementById('profile-edit-mode').style.display = 'none';
    document.getElementById('edit-profile-btn').textContent = '✏️ Edit Profile';
}

document.getElementById('profile-edit-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Update user data
    currentUser.name = document.getElementById('edit-name').value;
    currentUser.phone = document.getElementById('edit-phone').value;
    currentUser.age = document.getElementById('edit-age').value;
    currentUser.bloodGroup = document.getElementById('edit-blood').value;
    
    // Update in databases
    if (currentRole === 'patient') {
        const index = userData.patients.findIndex(p => p.id === currentUser.id);
        if (index !== -1) {
            userData.patients[index] = currentUser;
        }
        const mainIndex = hospitalData.patients.findIndex(p => p.id === currentUser.id);
        if (mainIndex !== -1) {
            hospitalData.patients[mainIndex] = currentUser;
        }
    }
    
    saveUserData();
    saveData();
    saveSession();
    
    showToast('Profile updated successfully!');
    loadPatientProfile();
    cancelProfileEdit();
});

function loadPatientDoctors() {
    const grid = document.getElementById('patient-doctors-grid');
    grid.innerHTML = '';

    hospitalData.doctors.forEach(doctor => {
        const card = document.createElement('div');
        card.className = 'doctor-card';
        card.onclick = () => openAppointmentModal(doctor);

        card.innerHTML = `
            <div class="doctor-photo">
                ${doctor.photo ? `<img src="${doctor.photo}" alt="${doctor.name}">` : '👨‍⚕️'}
            </div>
            <div class="doctor-info">
                <h3>${doctor.name}</h3>
                <p class="doctor-specialization">${doctor.specialization}</p>
                <p class="doctor-contact">📞 ${doctor.phone}</p>
                <p class="doctor-fee">Fee: ৳${doctor.fee}</p>
                <button class="btn btn-primary" style="width: 100%; margin-top: 10px;">
                    Book Appointment
                </button>
            </div>
        `;

        grid.appendChild(card);
    });
}

function loadPatientAppointments() {
    // Load appointments
    const aptList = document.getElementById('patient-appointments-list');
    const myAppointments = hospitalData.appointments.filter(apt => apt.patientId === currentUser.id);

    if (myAppointments.length === 0) {
        aptList.innerHTML = '<p style="color: #64748b;">No appointments yet.</p>';
    } else {
        aptList.innerHTML = '';
        myAppointments.forEach(apt => {
            const item = document.createElement('div');
            item.className = 'profile-item';
            item.innerHTML = `
                <h4>Dr. ${apt.doctorName}</h4>
                <p><strong>Date:</strong> ${apt.date} | <strong>Time:</strong> ${apt.slot}</p>
                <p><strong>Token:</strong> ${apt.tokenNumber}</p>
                <span class="status-badge ${apt.status}">${apt.status.toUpperCase()}</span>
            `;
            aptList.appendChild(item);
        });
    }
    
    // Load diagnostics
    const diagList = document.getElementById('patient-diagnostics-list');
    const myDiagnostics = hospitalData.diagnosticBookings.filter(d => d.patientId === currentUser.id);

    if (myDiagnostics.length === 0) {
        diagList.innerHTML = '<p style="color: #64748b;">No diagnostic tests booked.</p>';
    } else {
        diagList.innerHTML = '';
        myDiagnostics.forEach(diag => {
            const item = document.createElement('div');
            item.className = 'profile-item';
            item.innerHTML = `
                <h4>${diag.testType}</h4>
                <p><strong>Date:</strong> ${diag.date} | <strong>Time:</strong> ${diag.slot}</p>
                <p><strong>Token:</strong> ${diag.tokenNumber}</p>
                <span class="status-badge ${diag.status}">${diag.status.toUpperCase()}</span>
            `;
            diagList.appendChild(item);
        });
    }
    
    // Load admissions
    const admList = document.getElementById('patient-admissions-list');
    const myAdmissions = hospitalData.wardAdmissions.filter(a => a.patientId === currentUser.id);

    if (myAdmissions.length === 0) {
        admList.innerHTML = '<p style="color: #64748b;">No ward admission requests.</p>';
    } else {
        admList.innerHTML = '';
        myAdmissions.forEach(adm => {
            const item = document.createElement('div');
            item.className = 'profile-item';
            item.innerHTML = `
                <h4>🏥 ${adm.wardType} Ward</h4>
                <p><strong>Reason:</strong> ${adm.reason}</p>
                <p><strong>Duration:</strong> ${adm.duration} days</p>
                <span class="admission-badge ${adm.status}">${adm.status.toUpperCase()}</span>
            `;
            admList.appendChild(item);
        });
    }
}

// Donor Dashboard Functions
function showDonorTab(tabId) {
    document.querySelectorAll('#donor-dashboard .dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('#donor-dashboard .sub-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
    
    if (tabId === 'donor-profile') {
        loadDonorProfile();
    } else if (tabId === 'donor-blood-bank') {
        loadDonorBloodBank();
    } else if (tabId === 'donor-history') {
        loadDonorHistory();
    }
}

function loadDonorDashboard() {
    if (!currentUser || currentRole !== 'donor') return;
    loadDonorProfile();
}

function loadDonorProfile() {
    if (!currentUser) return;
    
    // Display mode
    document.getElementById('donor-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('donor-name-display').textContent = currentUser.name;
    document.getElementById('donor-id-display').textContent = `ID: ${currentUser.id}`;
    document.getElementById('donor-view-phone').textContent = currentUser.phone;
    document.getElementById('donor-view-age').textContent = `${currentUser.age} years`;
    document.getElementById('donor-view-blood').textContent = currentUser.bloodGroup || 'Not specified';
    document.getElementById('donor-view-registered').textContent = formatDateTime(currentUser.registrationDate);
}

function toggleDonorProfileEdit() {
    const viewMode = document.getElementById('donor-profile-view-mode');
    const editMode = document.getElementById('donor-profile-edit-mode');
    const editBtn = document.getElementById('edit-donor-profile-btn');
    
    if (editMode.style.display === 'none') {
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
        editBtn.textContent = '❌ Cancel';
        
        document.getElementById('donor-edit-name').value = currentUser.name;
        document.getElementById('donor-edit-phone').value = currentUser.phone;
        document.getElementById('donor-edit-age').value = currentUser.age;
        document.getElementById('donor-edit-blood').value = currentUser.bloodGroup || '';
    } else {
        cancelDonorProfileEdit();
    }
}

function cancelDonorProfileEdit() {
    document.getElementById('donor-profile-view-mode').style.display = 'grid';
    document.getElementById('donor-profile-edit-mode').style.display = 'none';
    document.getElementById('edit-donor-profile-btn').textContent = '✏️ Edit Profile';
}

document.getElementById('donor-profile-edit-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    currentUser.name = document.getElementById('donor-edit-name').value;
    currentUser.phone = document.getElementById('donor-edit-phone').value;
    currentUser.age = document.getElementById('donor-edit-age').value;
    currentUser.bloodGroup = document.getElementById('donor-edit-blood').value;
    
    const index = userData.donors.findIndex(d => d.id === currentUser.id);
    if (index !== -1) {
        userData.donors[index] = currentUser;
    }
    
    saveUserData();
    saveSession();
    
    showToast('Profile updated successfully!');
    loadDonorProfile();
    cancelDonorProfileEdit();
});

function loadDonorBloodBank() {
    // Load blood stock
    const container = document.getElementById('donor-blood-stock');
    container.innerHTML = '';

    Object.keys(hospitalData.bloodBank.stock).forEach(bloodGroup => {
        const units = hospitalData.bloodBank.stock[bloodGroup];
        const card = document.createElement('div');
        
        let statusClass = '';
        let statusText = 'Available';
        
        if (units === 0) {
            statusClass = 'out-of-stock';
            statusText = 'Out of Stock';
        } else if (units < 5) {
            statusClass = 'low-stock';
            statusText = 'Low Stock';
        }
        
        card.className = `blood-group-card ${statusClass}`;
        card.innerHTML = `
            <div class="blood-group-label">${bloodGroup}</div>
            <div class="blood-stock-count">${units} Units</div>
            <div class="blood-stock-status">${statusText}</div>
        `;
        
        container.appendChild(card);
    });
    
    // Load blood requests
    loadBloodRequestsForDonor();
}

function loadBloodRequestsForDonor() {
    const container = document.getElementById('donor-blood-requests');
    
    const pendingRequests = hospitalData.bloodBank.requests.filter(r => r.status === 'pending');
    
    if (pendingRequests.length === 0) {
        container.innerHTML = '<p>No pending blood requests.</p>';
        return;
    }

    container.innerHTML = '';
    pendingRequests.forEach(request => {
        const item = document.createElement('div');
        item.className = 'blood-request-item urgent';
        
        const deadline = new Date(request.deadline);
        const isUrgent = (deadline - new Date()) < (24 * 60 * 60 * 1000);
        
        item.innerHTML = `
            <h4>🚨 ${request.bloodGroup} - ${request.units} Unit(s) Needed</h4>
            <p><strong>Patient:</strong> ${request.patientName}</p>
            <p><strong>Reason:</strong> ${request.reason}</p>
            <p><strong>Contact:</strong> ${request.contact}</p>
            <p><strong>Required By:</strong> ${formatDateTime(request.deadline)}</p>
            ${isUrgent ? '<span class="blood-badge" style="background: #fee2e2; color: #991b1b;">⚠️ URGENT</span>' : ''}
            <span class="blood-badge pending">Pending</span>
        `;
        container.appendChild(item);
    });
}

function loadDonorHistory() {
    const container = document.getElementById('donor-donations-list');
    const myDonations = hospitalData.bloodBank.donations.filter(d => d.donorId === currentUser.id);

    if (myDonations.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">No donations yet. Be a hero - donate blood!</p>';
        return;
    }

    container.innerHTML = '';
    myDonations.forEach(donation => {
        const item = document.createElement('div');
        item.className = 'profile-item';
        item.innerHTML = `
            <h4>🩸 Blood Group: ${donation.bloodGroup}</h4>
            <p><strong>Units Donated:</strong> ${donation.units}</p>
            <p><strong>Date:</strong> ${formatDateTime(donation.donationDate)}</p>
            <span class="blood-badge donated">✓ Donated Successfully</span>
        `;
        container.appendChild(item);
    });
}

// Donor Dashboard Functions (continued)

// Employee Dashboard Functions
function showEmployeeTab(tabId) {
    document.querySelectorAll('#employee-dashboard .dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('#employee-dashboard .sub-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

function loadEmployeeDashboard() {
    if (!currentUser || currentRole !== 'employee') return;
    loadEmployeeProfile();
}

function loadEmployeeProfile() {
    const content = document.getElementById('employee-profile-content');
    content.innerHTML = `
        <div class="profile-details">
            <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${currentUser.name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Employee ID:</span>
                <span class="detail-value">${currentUser.employeeId}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Department:</span>
                <span class="detail-value">${currentUser.department}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${currentUser.phone}</span>
            </div>
        </div>
    `;
}

// Admin Dashboard Function
function loadAdminDashboard() {
    showAdminTab('doctors-mgmt');
    updateAnalytics();
}

function showSection(sectionId) {
    // Check if trying to access admin without login
    if (sectionId === 'admin' && !isAdminLoggedIn) {
        showToast('Please login as admin first!');
        showAdminLogin();
        return;
    }

    // Check if trying to access profile without login
    if (sectionId === 'my-profile' && !currentPatient) {
        showToast('Please login first to view your profile!');
        showSection('patient-register');
        return;
    }

    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');

    // Load section-specific data
    if (sectionId === 'doctors') {
        loadDoctorsGrid();
    } else if (sectionId === 'wards') {
        loadAdmissionRequests();
    } else if (sectionId === 'blood-bank') {
        loadBloodStock();
        loadBloodRequests();
    } else if (sectionId === 'my-profile') {
        loadMyProfile();
    } else if (sectionId === 'admin') {
        showAdminTab('doctors-mgmt');
        updateAnalytics();
    }
}

// ============================================
// MY PROFILE SECTION
// ============================================

function loadMyProfile() {
    if (!currentPatient) return;

    // Load profile info
    document.getElementById('profile-avatar-text').textContent = currentPatient.name.charAt(0).toUpperCase();
    document.getElementById('profile-name').textContent = currentPatient.name;
    document.getElementById('profile-id').textContent = `Patient ID: ${currentPatient.id}`;
    document.getElementById('profile-blood').textContent = `Blood Group: ${currentPatient.bloodGroup || 'Not specified'}`;
    document.getElementById('profile-phone').textContent = currentPatient.phone;
    document.getElementById('profile-age').textContent = `${currentPatient.age} years`;
    document.getElementById('profile-registered').textContent = formatDateTime(currentPatient.registrationDate);

    // Load my appointments
    loadMyAppointments();
    
    // Load my diagnostics
    loadMyDiagnostics();
    
    // Load my donations
    loadMyDonations();
    
    // Load my admissions
    loadMyAdmissions();
}

function loadMyAppointments() {
    const container = document.getElementById('my-appointments-list');
    const myAppointments = hospitalData.appointments.filter(apt => apt.patientId === currentPatient.id);

    if (myAppointments.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">No appointments yet.</p>';
        return;
    }

    container.innerHTML = '';
    myAppointments.forEach(apt => {
        const item = document.createElement('div');
        item.className = 'profile-item';
        item.innerHTML = `
            <h4>Dr. ${apt.doctorName}</h4>
            <p><strong>Date:</strong> ${apt.date}</p>
            <p><strong>Time:</strong> ${apt.slot}</p>
            <p><strong>Token:</strong> ${apt.tokenNumber}</p>
            <p><strong>Fee:</strong> ৳${apt.fee || 0}</p>
            <span class="status-badge ${apt.paymentStatus === 'paid' ? 'normal' : 'pending'}">
                ${apt.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Payment Pending'}
            </span>
            <span class="status-badge ${apt.status}">${apt.status.toUpperCase()}</span>
        `;
        container.appendChild(item);
    });
}

function loadMyDiagnostics() {
    const container = document.getElementById('my-diagnostics-list');
    const myDiagnostics = hospitalData.diagnosticBookings.filter(diag => diag.patientId === currentPatient.id);

    if (myDiagnostics.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">No diagnostic tests booked yet.</p>';
        return;
    }

    container.innerHTML = '';
    myDiagnostics.forEach(diag => {
        const item = document.createElement('div');
        item.className = 'profile-item';
        item.innerHTML = `
            <h4>${diag.testType}</h4>
            <p><strong>Date:</strong> ${diag.date}</p>
            <p><strong>Time:</strong> ${diag.slot}</p>
            <p><strong>Token:</strong> ${diag.tokenNumber}</p>
            <span class="status-badge ${diag.status}">${diag.status.toUpperCase()}</span>
        `;
        container.appendChild(item);
    });
}

function loadMyDonations() {
    const container = document.getElementById('my-donations-list');
    const myDonations = hospitalData.bloodBank.donations.filter(don => don.donorId === currentPatient.id);

    if (myDonations.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">No blood donations yet. Be a hero - donate blood!</p>';
        return;
    }

    container.innerHTML = '';
    myDonations.forEach(don => {
        const item = document.createElement('div');
        item.className = 'profile-item';
        item.innerHTML = `
            <h4>🩸 Blood Group: ${don.bloodGroup}</h4>
            <p><strong>Units Donated:</strong> ${don.units}</p>
            <p><strong>Date:</strong> ${formatDateTime(don.donationDate)}</p>
            <span class="blood-badge donated">✓ Donated Successfully</span>
        `;
        container.appendChild(item);
    });
}

function loadMyAdmissions() {
    const container = document.getElementById('my-admissions-list');
    const myAdmissions = hospitalData.wardAdmissions.filter(adm => adm.patientId === currentPatient.id);

    if (myAdmissions.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">No ward admission requests.</p>';
        return;
    }

    container.innerHTML = '';
    myAdmissions.forEach(adm => {
        const item = document.createElement('div');
        item.className = 'profile-item';
        item.innerHTML = `
            <h4>🏥 ${adm.wardType} Ward</h4>
            <p><strong>Reason:</strong> ${adm.reason}</p>
            <p><strong>Duration:</strong> ${adm.duration} days</p>
            <p><strong>Request Date:</strong> ${formatDateTime(adm.requestTime)}</p>
            ${adm.emergency ? '<span class="admission-badge" style="background: #fee2e2; color: #991b1b;">🚨 EMERGENCY</span>' : ''}
            <span class="admission-badge ${adm.status}">${adm.status.toUpperCase()}</span>
        `;
        container.appendChild(item);
    });
}

function showSection(sectionId) {
    // Check if trying to access admin without login
    if (sectionId === 'admin' && !isAdminLoggedIn) {
        showToast('Please login as admin first!');
        showAdminLogin();
        return;
    }

    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');

    // Load section-specific data
    if (sectionId === 'doctors') {
        loadDoctorsGrid();
    } else if (sectionId === 'wards') {
        loadAdmissionRequests();
    } else if (sectionId === 'blood-bank') {
        loadBloodStock();
        loadDonationHistory();
        loadBloodRequests();
    } else if (sectionId === 'admin') {
        showAdminTab('doctors-mgmt');
        updateAnalytics();
    }
}

function showAdminTab(tabId) {
    // Check admin authentication
    if (!isAdminLoggedIn) {
        showToast('Unauthorized! Please login as admin.');
        showAdminLogin();
        return;
    }

    // Hide all tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');

    // Load tab-specific data
    if (tabId === 'doctors-mgmt') {
        loadDoctorsListAdmin();
    } else if (tabId === 'diagnostics-mgmt') {
        loadDiagnosticQueues();
    } else if (tabId === 'blood-mgmt') {
        loadAdminBloodBank();
    } else if (tabId === 'wards-mgmt') {
        loadWardRequestsAdmin();
    } else if (tabId === 'queues') {
        loadDoctorQueues();
    } else if (tabId === 'analytics') {
        updateAnalytics();
    }
}

// ============================================
// ADMIN - BLOOD BANK MANAGEMENT
// ============================================

function loadAdminBloodBank() {
    // Load blood stock
    const stockContainer = document.getElementById('admin-blood-stock');
    stockContainer.innerHTML = '';

    Object.keys(hospitalData.bloodBank.stock).forEach(bloodGroup => {
        const units = hospitalData.bloodBank.stock[bloodGroup];
        const card = document.createElement('div');
        
        let statusClass = '';
        let statusText = 'Available';
        
        if (units === 0) {
            statusClass = 'out-of-stock';
            statusText = 'Out of Stock';
        } else if (units < 5) {
            statusClass = 'low-stock';
            statusText = 'Low Stock';
        }
        
        card.className = `blood-group-card ${statusClass}`;
        card.innerHTML = `
            <div class="blood-group-label">${bloodGroup}</div>
            <div class="blood-stock-count">${units} Units</div>
            <div class="blood-stock-status">${statusText}</div>
        `;
        
        stockContainer.appendChild(card);
    });

    // Load all donations
    const donationsContainer = document.getElementById('admin-all-donations');
    
    if (hospitalData.bloodBank.donations.length === 0) {
        donationsContainer.innerHTML = '<p>No donations yet.</p>';
    } else {
        donationsContainer.innerHTML = '';
        
        // Show recent 10 donations
        const recentDonations = hospitalData.bloodBank.donations.slice(-10).reverse();
        
        recentDonations.forEach(don => {
            const item = document.createElement('div');
            item.className = 'donation-item';
            item.innerHTML = `
                <h4>Donor: ${don.donorName}</h4>
                <p><strong>Blood Group:</strong> ${don.bloodGroup} | <strong>Units:</strong> ${don.units}</p>
                <p><strong>Phone:</strong> ${don.donorPhone}</p>
                <p><strong>Date:</strong> ${formatDateTime(don.donationDate)}</p>
                <span class="blood-badge donated">✓ Completed</span>
            `;
            donationsContainer.appendChild(item);
        });
        
        if (hospitalData.bloodBank.donations.length > 10) {
            const moreInfo = document.createElement('p');
            moreInfo.style.textAlign = 'center';
            moreInfo.style.color = '#64748b';
            moreInfo.style.marginTop = '15px';
            moreInfo.textContent = `Showing recent 10 of ${hospitalData.bloodBank.donations.length} total donations`;
            donationsContainer.appendChild(moreInfo);
        }
    }

    // Load blood requests
    const requestsContainer = document.getElementById('admin-blood-requests');
    
    const pendingRequests = hospitalData.bloodBank.requests.filter(r => r.status === 'pending');
    
    if (pendingRequests.length === 0) {
        requestsContainer.innerHTML = '<p>No pending blood requests.</p>';
    } else {
        requestsContainer.innerHTML = '';
        
        pendingRequests.forEach(req => {
            const item = document.createElement('div');
            item.className = 'blood-request-item urgent';
            
            const deadline = new Date(req.deadline);
            const isUrgent = (deadline - new Date()) < (24 * 60 * 60 * 1000);
            
            const available = hospitalData.bloodBank.stock[req.bloodGroup] || 0;
            const canFulfill = available >= req.units;
            
            item.innerHTML = `
                <h4>🚨 ${req.bloodGroup} - ${req.units} Unit(s) Needed</h4>
                <p><strong>Patient:</strong> ${req.patientName}</p>
                <p><strong>Requester:</strong> ${req.requesterName} (${req.contact})</p>
                <p><strong>Reason:</strong> ${req.reason}</p>
                <p><strong>Required By:</strong> ${formatDateTime(req.deadline)}</p>
                <p><strong>Available Stock:</strong> ${available} units ${canFulfill ? '✓' : '❌'}</p>
                ${isUrgent ? '<span class="blood-badge" style="background: #fee2e2; color: #991b1b;">⚠️ URGENT</span>' : ''}
                <span class="blood-badge pending">Pending</span>
                ${canFulfill ? `
                    <div style="margin-top: 15px; display: flex; gap: 10px;">
                        <button class="btn btn-primary btn-small" onclick="fulfillBloodRequest('${req.id}')">Fulfill Request</button>
                        <button class="btn btn-danger btn-small" onclick="rejectBloodRequest('${req.id}')">Reject</button>
                    </div>
                ` : '<p style="color: #ef4444; margin-top: 10px;"><strong>⚠️ Insufficient stock!</strong></p>'}
            `;
            requestsContainer.appendChild(item);
        });
    }
}

function fulfillBloodRequest(requestId) {
    if (!isAdminLoggedIn) {
        showToast('Unauthorized! Admin access only.');
        return;
    }

    const request = hospitalData.bloodBank.requests.find(r => r.id === requestId);
    if (!request) return;

    // Check stock again
    if (hospitalData.bloodBank.stock[request.bloodGroup] < request.units) {
        showToast('Insufficient blood stock!');
        return;
    }

    if (confirm(`Fulfill blood request?\n\nBlood Group: ${request.bloodGroup}\nUnits: ${request.units}\nPatient: ${request.patientName}`)) {
        // Deduct from stock
        hospitalData.bloodBank.stock[request.bloodGroup] -= request.units;
        
        // Update request status
        request.status = 'fulfilled';
        request.fulfilledDate = new Date().toISOString();
        
        saveData();
        showToast('Blood request fulfilled successfully!');
        loadAdminBloodBank();
        
        addAlert('success', `✓ Blood request fulfilled: ${request.units} unit(s) ${request.bloodGroup} for ${request.patientName}`);
    }
}

function rejectBloodRequest(requestId) {
    if (!isAdminLoggedIn) {
        showToast('Unauthorized! Admin access only.');
        return;
    }

    const request = hospitalData.bloodBank.requests.find(r => r.id === requestId);
    if (!request) return;

    if (confirm(`Reject blood request for ${request.patientName}?`)) {
        request.status = 'rejected';
        request.rejectedDate = new Date().toISOString();
        
        saveData();
        showToast('Blood request rejected.');
        loadAdminBloodBank();
        
        addAlert('info', `Blood request rejected for ${request.patientName}`);
    }
}

function showAdminTab(tabId) {
    // Check admin authentication
    if (!isAdminLoggedIn) {
        showToast('Unauthorized! Please login as admin.');
        showAdminLogin();
        return;
    }

    // Hide all tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');

    // Load tab-specific data
    if (tabId === 'doctors-mgmt') {
        loadDoctorsListAdmin();
    } else if (tabId === 'diagnostics-mgmt') {
        loadDiagnosticQueues();
    } else if (tabId === 'wards-mgmt') {
        loadWardRequestsAdmin();
    } else if (tabId === 'queues') {
        loadDoctorQueues();
    } else if (tabId === 'analytics') {
        updateAnalytics();
    }
}

// ============================================
// PATIENT REGISTRATION & LOGIN
// ============================================

function showPatientAuth() {
    if (currentPatient) {
        // Already logged in - show profile or logout
        if (confirm(`Logged in as: ${currentPatient.name}\n\nDo you want to logout?`)) {
            logoutPatient();
        }
    } else {
        showSection('patient-register');
    }
}

function updatePatientAuthButton() {
    const btn = document.getElementById('patient-auth-btn');
    const profileBtn = document.getElementById('profile-btn');
    
    if (currentPatient) {
        btn.textContent = `👤 ${currentPatient.name}`;
        btn.style.background = '#10b981';
        btn.style.color = 'white';
        profileBtn.style.display = 'block'; // Show profile button
    } else {
        btn.textContent = 'Login / Register';
        btn.style.background = '';
        btn.style.color = '';
        profileBtn.style.display = 'none'; // Hide profile button
    }
}

function logoutPatient() {
    currentPatient = null;
    localStorage.removeItem('currentPatient');
    updatePatientAuthButton();
    showToast('Logged out successfully');
    showSection('patient-home');
}

function showLoginForm() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('registration-section').style.display = 'none';
    document.getElementById('registration-status').style.display = 'none';
}

function showRegistrationForm() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('registration-section').style.display = 'block';
    document.getElementById('registration-status').style.display = 'none';
}

// Patient Login Form Handler
document.getElementById('patient-login-form')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const phone = document.getElementById('login-phone').value;
    const patient = hospitalData.patients.find(p => p.phone === phone);

    if (patient) {
        currentPatient = patient;
        localStorage.setItem('currentPatient', JSON.stringify(patient));
        updatePatientAuthButton();
        
        showToast(`Welcome back, ${patient.name}!`);
        showSection('patient-home');
        this.reset();
    } else {
        const statusDiv = document.getElementById('registration-status');
        statusDiv.className = 'status-message error';
        statusDiv.textContent = 'Phone number not found! Please register first.';
    }
});

// Admin Login Form Handler
document.getElementById('admin-login-form')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;

    if (username === adminCredentials.username && password === adminCredentials.password) {
        isAdminLoggedIn = true;
        closeModal('admin-login-modal');
        showToast('Login successful! Welcome Admin');
        showSection('admin');
        
        // Update nav button
        updateAdminButton();
        
        // Reset form
        this.reset();
        document.getElementById('login-error').style.display = 'none';
    } else {
        document.getElementById('login-error').textContent = '❌ Invalid username or password!';
        document.getElementById('login-error').style.display = 'block';
    }
});

function updateAdminButton() {
    const adminBtn = document.querySelector('.admin-btn');
    if (isAdminLoggedIn) {
        adminBtn.textContent = 'Admin Panel';
        adminBtn.style.background = '#10b981';
    } else {
        adminBtn.textContent = 'Admin Login';
        adminBtn.style.background = '#ef4444';
    }
}

function logoutAdmin() {
    if (confirm('Are you sure you want to logout?')) {
        isAdminLoggedIn = false;
        showToast('Logged out successfully');
        updateAdminButton();
        showSection('patient-home');
    }
}

document.getElementById('registration-form')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const phone = document.getElementById('patient-phone').value;
    
    // Check if phone already exists
    const existingPatient = hospitalData.patients.find(p => p.phone === phone);
    if (existingPatient) {
        const statusDiv = document.getElementById('registration-status');
        statusDiv.className = 'status-message error';
        statusDiv.textContent = 'Phone number already registered! Please login instead.';
        return;
    }

    const patient = {
        id: 'P' + Date.now(),
        name: document.getElementById('patient-name').value,
        phone: phone,
        age: document.getElementById('patient-age').value,
        bloodGroup: document.getElementById('patient-blood').value,
        registrationDate: new Date().toISOString()
    };

    hospitalData.patients.push(patient);
    currentPatient = patient;
    localStorage.setItem('currentPatient', JSON.stringify(patient));
    hospitalData.analytics.totalPatients = hospitalData.patients.length;
    
    saveData();

    const statusDiv = document.getElementById('registration-status');
    statusDiv.className = 'status-message success';
    statusDiv.textContent = `Registration successful! Your Patient ID: ${patient.id}`;

    updatePatientAuthButton();
    showToast('Registration successful!');

    // Reset form
    this.reset();

    // Redirect to home after 2 seconds
    setTimeout(() => {
        showSection('patient-home');
    }, 2000);
});

// ============================================
// DOCTORS SECTION
// ============================================

function loadDoctorsGrid() {
    const grid = document.getElementById('doctors-grid');
    grid.innerHTML = '';

    hospitalData.doctors.forEach(doctor => {
        const card = document.createElement('div');
        card.className = 'doctor-card';
        card.onclick = () => openAppointmentModal(doctor);

        card.innerHTML = `
            <div class="doctor-photo">
                ${doctor.photo ? `<img src="${doctor.photo}" alt="${doctor.name}">` : '👨‍⚕️'}
            </div>
            <div class="doctor-info">
                <h3>${doctor.name}</h3>
                <p class="doctor-specialization">${doctor.specialization}</p>
                <p class="doctor-contact">📞 ${doctor.phone}</p>
                <p class="doctor-fee">Fee: ৳${doctor.fee}</p>
                <button class="btn btn-primary" style="width: 100%; margin-top: 10px;">
                    Book Appointment
                </button>
            </div>
        `;

        grid.appendChild(card);
    });
}

// ============================================
// APPOINTMENT BOOKING
// ============================================

let selectedDoctor = null;

// Maximum appointments per slot
const MAX_APPOINTMENTS_PER_SLOT = 5; // Each slot can have max 5 appointments

// All available slots
const ALL_TIME_SLOTS = [
    { value: '09:00-10:00', label: '09:00 AM - 10:00 AM' },
    { value: '10:00-11:00', label: '10:00 AM - 11:00 AM' },
    { value: '11:00-12:00', label: '11:00 AM - 12:00 PM' },
    { value: '12:00-13:00', label: '12:00 PM - 01:00 PM' },
    { value: '14:00-15:00', label: '02:00 PM - 03:00 PM' },
    { value: '15:00-16:00', label: '03:00 PM - 04:00 PM' },
    { value: '16:00-17:00', label: '04:00 PM - 05:00 PM' }
];

function openAppointmentModal(doctor) {
    if (!currentUser || currentRole !== 'patient') {
        showToast('Please login as patient first!');
        showSection('login');
        return;
    }

    selectedDoctor = doctor;
    
    const modal = document.getElementById('appointment-modal');
    const doctorInfo = document.getElementById('selected-doctor-info');
    
    doctorInfo.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3>${doctor.name}</h3>
            <p>${doctor.specialization}</p>
            <p>Consultation Fee: ৳${doctor.fee}</p>
        </div>
    `;

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').setAttribute('min', today);
    
    // Reset slot selector
    const slotSelect = document.getElementById('appointment-slot');
    slotSelect.innerHTML = '<option value="">Select Date First</option>';

    modal.classList.add('active');
}

// Update available slots when date changes
document.getElementById('appointment-date')?.addEventListener('change', function() {
    const selectedDate = this.value;
    const doctorId = selectedDoctor.id;
    
    updateAvailableSlots(doctorId, selectedDate);
});

function updateAvailableSlots(doctorId, date) {
    const slotSelect = document.getElementById('appointment-slot');
    const slotsInfo = document.getElementById('slots-info');
    
    // Count existing appointments for each slot on this date
    const existingAppointments = hospitalData.appointments.filter(apt => 
        apt.doctorId === doctorId && apt.date === date
    );
    
    // Count appointments per slot
    const slotCounts = {};
    existingAppointments.forEach(apt => {
        slotCounts[apt.slot] = (slotCounts[apt.slot] || 0) + 1;
    });
    
    // Build slot options
    let availableCount = 0;
    let fullyBookedCount = 0;
    slotSelect.innerHTML = '<option value="">Select Time Slot</option>';
    
    ALL_TIME_SLOTS.forEach(slot => {
        const count = slotCounts[slot.value] || 0;
        const remaining = MAX_APPOINTMENTS_PER_SLOT - count;
        
        const option = document.createElement('option');
        option.value = slot.value;
        
        if (remaining > 0) {
            option.textContent = `${slot.label} - ${remaining} slots available`;
            availableCount++;
        } else {
            option.textContent = `${slot.label} - FULLY BOOKED`;
            option.disabled = true;
            option.style.color = '#ef4444';
            fullyBookedCount++;
        }
        
        slotSelect.appendChild(option);
    });
    
    // Update info message
    if (availableCount === 0) {
        slotsInfo.innerHTML = `
            <span style="color: #ef4444; font-weight: bold;">⚠️ All slots fully booked for this date!</span><br>
            Please select another date.
        `;
        slotsInfo.style.background = '#fee2e2';
    } else {
        slotsInfo.innerHTML = `
            <span style="color: #059669; font-weight: bold;">✓ ${availableCount} slot(s) available</span><br>
            ${fullyBookedCount > 0 ? `<span style="color: #ef4444;">${fullyBookedCount} slot(s) fully booked</span>` : ''}
        `;
        slotsInfo.style.background = '#f0f9ff';
    }
}

function openAppointmentModal(doctor) {
    if (!currentPatient && hospitalData.patients.length === 0) {
        showToast('Please register first!');
        showSection('patient-register');
        return;
    }

    if (!currentPatient) {
        currentPatient = hospitalData.patients[hospitalData.patients.length - 1];
    }

    selectedDoctor = doctor;
    
    const modal = document.getElementById('appointment-modal');
    const doctorInfo = document.getElementById('selected-doctor-info');
    
    doctorInfo.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3>${doctor.name}</h3>
            <p>${doctor.specialization}</p>
            <p>Consultation Fee: ৳${doctor.fee}</p>
        </div>
    `;

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').setAttribute('min', today);

    modal.classList.add('active');
}

document.getElementById('appointment-form')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const selectedDate = document.getElementById('appointment-date').value;
    const selectedSlot = document.getElementById('appointment-slot').value;

    // Validate slot availability again before booking
    const existingAppointments = hospitalData.appointments.filter(apt => 
        apt.doctorId === selectedDoctor.id && 
        apt.date === selectedDate && 
        apt.slot === selectedSlot
    );

    if (existingAppointments.length >= MAX_APPOINTMENTS_PER_SLOT) {
        showToast('Sorry! This slot is now fully booked. Please select another slot.');
        updateAvailableSlots(selectedDoctor.id, selectedDate);
        return;
    }

    const appointment = {
        id: 'APT' + Date.now(),
        patientId: currentUser.id,
        patientName: currentUser.name,
        patientPhone: currentUser.phone,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        specialization: selectedDoctor.specialization,
        date: selectedDate,
        slot: selectedSlot,
        status: 'scheduled',
        bookingTime: new Date().toISOString(),
        tokenNumber: generateToken(),
        fee: selectedDoctor.fee,
        paymentStatus: 'pending'
    };

    hospitalData.appointments.push(appointment);
    hospitalData.analytics.todayAppointments++;

    // Add to doctor's queue if appointment is for today
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    if (appointmentDate.toDateString() === today.toDateString()) {
        addToQueue(selectedDoctor.id, appointment, 'doctor');
    }

    saveData();

    showToast(`Appointment booked! Token: ${appointment.tokenNumber}`);
    closeModal('appointment-modal');
    this.reset();
    
    // Open payment modal
    setTimeout(() => {
        openPaymentModal(appointment);
    }, 500);
});

// ============================================
// DIAGNOSTIC SERVICES
// ============================================

let selectedDiagnostic = null;

const MAX_DIAGNOSTIC_PER_SLOT = 10; // Diagnostic tests can have more slots

const DIAGNOSTIC_TIME_SLOTS = [
    { value: '08:00-09:00', label: '08:00 AM - 09:00 AM' },
    { value: '09:00-10:00', label: '09:00 AM - 10:00 AM' },
    { value: '10:00-11:00', label: '10:00 AM - 11:00 AM' },
    { value: '11:00-12:00', label: '11:00 AM - 12:00 PM' },
    { value: '14:00-15:00', label: '02:00 PM - 03:00 PM' },
    { value: '15:00-16:00', label: '03:00 PM - 04:00 PM' }
];

function bookDiagnostic(testType) {
    if (!currentUser || currentRole !== 'patient') {
        showToast('Please login as patient first!');
        showSection('login');
        return;
    }

    selectedDiagnostic = testType;

    const modal = document.getElementById('diagnostic-modal');
    const diagnosticInfo = document.getElementById('selected-diagnostic-info');

    diagnosticInfo.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3>${testType}</h3>
            <p>Diagnostic Test Booking</p>
        </div>
    `;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('diagnostic-date').setAttribute('min', today);

    modal.classList.add('active');
}

// Update diagnostic slots when date changes
document.getElementById('diagnostic-date')?.addEventListener('change', function() {
    const selectedDate = this.value;
    updateDiagnosticSlots(selectedDiagnostic, selectedDate);
});

function updateDiagnosticSlots(testType, date) {
    const slotSelect = document.getElementById('diagnostic-slot');
    
    // Count existing bookings for each slot
    const existingBookings = hospitalData.diagnosticBookings.filter(booking => 
        booking.testType === testType && booking.date === date
    );
    
    const slotCounts = {};
    existingBookings.forEach(booking => {
        slotCounts[booking.slot] = (slotCounts[booking.slot] || 0) + 1;
    });
    
    // Build slot options
    slotSelect.innerHTML = '<option value="">Select Time Slot</option>';
    
    DIAGNOSTIC_TIME_SLOTS.forEach(slot => {
        const count = slotCounts[slot.value] || 0;
        const remaining = MAX_DIAGNOSTIC_PER_SLOT - count;
        
        const option = document.createElement('option');
        option.value = slot.value;
        
        if (remaining > 0) {
            option.textContent = `${slot.label} - ${remaining} slots available`;
        } else {
            option.textContent = `${slot.label} - FULLY BOOKED`;
            option.disabled = true;
            option.style.color = '#ef4444';
        }
        
        slotSelect.appendChild(option);
    });
}

function bookDiagnostic(testType) {
    if (!currentPatient && hospitalData.patients.length === 0) {
        showToast('Please register first!');
        showSection('patient-register');
        return;
    }

    if (!currentPatient) {
        currentPatient = hospitalData.patients[hospitalData.patients.length - 1];
    }

    selectedDiagnostic = testType;

    const modal = document.getElementById('diagnostic-modal');
    const diagnosticInfo = document.getElementById('selected-diagnostic-info');

    diagnosticInfo.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3>${testType}</h3>
            <p>Diagnostic Test Booking</p>
        </div>
    `;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('diagnostic-date').setAttribute('min', today);

    modal.classList.add('active');
}

document.getElementById('diagnostic-form')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const selectedDate = document.getElementById('diagnostic-date').value;
    const selectedSlot = document.getElementById('diagnostic-slot').value;

    // Validate slot availability
    const existingBookings = hospitalData.diagnosticBookings.filter(booking => 
        booking.testType === selectedDiagnostic && 
        booking.date === selectedDate && 
        booking.slot === selectedSlot
    );

    if (existingBookings.length >= MAX_DIAGNOSTIC_PER_SLOT) {
        showToast('Sorry! This slot is fully booked. Please select another slot.');
        updateDiagnosticSlots(selectedDiagnostic, selectedDate);
        return;
    }

    const booking = {
        id: 'DIAG' + Date.now(),
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        patientPhone: currentPatient.phone,
        testType: selectedDiagnostic,
        date: selectedDate,
        slot: selectedSlot,
        status: 'scheduled',
        bookingTime: new Date().toISOString(),
        tokenNumber: generateToken()
    };

    hospitalData.diagnosticBookings.push(booking);

    // Add to diagnostic queue if booking is for today
    const bookingDate = new Date(booking.date);
    const today = new Date();
    if (bookingDate.toDateString() === today.toDateString()) {
        addToQueue(selectedDiagnostic, booking, 'diagnostic');
    }

    saveData();

    showToast(`Diagnostic test booked successfully! Token: ${booking.tokenNumber}`);
    closeModal('diagnostic-modal');
    this.reset();
    
    setTimeout(() => {
        alert(`Booking Confirmed!\n\nTest: ${selectedDiagnostic}\nDate: ${selectedDate}\nTime: ${selectedSlot}\nToken: ${booking.tokenNumber}\n\nPlease arrive 15 minutes early and fast for 8 hours if required.`);
    }, 500);
});

// ============================================
// BLOOD BANK SYSTEM
// ============================================

function loadBloodStock() {
    const container = document.getElementById('blood-stock-display');
    container.innerHTML = '';

    Object.keys(hospitalData.bloodBank.stock).forEach(bloodGroup => {
        const units = hospitalData.bloodBank.stock[bloodGroup];
        const card = document.createElement('div');
        
        let statusClass = '';
        let statusText = 'Available';
        
        if (units === 0) {
            statusClass = 'out-of-stock';
            statusText = 'Out of Stock';
        } else if (units < 5) {
            statusClass = 'low-stock';
            statusText = 'Low Stock';
        }
        
        card.className = `blood-group-card ${statusClass}`;
        card.innerHTML = `
            <div class="blood-group-label">${bloodGroup}</div>
            <div class="blood-stock-count">${units} Units</div>
            <div class="blood-stock-status">${statusText}</div>
        `;
        
        container.appendChild(card);
    });
}

function openDonateBloodModal() {
    if (!currentUser || (currentRole !== 'patient' && currentRole !== 'donor')) {
        showToast('Please login as patient or donor to donate blood!');
        showSection('login');
        return;
    }

    // Pre-fill blood group if available
    if (currentUser.bloodGroup) {
        document.getElementById('donate-blood-group').value = currentUser.bloodGroup;
    }

    document.getElementById('donate-blood-modal').classList.add('active');
}

// Blood Donation Form
document.getElementById('donate-blood-form')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const bloodGroup = document.getElementById('donate-blood-group').value;
    const units = parseInt(document.getElementById('donate-units').value);
    const lastDonation = document.getElementById('last-donation-date').value;

    // Check if 3 months have passed since last donation
    if (lastDonation) {
        const lastDate = new Date(lastDonation);
        const today = new Date();
        const monthsDiff = (today - lastDate) / (1000 * 60 * 60 * 24 * 30);
        
        if (monthsDiff < 3) {
            showToast('Sorry! You must wait 3 months between donations.');
            return;
        }
    }

    const donation = {
        id: 'DON' + Date.now(),
        donorId: currentUser.id,
        donorName: currentUser.name,
        donorPhone: currentUser.phone,
        bloodGroup: bloodGroup,
        units: units,
        donationDate: new Date().toISOString(),
        status: 'completed'
    };

    hospitalData.bloodBank.donations.push(donation);
    hospitalData.bloodBank.stock[bloodGroup] += units;

    saveData();
    closeModal('donate-blood-modal');
    this.reset();

    showToast(`Thank you for donating ${units} unit(s) of ${bloodGroup} blood! You saved lives! ❤️`);
    
    // Reload appropriate dashboard
    if (currentRole === 'donor') {
        loadDonorBloodBank();
        if (document.getElementById('donor-history').classList.contains('active')) {
            loadDonorHistory();
        }
    }

    // Show certificate
    setTimeout(() => {
        alert(`🎖️ Blood Donation Certificate\n\nDonor: ${currentUser.name}\nBlood Group: ${bloodGroup}\nUnits: ${units}\nDate: ${formatDateTime(donation.donationDate)}\n\nThank you for being a life saver!\n- IbneSina Hospital`);
    }, 500);
});

function openRequestBloodModal() {
    if (!currentUser || currentRole !== 'patient') {
        showToast('Please login as patient to request blood!');
        showSection('login');
        return;
    }

    // Set minimum datetime to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('request-deadline').setAttribute('min', now.toISOString().slice(0, 16));

    document.getElementById('request-blood-modal').classList.add('active');
}

// Blood Request Form
document.getElementById('request-blood-form')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const bloodGroup = document.getElementById('request-blood-group').value;
    const units = parseInt(document.getElementById('request-units').value);

    // Check stock availability
    if (hospitalData.bloodBank.stock[bloodGroup] < units) {
        if (confirm(`Only ${hospitalData.bloodBank.stock[bloodGroup]} unit(s) of ${bloodGroup} available. Do you want to request anyway?`)) {
            // Continue with request
        } else {
            return;
        }
    }

    const request = {
        id: 'REQ' + Date.now(),
        requesterId: currentUser.id,
        requesterName: currentUser.name,
        patientName: document.getElementById('request-patient-name').value,
        bloodGroup: bloodGroup,
        units: units,
        reason: document.getElementById('request-reason').value,
        contact: document.getElementById('request-contact').value,
        deadline: document.getElementById('request-deadline').value,
        requestDate: new Date().toISOString(),
        status: 'pending'
    };

    hospitalData.bloodBank.requests.push(request);
    saveData();

    closeModal('request-blood-modal');
    this.reset();

    showToast('Emergency blood request submitted! Hospital will contact you soon.');
    loadBloodRequests();

    // Add alert for admin
    addAlert('danger', `🚨 Emergency: ${units} unit(s) ${bloodGroup} blood needed for ${request.patientName}`);
});

function loadBloodRequests() {
    const container = document.getElementById('blood-requests-list');
    
    const pendingRequests = hospitalData.bloodBank.requests.filter(
        r => r.status === 'pending'
    );

    if (pendingRequests.length === 0) {
        container.innerHTML = '<p>No pending blood requests.</p>';
        return;
    }

    container.innerHTML = '';
    pendingRequests.forEach(request => {
        const item = document.createElement('div');
        item.className = 'blood-request-item urgent';
        
        const deadline = new Date(request.deadline);
        const isUrgent = (deadline - new Date()) < (24 * 60 * 60 * 1000); // Less than 24 hours
        
        item.innerHTML = `
            <h4>🚨 ${request.bloodGroup} - ${request.units} Unit(s) Needed</h4>
            <p><strong>Patient:</strong> ${request.patientName}</p>
            <p><strong>Reason:</strong> ${request.reason}</p>
            <p><strong>Contact:</strong> ${request.contact}</p>
            <p><strong>Required By:</strong> ${formatDateTime(request.deadline)}</p>
            ${isUrgent ? '<span class="blood-badge" style="background: #fee2e2; color: #991b1b;">⚠️ URGENT</span>' : ''}
            <span class="blood-badge pending">Pending</span>
        `;
        container.appendChild(item);
    });
}

// ============================================
// PAYMENT SYSTEM
// ============================================

let currentPaymentData = null;

function openPaymentModal(appointmentData) {
    currentPaymentData = appointmentData;
    
    const modal = document.getElementById('payment-modal');
    const paymentInfo = document.getElementById('payment-info');
    
    paymentInfo.innerHTML = `
        <h3>Doctor: ${appointmentData.doctorName}</h3>
        <p>${appointmentData.specialization}</p>
        <p style="font-size: 24px; font-weight: bold; color: #ef4444; margin-top: 10px;">
            Amount: ৳${appointmentData.fee}
        </p>
    `;
    
    modal.classList.add('active');
}

function updatePaymentFields() {
    const method = document.getElementById('payment-method').value;
    
    // Hide all fields first
    document.getElementById('mobile-payment-fields').style.display = 'none';
    document.getElementById('visa-fields').style.display = 'none';
    document.getElementById('savings-fields').style.display = 'none';
    
    // Show relevant fields
    if (method === 'bkash' || method === 'nagad') {
        document.getElementById('mobile-payment-fields').style.display = 'block';
    } else if (method === 'visa') {
        document.getElementById('visa-fields').style.display = 'block';
    } else if (method === 'savings') {
        document.getElementById('savings-fields').style.display = 'block';
    }
}

// Payment Form Handler
document.getElementById('payment-form')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const method = document.getElementById('payment-method').value;
    
    const payment = {
        id: 'PAY' + Date.now(),
        appointmentId: currentPaymentData.id,
        patientId: currentUser.id,
        amount: currentPaymentData.fee,
        method: method,
        paymentDate: new Date().toISOString(),
        status: 'completed'
    };

    // Add payment details based on method
    if (method === 'bkash' || method === 'nagad') {
        payment.mobileNumber = document.getElementById('mobile-number').value;
        payment.transactionId = document.getElementById('transaction-id').value;
    } else if (method === 'visa') {
        payment.cardNumber = document.getElementById('card-number').value.slice(-4); // Store last 4 digits only
    } else if (method === 'savings') {
        payment.accountNumber = document.getElementById('account-number').value;
        payment.bankName = document.getElementById('bank-name').value;
    }

    // Save payment
    if (!hospitalData.payments) {
        hospitalData.payments = [];
    }
    hospitalData.payments.push(payment);
    
    // Update appointment payment status
    const appointment = hospitalData.appointments.find(a => a.id === currentPaymentData.id);
    if (appointment) {
        appointment.paymentStatus = 'paid';
        appointment.paymentId = payment.id;
    }

    saveData();
    closeModal('payment-modal');
    this.reset();

    showToast('Payment successful! Your appointment is confirmed.');
    
    setTimeout(() => {
        alert(`Payment Receipt\n\nAppointment ID: ${currentPaymentData.tokenNumber}\nDoctor: ${currentPaymentData.doctorName}\nAmount Paid: ৳${currentPaymentData.fee}\nPayment Method: ${method.toUpperCase()}\nDate: ${formatDateTime(payment.paymentDate)}\n\nThank you!\n- IbneSina Hospital`);
    }, 500);
});

// ============================================
// WARD ADMISSION
// ============================================

let selectedWard = null;

function requestAdmission(wardType) {
    if (!currentUser || currentRole !== 'patient') {
        showToast('Please login as patient first!');
        showSection('login');
        return;
    }

    selectedWard = wardType;

    const modal = document.getElementById('ward-modal');
    const wardInfo = document.getElementById('selected-ward-info');

    const prices = {
        'General': '৳500/day',
        'Cabin': '৳2000/day',
        'ICU': '৳5000/day'
    };

    wardInfo.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3>${wardType} Ward</h3>
            <p>${prices[wardType]}</p>
        </div>
    `;

    modal.classList.add('active');
}

document.getElementById('ward-form')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const admission = {
        id: 'ADM' + Date.now(),
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        patientPhone: currentPatient.phone,
        wardType: selectedWard,
        reason: document.getElementById('admission-reason').value,
        emergency: document.getElementById('emergency-status').value === 'yes',
        duration: document.getElementById('expected-duration').value,
        status: 'pending',
        requestTime: new Date().toISOString()
    };

    // SCENARIO S5: Emergency ward request gets highest priority
    if (admission.emergency && selectedWard === 'ICU') {
        admission.priority = 'high';
        addAlert('danger', `Emergency ICU admission request from ${admission.patientName}`);
    }

    hospitalData.wardAdmissions.push(admission);
    saveData();

    showToast('Ward admission request submitted successfully!');
    closeModal('ward-modal');
    this.reset();
    
    loadAdmissionRequests();
});

function loadAdmissionRequests() {
    const list = document.getElementById('admission-requests-list');
    
    if (!currentPatient) {
        list.innerHTML = '<p>Please register to view your admission requests.</p>';
        return;
    }

    const patientAdmissions = hospitalData.wardAdmissions.filter(
        adm => adm.patientId === currentPatient.id
    );

    if (patientAdmissions.length === 0) {
        list.innerHTML = '<p>No admission requests found.</p>';
        return;
    }

    list.innerHTML = '';
    patientAdmissions.forEach(adm => {
        const item = document.createElement('div');
        item.className = 'admission-request-item';
        item.innerHTML = `
            <h4>${adm.wardType} Ward</h4>
            <p><strong>Reason:</strong> ${adm.reason}</p>
            <p><strong>Duration:</strong> ${adm.duration} days</p>
            <p><strong>Request Time:</strong> ${formatDateTime(adm.requestTime)}</p>
            <span class="admission-badge ${adm.status}">${adm.status.toUpperCase()}</span>
            ${adm.emergency ? '<span class="admission-badge" style="background: #fee2e2; color: #991b1b; margin-left: 10px;">EMERGENCY</span>' : ''}
        `;
        list.appendChild(item);
    });
}

// ============================================
// QUEUE MANAGEMENT
// ============================================

function addToQueue(providerId, booking, queueType) {
    const queueItem = {
        id: booking.id,
        tokenNumber: booking.tokenNumber,
        patientName: booking.patientName,
        patientPhone: booking.patientPhone,
        status: 'waiting',
        joinTime: Date.now(),
        waitingTime: 0,
        serviceTime: 0,
        serviceStartTime: null,
        appointmentTime: booking.slot || null
    };

    if (queueType === 'doctor') {
        if (!hospitalData.queues.doctors[providerId]) {
            hospitalData.queues.doctors[providerId] = [];
        }
        hospitalData.queues.doctors[providerId].push(queueItem);
    } else if (queueType === 'diagnostic') {
        if (!hospitalData.queues.diagnostics[providerId]) {
            hospitalData.queues.diagnostics[providerId] = [];
        }
        hospitalData.queues.diagnostics[providerId].push(queueItem);
    }

    startWaitingTimer(queueItem);
    saveData();
}

function startWaitingTimer(queueItem) {
    const timerId = `waiting_${queueItem.id}`;
    
    timerIntervals[timerId] = setInterval(() => {
        queueItem.waitingTime = Math.floor((Date.now() - queueItem.joinTime) / 1000);
        
        // SCENARIO S1-S3: Waiting time status
        if (queueItem.status === 'waiting') {
            const waitMinutes = Math.floor(queueItem.waitingTime / 60);
            
            if (waitMinutes <= 10) {
                queueItem.waitStatus = 'normal';
            } else if (waitMinutes <= 20) {
                queueItem.waitStatus = 'delayed';
                // SCENARIO S8: Long delay notification
                addAlert('warning', `Patient ${queueItem.patientName} waiting for ${waitMinutes} minutes`);
            } else {
                queueItem.waitStatus = 'critical';
                
                // SCENARIO S4: Priority boost after 25 minutes
                if (waitMinutes >= 25 && !queueItem.priorityBoosted) {
                    queueItem.priorityBoosted = true;
                    addAlert('danger', `Patient ${queueItem.patientName} waiting critically long (${waitMinutes} min) - Priority boosted!`);
                }
            }
        }

        saveData();
        updateQueueDisplays();
    }, 1000);
}

function startService(providerId, queueType) {
    // Check admin authentication
    if (!isAdminLoggedIn) {
        showToast('Unauthorized! Admin access only.');
        return;
    }

    let queue;
    if (queueType === 'doctor') {
        queue = hospitalData.queues.doctors[providerId];
    } else {
        queue = hospitalData.queues.diagnostics[providerId];
    }

    if (!queue || queue.length === 0) {
        showToast('No patients in queue!');
        return;
    }

    // Check if someone is already being served
    const serving = queue.find(item => item.status === 'serving');
    if (serving) {
        showToast('Please complete current service first!');
        return;
    }

    // Get next patient (priority or FIFO)
    let nextPatient = queue.find(item => item.priorityBoosted && item.status === 'waiting');
    if (!nextPatient) {
        nextPatient = queue.find(item => item.status === 'waiting');
    }

    if (!nextPatient) {
        showToast('No waiting patients!');
        return;
    }

    // Start service
    nextPatient.status = 'serving';
    nextPatient.serviceStartTime = Date.now();

    // Stop waiting timer
    clearInterval(timerIntervals[`waiting_${nextPatient.id}`]);

    // Start service timer
    const timerId = `service_${nextPatient.id}`;
    timerIntervals[timerId] = setInterval(() => {
        nextPatient.serviceTime = Math.floor((Date.now() - nextPatient.serviceStartTime) / 1000);
        
        // SCENARIO S6: Over-service warning
        const serviceMinutes = Math.floor(nextPatient.serviceTime / 60);
        if (serviceMinutes >= 10 && !nextPatient.overServiceWarned) {
            nextPatient.overServiceWarned = true;
            addAlert('warning', `Service time exceeding 10 minutes for ${nextPatient.patientName}`);
        }

        saveData();
        updateQueueDisplays();
    }, 1000);

    // SCENARIO S7: Idle alert check
    checkIdleStatus(providerId, queueType);

    saveData();
    updateQueueDisplays();
    showToast(`Service started for ${nextPatient.patientName}`);
}

function endService(providerId, queueType) {
    // Check admin authentication
    if (!isAdminLoggedIn) {
        showToast('Unauthorized! Admin access only.');
        return;
    }

    let queue;
    if (queueType === 'doctor') {
        queue = hospitalData.queues.doctors[providerId];
    } else {
        queue = hospitalData.queues.diagnostics[providerId];
    }

    const serving = queue.find(item => item.status === 'serving');
    if (!serving) {
        showToast('No active service to end!');
        return;
    }

    // SCENARIO S10: Service completed
    serving.status = 'completed';
    serving.endTime = Date.now();

    // Stop service timer
    clearInterval(timerIntervals[`service_${serving.id}`]);

    // SCENARIO S5: Recovered status (long wait + fast service)
    const waitMinutes = Math.floor(serving.waitingTime / 60);
    const serviceMinutes = Math.floor(serving.serviceTime / 60);
    if (waitMinutes > 20 && serviceMinutes < 5) {
        serving.recovered = true;
        addAlert('success', `Service recovered: ${serving.patientName} - Wait: ${waitMinutes}min, Service: ${serviceMinutes}min`);
    }

    // SCENARIO S8: Recalculate averages
    updateAverages();

    // SCENARIO S9: Queue length check
    const waitingCount = queue.filter(item => item.status === 'waiting').length;
    if (waitingCount > 10) {
        addAlert('warning', `Peak hour alert: ${waitingCount} patients waiting`);
    }

    hospitalData.analytics.completedServices++;

    saveData();
    updateQueueDisplays();
    updateAnalytics();
    showToast(`Service completed for ${serving.patientName}`);
}

// SCENARIO S7: Check idle status
function checkIdleStatus(providerId, queueType) {
    let queue;
    if (queueType === 'doctor') {
        queue = hospitalData.queues.doctors[providerId];
    } else {
        queue = hospitalData.queues.diagnostics[providerId];
    }

    const hasWaiting = queue.some(item => item.status === 'waiting');
    const isServing = queue.some(item => item.status === 'serving');

    if (hasWaiting && !isServing) {
        const timerId = `idle_${providerId}_${queueType}`;
        timerIntervals[timerId] = setTimeout(() => {
            addAlert('warning', `Provider idle for 5+ minutes with waiting patients!`);
        }, 5 * 60 * 1000);
    }
}

function updateAverages() {
    const allQueues = [
        ...Object.values(hospitalData.queues.doctors).flat(),
        ...Object.values(hospitalData.queues.diagnostics).flat()
    ];

    const completed = allQueues.filter(item => item.status === 'completed');

    if (completed.length > 0) {
        const totalWait = completed.reduce((sum, item) => sum + item.waitingTime, 0);
        const totalService = completed.reduce((sum, item) => sum + item.serviceTime, 0);

        hospitalData.analytics.averageWaitTime = Math.floor(totalWait / completed.length);
        hospitalData.analytics.averageServiceTime = Math.floor(totalService / completed.length);
    }
}

// ============================================
// ADMIN - DOCTORS MANAGEMENT
// ============================================

function showAddDoctorForm() {
    document.getElementById('add-doctor-form').style.display = 'block';
}

function cancelAddDoctor() {
    document.getElementById('add-doctor-form').style.display = 'none';
    document.getElementById('doctor-form').reset();
}

document.getElementById('doctor-form')?.addEventListener('submit', function(e) {
    e.preventDefault();

    // Check admin authentication
    if (!isAdminLoggedIn) {
        showToast('Unauthorized! Admin access only.');
        return;
    }

    const doctor = {
        id: 'D' + Date.now(),
        name: document.getElementById('doctor-name').value,
        specialization: document.getElementById('doctor-specialization').value,
        phone: document.getElementById('doctor-phone').value,
        photo: document.getElementById('doctor-photo').value,
        fee: parseInt(document.getElementById('doctor-fee').value)
    };

    hospitalData.doctors.push(doctor);
    hospitalData.queues.doctors[doctor.id] = [];

    saveData();
    showToast('Doctor added successfully!');
    
    cancelAddDoctor();
    loadDoctorsListAdmin();
});

function loadDoctorsListAdmin() {
    const list = document.getElementById('doctors-list-admin');
    list.innerHTML = '<div class="table-row header"><div>Name</div><div>Specialization</div><div>Phone</div><div>Fee</div><div>Actions</div></div>';

    hospitalData.doctors.forEach(doctor => {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div>${doctor.name}</div>
            <div>${doctor.specialization}</div>
            <div>${doctor.phone}</div>
            <div>৳${doctor.fee}</div>
            <div class="table-actions">
                <button class="btn btn-small btn-danger" onclick="deleteDoctor('${doctor.id}')">Delete</button>
            </div>
        `;
        list.appendChild(row);
    });
}

function deleteDoctor(doctorId) {
    // Check admin authentication
    if (!isAdminLoggedIn) {
        showToast('Unauthorized! Admin access only.');
        return;
    }

    if (confirm('Are you sure you want to delete this doctor?')) {
        hospitalData.doctors = hospitalData.doctors.filter(d => d.id !== doctorId);
        delete hospitalData.queues.doctors[doctorId];
        saveData();
        loadDoctorsListAdmin();
        showToast('Doctor deleted');
    }
}

// ============================================
// ADMIN - QUEUES DISPLAY
// ============================================

function loadDoctorQueues() {
    const container = document.getElementById('doctor-queues');
    container.innerHTML = '';

    hospitalData.doctors.forEach(doctor => {
        const queue = hospitalData.queues.doctors[doctor.id] || [];
        const waiting = queue.filter(item => item.status === 'waiting');
        const serving = queue.filter(item => item.status === 'serving');

        const card = document.createElement('div');
        card.className = 'queue-card';
        
        card.innerHTML = `
            <div class="queue-header">
                <div>
                    <h4>${doctor.name}</h4>
                    <p>${doctor.specialization}</p>
                </div>
                <div>
                    <span class="status-badge">${waiting.length} Waiting</span>
                    <span class="status-badge serving">${serving.length} Serving</span>
                </div>
            </div>
            <div class="queue-body" id="queue-${doctor.id}"></div>
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <button class="btn btn-primary" onclick="startService('${doctor.id}', 'doctor')">Start Service</button>
                <button class="btn btn-secondary" onclick="endService('${doctor.id}', 'doctor')">End Service</button>
            </div>
        `;

        container.appendChild(card);

        // Load queue items
        loadQueueItems(doctor.id, 'doctor');
    });
}

function loadDiagnosticQueues() {
    const container = document.getElementById('diagnostic-queues');
    container.innerHTML = '';

    Object.keys(hospitalData.queues.diagnostics).forEach(testType => {
        const queue = hospitalData.queues.diagnostics[testType] || [];
        const waiting = queue.filter(item => item.status === 'waiting');
        const serving = queue.filter(item => item.status === 'serving');

        if (queue.length === 0) return;

        const card = document.createElement('div');
        card.className = 'queue-card';
        
        card.innerHTML = `
            <div class="queue-header">
                <div>
                    <h4>${testType}</h4>
                </div>
                <div>
                    <span class="status-badge">${waiting.length} Waiting</span>
                    <span class="status-badge serving">${serving.length} Serving</span>
                </div>
            </div>
            <div class="queue-body" id="queue-diag-${testType.replace(/\s/g, '-')}"></div>
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <button class="btn btn-primary" onclick="startService('${testType}', 'diagnostic')">Start Service</button>
                <button class="btn btn-secondary" onclick="endService('${testType}', 'diagnostic')">End Service</button>
            </div>
        `;

        container.appendChild(card);

        // Load queue items
        loadQueueItems(testType, 'diagnostic');
    });
}

function loadQueueItems(providerId, queueType) {
    let queue;
    let containerId;

    if (queueType === 'doctor') {
        queue = hospitalData.queues.doctors[providerId] || [];
        containerId = `queue-${providerId}`;
    } else {
        queue = hospitalData.queues.diagnostics[providerId] || [];
        containerId = `queue-diag-${providerId.replace(/\s/g, '-')}`;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (queue.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b;">No patients in queue</p>';
        return;
    }

    queue.forEach(item => {
        const queueItem = document.createElement('div');
        queueItem.className = `queue-item ${item.status} ${item.waitStatus || ''}`;
        
        const waitTime = formatTime(item.waitingTime);
        const serviceTime = item.serviceTime ? formatTime(item.serviceTime) : '--:--';

        queueItem.innerHTML = `
            <div class="queue-patient-info">
                <h4>Token: ${item.tokenNumber}</h4>
                <p>${item.patientName} | ${item.patientPhone}</p>
                ${item.appointmentTime ? `<p>Slot: ${item.appointmentTime}</p>` : ''}
                <span class="status-badge ${item.waitStatus || item.status}">${(item.status).toUpperCase()}</span>
                ${item.priorityBoosted ? '<span class="status-badge" style="background: #fee2e2; color: #991b1b; margin-left: 5px;">PRIORITY</span>' : ''}
                ${item.recovered ? '<span class="status-badge success" style="margin-left: 5px;">RECOVERED</span>' : ''}
            </div>
            <div class="queue-time-info">
                <div class="time-badge">
                    <label>Waiting</label>
                    <div class="time">${waitTime}</div>
                </div>
                <div class="time-badge">
                    <label>Service</label>
                    <div class="time">${serviceTime}</div>
                </div>
            </div>
        `;

        container.appendChild(queueItem);
    });
}

function updateQueueDisplays() {
    // Update doctor queues if visible
    hospitalData.doctors.forEach(doctor => {
        loadQueueItems(doctor.id, 'doctor');
    });

    // Update diagnostic queues if visible
    Object.keys(hospitalData.queues.diagnostics).forEach(testType => {
        loadQueueItems(testType, 'diagnostic');
    });
}

// ============================================
// ADMIN - WARD MANAGEMENT
// ============================================

function loadWardRequestsAdmin() {
    const container = document.getElementById('ward-requests-admin');
    
    if (hospitalData.wardAdmissions.length === 0) {
        container.innerHTML = '<p>No admission requests</p>';
        return;
    }

    container.innerHTML = '';

    hospitalData.wardAdmissions.forEach(adm => {
        const card = document.createElement('div');
        card.className = 'admission-request-item';
        
        card.innerHTML = `
            <h4>${adm.patientName} - ${adm.wardType} Ward</h4>
            <p><strong>Phone:</strong> ${adm.patientPhone}</p>
            <p><strong>Reason:</strong> ${adm.reason}</p>
            <p><strong>Duration:</strong> ${adm.duration} days</p>
            <p><strong>Request Time:</strong> ${formatDateTime(adm.requestTime)}</p>
            <span class="admission-badge ${adm.status}">${adm.status.toUpperCase()}</span>
            ${adm.emergency ? '<span class="admission-badge" style="background: #fee2e2; color: #991b1b; margin-left: 10px;">EMERGENCY</span>' : ''}
            
            ${adm.status === 'pending' ? `
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button class="btn btn-primary btn-small" onclick="approveAdmission('${adm.id}')">Approve</button>
                    <button class="btn btn-danger btn-small" onclick="rejectAdmission('${adm.id}')">Reject</button>
                </div>
            ` : ''}
        `;

        container.appendChild(card);
    });
}

function approveAdmission(admissionId) {
    // Check admin authentication
    if (!isAdminLoggedIn) {
        showToast('Unauthorized! Admin access only.');
        return;
    }

    const admission = hospitalData.wardAdmissions.find(adm => adm.id === admissionId);
    
    // SCENARIO S6: ICU full check
    if (admission.wardType === 'ICU') {
        const approvedICU = hospitalData.wardAdmissions.filter(
            adm => adm.wardType === 'ICU' && adm.status === 'approved'
        );
        if (approvedICU.length >= 5) { // Assuming 5 ICU beds
            showToast('ICU is full! Patient added to waiting list.');
            admission.status = 'waiting-list';
            addAlert('warning', `ICU full - ${admission.patientName} added to waiting list`);
            saveData();
            loadWardRequestsAdmin();
            return;
        }
    }

    // SCENARIO S10: Ward approved
    admission.status = 'approved';
    admission.approvalTime = new Date().toISOString();
    addAlert('success', `Ward admission approved for ${admission.patientName}`);

    saveData();
    loadWardRequestsAdmin();
    showToast('Admission approved!');
}

function rejectAdmission(admissionId) {
    // Check admin authentication
    if (!isAdminLoggedIn) {
        showToast('Unauthorized! Admin access only.');
        return;
    }

    const admission = hospitalData.wardAdmissions.find(adm => adm.id === admissionId);
    
    // SCENARIO S11: Ward rejected
    admission.status = 'rejected';
    admission.rejectionTime = new Date().toISOString();
    addAlert('info', `Ward admission rejected for ${admission.patientName}`);

    saveData();
    loadWardRequestsAdmin();
    showToast('Admission rejected');
}

// ============================================
// ANALYTICS & ALERTS
// ============================================

function updateAnalytics() {
    // Update stats
    document.getElementById('total-patients').textContent = hospitalData.patients.length;
    
    // Count today's appointments
    const today = new Date().toDateString();
    const todayAppointments = hospitalData.appointments.filter(apt => 
        new Date(apt.date).toDateString() === today
    ).length;
    document.getElementById('today-appointments').textContent = todayAppointments;

    // Pending admissions
    const pendingAdmissions = hospitalData.wardAdmissions.filter(adm => adm.status === 'pending').length;
    document.getElementById('pending-admissions').textContent = pendingAdmissions;

    // Active queues
    let activeQueues = 0;
    Object.values(hospitalData.queues.doctors).forEach(queue => {
        if (queue.some(item => item.status === 'waiting' || item.status === 'serving')) {
            activeQueues++;
        }
    });
    document.getElementById('active-queues').textContent = activeQueues;

    // Load alerts
    loadAlerts();
}

function addAlert(type, message) {
    const alert = {
        id: Date.now(),
        type: type,
        message: message,
        time: new Date().toISOString()
    };

    hospitalData.alerts.unshift(alert);
    
    // Keep only last 50 alerts
    if (hospitalData.alerts.length > 50) {
        hospitalData.alerts = hospitalData.alerts.slice(0, 50);
    }

    saveData();
}

function loadAlerts() {
    const container = document.getElementById('system-alerts');
    
    if (hospitalData.alerts.length === 0) {
        container.innerHTML = '<p>No alerts</p>';
        return;
    }

    container.innerHTML = '';

    hospitalData.alerts.slice(0, 20).forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${alert.type}`;
        
        const icons = {
            info: 'ℹ️',
            warning: '⚠️',
            danger: '🚨',
            success: '✅'
        };

        alertDiv.innerHTML = `
            <span class="alert-icon">${icons[alert.type] || 'ℹ️'}</span>
            <div style="flex: 1;">
                <p>${alert.message}</p>
                <small>${formatDateTime(alert.time)}</small>
            </div>
        `;

        container.appendChild(alertDiv);
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateToken() {
    return 'TKN' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function resetDailyData() {
    // Check admin authentication
    if (!isAdminLoggedIn) {
        showToast('Unauthorized! Admin access only.');
        return;
    }

    if (confirm('Are you sure you want to reset all daily data? This will clear all queues and appointments.')) {
        // Clear queues
        hospitalData.doctors.forEach(doctor => {
            hospitalData.queues.doctors[doctor.id] = [];
        });
        Object.keys(hospitalData.queues.diagnostics).forEach(type => {
            hospitalData.queues.diagnostics[type] = [];
        });

        // Clear timers
        Object.values(timerIntervals).forEach(interval => clearInterval(interval));
        timerIntervals = {};

        // Reset analytics
        hospitalData.analytics.todayAppointments = 0;
        hospitalData.analytics.completedServices = 0;

        // Clear alerts
        hospitalData.alerts = [];

        saveData();
        showToast('Daily data reset successfully!');
        updateAnalytics();
        loadDoctorQueues();
    }
}

function exportData() {
    // Check admin authentication
    if (!isAdminLoggedIn) {
        showToast('Unauthorized! Admin access only.');
        return;
    }

    const dataStr = JSON.stringify(hospitalData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hospital-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('Data exported successfully!');
}

function initializeTimers() {
    // Restart timers for active queue items
    Object.values(hospitalData.queues.doctors).forEach(queue => {
        queue.forEach(item => {
            if (item.status === 'waiting') {
                startWaitingTimer(item);
            } else if (item.status === 'serving' && item.serviceStartTime) {
                const timerId = `service_${item.id}`;
                timerIntervals[timerId] = setInterval(() => {
                    item.serviceTime = Math.floor((Date.now() - item.serviceStartTime) / 1000);
                    saveData();
                    updateQueueDisplays();
                }, 1000);
            }
        });
    });

    Object.values(hospitalData.queues.diagnostics).forEach(queue => {
        queue.forEach(item => {
            if (item.status === 'waiting') {
                startWaitingTimer(item);
            } else if (item.status === 'serving' && item.serviceStartTime) {
                const timerId = `service_${item.id}`;
                timerIntervals[timerId] = setInterval(() => {
                    item.serviceTime = Math.floor((Date.now() - item.serviceStartTime) / 1000);
                    saveData();
                    updateQueueDisplays();
                }, 1000);
            }
        });
    });
}

// ============================================
// INITIALIZATION
// ============================================

// Load data on page load
window.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateNavigationForRole();
    
    // Show home by default
    showSection('home');
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});