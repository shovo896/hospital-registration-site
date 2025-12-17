

console.log('🏥 IbneSina Hospital System Loading...');

// ============================================

// ============================================

// These must be on window for HTML onclick/onchange to work
window.showSection = null;
window.selectRole = null;
window.backToRoleSelection = null;
window.showRegisterForm = null;
window.backToLogin = null;
window.logout = null;
window.resetSystem = null;
window.checkAuthAndShow = null;
window.showPatientTab = null;
window.showDonorTab = null;
window.showEmployeeTab = null;
window.showAdminTab = null;  // ← ADDED!
window.toggleProfileEdit = null;
window.cancelProfileEdit = null;
window.openAppointmentModal = null;
window.loadAppointmentSlots = null;
window.bookDiagnostic = null;
window.requestAdmission = null;
window.closeModal = null;

// ============================================
// GLOBAL VARIABLES
// ============================================

let currentUser = null;
let currentRole = null;
let selectedRoleForAuth = null;
let selectedDoctor = null;
let selectedDiagnostic = null;
let selectedWard = null;

// Slot limits
const MAX_APPOINTMENTS_PER_SLOT = 5;
const MAX_DIAGNOSTIC_PER_SLOT = 10;

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

function loadAdminDashboard() {
    if (!currentUser || currentRole !== 'admin') return;
    console.log('📊 Loading admin dashboard...');
    
    // Show first tab
    setTimeout(() => {
        window.showAdminTab('doctors-mgmt');
    }, 100);
}

function loadAdminDoctors() {
    console.log('📋 Loading doctors for admin. Total:', hospitalData.doctors.length);
    
    const container = document.getElementById('doctors-list-admin');
    if (!container) {
        console.warn('⚠️ Container not found');
        return;
    }
    
    if (hospitalData.doctors.length === 0) {
        container.innerHTML = '<p style="color: #64748b; padding: 20px;">No doctors added yet.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    hospitalData.doctors.forEach(doctor => {
        const card = document.createElement('div');
        card.style.cssText = 'border: 1px solid #e5e7eb; padding: 20px; margin: 15px 0; border-radius: 8px; background: white;';
        card.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">${doctor.name}</h3>
            <p style="margin: 5px 0;"><strong>Specialization:</strong> ${doctor.specialization}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${doctor.phone}</p>
            <p style="margin: 5px 0;"><strong>Fee:</strong> ৳${doctor.fee}</p>
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <button onclick="editDoctor('${doctor.id}')" class="btn btn-secondary">✏️ Edit</button>
                <button onclick="window.deleteDoctor('${doctor.id}')" class="btn" style="background: #ef4444; color: white;">🗑️ Delete</button>
            </div>
        `;
        container.appendChild(card);
    });
    
    console.log('✅ Displayed', hospitalData.doctors.length, 'doctors');
}

// Global functions for admin actions
window.editDoctor = function(doctorId) {
    showToast('Edit doctor - coming soon!');
};

window.deleteDoctor = function(doctorId) {
    if (confirm('Delete this doctor?')) {
        const index = hospitalData.doctors.findIndex(d => d.id === doctorId);
        if (index !== -1) {
            hospitalData.doctors.splice(index, 1);
            saveData();
            showToast('Doctor deleted!');
            loadAdminDoctors();
        }
    }
};

// Make it global for HTML onclick
window.showAdminTab = function(tabId) {
    console.log('====================================');
    console.log('📊 ADMIN TAB SWITCH:', tabId);
    console.log('====================================');
    
    if (!currentUser || currentRole !== 'admin') {
        console.log('❌ Not admin');
        showToast('Admin access required!');
        return;
    }
    
    // Hide all admin tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
        console.log('✅ Tab shown:', tabId);
    } else {
        console.error('❌ Tab not found:', tabId);
    }
    
    // Activate button (if event exists)
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Load tab data
    if (tabId === 'doctors-mgmt') {
        loadAdminDoctors();
    } else if (tabId === 'diagnostics-mgmt') {
        console.log('Diagnostics management - coming soon');
    } else if (tabId === 'blood-mgmt') {
        console.log('Blood bank management - coming soon');
    } else if (tabId === 'wards-mgmt') {
        console.log('Wards management - coming soon');
    } else if (tabId === 'queues') {
        console.log('Queue management - coming soon');
    } else if (tabId === 'analytics') {
        console.log('Analytics - coming soon');
    }
    
    console.log('====================================');
};

// Keep reference for internal use
function showAdminTab(tabId) {
    window.showAdminTab(tabId);
}

// ============================================
// BOOKING FUNCTIONS
// ============================================

function openAppointmentModal(doctor) {
    if (!currentUser) {
        showToast('Please login!');
        return;
    }
    
    console.log('🏥 Opening appointment modal for:', doctor.name);
    selectedDoctor = doctor;
    
    document.getElementById('selected-doctor-info').innerHTML = `
        <h3>${doctor.name}</h3>
        <p>${doctor.specialization}</p>
        <p>Fee: ৳${doctor.fee}</p>
    `;
    
    // Set min date to today
    const dateInput = document.getElementById('appointment-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
        dateInput.value = ''; // Clear previous value
    }
    
    // Reset slots
    const slotSelect = document.getElementById('appointment-slot');
    if (slotSelect) {
        slotSelect.innerHTML = '<option value="">Select Date First</option>';
    }
    
    const slotsInfo = document.getElementById('slots-info');
    if (slotsInfo) {
        slotsInfo.innerHTML = 'Select a date to see available slots';
        slotsInfo.style.background = '#f0f9ff';
        slotsInfo.style.color = '#1e40af';
    }
    
    document.getElementById('appointment-modal').classList.add('active');
}

// GLOBAL FUNCTION - Called from HTML onchange
// Make it explicitly available on window
window.loadAppointmentSlots = function(selectedDate) {
    console.log('====================================');
    console.log('📅 LOADING SLOTS FOR DATE:', selectedDate);
    console.log('====================================');
    
    if (!selectedDate) {
        console.log('❌ No date provided');
        return;
    }
    
    if (!selectedDoctor) {
        console.log('❌ No doctor selected');
        alert('Please select a doctor first!');
        return;
    }
    
    const slotSelect = document.getElementById('appointment-slot');
    const slotsInfo = document.getElementById('slots-info');
    
    if (!slotSelect) {
        console.error('❌ Slot select element not found!');
        return;
    }
    
    console.log('Doctor:', selectedDoctor.name);
    console.log('Date:', selectedDate);
    
    // All available time slots
    const allTimeSlots = [
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
    
    console.log('Total slots:', allTimeSlots.length);
    
    // Check existing bookings for this doctor on this date
    const existingBookings = hospitalData.appointments.filter(apt => 
        apt.doctorId === selectedDoctor.id && 
        apt.date === selectedDate
    );
    
    console.log('Existing bookings:', existingBookings.length);
    
    // Clear existing options
    slotSelect.innerHTML = '<option value="">Select Time Slot</option>';
    
    let availableCount = 0;
    
    // Add each slot if available
    allTimeSlots.forEach((slot, index) => {
        const bookingsInSlot = existingBookings.filter(apt => apt.slot === slot).length;
        const available = MAX_APPOINTMENTS_PER_SLOT - bookingsInSlot;
        
        console.log(`Slot ${index + 1}: ${slot} - ${available} available`);
        
        if (available > 0) {
            const option = document.createElement('option');
            option.value = slot;
            option.textContent = `${slot} (${available} available)`;
            slotSelect.appendChild(option);
            availableCount++;
        }
    });
    
    console.log('====================================');
    console.log('✅ TOTAL AVAILABLE SLOTS:', availableCount);
    console.log('====================================');
    
    // Update info display
    if (slotsInfo) {
        if (availableCount > 0) {
            slotsInfo.innerHTML = `✅ ${availableCount} time slots available`;
            slotsInfo.style.background = '#d1fae5';
            slotsInfo.style.color = '#065f46';
        } else {
            slotsInfo.innerHTML = '❌ No slots available for this date';
            slotsInfo.style.background = '#fee2e2';
            slotsInfo.style.color = '#991b1b';
        }
    }
};

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
                    authenticated = true;
                    console.log('✅ Patient found:', user.name);
                } else {
                    console.log('❌ Patient not found');
                }
            } else if (selectedRoleForAuth === 'donor') {
                console.log('Checking donor database...');
                console.log('Total donors:', userData.donors.length);
                user = userData.donors.find(d => d.phone === username);
                if (user) {
                    authenticated = true;
                    console.log('✅ Donor found:', user.name);
                } else {
                    console.log('❌ Donor not found');
                }
            } else if (selectedRoleForAuth === 'employee') {
                console.log('Checking employee database...');
                console.log('Total employees:', userData.employees.length);
                user = userData.employees.find(e => e.phone === username && e.password === password);
                if (user) {
                    authenticated = true;
                    console.log('✅ Employee found:', user.name);
                } else {
                    console.log('❌ Employee not found or wrong password');
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
            
            const newUser = {
                id: selectedRoleForAuth.charAt(0).toUpperCase() + Date.now(),
                name: document.getElementById('register-name').value,
                phone: phone,
                age: document.getElementById('register-age').value,
                bloodGroup: document.getElementById('register-blood').value,
                registrationDate: new Date().toISOString()
            };
            
            console.log('New user data:', newUser);
            
            if (selectedRoleForAuth === 'employee') {
                newUser.password = document.getElementById('register-password').value;
            }
            
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
                status: 'scheduled',
                bookingTime: new Date().toISOString(),
                tokenNumber: generateToken()
            };
            
            hospitalData.appointments.push(appointment);
            saveData();
            
            console.log('✅ Appointment booked:', appointment.tokenNumber);
            
            showToast(`Appointment booked! Token: ${appointment.tokenNumber}`);
            closeModal('appointment-modal');
            this.reset();
            
            // Reload appointments if on that tab
            if (document.getElementById('patient-appointments').classList.contains('active')) {
                loadPatientAppointments();
            }
        });
    } else {
        console.warn('⚠️ Appointment form NOT found');
    }
}

// ============================================
// INIT
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('====================================');
    console.log('🚀 HOSPITAL SYSTEM STARTING...');
    console.log('====================================');
    
    // CRITICAL: Assign all functions to window for HTML access
    window.showSection = showSection;
    window.selectRole = selectRole;
    window.backToRoleSelection = backToRoleSelection;
    window.showRegisterForm = showRegisterForm;
    window.backToLogin = backToLogin;
    window.logout = logout;
    window.resetSystem = resetSystem;
    window.checkAuthAndShow = checkAuthAndShow;
    window.showPatientTab = showPatientTab;
    window.showDonorTab = showDonorTab;
    window.showEmployeeTab = showEmployeeTab;
    window.showAdminTab = showAdminTab;  // ← ADDED!
    window.toggleProfileEdit = toggleProfileEdit;
    window.cancelProfileEdit = cancelProfileEdit;
    window.openAppointmentModal = openAppointmentModal;
    // window.loadAppointmentSlots already assigned above
    window.bookDiagnostic = bookDiagnostic;
    window.requestAdmission = requestAdmission;
    window.closeModal = closeModal;
    
    console.log('✅ All functions assigned to window');
    
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
    
    console.log('Step 3: Showing home section...');
    try {
        showSection('home');
        console.log('✅ Step 3 complete - Home section shown');
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

console.log('✅ Script loaded!');