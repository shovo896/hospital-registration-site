// ============================================
// IbneSina Hospital Management System
// Brand New Clean JavaScript
// ============================================

console.log('🏥 IbneSina Hospital System Loading...');


let currentUser = null;
let currentRole = null;
let selectedRoleForAuth = null;
let selectedDoctor = null;
let selectedDiagnostic = null;
let selectedWard = null;

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

// ============================================
// DATA MANAGEMENT
// ============================================

function saveData() {
    localStorage.setItem('hospitalData', JSON.stringify(hospitalData));
}

function loadData() {
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
    
    const savedSession = localStorage.getItem('currentSession');
    if (savedSession) {
        try {
            const session = JSON.parse(savedSession);
            currentUser = session.user;
            currentRole = session.role;
        } catch (e) {
            localStorage.removeItem('currentSession');
        }
    }
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

function clearSession() {
    localStorage.removeItem('currentSession');
}

function initializeSampleData() {
    hospitalData.doctors = [
        { id: 'D001', name: 'Dr. Ahmed Khan', specialization: 'Cardiologist', phone: '01711-123456', photo: '', fee: 800 },
        { id: 'D002', name: 'Dr. Fatima Rahman', specialization: 'Pediatrician', phone: '01811-234567', photo: '', fee: 600 },
        { id: 'D003', name: 'Dr. Kamal Hossain', specialization: 'Neurologist', phone: '01911-345678', photo: '', fee: 1000 },
        { id: 'D004', name: 'Dr. Nazia Sultana', specialization: 'Gynecologist', phone: '01611-456789', photo: '', fee: 700 },
        { id: 'D005', name: 'Dr. Rafiq Ahmed', specialization: 'Orthopedic', phone: '01511-567890', photo: '', fee: 900 }
    ];
    saveData();
}

// ============================================
// AUTH FUNCTIONS
// ============================================

function selectRole(role) {
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
    
    if (role === 'employee' || role === 'admin') {
        passwordField.style.display = 'block';
        loginPassword.required = true;
    } else {
        passwordField.style.display = 'none';
        loginPassword.required = false;
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
    const passwordRegisterField = document.getElementById('password-register-field');
    
    if (selectedRoleForAuth === 'employee') {
        employeeIdField.style.display = 'block';
        departmentField.style.display = 'block';
        passwordRegisterField.style.display = 'block';
    } else {
        employeeIdField.style.display = 'none';
        departmentField.style.display = 'none';
        passwordRegisterField.style.display = 'none';
    }
}

function backToLogin() {
    document.getElementById('login-form-section').style.display = 'block';
    document.getElementById('register-form-section').style.display = 'none';
}

function updateNavigationForRole() {
    document.getElementById('patient-nav').style.display = 'none';
    document.getElementById('donor-nav').style.display = 'none';
    document.getElementById('employee-nav').style.display = 'none';
    document.getElementById('admin-nav').style.display = 'none';
    
    if (currentRole) {
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'block';
        
        const navButtons = {
            'patient': 'patient-nav',
            'donor': 'donor-nav',
            'employee': 'employee-nav',
            'admin': 'admin-nav'
        };
        document.getElementById(navButtons[currentRole]).style.display = 'block';
    } else {
        document.getElementById('login-btn').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'none';
    }
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
        currentUser = null;
        currentRole = null;
        updateNavigationForRole();
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
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    if (sectionId === 'patient-dashboard') {
        loadPatientDashboard();
    } else if (sectionId === 'donor-dashboard') {
        loadDonorDashboard();
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

function loadPatientProfile() {
    if (!currentUser) return;
    
    document.getElementById('patient-avatar').textContent = currentUser.name.charAt(0);
    document.getElementById('patient-name-display').textContent = currentUser.name;
    document.getElementById('patient-id-display').textContent = 'ID: ' + currentUser.id;
    document.getElementById('view-phone').textContent = currentUser.phone;
    document.getElementById('view-age').textContent = currentUser.age + ' years';
    document.getElementById('view-blood').textContent = currentUser.bloodGroup || 'N/A';
    document.getElementById('view-registered').textContent = formatDateTime(currentUser.registrationDate);
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
    if (!aptList) return;
    
    const myApts = hospitalData.appointments.filter(a => a.patientId === currentUser.id);
    aptList.innerHTML = myApts.length ? '' : '<p>No appointments</p>';
    
    myApts.forEach(apt => {
        const div = document.createElement('div');
        div.className = 'profile-item';
        div.innerHTML = `<h4>Dr. ${apt.doctorName}</h4><p>${apt.date} - ${apt.slot}</p>`;
        aptList.appendChild(div);
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

function loadDonorDashboard() {
    if (!currentUser) return;
}

function loadEmployeeDashboard() {
    if (!currentUser) return;
}

// ============================================
// BOOKING FUNCTIONS
// ============================================

function openAppointmentModal(doctor) {
    if (!currentUser) {
        showToast('Please login!');
        return;
    }
    selectedDoctor = doctor;
    document.getElementById('selected-doctor-info').innerHTML = `<h3>${doctor.name}</h3><p>Fee: ৳${doctor.fee}</p>`;
    document.getElementById('appointment-modal').classList.add('active');
}

function bookDiagnostic(type) {
    if (!currentUser) {
        showToast('Please login!');
        return;
    }
    selectedDiagnostic = type;
    document.getElementById('diagnostic-modal').classList.add('active');
}

function requestAdmission(ward) {
    if (!currentUser) {
        showToast('Please login!');
        return;
    }
    selectedWard = ward;
    document.getElementById('ward-modal').classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ============================================
// UTILS
// ============================================

function formatDateTime(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('en-GB');
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
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            let user = null;
            let authenticated = false;
            
            if (selectedRoleForAuth === 'admin') {
                if (username === 'admin' && password === 'admin123') {
                    user = { name: 'Admin' };
                    authenticated = true;
                }
            } else if (selectedRoleForAuth === 'patient') {
                user = userData.patients.find(p => p.phone === username);
                if (user) authenticated = true;
            } else if (selectedRoleForAuth === 'donor') {
                user = userData.donors.find(d => d.phone === username);
                if (user) authenticated = true;
            } else if (selectedRoleForAuth === 'employee') {
                user = userData.employees.find(e => e.phone === username && e.password === password);
                if (user) authenticated = true;
            }
            
            if (authenticated) {
                currentUser = user;
                currentRole = selectedRoleForAuth;
                saveSession();
                showToast('Welcome ' + user.name + '!');
                updateNavigationForRole();
                
                const dash = {
                    'patient': 'patient-dashboard',
                    'donor': 'donor-dashboard',
                    'employee': 'employee-dashboard',
                    'admin': 'admin'
                };
                showSection(dash[selectedRoleForAuth]);
                this.reset();
            } else {
                showToast('Invalid credentials!');
            }
        });
    }

    // Register
    const registerForm = document.getElementById('unified-register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const phone = document.getElementById('register-phone').value;
            
            const newUser = {
                id: selectedRoleForAuth.charAt(0).toUpperCase() + Date.now(),
                name: document.getElementById('register-name').value,
                phone: phone,
                age: document.getElementById('register-age').value,
                bloodGroup: document.getElementById('register-blood').value,
                registrationDate: new Date().toISOString()
            };
            
            if (selectedRoleForAuth === 'employee') {
                newUser.password = document.getElementById('register-password').value;
            }
            
            if (selectedRoleForAuth === 'patient') {
                userData.patients.push(newUser);
                hospitalData.patients.push(newUser);
            } else if (selectedRoleForAuth === 'donor') {
                userData.donors.push(newUser);
            } else if (selectedRoleForAuth === 'employee') {
                userData.employees.push(newUser);
            }
            
            saveUserData();
            saveData();
            
            showToast('Registration successful!');
            this.reset();
            setTimeout(backToLogin, 2000);
        });
    }

    // Profile edit
    const profileForm = document.getElementById('profile-edit-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            currentUser.name = document.getElementById('edit-name').value;
            currentUser.phone = document.getElementById('edit-phone').value;
            currentUser.age = document.getElementById('edit-age').value;
            currentUser.bloodGroup = document.getElementById('edit-blood').value;
            
            saveUserData();
            saveData();
            saveSession();
            
            showToast('Profile updated!');
            loadPatientProfile();
            cancelProfileEdit();
        });
    }
}

// ============================================
// INIT
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing...');
    loadData();
    updateNavigationForRole();
    showSection('home');
    setupEventListeners();
    console.log('✅ Ready!');
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

console.log('✅ Script loaded!');