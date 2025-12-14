
// DATA STORAGE & INITIALIZATION


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


// UI NAVIGATION


function showSection(sectionId) {
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
    } else if (sectionId === 'admin') {
        showAdminTab('doctors-mgmt');
        updateAnalytics();
    }
}

function showAdminTab(tabId) {
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


// PATIENT REGISTRATION

document.getElementById('registration-form')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const patient = {
        id: 'P' + Date.now(),
        name: document.getElementById('patient-name').value,
        phone: document.getElementById('patient-phone').value,
        age: document.getElementById('patient-age').value,
        bloodGroup: document.getElementById('patient-blood').value,
        registrationDate: new Date().toISOString()
    };

    hospitalData.patients.push(patient);
    currentPatient = patient;
    hospitalData.analytics.totalPatients = hospitalData.patients.length;
    
    saveData();

    const statusDiv = document.getElementById('registration-status');
    statusDiv.className = 'status-message success';
    statusDiv.textContent = `Registration successful! Your Patient ID: ${patient.id}`;

    showToast('Registration successful!');

    // Reset form
    this.reset();

    // Redirect to home after 2 seconds
    setTimeout(() => {
        showSection('patient-home');
    }, 2000);
});


// DOCTORS SECTION


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



let selectedDoctor = null;

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

    const appointment = {
        id: 'APT' + Date.now(),
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        patientPhone: currentPatient.phone,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        date: document.getElementById('appointment-date').value,
        slot: document.getElementById('appointment-slot').value,
        status: 'scheduled',
        bookingTime: new Date().toISOString(),
        tokenNumber: generateToken()
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

    showToast(`Appointment booked successfully! Token: ${appointment.tokenNumber}`);
    closeModal('appointment-modal');
    this.reset();
});


// DIAGNOSTIC SERVICES


let selectedDiagnostic = null;

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

    const booking = {
        id: 'DIAG' + Date.now(),
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        patientPhone: currentPatient.phone,
        testType: selectedDiagnostic,
        date: document.getElementById('diagnostic-date').value,
        slot: document.getElementById('diagnostic-slot').value,
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
})
// WARD ADMISSION


let selectedWard = null;

function requestAdmission(wardType) {
    if (!currentPatient && hospitalData.patients.length === 0) {
        showToast('Please register first!');
        showSection('patient-register');
        return;
    }

    if (!currentPatient) {
        currentPatient = hospitalData.patients[hospitalData.patients.length - 1];
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


// QUEUE MANAGEMENT


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


// ADMIN - DOCTORS MANAGEMENT


function showAddDoctorForm() {
    document.getElementById('add-doctor-form').style.display = 'block';
}

function cancelAddDoctor() {
    document.getElementById('add-doctor-form').style.display = 'none';
    document.getElementById('doctor-form').reset();
}

document.getElementById('doctor-form')?.addEventListener('submit', function(e) {
    e.preventDefault();

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
    if (confirm('Are you sure you want to delete this doctor?')) {
        hospitalData.doctors = hospitalData.doctors.filter(d => d.id !== doctorId);
        delete hospitalData.queues.doctors[doctorId];
        saveData();
        loadDoctorsListAdmin();
        showToast('Doctor deleted');
    }
}


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


// ADMIN - WARD MANAGEMENT

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



// Load data on page load
window.addEventListener('DOMContentLoaded', () => {
    loadData();
    showSection('patient-home');
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});