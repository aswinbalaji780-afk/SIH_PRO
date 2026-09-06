/**
 * National Skill Intelligence & Learning Platform
 * Frontend Controller & Enterprise UX Engine
 */

// -------------------------------------------------------------
// 1. Multilingual (i18n) Dictionary: English & Hindi
// -------------------------------------------------------------
const i18n = {
  en: {
    "header.subtitle": "AI-Enabled Statistical Cadre Intelligence Platform",
    "header.aiAssistant": "AI Copilot",
    "persona.label": "Persona:",
    "notifications.title": "Cadre Notifications",
    "nav.menu": "Portal Menu",
    "nav.dashboard": "Cadre Dashboard",
    "nav.competencies": "My Competencies",
    "nav.skillGaps": "Skill Gap Analysis",
    "nav.learningPaths": "Personalized Pathways",
    "nav.courses": "iGOT / NSSTA Catalogue",
    "nav.assessments": "Assessments & Quizzes",
    "nav.mcqExam": "AI Multi-Level Exam (NSSTA)",
    "nav.trainerStudio": "Trainer RAG Studio",
    "nav.analytics": "Workforce Analytics",
    "nav.admin": "System Administration",
    "dash.greeting": "Welcome back, Officer",
    "dash.overallComp": "Overall Assessed Competency",
    "dash.monthlyGrowth": "+8.2% this month",
    "dash.domainHeader": "Domain Competency Distribution",
    "dash.gapsHeader": "Top Prioritized Skill Gaps",
    "dash.recsHeader": "AI Recommended Learning (iGOT & NSSTA)",
    "dash.growthHeader": "Competency Progression Trend",
    "action.viewPath": "View Learning Path",
    "action.startCourse": "Start on iGOT",
    "action.takeQuiz": "Launch Assessment",
    "action.viewEvidence": "Audit Evidence"
  },
  hi: {
    "header.subtitle": "एआई-सक्षम सांख्यिकीय संवर्ग कौशल खुफिया मंच",
    "header.aiAssistant": "एआई सहायक",
    "persona.label": "व्यक्ति:",
    "notifications.title": "संवर्ग सूचनाएं",
    "nav.menu": "पोर्टल मेनू",
    "nav.dashboard": "डैशबोर्ड",
    "nav.competencies": "मेरी दक्षताएं",
    "nav.skillGaps": "कौशल अंतर विश्लेषण",
    "nav.learningPaths": "व्यक्तिगत शिक्षण मार्ग",
    "nav.courses": "आईगॉट / एनएसएसटीए पाठ्यक्रम",
    "nav.assessments": "मूल्यांकन एवं प्रश्नोत्तरी",
    "nav.mcqExam": "एआई बहु-स्तरीय परीक्षा (एनएसएसटीए)",
    "nav.trainerStudio": "प्रशिक्षक आरएजी स्टूडियो",
    "nav.analytics": "कार्यबल विश्लेषिकी",
    "nav.admin": "सिस्टम प्रशासन",
    "dash.greeting": "स्वागत है, अधिकारी महोदय",
    "dash.overallComp": "समग्र मूल्यांकित दक्षता",
    "dash.monthlyGrowth": "+8.2% इस माह वृद्धि",
    "dash.domainHeader": "डोमेन दक्षता वितरण",
    "dash.gapsHeader": "शीर्ष प्राथमिकता वाले कौशल अंतर",
    "dash.recsHeader": "एआई अनुशंसित शिक्षण (आईगॉट एवं एनएसएसटीए)",
    "dash.growthHeader": "दक्षता प्रगति रुझान",
    "action.viewPath": "शिक्षण मार्ग देखें",
    "action.startCourse": "आईगॉट पर आरंभ करें",
    "action.takeQuiz": "मूल्यांकन आरंभ करें",
    "action.viewEvidence": "साक्ष्य ऑडिट करें"
  }
};

let currentLang = 'en';
let currentPersona = 'arun.kumar';
let activeView = 'dashboard';
let currentEmployeeId = 1;

function t(key) {
  if (i18n[currentLang] && i18n[currentLang][key]) {
    return i18n[currentLang][key];
  }
  if (i18n.en && i18n.en[key]) {
    return i18n.en[key];
  }
  return key;
}

function setLanguage(lang) {
  if (!i18n[lang]) return;
  currentLang = lang;
  
  const btnEn = document.getElementById('lang-en');
  const btnHi = document.getElementById('lang-hi');
  if (lang === 'en') {
    if (btnEn) btnEn.className = "px-1.5 py-0.5 rounded font-medium text-white bg-govNavy-700 transition";
    if (btnHi) btnHi.className = "px-1.5 py-0.5 rounded font-medium text-slate-400 hover:text-white transition";
  } else {
    if (btnHi) btnHi.className = "px-1.5 py-0.5 rounded font-medium text-white bg-govNavy-700 transition";
    if (btnEn) btnEn.className = "px-1.5 py-0.5 rounded font-medium text-slate-400 hover:text-white transition";
  }

  // Update elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if (k && t(k)) {
      el.textContent = t(k);
    }
  });

  if (isAuthenticated) {
    setupPersonaNavigation();
    loadView(activeView);
  }
}

// Auth Portal State
let authRole = 'EMPLOYEE';
let authMode = 'login';
let isAuthenticated = false;
let cadreOptions = { departments: [], job_roles: [] };

// Cached State
let state = {
  profile: null,
  competencies: [],
  skillGaps: [],
  recommendations: [],
  learningPath: null,
  notifications: [],
  currentAssessment: null,
  activeQuizStep: 0,
  quizAnswers: {}
};

// -------------------------------------------------------------
// 2. Lifecycle & Authentication Initialization
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();
  await loadCadreOptions();
  checkAuthSession();
});

async function loadCadreOptions() {
  try {
    const res = await fetch('/api/v1/meta/cadre-options').then(r => r.json());
    cadreOptions = res;
  } catch (e) {
    console.error("Error loading cadre options:", e);
  }
}

function checkAuthSession() {
  const savedToken = localStorage.getItem('cadre_token');
  const savedUser = localStorage.getItem('cadre_user');

  if (savedToken && savedUser) {
    try {
      const user = JSON.parse(savedUser);
      loginSuccess(user, false);
      return;
    } catch (e) {
      localStorage.removeItem('cadre_token');
      localStorage.removeItem('cadre_user');
    }
  }

  // Not logged in: Show Auth Portal
  showAuthPortal();
}

function showAuthPortal() {
  isAuthenticated = false;
  document.getElementById('auth-portal').classList.remove('hidden');
  document.getElementById('app-viewport').classList.add('hidden');
  
  const authHeaderControls = document.getElementById('auth-header-controls');
  if (authHeaderControls) authHeaderControls.classList.add('hidden');
  const guestHeaderBadge = document.getElementById('guest-header-badge');
  if (guestHeaderBadge) guestHeaderBadge.classList.remove('hidden');

  selectAuthRole('EMPLOYEE');
  setAuthMode('login');
  lucide.createIcons();
}

function selectAuthRole(role) {
  authRole = role;
  
  // Highlight active role tab
  const roles = ['EMPLOYEE', 'TRAINER', 'DEPT_ADMIN', 'SYSTEM_ADMIN'];
  roles.forEach(r => {
    const tab = document.getElementById(`role-tab-${r}`);
    if (tab) {
      if (r === role) {
        tab.className = "py-2 px-3 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition bg-govNavy-800 text-white shadow-sm";
      } else {
        tab.className = "py-2 px-3 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition bg-white text-slate-700 hover:bg-slate-100 border border-slate-200";
      }
    }
  });

  // Role descriptive hints
  const loginHint = document.getElementById('login-role-hint');
  const regHint = document.getElementById('register-role-hint');
  const quickDemoBtn = document.getElementById('quick-demo-label');

  if (role === 'EMPLOYEE') {
    if (loginHint) loginHint.innerHTML = "Signing in to <b>Learner / Statistical Official Portal</b>. Use your cadre credentials.";
    if (regHint) regHint.innerHTML = "Registering a new <b>Learner / Statistical Official</b> profile. Competencies and gap tracking will be auto-bound.";
    if (quickDemoBtn) quickDemoBtn.textContent = "⚡ 1-Click Sign In as Arun Kumar (Learner - SO)";
    document.getElementById('login-username').value = "arun.kumar";
    document.getElementById('login-password').value = "password123";
  } else if (role === 'TRAINER') {
    if (loginHint) loginHint.innerHTML = "Signing in to <b>Trainer / Faculty Studio Portal (NSSTA)</b>.";
    if (regHint) regHint.innerHTML = "Registering a new <b>Trainer / Course Director</b> account for NSSTA & Partner Institutes.";
    if (quickDemoBtn) quickDemoBtn.textContent = "⚡ 1-Click Sign In as Dr. Priya Sharma (Trainer - NSSTA)";
    document.getElementById('login-username').value = "priya.sharma";
    document.getElementById('login-password').value = "password123";
  } else if (role === 'DEPT_ADMIN') {
    if (loginHint) loginHint.innerHTML = "Signing in to <b>Department / Division Administrator Portal</b>.";
    if (regHint) regHint.innerHTML = "Registering a new <b>Department Administrator / Director</b> profile for divisional workforce oversight.";
    if (quickDemoBtn) quickDemoBtn.textContent = "⚡ 1-Click Sign In as Rajesh Verma, ISS (Dept Admin)";
    document.getElementById('login-username').value = "rajesh.verma";
    document.getElementById('login-password').value = "password123";
  } else if (role === 'SYSTEM_ADMIN') {
    if (loginHint) loginHint.innerHTML = "Signing in to <b>National Systems & Cadre Governance Portal</b>.";
    if (regHint) regHint.innerHTML = "Registering a new <b>National Systems Administrator</b> (Security Token Required).";
    if (quickDemoBtn) quickDemoBtn.textContent = "⚡ 1-Click Sign In as National Admin (System Admin)";
    document.getElementById('login-username').value = "admin.system";
    document.getElementById('login-password').value = "password123";
  }

  renderDynamicRegistrationFields();
  lucide.createIcons();
}

function setAuthMode(mode) {
  authMode = mode;
  const tabLogin = document.getElementById('tab-login');
  const tabReg = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formReg = document.getElementById('form-register');

  if (mode === 'login') {
    tabLogin.className = "flex-1 py-3 text-xs font-bold border-b-2 border-govNavy-800 text-govNavy-900 flex items-center justify-center space-x-1.5";
    tabReg.className = "flex-1 py-3 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-700 flex items-center justify-center space-x-1.5";
    formLogin.classList.remove('hidden');
    formReg.classList.add('hidden');
  } else {
    tabReg.className = "flex-1 py-3 text-xs font-bold border-b-2 border-emerald-600 text-emerald-800 flex items-center justify-center space-x-1.5";
    tabLogin.className = "flex-1 py-3 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-700 flex items-center justify-center space-x-1.5";
    formReg.classList.remove('hidden');
    formLogin.classList.add('hidden');
    renderDynamicRegistrationFields();
  }
  lucide.createIcons();
}

function renderDynamicRegistrationFields() {
  const container = document.getElementById('dynamic-role-fields');
  if (!container) return;

  const depts = cadreOptions.departments || [];
  const roles = cadreOptions.job_roles || [];

  if (authRole === 'EMPLOYEE') {
    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Cadre Department / Division</label>
          <select id="reg-dept-id" class="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-govNavy-700">
            ${depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Assigned Statistical Job Role</label>
          <select id="reg-role-id" class="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-govNavy-700">
            ${roles.map(r => `<option value="${r.id}">${r.title}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Official Designation</label>
          <input type="text" id="reg-designation" value="Statistical Officer" class="w-full text-xs p-2.5 rounded-lg border border-slate-300">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Cadre Employee Code</label>
          <input type="text" id="reg-emp-code" placeholder="e.g. MOSPI-2026-904" class="w-full text-xs p-2.5 rounded-lg border border-slate-300">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Years of Experience</label>
          <input type="number" id="reg-experience" min="0" max="40" step="0.5" value="3.0" class="w-full text-xs p-2.5 rounded-lg border border-slate-300">
        </div>
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Current Official Assignment</label>
        <input type="text" id="reg-assignment" placeholder="e.g. PLFS Microdata Validation & Survey Weighting" class="w-full text-xs p-2.5 rounded-lg border border-slate-300">
      </div>
    `;
  } else if (authRole === 'TRAINER') {
    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Training Institution / Academy</label>
          <input type="text" id="reg-institution" value="National Statistical Systems Training Academy (NSSTA)" class="w-full text-xs p-2.5 rounded-lg border border-slate-300">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Faculty / Trainer Designation</label>
          <input type="text" id="reg-designation" value="Senior Faculty & Course Director" class="w-full text-xs p-2.5 rounded-lg border border-slate-300">
        </div>
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Specialist Domain Area</label>
        <input type="text" id="reg-domain" value="Survey Sampling, PPS Design & Modern Data Imputation" class="w-full text-xs p-2.5 rounded-lg border border-slate-300">
      </div>
    `;
  } else if (authRole === 'DEPT_ADMIN') {
    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Division Under Administration</label>
          <select id="reg-dept-id" class="w-full text-xs p-2.5 rounded-lg border border-slate-300">
            ${depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Administrative Cadre Rank</label>
          <input type="text" id="reg-designation" value="Director / Deputy Director General, ISS" class="w-full text-xs p-2.5 rounded-lg border border-slate-300">
        </div>
      </div>
    `;
  } else if (authRole === 'SYSTEM_ADMIN') {
    container.innerHTML = `
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Security Administration Access Token</label>
        <input type="password" id="reg-admin-token" value="MOSPI-ADMIN-KEY-2026" class="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono">
        <p class="text-[10px] text-slate-400 mt-1">Pre-filled default demo key: <code class="font-mono text-govNavy-900">MOSPI-ADMIN-KEY-2026</code></p>
      </div>
    `;
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    showToast("Please enter official username and password.");
    return;
  }

  showToast("Authenticating cadre credentials...");

  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(err.detail || "Invalid credentials.");
      return;
    }

    const data = await res.json();
    loginSuccess(data, true);
  } catch (err) {
    console.error("Login failed:", err);
    showToast("Server connection error. Please ensure backend is running.");
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  const fullName = document.getElementById('reg-fullname').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value.trim();

  if (!fullName || !username || !email || !password) {
    showToast("Please complete all required registration fields.");
    return;
  }

  const payload = {
    full_name: fullName,
    username: username,
    email: email,
    password: password,
    role: authRole
  };

  if (authRole === 'EMPLOYEE') {
    payload.department_id = parseInt(document.getElementById('reg-dept-id')?.value || 1);
    payload.job_role_id = parseInt(document.getElementById('reg-role-id')?.value || 1);
    payload.designation = document.getElementById('reg-designation')?.value || "Statistical Officer";
    payload.employee_code = document.getElementById('reg-emp-code')?.value || `MOSPI-${Date.now().toString().slice(-4)}`;
    payload.years_of_experience = parseFloat(document.getElementById('reg-experience')?.value || 1.0);
    payload.current_assignment = document.getElementById('reg-assignment')?.value || "Microdata Processing";
  } else if (authRole === 'TRAINER') {
    payload.institution = document.getElementById('reg-institution')?.value || "NSSTA";
    payload.designation = document.getElementById('reg-designation')?.value || "Senior Faculty";
    payload.training_domain = document.getElementById('reg-domain')?.value || "Survey Analytics";
  } else if (authRole === 'DEPT_ADMIN') {
    payload.department_id = parseInt(document.getElementById('reg-dept-id')?.value || 1);
    payload.designation = document.getElementById('reg-designation')?.value || "Director, ISS";
  }

  showToast("Registering official cadre profile...");

  try {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(err.detail || "Registration failed.");
      return;
    }

    const data = await res.json();
    showToast("Official registration successful! Welcome to the Cadre Portal.");
    loginSuccess(data, true);
  } catch (err) {
    console.error("Registration error:", err);
    showToast("Error communicating with registration service.");
  }
}

function handleQuickDemoLogin() {
  document.getElementById('form-login').dispatchEvent(new Event('submit'));
}

function loginSuccess(userData, shouldSave = true) {
  isAuthenticated = true;
  if (shouldSave) {
    localStorage.setItem('cadre_token', userData.access_token);
    localStorage.setItem('cadre_user', JSON.stringify(userData));
  }

  currentPersona = userData.username;
  currentEmployeeId = userData.employee_id || 1;

  document.getElementById('auth-portal').classList.add('hidden');
  document.getElementById('app-viewport').classList.remove('hidden');
  
  const authHeaderControls = document.getElementById('auth-header-controls');
  if (authHeaderControls) authHeaderControls.classList.remove('hidden');
  const guestHeaderBadge = document.getElementById('guest-header-badge');
  if (guestHeaderBadge) guestHeaderBadge.classList.add('hidden');

  document.getElementById('user-name').textContent = userData.full_name;
  document.getElementById('user-role').textContent = userData.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  
  const initials = userData.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('user-avatar').textContent = initials || "GO";

  const authRoleBadge = document.getElementById('header-authenticated-role');
  if (authRoleBadge) {
    const roleLabel = userData.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    authRoleBadge.textContent = `${userData.full_name} (${roleLabel})`;
  }

  // Set default view based on role
  if (userData.role === 'TRAINER') {
    activeView = 'trainer_studio';
  } else if (userData.role === 'DEPT_ADMIN') {
    activeView = 'analytics';
  } else if (userData.role === 'SYSTEM_ADMIN') {
    activeView = 'admin';
  } else {
    activeView = 'dashboard';
  }

  loadNotifications();
  setupPersonaNavigation();
  loadView(activeView);
  showToast(`Authenticated as ${userData.full_name} (${userData.role})`);
}

function handleLogout() {
  localStorage.removeItem('cadre_token');
  localStorage.removeItem('cadre_user');
  sessionStorage.clear();
  isAuthenticated = false;
  currentPersona = null;
  currentEmployeeId = null;
  state = {
    profile: null,
    competencies: [],
    skillGaps: [],
    recommendations: [],
    learningPath: null,
    notifications: [],
    currentAssessment: null,
    activeQuizStep: 0,
    quizAnswers: {}
  };
  showToast("Official session signed out safely.");
  showAuthPortal();
}

function promptSwitchAccount() {
  if (confirm("Official Security Policy: To switch to another statistical cadre account, you must sign out and authenticate with the target account's verified credentials.\n\nProceed to Sign Out now?")) {
    handleLogout();
  }
}

async function updateTargetPosition(roleId) {
  try {
    showToast("🎯 Updating expected cadre position goal...");
    const res = await fetch(`/api/v1/profile/${currentEmployeeId}/target-position`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_job_role_id: parseInt(roleId) })
    }).then(r => r.json());

    showToast(`🎯 Aspirational position set to ${res.target_role.title}! Promotion readiness recomputed.`);
    loadView('dashboard');
  } catch (e) {
    showToast("Error updating target position.");
  }
}

function setCadreWizardStep(step) {
  state.cadreWizardStep = step;
  loadView('dashboard');
}

function submitCurrentPosition() {
  const select = document.getElementById('wizard-current-position');
  if (select) {
    state.selectedCurrentRoleId = parseInt(select.value);
  }
  // Reset selectedTargetRoleId so it defaults to an eligible higher role in Step 2
  state.selectedTargetRoleId = null;
  state.cadreWizardStep = 2;
  showToast("1st Question Completed! Now choose your expected target promotional role.");
  loadView('dashboard');
}

async function submitTargetPositionAndRunAI() {
  const select = document.getElementById('wizard-target-position');
  if (!select || !select.value) {
    showToast("⚠️ Please select an eligible promotional target role.");
    return;
  }
  const targetId = parseInt(select.value);
  state.selectedTargetRoleId = targetId;

  const currentId = state.selectedCurrentRoleId || 1;

  // Seniority & Promotion Hierarchy Validation
  if (state.targetPosRes && state.targetPosRes.available_roles) {
    const curRole = state.targetPosRes.available_roles.find(r => r.id === currentId) || state.targetPosRes.current_role;
    const tgtRole = state.targetPosRes.available_roles.find(r => r.id === targetId);
    const curLevel = curRole?.hierarchy_level || currentId;
    const tgtLevel = tgtRole?.hierarchy_level || targetId;

    if (tgtLevel <= curLevel) {
      showToast(`⚠️ Promotional Cadre Error: Target position (${tgtRole?.title || 'Target'}) must be higher in hierarchy than your current position (${curRole?.title || 'Current'}).`);
      return;
    }
  }

  const btn = document.getElementById('btn-wizard-run-ai');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="inline-block animate-spin mr-2">⚙️</span><span>AI Analyzing iGOT Karmayogi Catalog...</span>`;
  }

  showToast("🤖 Generating AI Course Recommendations from iGOT Karmayogi...");

  try {
    // Persist target position to profile
    await fetch(`/api/v1/profile/${currentEmployeeId}/target-position`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_job_role_id: targetId })
    }).catch(e => console.warn("Failed to persist target role:", e));

    const res = await fetch('/api/v1/ai/recommend-igot-courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: currentEmployeeId || 1,
        current_job_role_id: currentId,
        target_job_role_id: targetId
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to generate AI course recommendations." }));
      throw new Error(err.detail || "Failed to generate AI course recommendations.");
    }

    const data = await res.json();
    state.aiCoursePlan = data;
    state.cadreWizardStep = 3;
    showToast(`✨ AI generated ${data.recommended_courses.length} targeted iGOT courses for your transition!`);
    loadView('dashboard');
  } catch (e) {
    showToast("Error running AI Course Recommender: " + e.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>✨ Suggest iGOT Courses with AI 🚀</span>`;
    }
  }
}

// Backward compatibility
async function executeAICourseRecommender() {
  await submitTargetPositionAndRunAI();
}

async function enrollInCourse(courseId, courseTitle = "Course", btnElement = null) {
  let btn = btnElement;
  if (!btn && typeof event !== 'undefined' && event && event.currentTarget) {
    btn = event.currentTarget;
  }
  if (!btn) {
    btn = document.getElementById(`enroll-btn-${courseId}`);
  }
  const originalHtml = btn ? btn.innerHTML : '';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="inline-block animate-spin mr-1">⚙️</span><span>Enrolling via iGOT API...</span>`;
  }

  try {
    showToast(`⚡ Contacting iGOT Karmayogi Bharat API gateway...`);
    const res = await fetch('/api/v1/courses/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: currentEmployeeId || 1,
        course_id: courseId
      })
    }).then(r => r.json());

    if (res.status === 'SUCCESS' || res.status === 'ALREADY_ENROLLED') {
      showToast(`🎉 ${res.message || 'Enrolled successfully via iGOT API!'}`);

      if (btn) {
        btn.className = "px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center space-x-1 cursor-default shadow-xs";
        btn.innerHTML = `<span>✓ Enrolled on iGOT</span>`;
        btn.disabled = true;
      }

      // Synchronize in local objects if present
      if (state.aiCoursePlan && state.aiCoursePlan.recommended_courses) {
        state.aiCoursePlan.recommended_courses.forEach(c => {
          if (c.id === courseId) c.is_enrolled = true;
        });
      }
    } else {
      showToast(`Enrollment notice: ${res.detail || res.message || 'Service unavailable'}`);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    }
  } catch (e) {
    console.error("iGOT enrollment error:", e);
    showToast("Enrollment failed. Please check network connection.");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

function enrollCourse(courseId, btnElement = null) {
  return enrollInCourse(courseId, "Course", btnElement);
}

async function openIGOTCoursePlayer(courseId) {
  const modal = document.getElementById('igot-player-modal');
  if (!modal) return;
  const titleEl = document.getElementById('igot-modal-course-title');
  const bodyEl = document.getElementById('igot-modal-body');
  const footerActionEl = document.getElementById('igot-modal-action-buttons');
  const extLinkEl = document.getElementById('igot-modal-external-link');

  modal.classList.remove('hidden');
  bodyEl.innerHTML = `<div class="p-12 text-center text-slate-500"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-govNavy-700 mb-3"></i>Connecting to iGOT Karmayogi Course Stream...</div>`;
  if (window.lucide) lucide.createIcons();

  try {
    const course = await fetch(`/api/v1/courses/${courseId}/igot-preview`).then(r => r.json());
    if (titleEl) titleEl.textContent = course.title;
    if (extLinkEl) extLinkEl.href = course.external_url || "https://igotkarmayogi.gov.in";

    bodyEl.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Interactive Player Panel -->
        <div class="lg:col-span-2 space-y-4">
          <div class="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video shadow-lg border border-slate-800 flex flex-col justify-between p-5 text-white">
            <div class="flex justify-between items-center text-xs">
              <span class="bg-amber-500 text-slate-950 font-extrabold px-2.5 py-1 rounded-md">iGOT Interactive Lab</span>
              <span class="text-slate-300 font-mono">${course.duration_hours} Total Hours • ${course.skill_level}</span>
            </div>
            
            <div class="text-center my-auto space-y-2">
              <a href="${course.external_url || 'https://igotkarmayogi.gov.in'}" target="_blank" rel="noopener noreferrer" class="w-14 h-14 mx-auto rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center cursor-pointer hover:scale-110 transition shadow-lg inline-flex">
                <i data-lucide="play" class="w-7 h-7 fill-current ml-1"></i>
              </a>
              <h4 class="font-bold text-sm text-slate-100">${course.title}</h4>
              <p class="text-xs text-slate-400 max-w-md mx-auto">Official Statistical Training Module synthesized for MoSPI Cadres & Capacity Building</p>
            </div>

            <div class="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>Provider: <b class="text-white">${course.provider}</b></span>
              <span>Format: <b class="text-white">Blended e-Learning</b></span>
            </div>
          </div>

          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <h4 class="font-bold text-sm text-govNavy-900 flex items-center space-x-2">
              <i data-lucide="book-open" class="w-4 h-4 text-govNavy-700"></i>
              <span>Curriculum & Learning Objectives</span>
            </h4>
            <p class="text-xs text-slate-600 leading-relaxed">${course.description || "In-depth official statistical capability building module aligned with MoSPI standards and National Statistical Office mandates."}</p>
          </div>
        </div>

        <!-- Syllabus & Module Structure -->
        <div class="space-y-4">
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h4 class="font-bold text-sm text-govNavy-900 flex items-center space-x-2">
              <i data-lucide="list-checks" class="w-4 h-4 text-emerald-600"></i>
              <span>Syllabus Modules (${course.syllabus ? course.syllabus.length : 4})</span>
            </h4>
            <div class="space-y-2.5">
              ${(course.syllabus || []).map((m, idx) => `
                <div class="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-xs flex items-start space-x-2.5">
                  <span class="w-5 h-5 rounded-full bg-govNavy-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">${idx + 1}</span>
                  <div>
                    <p class="font-bold text-slate-800 text-[11px] leading-tight">${m}</p>
                    <span class="text-[10px] text-slate-400 font-medium">Self-Paced • Video & Exercises</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    if (footerActionEl) {
      footerActionEl.innerHTML = `
        <button id="igot-modal-enroll-btn" type="button" onclick="enrollInCourse(${course.id}, '${course.title.replace(/'/g, "\\'")}', this)" class="px-4 py-2 bg-govNavy-900 hover:bg-govNavy-800 text-white font-bold rounded-lg text-xs transition flex items-center space-x-1.5 shadow-xs">
          <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-400"></i>
          <span>1-Click Enroll via iGOT API</span>
        </button>
        <a href="${course.external_url || 'https://igotkarmayogi.gov.in'}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center space-x-1.5 shadow-xs">
          <span>Launch on Official iGOT Portal</span>
          <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
        </a>
      `;
    }
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error("iGOT player error:", err);
    bodyEl.innerHTML = `<div class="p-8 text-center text-red-600 font-semibold">Failed to load course details from iGOT API.</div>`;
  }
}

function closeIGOTPlayerModal() {
  const modal = document.getElementById('igot-player-modal');
  if (modal) modal.classList.add('hidden');
}


function openAIIntegrationGuideModal() {
  let modal = document.getElementById('ai-guide-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ai-guide-modal';
    modal.className = "fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-start border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2.5">
          <div class="w-9 h-9 rounded-xl bg-govNavy-900 text-white flex items-center justify-center font-bold">
            🤖
          </div>
          <div>
            <h3 class="text-base font-bold text-govNavy-900">How to Integrate Any AI Model</h3>
            <p class="text-xs text-slate-500">Google Gemini • OpenAI GPT-4o • Local Ollama (Mistral/Llama) • Grounded RAG</p>
          </div>
        </div>
        <button onclick="document.getElementById('ai-guide-modal').remove()" class="text-slate-400 hover:text-slate-700 p-1 text-xl font-bold">✕</button>
      </div>

      <div class="space-y-3 text-xs text-slate-700">
        <div class="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
          <h4 class="font-bold text-emerald-900 flex items-center space-x-1.5 mb-1">
            <span>✅ Built-in Grounded Statistical RAG (Currently Active)</span>
          </h4>
          <p class="text-emerald-800 leading-relaxed">
            Your platform is already equipped with our zero-cost, offline <b>Grounded Semantic RAG Engine</b>. It automatically maps MoSPI Cadre competencies against the iGOT Karmayogi catalog without requiring external API keys.
          </p>
        </div>

        <div class="space-y-3 pt-2">
          <h4 class="font-bold text-govNavy-900 uppercase tracking-wider text-[11px]">To Connect External AI Providers:</h4>
          
          <!-- Gemini -->
          <div class="border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition">
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold text-blue-700 text-xs">1. Google Gemini 1.5 Flash / Pro (Recommended)</span>
              <span class="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">GEMINI_API_KEY</span>
            </div>
            <p class="text-slate-600 mb-2">Get a free key from <a href="https://aistudio.google.com/" target="_blank" class="text-blue-600 underline font-semibold">Google AI Studio</a>. Set it in your environment or <code class="bg-slate-100 px-1 py-0.5 rounded font-mono">.env</code>:</p>
            <pre class="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-[11px] font-mono overflow-x-auto">export GEMINI_API_KEY="AIzaSy..."</pre>
          </div>

          <!-- OpenAI -->
          <div class="border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition">
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold text-emerald-700 text-xs">2. OpenAI GPT-4o / GPT-4o-mini</span>
              <span class="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">OPENAI_API_KEY</span>
            </div>
            <p class="text-slate-600 mb-2">Generate an API key from <a href="https://platform.openai.com/" target="_blank" class="text-emerald-600 underline font-semibold">OpenAI Platform</a>:</p>
            <pre class="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-[11px] font-mono overflow-x-auto">export OPENAI_API_KEY="sk-proj-..."</pre>
          </div>

          <!-- Ollama -->
          <div class="border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition">
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold text-purple-700 text-xs">3. Local Ollama (Llama 3 / Mistral 7B — Fully Offline & Private)</span>
              <span class="text-[10px] bg-purple-50 text-purple-800 px-2 py-0.5 rounded font-mono font-bold">OLLAMA_BASE_URL</span>
            </div>
            <p class="text-slate-600 mb-2">Run Ollama on your machine (<code class="bg-slate-100 px-1 py-0.5 rounded font-mono">ollama run llama3</code>). Zero data leaves your government network:</p>
            <pre class="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-[11px] font-mono overflow-x-auto">export OLLAMA_BASE_URL="http://localhost:11434"</pre>
          </div>
        </div>
      </div>

      <div class="pt-3 border-t border-slate-100 flex justify-end">
        <button onclick="document.getElementById('ai-guide-modal').remove()" class="px-4 py-2 bg-govNavy-900 text-white font-bold rounded-lg text-xs hover:bg-govNavy-800">
          Got It, Close
        </button>
      </div>
    </div>
  `;
}


function setupPersonaNavigation() {
  const navContainer = document.getElementById('sidebar-nav');
  let navItems = [];

  if (currentPersona === 'arun.kumar') {
    navItems = [
      { id: 'dashboard', label: t('nav.dashboard'), icon: 'layout-dashboard' },
      { id: 'mcq_test_studio', label: t('nav.mcqExam'), icon: 'award' },
      { id: 'competencies', label: t('nav.competencies'), icon: 'check-circle' },
      { id: 'skill_gaps', label: t('nav.skillGaps'), icon: 'git-pull-request' },
      { id: 'learning_paths', label: t('nav.learningPaths'), icon: 'map' },
      { id: 'courses', label: t('nav.courses'), icon: 'book-open' },
      { id: 'assessments', label: t('nav.assessments'), icon: 'check-square' }
    ];
  } else if (currentPersona === 'priya.sharma') {
    navItems = [
      { id: 'trainer_studio', label: t('nav.trainerStudio'), icon: 'cpu' },
      { id: 'mcq_test_studio', label: t('nav.mcqExam'), icon: 'award' },
      { id: 'assessments', label: t('nav.assessments'), icon: 'check-square' },
      { id: 'courses', label: t('nav.courses'), icon: 'book-open' },
      { id: 'analytics', label: t('nav.analytics'), icon: 'pie-chart' }
    ];
  } else if (currentPersona === 'rajesh.verma') {
    navItems = [
      { id: 'analytics', label: t('nav.analytics'), icon: 'pie-chart' },
      { id: 'mcq_test_studio', label: t('nav.mcqExam'), icon: 'award' },
      { id: 'dashboard', label: t('nav.dashboard'), icon: 'layout-dashboard' },
      { id: 'courses', label: t('nav.courses'), icon: 'book-open' },
      { id: 'admin', label: t('nav.admin'), icon: 'settings' }
    ];
  } else {
    navItems = [
      { id: 'admin', label: t('nav.admin'), icon: 'settings' },
      { id: 'mcq_test_studio', label: t('nav.mcqExam'), icon: 'award' },
      { id: 'analytics', label: t('nav.analytics'), icon: 'pie-chart' },
      { id: 'dashboard', label: t('nav.dashboard'), icon: 'layout-dashboard' },
      { id: 'trainer_studio', label: t('nav.trainerStudio'), icon: 'cpu' }
    ];
  }

  navContainer.innerHTML = navItems.map(item => `
    <button onclick="loadView('${item.id}')" class="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition ${activeView === item.id ? 'bg-govNavy-800 text-white font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}">
      <i data-lucide="${item.icon}" class="w-4 h-4 shrink-0 ${activeView === item.id ? 'text-saffron-500' : 'text-slate-400'}"></i>
      <span class="truncate">${item.label}</span>
    </button>
  `).join('');

  lucide.createIcons();
}

// -------------------------------------------------------------
// 4. View Router & View Renderers
// -------------------------------------------------------------
async function loadView(viewName) {
  activeView = viewName;
  setupPersonaNavigation();
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="p-12 text-center text-slate-400"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-govNavy-700 mb-3"></i><p>Loading cadre intelligence view...</p></div>`;
  lucide.createIcons();

  try {
    if (viewName === 'dashboard') {
      await renderDashboardView(main);
    } else if (viewName === 'mcq_test_studio') {
      await renderMCQTestPageView(main);
    } else if (viewName === 'competencies') {
      await renderCompetenciesView(main);
    } else if (viewName === 'skill_gaps') {
      await renderSkillGapsView(main);
    } else if (viewName === 'learning_paths') {
      await renderLearningPathsView(main);
    } else if (viewName === 'courses') {
      await renderCoursesView(main);
    } else if (viewName === 'assessments') {
      await renderAssessmentsView(main);
    } else if (viewName === 'trainer_studio') {
      await renderTrainerStudioView(main);
    } else if (viewName === 'analytics') {
      await renderAnalyticsView(main);
    } else if (viewName === 'admin') {
      await renderAdminView(main);
    }
  } catch (err) {
    console.error("View rendering error:", err);
    main.innerHTML = `<div class="bg-red-50 p-6 rounded-xl border border-red-200 text-red-700"><h4 class="font-bold mb-1">Error Loading View</h4><p class="text-xs">${err.message}</p></div>`;
  }
  lucide.createIcons();
}

// -------------------------------------------------------------
// 5. VIEW: Employee Dashboard
// -------------------------------------------------------------
async function renderDashboardView(container) {
  const [profileRes, gapsRes, recsRes, targetPosRes] = await Promise.all([
    fetch(`/api/v1/employees/me?employee_id=${currentEmployeeId}`).then(r => r.json()),
    fetch(`/api/v1/skill-gaps/my-gaps?employee_id=${currentEmployeeId}`).then(r => r.json()),
    fetch(`/api/v1/recommendations/my-recommendations?employee_id=${currentEmployeeId}`).then(r => r.json()),
    fetch(`/api/v1/profile/${currentEmployeeId}/target-position`).then(r => r.json()).catch(() => null)
  ]);

  state.profile = profileRes;
  state.skillGaps = gapsRes;
  state.recommendations = recsRes;
  state.targetPosRes = targetPosRes;

  const curRoleId = state.selectedCurrentRoleId || targetPosRes?.current_role?.id || 1;
  state.selectedCurrentRoleId = curRoleId;

  const currentRoleObj = targetPosRes?.available_roles?.find(r => r.id === curRoleId) || targetPosRes?.current_role;
  const currentLevel = currentRoleObj?.hierarchy_level || curRoleId;

  // Filter target roles to ONLY those with hierarchy level strictly higher than currentLevel
  const eligibleTargetRoles = (targetPosRes?.available_roles || []).filter(r => (r.hierarchy_level || r.id) > currentLevel);

  let targetRoleId = state.selectedTargetRoleId;
  if (!targetRoleId || !eligibleTargetRoles.some(r => r.id === targetRoleId)) {
    targetRoleId = eligibleTargetRoles.length > 0 ? eligibleTargetRoles[0].id : null;
    state.selectedTargetRoleId = targetRoleId;
  }

  // Defaults to step 1 (1st Ask their position, then 2nd ask target position)
  if (!state.cadreWizardStep) {
    state.cadreWizardStep = 1;
  }
  const wizardStep = state.cadreWizardStep;

  // If in step 3 and AI course plan isn't loaded yet, fetch it
  if (wizardStep === 3 && !state.aiCoursePlan && targetPosRes && targetRoleId) {
    try {
      state.aiCoursePlan = await fetch('/api/v1/ai/recommend-igot-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: currentEmployeeId || 1,
          current_job_role_id: curRoleId,
          target_job_role_id: targetRoleId
        })
      }).then(r => r.json());
    } catch (e) {
      console.error("Error fetching AI course plan:", e);
    }
  }

  const aiPlan = state.aiCoursePlan;
  const topGaps = gapsRes.slice(0, 4);
  const topRecs = recsRes.slice(0, 2);

  const targetRoleObj = targetPosRes?.available_roles?.find(r => r.id === targetRoleId) || eligibleTargetRoles[0] || targetPosRes?.target_role;

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- Greeting & Cadre Header Card -->
      <div class="gov-card p-6 bg-gradient-to-r from-govNavy-800 to-govNavy-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span class="text-xs uppercase font-bold tracking-widest text-saffron-500 bg-govNavy-700/60 px-2.5 py-1 rounded">Indian Statistical System (ISS / SSS)</span>
          <h2 class="text-xl font-bold mt-2">${t('dash.greeting')}, ${profileRes.full_name}</h2>
          <p class="text-xs text-slate-300 mt-1">${profileRes.designation} • ${profileRes.department_name}</p>
        </div>
        <div class="flex items-center space-x-3">
          <button onclick="loadView('assessments')" class="px-3.5 py-2 bg-saffron-500 text-govNavy-950 font-semibold rounded-lg text-xs hover:bg-saffron-400 transition shadow">
            Take Adaptive Assessment
          </button>
          <button onclick="toggleAIAssistant()" class="px-3.5 py-2 bg-govNavy-700 text-white font-semibold rounded-lg text-xs hover:bg-govNavy-600 transition border border-govNavy-600">
            Consult AI Copilot
          </button>
        </div>
      </div>

      <!-- AI Cadre Pathway & iGOT Course Recommender Card (Sequential Flow: 1st Position -> 2nd Target -> AI iGOT Courses) -->
      ${targetPosRes ? `
      <div class="bg-white p-6 rounded-2xl shadow-md border-2 border-slate-200 text-slate-800 relative overflow-hidden space-y-5">
        
        <!-- Header Strip (AI integrated directly in backend, no user prompts/modal) -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-4">
          <div class="flex items-center space-x-2.5">
            <span class="w-10 h-10 rounded-xl bg-govNavy-900 text-white flex items-center justify-center font-bold text-lg shadow">
              🤖
            </span>
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-base sm:text-lg font-black text-govNavy-900">AI Cadre Pathway & iGOT Course Recommender</h3>
                <span class="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full border border-purple-200">AI & RAG Powered</span>
              </div>
              <p class="text-xs text-slate-500">1st: Specify Current Position • 2nd: Specify Target Position • 3rd: AI Curates iGOT Karmayogi Courses</p>
            </div>
          </div>
          
          <div class="text-xs font-semibold text-slate-600 flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Backend AI Suggestion Engine Active</span>
          </div>
        </div>

        <!-- Interactive 3-Step Wizard Navigation Stepper -->
        <div class="flex items-center flex-wrap gap-2 pb-2 border-b border-slate-100">
          <!-- Step 1 Tab -->
          <button type="button" onclick="setCadreWizardStep(1)" class="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${wizardStep === 1 ? 'bg-govNavy-900 text-white shadow-sm ring-2 ring-govNavy-700/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
            <span class="w-5 h-5 rounded-full ${wizardStep === 1 ? 'bg-saffron-500 text-govNavy-950 font-black' : 'bg-slate-300 text-slate-700 font-bold'} flex items-center justify-center text-[10px]">1</span>
            <span>1st: Current Position</span>
            ${state.selectedCurrentRoleId ? '<span class="text-emerald-400 text-xs">✓</span>' : ''}
          </button>

          <span class="text-slate-300 font-bold">➔</span>

          <!-- Step 2 Tab -->
          <button type="button" onclick="setCadreWizardStep(2)" class="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${wizardStep === 2 ? 'bg-govNavy-900 text-white shadow-sm ring-2 ring-govNavy-700/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
            <span class="w-5 h-5 rounded-full ${wizardStep === 2 ? 'bg-saffron-500 text-govNavy-950 font-black' : 'bg-slate-300 text-slate-700 font-bold'} flex items-center justify-center text-[10px]">2</span>
            <span>2nd: Expected Target Position</span>
            ${state.selectedTargetRoleId ? '<span class="text-emerald-400 text-xs">✓</span>' : ''}
          </button>

          <span class="text-slate-300 font-bold">➔</span>

          <!-- Step 3 Tab -->
          <button type="button" onclick="setCadreWizardStep(3)" class="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${wizardStep === 3 ? 'bg-govNavy-900 text-white shadow-sm ring-2 ring-govNavy-700/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
            <span class="w-5 h-5 rounded-full ${wizardStep === 3 ? 'bg-saffron-500 text-govNavy-950 font-black' : 'bg-slate-300 text-slate-700 font-bold'} flex items-center justify-center text-[10px]">3</span>
            <span>✨ AI iGOT Courses</span>
          </button>
        </div>

        <!-- STEP 1: 1st Ask Their Position -->
        ${wizardStep === 1 ? `
        <div class="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 space-y-4">
          <div class="flex items-start space-x-3">
            <div class="w-9 h-9 rounded-xl bg-govNavy-900 text-white flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
              1st
            </div>
            <div>
              <h4 class="text-base font-black text-govNavy-900">What is your Current Official Position?</h4>
              <p class="text-xs text-slate-600 mt-0.5">Please specify your active designation within the Indian Statistical System (ISS / SSS) cadre hierarchy.</p>
            </div>
          </div>

          <div class="max-w-2xl space-y-3 pt-2">
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Select Your Current Cadre Role:</label>
            <select id="wizard-current-position" class="w-full bg-white text-slate-900 font-bold text-sm py-3 px-4 rounded-xl border-2 border-slate-300 focus:border-govNavy-800 focus:ring-2 focus:ring-govNavy-700/20 cursor-pointer shadow-sm">
              ${targetPosRes.available_roles.map(r => `
                <option value="${r.id}" ${r.id === curRoleId ? 'selected' : ''}>
                  📋 ${r.title} (Level ${r.hierarchy_level || r.id}) ${r.id === targetPosRes.current_role.id ? '• Active Profile' : ''}
                </option>
              `).join('')}
            </select>

            <div class="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center space-x-2.5">
              <span class="text-base">ℹ️</span>
              <span>Next, you will be asked to select your target promotional position higher than Level ${currentLevel}.</span>
            </div>

            <div class="pt-3 flex justify-end">
              <button type="button" onclick="submitCurrentPosition()" class="py-3 px-6 bg-govNavy-900 hover:bg-govNavy-800 text-white font-bold rounded-xl text-sm transition shadow-md flex items-center space-x-2.5 cursor-pointer">
                <span>Continue to 2nd Question: Target Position</span>
                <span class="text-saffron-400 font-bold text-base">➔</span>
              </button>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- STEP 2: 2nd Ask Target Position (Strictly higher in hierarchy) -->
        ${wizardStep === 2 ? `
        <div class="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div class="flex items-start space-x-3">
              <div class="w-9 h-9 rounded-xl bg-saffron-500 text-govNavy-950 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                2nd
              </div>
              <div>
                <h4 class="text-base font-black text-govNavy-900">Which Target Cadre Position are you Expecting / Aiming For?</h4>
                <p class="text-xs text-slate-600 mt-0.5">Select an aspirational promotional milestone strictly higher than your current position.</p>
              </div>
            </div>

            <!-- Current Position Confirmed Badge -->
            <div class="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs flex items-center space-x-2 shrink-0 self-start sm:self-center shadow-2xs">
              <span class="text-slate-500">1st Position Confirmed:</span>
              <b class="text-govNavy-900 font-bold">${currentRoleObj ? currentRoleObj.title : 'Current Role'} (Level ${currentLevel})</b>
              <button type="button" onclick="setCadreWizardStep(1)" class="text-blue-600 hover:underline text-[11px] font-bold cursor-pointer">✎ Change</button>
            </div>
          </div>

          <div class="max-w-2xl space-y-3 pt-2">
            ${eligibleTargetRoles.length > 0 ? `
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Select Promotional Target Role (Higher Seniority Cadre):</label>
              <select id="wizard-target-position" class="w-full bg-white text-slate-900 font-bold text-sm py-3 px-4 rounded-xl border-2 border-saffron-400 focus:border-govNavy-800 focus:ring-2 focus:ring-govNavy-700/20 cursor-pointer shadow-sm">
                ${eligibleTargetRoles.map(r => `
                  <option value="${r.id}" ${r.id === targetRoleId ? 'selected' : ''}>
                    🎯 ${r.title} (Level ${r.hierarchy_level || r.id}) ${r.id === targetPosRes.target_role.id ? '• Recommended Next Promotion' : ''}
                  </option>
                `).join('')}
              </select>

              <div class="bg-blue-50 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center space-x-2.5">
                <span class="text-base">💡</span>
                <span>The backend AI will compare your current competencies against this target role and curate custom iGOT Karmayogi modules.</span>
              </div>

              <div class="pt-3 flex items-center justify-between flex-wrap gap-2">
                <button type="button" onclick="setCadreWizardStep(1)" class="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer">
                  ← Back to 1st Question
                </button>
                <button type="button" id="btn-wizard-run-ai" onclick="submitTargetPositionAndRunAI()" class="py-3 px-6 bg-govNavy-900 hover:bg-govNavy-800 text-white font-black rounded-xl text-sm transition shadow-lg flex items-center space-x-2 cursor-pointer border border-govNavy-950">
                  <span>✨ Suggest iGOT Courses with AI</span>
                  <span class="text-saffron-400 font-bold">🚀</span>
                </button>
              </div>
            ` : `
              <div class="bg-amber-50 p-5 rounded-xl border border-amber-300 text-amber-900 space-y-2">
                <div class="flex items-center space-x-2">
                  <span class="text-2xl">🏆</span>
                  <h5 class="font-bold text-sm">Top Cadre Tier Attained (${currentRoleObj?.title || 'Director'})</h5>
                </div>
                <p class="text-xs leading-relaxed">
                  Your current position is at the highest cadre executive tier (Level ${currentLevel}). There are no higher promotional roles in this cadre hierarchy. You can review existing competency benchmarks or select an earlier cadre level in Step 1 to test career progressions.
                </p>
                <div class="pt-2">
                  <button type="button" onclick="setCadreWizardStep(1)" class="py-2 px-4 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg text-xs transition cursor-pointer">
                    ← Change Current Position (Step 1)
                  </button>
                </div>
              </div>
            `}
          </div>
        </div>
        ` : ''}

        <!-- STEP 3: AI Recommendations & iGOT Course Catalog -->
        ${wizardStep === 3 ? `
        <div class="space-y-4">
          <!-- Active Career Pathway Summary Ribbon -->
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div class="flex items-center space-x-2.5 text-xs flex-wrap gap-y-1">
              <span class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Active Career Pathway:</span>
              <span class="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-300">
                1st: ${currentRoleObj?.title || 'Current Role'} (Level ${currentLevel})
              </span>
              <span class="text-govNavy-700 font-bold text-sm">➔</span>
              <span class="font-black text-govNavy-900 bg-saffron-100 text-govNavy-950 px-2.5 py-1 rounded-lg border border-saffron-300">
                2nd Target: ${targetRoleObj?.title || 'Target Role'} (Level ${targetRoleObj?.hierarchy_level || ''})
              </span>
            </div>
            <div class="flex items-center space-x-2">
              <button type="button" onclick="setCadreWizardStep(1)" class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs border border-slate-300 transition cursor-pointer shadow-2xs flex items-center space-x-1">
                <span>✎</span>
                <span>Change Positions</span>
              </button>
              <button type="button" onclick="submitTargetPositionAndRunAI()" class="px-3 py-1.5 bg-govNavy-900 hover:bg-govNavy-800 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs flex items-center space-x-1">
                <span>🔄</span>
                <span>Re-run AI</span>
              </button>
            </div>
          </div>

          ${aiPlan ? `
          <!-- AI Summary & Promotion Readiness Split -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            
            <!-- AI Strategic Transition Roadmap -->
            <div class="lg:col-span-2 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 p-4 rounded-xl border border-blue-200 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center space-x-1">
                    <span>🧠</span>
                    <span>AI Strategic Transition Roadmap</span>
                  </span>
                  <span class="text-[10px] bg-white text-slate-700 px-2 py-0.5 rounded font-mono border border-blue-200 font-bold">
                    ⚡ ${aiPlan.ai_model_used}
                  </span>
                </div>
                <p class="text-xs text-slate-800 leading-relaxed font-medium">${aiPlan.ai_roadmap_summary}</p>
              </div>
              <div class="pt-2 border-t border-blue-100/80 text-[11px] text-blue-950/80 italic">
                <b>MoSPI Cadre Alignment:</b> ${aiPlan.ai_pedagogical_rationale}
              </div>
            </div>

            <!-- Promotion Readiness Meter -->
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center space-x-4 shadow-2xs">
              <div class="text-center shrink-0">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full border-4 ${aiPlan.promotion_readiness_pct >= 85 ? 'border-emerald-600 text-emerald-800 bg-emerald-50' : aiPlan.promotion_readiness_pct >= 70 ? 'border-amber-500 text-amber-800 bg-amber-50' : 'border-red-500 text-red-800 bg-red-50'} shadow-sm">
                  <span class="text-xl font-black text-slate-900">${aiPlan.promotion_readiness_pct}%</span>
                </div>
                <p class="text-[9px] text-slate-600 mt-1 uppercase tracking-wider font-bold">Readiness</p>
              </div>
              <div class="space-y-1 text-left min-w-0">
                <span class="inline-block px-2 py-0.5 text-[10px] font-bold rounded ${aiPlan.promotion_readiness_pct >= 85 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : aiPlan.promotion_readiness_pct >= 70 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-red-100 text-red-900 border border-red-300'}">
                  ${aiPlan.readiness_status}
                </span>
                <p class="text-xs text-slate-700 font-medium truncate">Target: <b class="text-govNavy-900 font-bold">${aiPlan.target_role.title}</b></p>
                <p class="text-[10px] text-slate-500">${aiPlan.competency_deltas.filter(g => !g.is_met).length} benchmark gaps require elevation</p>
              </div>
            </div>
          </div>

          <!-- AI Curated iGOT Courses Grid -->
          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-govNavy-900 uppercase tracking-wider flex items-center space-x-1.5">
                <span>📚</span>
                <span>AI-Recommended Courses from iGOT Karmayogi (${aiPlan.recommended_courses.length} Targeted Modules)</span>
              </h4>
              <span class="text-[11px] text-slate-500 font-medium">Ranked by promotion delta bridging impact</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              ${aiPlan.recommended_courses.map(c => `
                <div class="bg-white p-4 rounded-xl border-2 border-slate-200 hover:border-govNavy-700 hover:shadow-md transition flex flex-col justify-between space-y-3">
                  <div class="space-y-1.5">
                    <div class="flex justify-between items-start gap-2">
                      <span class="text-[10px] font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                        ${c.provider}
                      </span>
                      <span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                        ${c.match_score_pct}% Match
                      </span>
                    </div>
                    <h5 class="text-xs font-bold text-govNavy-900 line-clamp-2 leading-tight">${c.title}</h5>
                    <p class="text-[11px] text-slate-500 font-medium">${c.duration_hours} Hours • ${c.skill_level} • ${c.phase}</p>
                    
                    <!-- Why AI Recommended This -->
                    <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 space-y-1">
                      <p class="font-bold text-govNavy-800 text-[10px] uppercase tracking-wider">Why AI Selected This:</p>
                      <p class="leading-relaxed text-slate-600 italic">"${c.ai_rationale}"</p>
                    </div>
                  </div>

                  <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div class="flex items-center space-x-2">
                      <button type="button" onclick="openIGOTCoursePlayer(${c.id})" class="text-[11px] font-bold text-govNavy-800 hover:text-govNavy-600 flex items-center space-x-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">
                        <span>Preview</span>
                      </button>
                      <a href="${c.external_url || 'https://igotkarmayogi.gov.in'}" target="_blank" rel="noopener noreferrer" class="text-[11px] font-bold text-blue-600 hover:underline flex items-center space-x-0.5">
                        <span>iGOT ↗</span>
                      </a>
                    </div>
                    <button id="enroll-btn-${c.id}" type="button" onclick="enrollInCourse(${c.id}, '${c.title.replace(/'/g, "\\'")}', this)" class="px-3 py-1.5 ${c.is_enrolled ? 'bg-emerald-600 text-white cursor-default' : 'bg-govNavy-900 hover:bg-govNavy-800 text-white'} font-bold rounded-lg text-xs transition flex items-center space-x-1 cursor-pointer shadow-xs" ${c.is_enrolled ? 'disabled' : ''}>
                      <span>${c.is_enrolled ? '✓ Enrolled' : '⚡ 1-Click Enroll'}</span>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Competency Benchmarks Strip -->
          <div class="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <span class="text-xs text-slate-700 font-bold mr-1">Target Competency Benchmarks:</span>
            ${aiPlan.competency_deltas.slice(0, 6).map(g => `
              <span class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${g.is_met ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-amber-50 text-amber-900 border-amber-300'} shadow-2xs">
                <span class="font-semibold text-slate-800">${g.competency_name}:</span>
                <b class="${g.is_met ? 'text-emerald-700' : 'text-amber-800'} font-bold">${g.current_score}/${g.target_score}</b>
                ${g.is_met ? '<span class="text-emerald-700 font-bold text-xs">✓ Met</span>' : `<span class="text-amber-800 font-bold text-[11px]">(-${g.gap_points} pts)</span>`}
              </span>
            `).join('')}
          </div>
          ` : `
          <div class="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
            <p class="font-bold text-slate-700 mb-2">No AI Recommendation generated yet.</p>
            <button onclick="submitTargetPositionAndRunAI()" class="px-4 py-2 bg-govNavy-900 text-white rounded-lg text-xs font-bold">Run AI Recommender</button>
          </div>
          `}
        </div>
        ` : ''}

      </div>
      ` : ''}

      <!-- Top Metric Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <!-- Overall Competency KPI -->
        <div class="gov-card p-5">
          <p class="text-xs text-slate-500 font-medium">${t('dash.overallComp')}</p>
          <div class="flex items-baseline space-x-2 mt-2">
            <span class="text-3xl font-extrabold text-govNavy-900">${profileRes.overall_competency_score}%</span>
            <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">${t('dash.monthlyGrowth')}</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div class="bg-bharatTeal-500 h-2 rounded-full" style="width: ${profileRes.overall_competency_score}%"></div>
          </div>
          <p class="text-[11px] text-slate-400 mt-2">Level 4 — Advanced Statistical Benchmark</p>
        </div>

        <!-- Verified Evidence Count -->
        <div class="gov-card p-5">
          <p class="text-xs text-slate-500 font-medium">Verified Evidence Records</p>
          <div class="flex items-baseline space-x-2 mt-2">
            <span class="text-3xl font-extrabold text-govNavy-900">14</span>
            <span class="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Multi-Source</span>
          </div>
          <p class="text-[11px] text-slate-500 mt-3">Quizzes (45%), Courses (30%), Experience (25%)</p>
          <button onclick="loadView('competencies')" class="text-xs font-semibold text-bharatTeal-600 hover:underline mt-1 block">View Audit Ledger →</button>
        </div>

        <!-- Prioritized Skill Gaps -->
        <div class="gov-card p-5">
          <p class="text-xs text-slate-500 font-medium">Critical / High Skill Gaps</p>
          <div class="flex items-baseline space-x-2 mt-2">
            <span class="text-3xl font-extrabold text-amber-600">${gapsRes.filter(g => g.priority === 'CRITICAL' || g.priority === 'HIGH').length}</span>
            <span class="text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Action Needed</span>
          </div>
          <p class="text-[11px] text-slate-500 mt-3">Top: AI/ML, Python Data Analytics, Cloud</p>
          <button onclick="loadView('skill_gaps')" class="text-xs font-semibold text-amber-600 hover:underline mt-1 block">View Gap Breakdown →</button>
        </div>

        <!-- Active Recommendations -->
        <div class="gov-card p-5">
          <p class="text-xs text-slate-500 font-medium">Targeted Course Matches</p>
          <div class="flex items-baseline space-x-2 mt-2">
            <span class="text-3xl font-extrabold text-govNavy-900">${recsRes.length}</span>
            <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">iGOT & NSSTA</span>
          </div>
          <p class="text-[11px] text-slate-500 mt-3">Avg Match Score: 92% Alignment</p>
          <button onclick="loadView('learning_paths')" class="text-xs font-semibold text-bharatTeal-600 hover:underline mt-1 block">Inspect Milestone Path →</button>
        </div>

      </div>

      <!-- Main Columns: Gaps & Recommendations -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Left: Top Skill Gaps with Direct CTA -->
        <div class="gov-card p-6">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h3 class="font-bold text-slate-900 text-sm">${t('dash.gapsHeader')}</h3>
              <p class="text-xs text-slate-500">Evaluated against role: ${profileRes.job_role_title}</p>
            </div>
            <button onclick="loadView('skill_gaps')" class="text-xs font-semibold text-bharatTeal-600 hover:underline">Full Report →</button>
          </div>

          <div class="space-y-3">
            ${topGaps.map(gap => `
              <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div class="space-y-1">
                  <div class="flex items-center space-x-2">
                    <span class="font-bold text-xs text-slate-900">${gap.name}</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded ${gap.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' : gap.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">
                      ${gap.priority}
                    </span>
                  </div>
                  <div class="text-[11px] text-slate-500">
                    Assessed: <span class="font-semibold text-slate-700">${gap.current_score}</span> | 
                    Required: <span class="font-semibold text-slate-700">${gap.required_score}</span> | 
                    <span class="text-red-600 font-semibold">Gap: ${gap.gap_score} pts</span>
                  </div>
                </div>
                <button onclick="loadView('learning_paths')" class="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 shrink-0">
                  ${t('action.viewPath')}
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right: AI Recommended Courses with Explainability -->
        <div class="gov-card p-6">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h3 class="font-bold text-slate-900 text-sm">${t('dash.recsHeader')}</h3>
              <p class="text-xs text-slate-500">Algorithmic alignment with current gaps & cadre prerequisites</p>
            </div>
            <button onclick="loadView('courses')" class="text-xs font-semibold text-bharatTeal-600 hover:underline">All Courses →</button>
          </div>

          <div class="space-y-4">
            ${topRecs.map(rec => `
              <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div class="flex justify-between items-start gap-2">
                  <div>
                    <span class="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">${rec.source}</span>
                    <h4 class="font-bold text-xs text-slate-900 mt-1">${rec.title}</h4>
                    <p class="text-[11px] text-slate-500">${rec.provider} • ${rec.duration_hours} hrs • ${rec.skill_level}</p>
                  </div>
                  <span class="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    ${rec.recommendation_score}% Match
                  </span>
                </div>

                <!-- Explainability Box -->
                <div class="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div class="flex items-center space-x-1 font-semibold text-govNavy-900">
                    <i data-lucide="info" class="w-3.5 h-3.5 text-bharatTeal-600"></i>
                    <span>Why recommended?</span>
                  </div>
                  <p class="leading-relaxed">${rec.why_recommended}</p>
                  <div class="flex space-x-3 text-[10px] text-slate-500 pt-1">
                    <span>Gap Fit: <b>${rec.gap_match_score}%</b></span>
                    <span>Role Fit: <b>${rec.role_match_score}%</b></span>
                    <span>Prereq Check: <b class="text-emerald-600">Verified</b></span>
                  </div>
                </div>

                <div class="flex items-center justify-end space-x-2 pt-2">
                  <button type="button" onclick="openIGOTCoursePlayer(${rec.id})" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer">
                    <span>Preview</span>
                  </button>
                  <button id="enroll-btn-${rec.id}" onclick="enrollInCourse(${rec.id}, '${rec.title.replace(/'/g, "\\'")}', this)" class="px-3 py-1.5 bg-govNavy-800 hover:bg-govNavy-700 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer shadow-xs">
                    <span>Enroll on iGOT</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>

      <!-- Competency Growth Chart -->
      <div class="gov-card p-6">
        <h3 class="font-bold text-slate-900 text-sm mb-1">${t('dash.growthHeader')}</h3>
        <p class="text-xs text-slate-500 mb-4">Historical competency progression over recent cadre rounds</p>
        <div class="h-56 w-full">
          <canvas id="growthChart"></canvas>
        </div>
      </div>

    </div>
  `;

  renderGrowthChart();
}

function renderGrowthChart() {
  const ctx = document.getElementById('growthChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026 (Assessed)'],
      datasets: [{
        label: 'Overall Competency Index (%)',
        data: [52, 58, 61, 68, 71, 74],
        borderColor: '#0c2340',
        backgroundColor: 'rgba(12, 35, 64, 0.05)',
        borderWidth: 2.5,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#d97706',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 40,
          max: 100,
          grid: { color: '#f1f5f9' },
          ticks: { font: { size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 } }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// -------------------------------------------------------------
// 6. VIEW: Competency Profile & Evidence Ledger
// -------------------------------------------------------------
async function renderCompetenciesView(container) {
  const comps = await fetch(`/api/v1/competencies/my-competencies?employee_id=${currentEmployeeId}`).then(r => r.json());
  state.competencies = comps;

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-lg font-bold text-govNavy-900">Cadre Competency Profile & Multi-Source Evidence</h2>
          <p class="text-xs text-slate-500">Continuous assessment record grounded in quizzes, practical audits, and course completions</p>
        </div>
        <button onclick="loadView('assessments')" class="px-3 py-2 bg-govNavy-800 text-white rounded-lg text-xs font-semibold hover:bg-govNavy-700">
          Take Assessment
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${comps.map(c => `
          <div class="gov-card p-5 flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-2">
                <div>
                  <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">${c.domain}</span>
                  <h4 class="font-bold text-sm text-slate-900">${c.name}</h4>
                </div>
                <span class="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  ${c.level_title}
                </span>
              </div>

              <div class="flex items-center space-x-3 my-3">
                <div class="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div class="bg-govNavy-800 h-2 rounded-full" style="width: ${c.current_score}%"></div>
                </div>
                <span class="text-xs font-extrabold text-govNavy-900">${c.current_score}%</span>
              </div>

              <div class="flex justify-between text-[11px] text-slate-500 mb-3">
                <span>Confidence: <b class="text-slate-700">${c.confidence_score}%</b></span>
                <span>Evidence Records: <b class="text-slate-700">${c.evidence_count}</b></span>
                <span>Assessed: ${c.last_assessed_at}</span>
              </div>
            </div>

            <button onclick="openEvidenceModal(${c.id})" class="w-full py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-govNavy-900 hover:bg-slate-100 transition flex items-center justify-center space-x-2">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-bharatTeal-600"></i>
              <span>${t('action.viewEvidence')} (${c.evidence_count})</span>
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function openEvidenceModal(empCompId) {
  const modal = document.getElementById('evidence-modal');
  const body = document.getElementById('evidence-modal-body');
  body.innerHTML = `<div class="p-8 text-center text-slate-400"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-govNavy-700 mb-2"></i>Loading audit records...</div>`;
  modal.classList.remove('hidden');
  lucide.createIcons();

  const data = await fetch(`/api/v1/competencies/evidence/${empCompId}`).then(r => r.json());
  document.getElementById('evidence-modal-title').textContent = `${data.competency_name} — Evidence Audit Ledger`;
  document.getElementById('evidence-modal-sub').textContent = `Current Score: ${data.current_score}% | Statistical Confidence: ${data.confidence_score}%`;

  body.innerHTML = `
    <div class="space-y-4">
      <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Registered Evidence Entries</h4>
      <div class="space-y-2">
        ${data.evidences.map(ev => `
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold text-govNavy-900">${ev.evidence_type.replace('_', ' ')}</span>
              <span class="text-slate-400 text-[10px]">${ev.created_at}</span>
            </div>
            <p class="text-slate-600">${ev.description}</p>
            <p class="text-[10px] text-slate-400 mt-1">Source: <span class="font-mono">${ev.source_reference}</span></p>
          </div>
        `).join('')}
      </div>

      ${data.history.length > 0 ? `
        <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mt-4">Score Transition History</h4>
        <div class="space-y-2">
          ${data.history.map(h => `
            <div class="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100 text-xs flex justify-between items-center">
              <div>
                <span class="font-semibold text-slate-800">${h.reason}</span>
                <p class="text-[10px] text-slate-500">${h.recorded_at}</p>
              </div>
              <div class="text-right">
                <span class="font-mono text-slate-600">${h.old_score}% → </span>
                <span class="font-mono font-bold text-govNavy-900">${h.new_score}%</span>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
  lucide.createIcons();
}

function closeEvidenceModal() {
  document.getElementById('evidence-modal').classList.add('hidden');
}

// -------------------------------------------------------------
// 7. VIEW: Skill Gap Analysis
// -------------------------------------------------------------
async function renderSkillGapsView(container) {
  const gaps = await fetch(`/api/v1/skill-gaps/my-gaps?employee_id=${currentEmployeeId}`).then(r => r.json());

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-lg font-bold text-govNavy-900">Cadre Skill Gap Analysis & Priority Ranking</h2>
          <p class="text-xs text-slate-500">Deficits calculated as: Required Role Competency Benchmark - Current Assessed Score</p>
        </div>
        <button onclick="loadView('learning_paths')" class="px-3 py-2 bg-govNavy-800 text-white rounded-lg text-xs font-semibold hover:bg-govNavy-700">
          View Remediation Pathway
        </button>
      </div>

      <!-- Gaps Table -->
      <div class="gov-card overflow-hidden">
        <table class="min-w-full divide-y divide-slate-200 text-xs">
          <thead class="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th class="px-6 py-3 text-left">Competency</th>
              <th class="px-6 py-3 text-left">Domain</th>
              <th class="px-6 py-3 text-center">Assessed Score</th>
              <th class="px-6 py-3 text-center">Role Benchmark</th>
              <th class="px-6 py-3 text-center">Net Gap Delta</th>
              <th class="px-6 py-3 text-center">Priority</th>
              <th class="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 bg-white">
            ${gaps.map(g => `
              <tr class="hover:bg-slate-50">
                <td class="px-6 py-4 font-bold text-slate-900">${g.name}</td>
                <td class="px-6 py-4 text-slate-500">${g.domain}</td>
                <td class="px-6 py-4 text-center font-semibold text-slate-700">${g.current_score}</td>
                <td class="px-6 py-4 text-center font-semibold text-slate-700">${g.required_score}</td>
                <td class="px-6 py-4 text-center font-bold ${g.gap_score > 30 ? 'text-red-600' : g.gap_score > 15 ? 'text-amber-600' : 'text-slate-600'}">
                  ${g.gap_score > 0 ? `-${g.gap_score}` : '0 (Met)'}
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded ${g.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' : g.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : g.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}">
                    ${g.priority}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button onclick="loadView('learning_paths')" class="text-xs font-semibold text-bharatTeal-600 hover:underline">
                    Remediate →
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 8. VIEW: Personalized Learning Pathways
// -------------------------------------------------------------
async function renderLearningPathsView(container) {
  const path = await fetch(`/api/v1/learning-paths/my-path?employee_id=${currentEmployeeId}`).then(r => r.json());

  container.innerHTML = `
    <div class="space-y-6">
      <div class="gov-card p-6 bg-gradient-to-r from-govNavy-800 to-govNavy-900 text-white">
        <span class="text-[10px] uppercase font-bold tracking-wider text-saffron-500 bg-govNavy-700/60 px-2 py-0.5 rounded">Cadre Capacity Building Roadmap</span>
        <h2 class="text-xl font-bold mt-2">${path.title}</h2>
        <p class="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">${path.description}</p>
        <div class="flex items-center space-x-6 mt-4 text-xs">
          <span>Starting: <b>${path.starting_level}</b></span>
          <span>Target: <b>${path.target_level}</b></span>
          <span>Duration: <b>${path.duration_weeks} Weeks</b></span>
          <span>Progress: <b class="text-saffron-500">${path.completion_percentage}%</b></span>
        </div>
      </div>

      <!-- Sequenced Milestones -->
      <div class="gov-card p-6">
        <h3 class="font-bold text-slate-900 text-sm mb-4">Milestone Sequence</h3>
        <div class="space-y-4">
          ${path.milestones.map(m => `
            <div class="flex items-start space-x-4 p-4 rounded-xl border ${m.status === 'CURRENT' ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300' : m.status === 'COMPLETED' ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-60'}">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${m.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : m.status === 'CURRENT' ? 'bg-saffron-500 text-white ring-4 ring-amber-100' : 'bg-slate-300 text-slate-600'}">
                ${m.status === 'COMPLETED' ? '✓' : m.step}
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-center">
                  <h4 class="font-bold text-xs text-slate-900">${m.title}</h4>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded ${m.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : m.status === 'CURRENT' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}">
                    ${m.status}
                  </span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Expected Cadre Competency Gain: <span class="font-medium text-govNavy-900">${m.gain}</span></p>
              </div>
              ${m.status === 'CURRENT' ? `
                <button onclick="loadView('assessments')" class="px-3 py-1.5 bg-govNavy-800 text-white rounded-lg text-xs font-semibold hover:bg-govNavy-700 shrink-0">
                  Assess Now
                </button>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 9. VIEW: Course Catalogue (iGOT & NSSTA)
// -------------------------------------------------------------
async function renderCoursesView(container) {
  const [courses, nsstaProgs] = await Promise.all([
    fetch('/api/v1/courses').then(r => r.json()),
    fetch('/api/v1/nssta/programmes').then(r => r.json())
  ]);

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-lg font-bold text-govNavy-900">National Course Catalogue (iGOT Karmayogi & NSSTA)</h2>
          <p class="text-xs text-slate-500">Verified official courses aligned with the National Statistical Competency Framework</p>
        </div>
      </div>

      <!-- iGOT Courses Grid -->
      <h3 class="font-bold text-sm text-slate-900 flex items-center space-x-2">
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>iGOT Karmayogi Digital Courses</span>
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${courses.map(c => `
          <div class="gov-card p-5 flex flex-col justify-between space-y-3">
            <div>
              <div class="flex justify-between items-start">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">${c.source}</span>
                <span class="text-xs text-slate-500">★ ${c.rating}</span>
              </div>
              <h4 class="font-bold text-xs text-slate-900 mt-2">${c.title}</h4>
              <p class="text-[11px] text-slate-500 mt-1 line-clamp-2">${c.description}</p>
              <div class="flex space-x-3 text-[10px] text-slate-400 mt-2">
                <span>Provider: ${c.provider}</span>
                <span>Duration: ${c.duration_hours} hrs</span>
                <span>Level: ${c.skill_level}</span>
              </div>
            </div>
            <div class="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button type="button" onclick="openIGOTCoursePlayer(${c.id})" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer">
                <span>Preview</span>
              </button>
              <button id="enroll-btn-${c.id}" onclick="enrollInCourse(${c.id}, '${c.title.replace(/'/g, "\\'")}', this)" class="px-3 py-1.5 bg-govNavy-800 hover:bg-govNavy-700 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer shadow-xs">
                <span>Enroll on iGOT</span>
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- NSSTA TPAC Programmes -->
      <h3 class="font-bold text-sm text-slate-900 flex items-center space-x-2 pt-4">
        <span class="w-2 h-2 rounded-full bg-saffron-500"></span>
        <span>NSSTA TPAC Recommended Training Programmes</span>
      </h3>
      <div class="grid grid-cols-1 gap-4">
        ${nsstaProgs.map(p => `
          <div class="gov-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-amber-50/20 border-amber-200">
            <div class="space-y-1">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">${p.source}</span>
              <h4 class="font-bold text-sm text-slate-900">${p.title}</h4>
              <p class="text-xs text-slate-600 max-w-2xl">${p.description}</p>
              <div class="flex flex-wrap gap-3 text-[11px] text-slate-500 pt-1">
                <span>Domain: <b>${p.training_domain}</b></span>
                <span>Mode: <b>${p.mode}</b></span>
                <span>Duration: <b>${p.duration_days} Days</b></span>
                <span class="text-amber-800 font-semibold">Schedule: ${p.schedule}</span>
              </div>
            </div>
            <button onclick="showToast('Nomination request submitted to Cadre Controlling Authority')" class="px-4 py-2 bg-govNavy-800 text-white rounded-lg text-xs font-semibold hover:bg-govNavy-700 shrink-0">
              Request Cadre Nomination
            </button>
          </div>
        `).join('')}
      </div>

    </div>
  `;
}

// -------------------------------------------------------------
// Live Exam Timers (Multi-Level Exam & Standard Quiz Modal)
// -------------------------------------------------------------
let mcqTimerInterval = null;
let mcqSecondsRemaining = 0;

function startMCQExamTimer(durationMinutes) {
  stopMCQExamTimer();
  mcqSecondsRemaining = Math.max(60, (durationMinutes || 36) * 60);
  updateExamTimerDisplays();

  mcqTimerInterval = setInterval(() => {
    mcqSecondsRemaining--;
    updateExamTimerDisplays();

    if (mcqSecondsRemaining <= 0) {
      stopMCQExamTimer();
      showToast("⏰ Assessment time has expired! Auto-evaluating responses...", 5000);
      submitMultiLevelExam();
    }
  }, 1000);
}

function stopMCQExamTimer() {
  if (mcqTimerInterval) {
    clearInterval(mcqTimerInterval);
    mcqTimerInterval = null;
  }
}

function updateExamTimerDisplays() {
  const m = Math.floor(Math.max(0, mcqSecondsRemaining) / 60);
  const s = Math.max(0, mcqSecondsRemaining) % 60;
  const timeFormatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const topTimer = document.getElementById('exam-live-timer');
  if (topTimer) {
    topTimer.textContent = timeFormatted;
    if (mcqSecondsRemaining <= 300) {
      topTimer.classList.add('text-red-600', 'animate-pulse');
      topTimer.classList.remove('text-govNavy-900');
    } else {
      topTimer.classList.remove('text-red-600', 'animate-pulse');
      topTimer.classList.add('text-govNavy-900');
    }
  }

  const bottomTimer = document.getElementById('exam-bottom-timer');
  if (bottomTimer) {
    bottomTimer.textContent = timeFormatted;
    const container = document.getElementById('exam-bottom-timer-container');
    if (container) {
      if (mcqSecondsRemaining <= 300) {
        container.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-900 border border-red-300 text-xs font-bold animate-pulse';
      } else {
        container.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold';
      }
    }
  }
}

// Modal Timer for Standard Quiz
let quizModalTimerInterval = null;
let quizModalSecondsRemaining = 0;

function startQuizModalTimer(durationMinutes) {
  stopQuizModalTimer();
  quizModalSecondsRemaining = Math.max(60, (durationMinutes || 15) * 60);
  updateQuizModalTimerDisplay();

  quizModalTimerInterval = setInterval(() => {
    quizModalSecondsRemaining--;
    updateQuizModalTimerDisplay();

    if (quizModalSecondsRemaining <= 0) {
      stopQuizModalTimer();
      showToast("⏰ Time is up! Submitting your answers...");
      submitQuiz();
    }
  }, 1000);
}

function stopQuizModalTimer() {
  if (quizModalTimerInterval) {
    clearInterval(quizModalTimerInterval);
    quizModalTimerInterval = null;
  }
}

function updateQuizModalTimerDisplay() {
  const m = Math.floor(Math.max(0, quizModalSecondsRemaining) / 60);
  const s = Math.max(0, quizModalSecondsRemaining) % 60;
  const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const el = document.getElementById('quiz-timer');
  if (el) {
    el.textContent = formatted;
    if (quizModalSecondsRemaining <= 120 && el.parentElement) {
      el.parentElement.classList.add('bg-red-900/80', 'text-red-200', 'animate-pulse');
    }
  }
}


// -------------------------------------------------------------
// 9B. VIEW: AI Multi-Level MCQ Examination & NSSTA Studio
// -------------------------------------------------------------
let mcqState = {
  activeTab: 'exam_runner', // 'exam_runner' | 'upload_studio'
  assessments: [],
  selectedAssessmentId: null,
  selectedAssessment: null,
  activeLevelFilter: 0, // 0: All, 1: Level 1, 2: Level 2, 3: Level 3
  answers: {},
  lastSubmissionResult: null,
  courses: [],
  isSubmitting: false,
  isGenerating: false
};

const NSSTA_SAMPLE_GUIDE_TEXT = `NSSTA STATISTICAL CADRE TRAINING MANUAL & METHODOLOGICAL DIRECTIVES (2026)
Module 1: Complex Survey Designs & Sampling Variance Optimization
Primary Sampling Units (PSUs) in national household surveys must strictly adhere to Probability Proportional to Size (PPS) selection based on updated Census EBs. Intra-cluster correlation (rho) severely penalizes variance when cluster take (m) expands. As established in Hansen-Hurwitz and Horvitz-Thompson theory, the Design Effect Deff = 1 + (m-1)*rho. Increasing cluster size under positive intra-cluster correlation inflates standard errors; multi-stage dispersion across geographically balanced PSUs is mandatory.

Module 2: Price Index Compilations & Calibrated Weighting
When item specifications disappear from market observation, pure imputation without hedonic adjustment introduces substantial upward bias in CPI. Laspeyres indices suffer from substitution bias, whereas Törnqvist and Fisher ideal price indexes approximate true Cost of Living Indices (COLI). Calibrated survey re-weighting using GREG ensures demographic consistency across sub-strata.

Module 3: Small Area Estimation (SAE) & Macro Deflation
When domain sample sizes cannot achieve Relative Standard Error (RSE) below 15%, Fay-Herriot area-level empirical best linear unbiased predictors (EBLUP) borrow auxiliary strength from administrative registers (GST, EPFO, satellite nightlights). For Gross Value Added (GVA), single indicator deflation severely distorts real growth when input prices rise faster than output prices; double deflation is the gold standard required for accurate GDP compilation.`;

async function renderMCQTestPageView(container) {
  const [quizzesRes, coursesRes] = await Promise.all([
    fetch('/api/v1/mcq/multilevel-quizzes').then(r => r.json()).catch(() => []),
    fetch('/api/v1/courses').then(r => r.json()).catch(() => [])
  ]);

  mcqState.assessments = quizzesRes;
  mcqState.courses = coursesRes;

  if (!mcqState.selectedAssessmentId && quizzesRes.length > 0) {
    mcqState.selectedAssessmentId = quizzesRes[0].id;
    mcqState.selectedAssessment = quizzesRes[0];
  } else if (mcqState.selectedAssessmentId) {
    mcqState.selectedAssessment = quizzesRes.find(q => q.id === mcqState.selectedAssessmentId) || quizzesRes[0];
  }

  container.innerHTML = `
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- Header Banner -->
      <div class="gov-card p-6 bg-gradient-to-r from-govNavy-900 via-govNavy-800 to-slate-900 text-white relative overflow-hidden shadow-lg">
        <div class="absolute -right-6 -bottom-6 opacity-10 text-white pointer-events-none">
          <i data-lucide="award" class="w-48 h-48"></i>
        </div>
        <div class="relative z-10 space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-saffron-500 text-govNavy-950 uppercase tracking-wider">
              NSSTA • MoSPI • iGOT AI Cadre Testing
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/90">
              Verified Source Grounding
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Levels 1, 2 & 3 Cognitive Taxonomy
            </span>
          </div>

          <h2 class="text-xl md:text-2xl font-black tracking-tight text-white flex items-center space-x-2">
            <span>AI Multi-Level Examination & NSSTA Trainer Studio</span>
          </h2>
          <p class="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Autonomous multi-level assessment synthesizing official NSSTA Trainer Guides and Cadre Course Notes.
            Questions test <b>Level 1 (Foundational & Definitions)</b>, <b>Level 2 (Applied Operations)</b>,
            and <b>Level 3 (Advanced Strategic Analysis)</b> with verifiable citations.
          </p>

          <!-- Studio Navigation Tabs -->
          <div class="flex flex-wrap items-center gap-2 pt-3">
            <button onclick="setMCQStudioTab('exam_runner')" class="px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${mcqState.activeTab === 'exam_runner' ? 'bg-white text-govNavy-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}">
              <i data-lucide="play-circle" class="w-4 h-4 text-saffron-500"></i>
              <span>Take Multi-Level Exam</span>
              <span class="ml-1.5 px-2 py-0.5 bg-govNavy-900 text-white text-[10px] rounded-full font-mono">${quizzesRes.length}</span>
            </button>
            <button onclick="setMCQStudioTab('upload_studio')" class="px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${mcqState.activeTab === 'upload_studio' ? 'bg-white text-govNavy-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}">
              <i data-lucide="upload-cloud" class="w-4 h-4 text-emerald-400"></i>
              <span>Upload Trainer Guide & AI Generator</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Content -->
      ${mcqState.activeTab === 'exam_runner' ? renderExamRunnerHTML() : renderUploadStudioHTML()}
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  if (mcqState.activeTab === 'exam_runner' && mcqState.selectedAssessment && !mcqState.lastSubmissionResult) {
    startMCQExamTimer(mcqState.selectedAssessment.duration_minutes || 36);
  } else {
    stopMCQExamTimer();
  }
}

function setMCQStudioTab(tab) {
  stopMCQExamTimer();
  mcqState.activeTab = tab;
  renderMCQTestPageView(document.getElementById('main-content'));
}

function selectMCQAssessment(id) {
  mcqState.selectedAssessmentId = parseInt(id);
  mcqState.selectedAssessment = mcqState.assessments.find(a => a.id === mcqState.selectedAssessmentId) || null;
  mcqState.answers = {};
  mcqState.lastSubmissionResult = null;
  mcqState.activeLevelFilter = 0;
  renderMCQTestPageView(document.getElementById('main-content'));
}

function filterMCQLevel(lvl) {
  mcqState.activeLevelFilter = lvl;
  renderMCQTestPageView(document.getElementById('main-content'));
}

function selectExamOption(qid, key) {
  mcqState.answers[qid] = key;
  const card = document.getElementById(`q-card-${qid}`);
  if (card) {
    const labels = card.querySelectorAll('.exam-option-label');
    labels.forEach(l => {
      const optKey = l.getAttribute('data-opt-key');
      if (optKey === key) {
        l.className = 'exam-option-label flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition bg-blue-50/80 border-blue-500 ring-2 ring-blue-300 shadow-xs';
        const radio = l.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      } else {
        l.className = 'exam-option-label flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition bg-white';
      }
    });
  }
  updateExamProgressCounter();
}

function updateExamProgressCounter() {
  const current = mcqState.selectedAssessment;
  if (!current) return;
  const answeredCount = Object.keys(mcqState.answers).length;
  const totalCount = current.questions ? current.questions.length : 0;
  const counterEl = document.getElementById('exam-progress-counter');
  if (counterEl) {
    counterEl.textContent = `Answered: ${answeredCount} / ${totalCount} Questions`;
  }
}

function renderExamRunnerHTML() {
  const current = mcqState.selectedAssessment;
  if (!current) {
    return `
      <div class="gov-card p-12 text-center text-slate-500">
        <i data-lucide="alert-circle" class="w-10 h-10 mx-auto text-amber-500 mb-2"></i>
        <h3 class="font-bold text-base text-slate-800">No Multi-Level Assessments Found</h3>
        <p class="text-xs text-slate-500 mt-1">Switch to the 'Upload Trainer Guide & AI Generator' tab to generate your first examination.</p>
      </div>
    `;
  }

  const allQuestions = current.questions || [];
  const filteredQuestions = mcqState.activeLevelFilter === 0
    ? allQuestions
    : allQuestions.filter(q => q.level === mcqState.activeLevelFilter);

  const level1Count = allQuestions.filter(q => q.level === 1).length;
  const level2Count = allQuestions.filter(q => q.level === 2).length;
  const level3Count = allQuestions.filter(q => q.level === 3).length;

  const answeredCount = Object.keys(mcqState.answers).length;
  const hasSubmitted = !!mcqState.lastSubmissionResult;
  const result = mcqState.lastSubmissionResult;

  return `
    <div class="space-y-6">
      <!-- Selector & Assessment Metadata Card -->
      <div class="gov-card p-5 space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Multi-Level Examination</label>
            <select onchange="selectMCQAssessment(this.value)" class="text-xs font-bold text-govNavy-900 border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-1 focus:ring-govNavy-800 max-w-xl">
              ${mcqState.assessments.map(a => `
                <option value="${a.id}" ${a.id === current.id ? 'selected' : ''}>
                  ${a.title} (${a.total_questions} MCQs • ${a.course_title})
                </option>
              `).join('')}
            </select>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-xs text-slate-500">Target Competency:</span>
            <span class="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">${current.competency_name}</span>
          </div>
        </div>

        <!-- Meta Stats & Level Breakdown Badges -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span class="text-[10px] uppercase font-bold text-slate-400">Total Questions</span>
            <p class="text-base font-extrabold text-govNavy-900 mt-0.5">${allQuestions.length} MCQs</p>
          </div>
          <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span class="text-[10px] uppercase font-bold text-slate-400">Passing Score</span>
            <p class="text-base font-extrabold text-govNavy-900 mt-0.5">${current.passing_score}%</p>
          </div>
          <div class="bg-slate-50 p-3 rounded-lg border border-slate-200" id="exam-timer-card">
            <span class="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center space-x-1">
              <i data-lucide="timer" class="w-3 h-3 text-govNavy-700"></i>
              <span>${hasSubmitted ? 'Allocated Duration' : 'Live Exam Timer'}</span>
            </span>
            <p id="exam-live-timer" class="text-base font-extrabold ${hasSubmitted ? 'text-slate-700' : 'text-govNavy-900'} mt-0.5 font-mono">
              ${hasSubmitted ? `${current.duration_minutes} Mins` : `${String(current.duration_minutes || 36).padStart(2, '0')}:00`}
            </p>
          </div>
          <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span class="text-[10px] uppercase font-bold text-slate-400">Linked Course</span>
            <p class="text-xs font-bold text-govNavy-900 mt-1 truncate" title="${current.course_title}">${current.course_title}</p>
          </div>
        </div>

        <!-- Level Filter Tabs -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div class="flex items-center space-x-1.5">
            <span class="text-xs font-semibold text-slate-500 mr-1">Filter by Level:</span>
            <button onclick="filterMCQLevel(0)" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${mcqState.activeLevelFilter === 0 ? 'bg-govNavy-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
              All Levels (${allQuestions.length})
            </button>
            <button onclick="filterMCQLevel(1)" class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${mcqState.activeLevelFilter === 1 ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'}">
              <span>Level 1: Foundational</span>
              <span class="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">${level1Count}</span>
            </button>
            <button onclick="filterMCQLevel(2)" class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${mcqState.activeLevelFilter === 2 ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'}">
              <span>Level 2: Applied</span>
              <span class="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">${level2Count}</span>
            </button>
            <button onclick="filterMCQLevel(3)" class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${mcqState.activeLevelFilter === 3 ? 'bg-purple-600 text-white shadow-xs' : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'}">
              <span>Level 3: Advanced</span>
              <span class="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">${level3Count}</span>
            </button>
          </div>

          <div id="exam-progress-counter" class="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            Answered: ${answeredCount} / ${allQuestions.length} Questions
          </div>
        </div>
      </div>

      <!-- Submission Results Summary Card (If submitted) -->
      ${hasSubmitted ? `
        <div class="gov-card p-6 border-2 ${result.passed ? 'border-emerald-500 bg-emerald-50/20' : 'border-amber-500 bg-amber-50/20'} space-y-5 animate-in fade-in">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
            <div class="flex items-center space-x-3.5">
              <div class="w-14 h-14 rounded-2xl ${result.passed ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'} flex items-center justify-center font-black text-2xl shadow-md">
                ${result.passed ? '✓' : '!'}
              </div>
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${result.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                  ${result.passed ? 'Assessment Certified' : 'Review Required'}
                </span>
                <h3 class="text-lg font-black text-slate-900 mt-1">${result.passed ? 'Multi-Level Examination Passed!' : 'Examination Attempt Evaluated'}</h3>
                <p class="text-xs text-slate-600">Overall Score: <b class="text-govNavy-900">${result.score_percentage}%</b> (${result.total_correct} of ${result.total_questions} correct) • Passing threshold: ${result.passing_score}%</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button onclick="retakeExam()" class="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-xs">
                <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                <span>Retake Exam</span>
              </button>
            </div>
          </div>

          <!-- 3-Level Granular Breakdown -->
          <div>
            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Cognitive Level-Wise Score Breakdown:</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Level 1 -->
              <div class="bg-white p-4 rounded-xl border border-blue-200 shadow-xs space-y-2">
                <div class="flex justify-between items-center text-xs">
                  <span class="font-bold text-blue-900">Level 1: Foundational</span>
                  <span class="font-extrabold text-blue-700">${result.level_breakdown?.level_1?.score_pct || 0}%</span>
                </div>
                <div class="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                  <div class="bg-blue-600 h-2 rounded-full transition-all duration-500" style="width: ${result.level_breakdown?.level_1?.score_pct || 0}%"></div>
                </div>
                <div class="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Conceptual Recall & Formulas</span>
                  <span class="font-bold text-slate-700">${result.level_breakdown?.level_1?.correct || 0} / ${result.level_breakdown?.level_1?.total || 0} Correct</span>
                </div>
              </div>

              <!-- Level 2 -->
              <div class="bg-white p-4 rounded-xl border border-amber-200 shadow-xs space-y-2">
                <div class="flex justify-between items-center text-xs">
                  <span class="font-bold text-amber-900">Level 2: Applied</span>
                  <span class="font-extrabold text-amber-700">${result.level_breakdown?.level_2?.score_pct || 0}%</span>
                </div>
                <div class="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
                  <div class="bg-amber-600 h-2 rounded-full transition-all duration-500" style="width: ${result.level_breakdown?.level_2?.score_pct || 0}%"></div>
                </div>
                <div class="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Operational Survey Problems</span>
                  <span class="font-bold text-slate-700">${result.level_breakdown?.level_2?.correct || 0} / ${result.level_breakdown?.level_2?.total || 0} Correct</span>
                </div>
              </div>

              <!-- Level 3 -->
              <div class="bg-white p-4 rounded-xl border border-purple-200 shadow-xs space-y-2">
                <div class="flex justify-between items-center text-xs">
                  <span class="font-bold text-purple-900">Level 3: Advanced</span>
                  <span class="font-extrabold text-purple-700">${result.level_breakdown?.level_3?.score_pct || 0}%</span>
                </div>
                <div class="w-full bg-purple-100 rounded-full h-2 overflow-hidden">
                  <div class="bg-purple-600 h-2 rounded-full transition-all duration-500" style="width: ${result.level_breakdown?.level_3?.score_pct || 0}%"></div>
                </div>
                <div class="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Strategic Analytical Evaluation</span>
                  <span class="font-bold text-slate-700">${result.level_breakdown?.level_3?.correct || 0} / ${result.level_breakdown?.level_3?.total || 0} Correct</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Profile Competency & Evidence Ledger Boost Notice -->
          <div class="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-9 h-9 rounded-lg bg-govNavy-900 text-saffron-500 flex items-center justify-center font-bold">
                ★
              </div>
              <div>
                <p class="text-xs font-bold text-govNavy-900">Official Cadre Competency Ledger Status</p>
                <p class="text-[11px] text-slate-500">
                  Assessed Cadre Level: <b class="text-govNavy-900">Level ${result.assessed_level} (${result.assessed_level === 3 ? 'Advanced Strategic' : result.assessed_level === 2 ? 'Applied Operational' : 'Foundational'})</b> • Profile Score: <b class="text-emerald-700">${result.updated_competency_score}%</b>
                </p>
              </div>
            </div>
            ${result.passed ? `
              <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">+6.5% Competency Boost</span>
            ` : `
              <span class="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">No Boost — Passing Score (70%) Not Met</span>
            `}
          </div>
        </div>
      ` : ''}

      <!-- Question Cards -->
      <div class="space-y-4">
        ${filteredQuestions.map((q, idx) => {
          const selectedKey = mcqState.answers[q.id];
          const feedbackItem = result?.detailed_feedback?.find(f => f.question_id === q.id);

          // Level styling
          let levelBadgeClass = "bg-blue-50 text-blue-800 border-blue-200";
          let levelTitle = "Level 1: Foundational / Conceptual Recall";
          if (q.level === 2) {
            levelBadgeClass = "bg-amber-50 text-amber-900 border-amber-200";
            levelTitle = "Level 2: Applied / Operational Problem Solving";
          } else if (q.level === 3) {
            levelBadgeClass = "bg-purple-50 text-purple-900 border-purple-200";
            levelTitle = "Level 3: Advanced / Strategic Analytical Evaluation";
          }

          return `
            <div id="q-card-${q.id}" class="gov-card p-6 space-y-4 ${feedbackItem ? (feedbackItem.is_correct ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-red-500') : ''}">
              <!-- Question Header -->
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div class="flex items-center space-x-2">
                  <span class="text-xs font-extrabold text-govNavy-900 bg-slate-100 px-2.5 py-1 rounded-md">Q${idx + 1}</span>
                  <span class="px-2.5 py-1 rounded-md text-xs font-bold border ${levelBadgeClass}">
                    ${levelTitle}
                  </span>
                  ${(q.is_from_uploaded_file || q.source_reference?.includes('Uploaded') || q.source_note_citation?.includes('Uploaded') || q.source_note_citation?.includes('Directly Extracted')) ? `
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                      <span>📄 From Uploaded Notes</span>
                    </span>
                  ` : ''}
                  ${hasSubmitted && feedbackItem ? (
                    feedbackItem.is_correct
                      ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1"><span>✓ Correct (+1)</span></span>`
                      : `<span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-100 text-red-800 border border-red-300 flex items-center space-x-1"><span>✗ Incorrect (0)</span></span>`
                  ) : ''}
                </div>
                <div class="flex items-center space-x-2 text-[11px]">
                  <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">${q.bloom_level || 'Understanding'}</span>
                  <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">${q.difficulty || 'Medium'}</span>
                </div>
              </div>

              <!-- Grounding Source Citations (Trainer Guide & Course Notes) -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div class="flex items-center space-x-2 text-slate-700">
                  <span class="font-bold text-govNavy-900 shrink-0">📖 NSSTA Guide:</span>
                  <span class="truncate text-slate-600" title="${q.source_reference}">${q.source_reference}</span>
                </div>
                <div class="flex items-center space-x-2 text-slate-700">
                  <span class="font-bold text-blue-900 shrink-0">📑 Course Notes:</span>
                  <span class="truncate text-slate-600" title="${q.source_note_citation || current.course_title}">${q.source_note_citation || current.course_title}</span>
                </div>
              </div>

              <!-- Stem -->
              <h4 class="font-bold text-sm text-slate-900 leading-relaxed">${q.stem}</h4>

              <!-- Options -->
              <div class="space-y-2.5 pt-1">
                ${q.options.map(opt => {
                  const isSelected = (selectedKey === opt.key);
                  let optStyle = "border-slate-200 hover:bg-slate-50 bg-white";

                  if (hasSubmitted && feedbackItem) {
                    if (opt.key === feedbackItem.correct_answer) {
                      optStyle = "bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold ring-2 ring-emerald-400 shadow-xs";
                    } else if (isSelected && !feedbackItem.is_correct) {
                      optStyle = "bg-red-50 border-red-500 text-red-900 line-through ring-2 ring-red-400 shadow-xs";
                    } else {
                      optStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                    }
                  } else if (isSelected) {
                    optStyle = "bg-blue-50/80 border-blue-500 ring-2 ring-blue-300 shadow-xs";
                  }

                  return `
                    <label data-opt-key="${opt.key}" class="exam-option-label flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition ${optStyle}" ${!hasSubmitted ? `onclick="selectExamOption(${q.id}, '${opt.key}')"` : ''}>
                      <input type="radio" name="exam_q_${q.id}" value="${opt.key}" ${isSelected ? 'checked' : ''} ${hasSubmitted ? 'disabled' : ''} class="mt-0.5 text-govNavy-800 focus:ring-govNavy-800">
                      <div class="text-xs leading-normal">
                        <span class="font-bold mr-1">${opt.key}.</span>
                        <span>${opt.text}</span>
                        ${hasSubmitted && opt.key === feedbackItem?.correct_answer ? `
                          <span class="ml-2 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">Correct Answer ✓</span>
                        ` : ''}
                        ${hasSubmitted && isSelected && !feedbackItem?.is_correct ? `
                          <span class="ml-2 text-[10px] font-extrabold text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-300">Your Selection (Incorrect) ✗</span>
                        ` : ''}
                      </div>
                    </label>
                  `;
                }).join('')}
              </div>

              <!-- Pedagogical Explanation (Revealed after submission) -->
              ${hasSubmitted && feedbackItem ? `
                <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs animate-in fade-in">
                  <div class="flex items-center space-x-1.5 font-bold ${feedbackItem.is_correct ? 'text-emerald-800' : 'text-slate-800'}">
                    <i data-lucide="${feedbackItem.is_correct ? 'check-circle' : 'info'}" class="w-4 h-4 text-saffron-500"></i>
                    <span>Statistical Methodology & Grounded Rationale (Correct: Option ${feedbackItem.correct_answer}):</span>
                  </div>
                  <p class="text-slate-700 leading-relaxed">${feedbackItem.explanation}</p>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>

      <!-- Action Footer -->
      <div class="gov-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 shadow-xl border-t-2 border-t-govNavy-800 bg-white/95 backdrop-blur-md">
        <div class="flex items-center space-x-4 text-xs text-slate-600">
          <div>
            <span class="font-bold text-govNavy-900">${answeredCount} of ${allQuestions.length}</span> questions answered
            ${answeredCount < allQuestions.length ? `<span class="text-amber-600 font-medium ml-2">(${allQuestions.length - answeredCount} remaining)</span>` : '<span class="text-emerald-600 font-bold ml-2">✓ Ready to Submit</span>'}
          </div>
          ${!hasSubmitted ? `
            <div id="exam-bottom-timer-container" class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold shadow-2xs">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-600 animate-pulse"></i>
              <span>Time Left: <span id="exam-bottom-timer" class="font-mono font-black">${String(current.duration_minutes || 36).padStart(2, '0')}:00</span></span>
            </div>
          ` : ''}
        </div>

        <div class="flex items-center space-x-3 w-full sm:w-auto">
          ${hasSubmitted ? `
            <button onclick="retakeExam()" class="px-5 py-2.5 bg-govNavy-800 text-white rounded-lg text-xs font-bold hover:bg-govNavy-700 transition flex items-center justify-center space-x-2 w-full sm:w-auto shadow-md">
              <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
              <span>Retake Examination</span>
            </button>
          ` : `
            <button id="btn-submit-exam" onclick="submitMultiLevelExam()" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black tracking-wide shadow-md transition flex items-center justify-center space-x-2 w-full sm:w-auto">
              <i data-lucide="send" class="w-4 h-4"></i>
              <span>Submit Multi-Level Exam & Compute Level Scores</span>
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

async function submitMultiLevelExam() {
  stopMCQExamTimer();
  const current = mcqState.selectedAssessment;
  if (!current) return;

  const answeredCount = Object.keys(mcqState.answers).length;
  const totalCount = current.questions ? current.questions.length : 0;

  if (answeredCount < totalCount) {
    if (!confirm(`You have answered ${answeredCount} of ${totalCount} questions. Submit anyway?`)) {
      return;
    }
  }

  const btn = document.getElementById('btn-submit-exam');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="inline-block animate-spin mr-2">⚙️</span>Evaluating Level 1, 2 & 3 scores...`;
  }

  showToast("📊 Computing Level-Wise Scores & Updating Competency Profile...");

  try {
    const rawAnswers = current.questions.map(q => ({
      question_id: q.id,
      selected_answer: mcqState.answers[q.id] || "NONE"
    }));

    const res = await fetch('/api/v1/mcq/submit-multilevel-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessment_id: current.id,
        employee_id: currentEmployeeId || 1,
        answers: rawAnswers
      })
    });

    if (!res.ok) {
      throw new Error("Failed to submit exam evaluation.");
    }

    const data = await res.json();
    mcqState.lastSubmissionResult = data;
    showToast(`🎯 Exam Submitted! Overall: ${data.score_percentage}% (${data.passed ? 'PASSED' : 'COMPLETED'})`);
    renderMCQTestPageView(document.getElementById('main-content'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error("Exam submission error:", err);
    showToast("Error evaluating exam submission: " + err.message);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Submit Multi-Level Exam</span>`;
    }
  }
}

function retakeExam() {
  mcqState.answers = {};
  mcqState.lastSubmissionResult = null;
  renderMCQTestPageView(document.getElementById('main-content'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderUploadStudioHTML() {
  const courses = mcqState.courses || [];

  return `
    <div class="gov-card p-6 space-y-6">
      <div class="border-b border-slate-100 pb-4">
        <div class="flex items-center space-x-2 mb-1">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-govNavy-900 text-saffron-500 uppercase">NSSTA Faculty Studio</span>
          <span class="text-xs text-slate-400">• RAG Knowledge Ingestion</span>
        </div>
        <h3 class="text-lg font-black text-govNavy-900">Upload NSSTA Trainer's Guide & Synthesize Multi-Level Exam</h3>
        <p class="text-xs text-slate-500 mt-1 leading-relaxed">
          Upload NSSTA training manuals, lecture notes, or syllabus summaries. The AI RAG engine matches your notes
          against course curriculum to synthesize grounded MCQs categorized into Level 1, Level 2, and Level 3.
        </p>
      </div>

      <form id="form-mcq-generator" onsubmit="generateAIMultiLevelExamFromForm(event)" class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              NSSTA Trainer's Guide / Document Title <span class="text-red-500">*</span>
            </label>
            <input type="text" id="generator-guide-title" value="NSSTA Cadre Statistical Training Guide — 2026 Edition" class="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-1 focus:ring-govNavy-800 font-semibold text-slate-800" required>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              Linked MoSPI / iGOT Course Notes <span class="text-red-500">*</span>
            </label>
            <select id="generator-course-id" class="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-1 focus:ring-govNavy-800 text-slate-800 font-medium">
              ${courses.map(c => `
                <option value="${c.id}">${c.title} (${c.category})</option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Target Levels Selector -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-2">
            Target Cognitive Levels to Synthesize:
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label class="flex items-center space-x-2.5 p-3 rounded-xl border border-blue-200 bg-blue-50/50 cursor-pointer hover:bg-blue-50">
              <input type="checkbox" id="chk-level-1" checked class="text-blue-600 focus:ring-blue-500 rounded">
              <div class="text-xs">
                <span class="font-bold text-blue-900 block">Level 1: Foundational</span>
                <span class="text-[11px] text-slate-500">Definitions & Formula Recall</span>
              </div>
            </label>

            <label class="flex items-center space-x-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50/50 cursor-pointer hover:bg-amber-50">
              <input type="checkbox" id="chk-level-2" checked class="text-amber-600 focus:ring-amber-500 rounded">
              <div class="text-xs">
                <span class="font-bold text-amber-900 block">Level 2: Applied</span>
                <span class="text-[11px] text-slate-500">Operational Survey Problems</span>
              </div>
            </label>

            <label class="flex items-center space-x-2.5 p-3 rounded-xl border border-purple-200 bg-purple-50/50 cursor-pointer hover:bg-purple-50">
              <input type="checkbox" id="chk-level-3" checked class="text-purple-600 focus:ring-purple-500 rounded">
              <div class="text-xs">
                <span class="font-bold text-purple-900 block">Level 3: Advanced</span>
                <span class="text-[11px] text-slate-500">Strategic Analytical Evaluation</span>
              </div>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">Questions to Synthesize per Level</label>
            <select id="generator-count-per-level" class="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-semibold text-slate-800">
              <option value="2">2 Questions per Level (6 Total)</option>
              <option value="3">3 Questions per Level (9 Total)</option>
              <option value="4" selected>4 Questions per Level (12 Total - Recommended)</option>
              <option value="5">5 Questions per Level (15 Total - In-Depth)</option>
              <option value="6">6 Questions per Level (18 Total - Comprehensive)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">Upload File (.pdf, .docx, .txt, .md)</label>
            <input type="file" id="generator-file-upload" onchange="handleTrainerGuideFileUpload(event)" accept=".txt,.pdf,.docx,.doc,.md" class="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white">
          </div>
        </div>

        <!-- Guide Notes Content -->
        <div>
          <div class="flex justify-between items-center mb-1.5">
            <label class="block text-xs font-bold text-slate-700">
              NSSTA Trainer's Guide / Technical Notes Content <span class="text-red-500">*</span>
            </label>
            <button type="button" onclick="insertSampleGuideNotes()" class="text-xs font-bold text-govNavy-800 hover:text-govNavy-600 underline flex items-center space-x-1">
              <span>📋 Insert Official NSSTA Sample Notes</span>
            </button>
          </div>
          <textarea id="generator-guide-content" rows="8" class="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono focus:ring-1 focus:ring-govNavy-800 leading-relaxed text-slate-800" placeholder="Paste trainer notes, methodology directives, or statistical standards here..." required>${NSSTA_SAMPLE_GUIDE_TEXT}</textarea>
        </div>

        <div class="flex justify-end space-x-3 pt-3 border-t border-slate-100">
          <button type="button" onclick="setMCQStudioTab('exam_runner')" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs">
            Cancel
          </button>
          <button type="submit" id="btn-generate-exam" class="px-6 py-2.5 bg-govNavy-800 hover:bg-govNavy-700 text-white font-black rounded-lg text-xs tracking-wide shadow-md transition flex items-center space-x-2">
            <i data-lucide="sparkles" class="w-4 h-4 text-saffron-500"></i>
            <span>Generate AI Multi-Level Exam 🚀</span>
          </button>
        </div>
      </form>
    </div>
  `;
}

function insertSampleGuideNotes() {
  const ta = document.getElementById('generator-guide-content');
  if (ta) {
    ta.value = NSSTA_SAMPLE_GUIDE_TEXT;
    showToast("Official NSSTA Cadre Training Guide text loaded into editor!");
  }
}

async function handleTrainerGuideFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  showToast(`⏳ Extracting text from "${file.name}" (${(file.size / 1024).toFixed(1)} KB)...`);
  const ta = document.getElementById('generator-guide-content');
  const titleInput = document.getElementById('generator-guide-title');

  if (titleInput && (!titleInput.value || titleInput.value.includes('NSSTA Cadre Statistical Training Guide'))) {
    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    titleInput.value = `NSSTA Guide: ${cleanName}`;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/v1/mcq/parse-document-file', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      if (ta && data.extracted_text) {
        ta.value = data.extracted_text;
        showToast(`📄 Successfully extracted ${data.word_count} words from "${file.name}"!`);
        return;
      }
    }
  } catch (err) {
    console.warn("Backend file extraction failed, falling back to local text reader:", err);
  }

  // Fallback for plain text files
  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    if (ta) {
      ta.value = content;
      showToast(`Loaded "${file.name}" into generator.`);
    }
  };
  reader.readAsText(file);
}

async function generateAIMultiLevelExamFromForm(event) {
  event.preventDefault();

  const title = document.getElementById('generator-guide-title')?.value.trim();
  const courseId = parseInt(document.getElementById('generator-course-id')?.value || 1);
  const countPerLevel = parseInt(document.getElementById('generator-count-per-level')?.value || 4);
  const content = document.getElementById('generator-guide-content')?.value.trim();

  const levels = [];
  if (document.getElementById('chk-level-1')?.checked) levels.push(1);
  if (document.getElementById('chk-level-2')?.checked) levels.push(2);
  if (document.getElementById('chk-level-3')?.checked) levels.push(3);

  if (levels.length === 0) {
    showToast("Please select at least one target cognitive level.");
    return;
  }

  if (!content) {
    showToast("Please provide or paste NSSTA Trainer Guide content.");
    return;
  }

  const btn = document.getElementById('btn-generate-exam');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="inline-block animate-spin mr-2">⚙️</span>Synthesizing Levels 1, 2 & 3 via RAG...`;
  }

  showToast("🤖 AI RAG Synthesizing Multi-Level Assessment Questions...");

  try {
    const res = await fetch('/api/v1/mcq/generate-multilevel-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guide_title: title,
        guide_content: content,
        course_id: courseId,
        levels: levels,
        count_per_level: countPerLevel,
        assessment_title: `AI Assessment: ${title}`
      })
    });

    if (!res.ok) {
      throw new Error("Failed to generate AI multi-level exam.");
    }

    const data = await res.json();
    showToast(`🎉 Generated ${data.total_questions} questions across Levels ${levels.join(', ')}!`);

    // Switch to Exam Runner with new assessment selected
    mcqState.selectedAssessmentId = data.assessment_id;
    mcqState.selectedAssessment = data;
    mcqState.answers = {};
    mcqState.lastSubmissionResult = null;
    mcqState.activeTab = 'exam_runner';

    // Refresh assessment list
    const updatedQuizzes = await fetch('/api/v1/mcq/multilevel-quizzes').then(r => r.json()).catch(() => []);
    mcqState.assessments = updatedQuizzes;

    renderMCQTestPageView(document.getElementById('main-content'));
  } catch (err) {
    console.error("MCQ generation error:", err);
    showToast("Error generating multi-level exam: " + err.message);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Generate AI Multi-Level Exam 🚀</span>`;
    }
  }
}

// -------------------------------------------------------------
// 10. VIEW: Assessments & Interactive Live Quiz Engine
// -------------------------------------------------------------
async function renderAssessmentsView(container) {
  const assessments = await fetch('/api/v1/assessments').then(r => r.json());

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-lg font-bold text-govNavy-900">Standardized Cadre Competency Assessments</h2>
          <p class="text-xs text-slate-500">Adaptive assessments evaluating competencies with instant feedback and evidence recording</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${assessments.map(a => `
          <div class="gov-card p-6 flex flex-col justify-between space-y-4">
            <div>
              <span class="text-[10px] uppercase font-bold tracking-wider text-saffron-500 bg-govNavy-800 px-2 py-0.5 rounded">MoSPI Certified</span>
              <h3 class="font-bold text-sm text-slate-900 mt-2">${a.title}</h3>
              <p class="text-xs text-slate-500 mt-1">${a.description}</p>
              
              <div class="grid grid-cols-2 gap-2 mt-4 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-lg">
                <div>Target Competency: <b class="text-slate-800">${a.competency_name}</b></div>
                <div>Passing Score: <b class="text-slate-800">${a.passing_score}%</b></div>
                <div>Questions: <b class="text-slate-800">${a.total_questions} MCQs</b></div>
                <div>Duration: <b class="text-slate-800">${a.duration_minutes} Mins</b></div>
              </div>
            </div>

            <button onclick="launchQuiz(${a.id})" class="w-full py-2.5 bg-govNavy-800 text-white rounded-lg text-xs font-semibold hover:bg-govNavy-700 transition flex items-center justify-center space-x-2">
              <i data-lucide="play-circle" class="w-4 h-4 text-saffron-500"></i>
              <span>${t('action.takeQuiz')}</span>
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function launchQuiz(assessmentId) {
  const modal = document.getElementById('quiz-modal');
  const body = document.getElementById('quiz-body');
  const footer = document.getElementById('quiz-footer');
  modal.classList.remove('hidden');

  body.innerHTML = `<div class="p-12 text-center text-slate-400"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-govNavy-700 mb-3"></i>Loading assessment questions...</div>`;
  lucide.createIcons();

  const data = await fetch(`/api/v1/assessments/${assessmentId}`).then(r => r.json());
  state.currentAssessment = data;
  state.activeQuizStep = 0;
  state.quizAnswers = {};

  document.getElementById('quiz-title').textContent = data.title;
  startQuizModalTimer(data.duration_minutes || 15);
  renderQuizQuestionStep();
}

function renderQuizQuestionStep() {
  const data = state.currentAssessment;
  const qIndex = state.activeQuizStep;
  const question = data.questions[qIndex];
  const body = document.getElementById('quiz-body');
  const footer = document.getElementById('quiz-footer');

  body.innerHTML = `
    <div class="space-y-5">
      <div class="flex justify-between items-center text-xs text-slate-500 pb-2 border-b border-slate-100">
        <span class="font-bold text-govNavy-900">Question ${qIndex + 1} of ${data.questions.length}</span>
        <div class="flex space-x-2">
          <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">${question.bloom_level}</span>
          <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">${question.difficulty}</span>
        </div>
      </div>

      <h4 class="font-semibold text-sm text-slate-900 leading-relaxed">${question.stem}</h4>

      <div class="space-x-0 space-y-2.5">
        ${question.options.map(opt => `
          <label class="flex items-center space-x-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition ${state.quizAnswers[question.id] === opt.key ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-400' : ''}">
            <input type="radio" name="q_${question.id}" value="${opt.key}" ${state.quizAnswers[question.id] === opt.key ? 'checked' : ''} onchange="selectQuizOption(${question.id}, '${opt.key}')" class="text-govNavy-800 focus:ring-govNavy-800">
            <span class="text-xs text-slate-800 leading-normal"><b class="text-slate-900">${opt.key}.</b> ${opt.text}</span>
          </label>
        `).join('')}
      </div>

      <div class="text-[10px] text-slate-400 pt-2 flex items-center space-x-1">
        <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
        <span>Source Grounding: ${question.source_reference}</span>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <div>
      ${qIndex > 0 ? `<button onclick="prevQuizStep()" class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Previous</button>` : ''}
    </div>
    <div class="space-x-2">
      ${qIndex < data.questions.length - 1 ? `
        <button onclick="nextQuizStep()" class="px-4 py-2 bg-govNavy-800 text-white rounded-lg text-xs font-semibold hover:bg-govNavy-700">Next Question</button>
      ` : `
        <button onclick="submitQuiz()" class="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 shadow">Submit Assessment</button>
      `}
    </div>
  `;
  lucide.createIcons();
}

function selectQuizOption(qid, key) {
  state.quizAnswers[qid] = key;
  renderQuizQuestionStep();
}

function nextQuizStep() {
  if (state.activeQuizStep < state.currentAssessment.questions.length - 1) {
    state.activeQuizStep++;
    renderQuizQuestionStep();
  }
}

function prevQuizStep() {
  if (state.activeQuizStep > 0) {
    state.activeQuizStep--;
    renderQuizQuestionStep();
  }
}

async function submitQuiz() {
  stopQuizModalTimer();
  const body = document.getElementById('quiz-body');
  const footer = document.getElementById('quiz-footer');
  body.innerHTML = `<div class="p-12 text-center text-slate-400"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-govNavy-700 mb-3"></i>Evaluating submission & recalculating competencies...</div>`;
  footer.innerHTML = '';
  lucide.createIcons();

  const answers = Object.entries(state.quizAnswers).map(([qid, ans]) => ({
    question_id: parseInt(qid),
    selected_answer: ans
  }));

  const res = await fetch(`/api/v1/assessments/${state.currentAssessment.id}/submit?employee_id=${currentEmployeeId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assessment_id: state.currentAssessment.id,
      answers: answers
    })
  }).then(r => r.json());

  // Render Result Screen with instant Competency Boost
  body.innerHTML = `
    <div class="space-y-6 text-center py-4">
      <div class="w-16 h-16 rounded-full ${res.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'} flex items-center justify-center mx-auto text-2xl font-bold">
        ${res.passed ? '✓' : '!'}
      </div>

      <div>
        <h3 class="text-xl font-bold text-slate-900">${res.passed ? 'Assessment Passed Successfully!' : 'Assessment Completed'}</h3>
        <p class="text-xs text-slate-500 mt-1">${res.title}</p>
      </div>

      <div class="grid grid-cols-3 gap-3 max-w-lg mx-auto text-left">
        <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p class="text-[10px] text-slate-400 font-bold uppercase">Assessment Score</p>
          <p class="text-2xl font-extrabold text-govNavy-900 mt-1">${res.score_percentage}%</p>
        </div>
        <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p class="text-[10px] text-slate-400 font-bold uppercase">Competency Score</p>
          <p class="text-2xl font-extrabold text-emerald-600 mt-1">${res.updated_score}%</p>
          <p class="text-[10px] text-emerald-700">▲ Increased</p>
        </div>
        <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p class="text-[10px] text-slate-400 font-bold uppercase">Assessed Level</p>
          <p class="text-sm font-extrabold text-govNavy-900 mt-2">${res.level_title}</p>
        </div>
      </div>

      <!-- Personalized AI Feedback Card -->
      <div class="text-left bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-xl mx-auto space-y-2 text-xs">
        <div class="flex items-center space-x-1 font-bold text-govNavy-900">
          <i data-lucide="sparkles" class="w-4 h-4 text-saffron-500"></i>
          <span>Personalized AI Evaluation & Action Plan</span>
        </div>
        <p class="text-slate-600"><b class="text-slate-800">Strengths:</b> ${res.strengths}</p>
        <p class="text-slate-600"><b class="text-slate-800">Areas for Focus:</b> ${res.weaknesses}</p>
        <p class="text-emerald-800 font-medium bg-emerald-50 p-2 rounded border border-emerald-100 mt-2">
          <b>Recommended Next Step:</b> ${res.action_plan}
        </p>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <div></div>
    <button onclick="closeQuizModal(); loadView('dashboard');" class="px-5 py-2 bg-govNavy-800 text-white rounded-lg text-xs font-bold hover:bg-govNavy-700">
      View Updated Dashboard & Gaps
    </button>
  `;
  lucide.createIcons();
  showToast("Competency scores updated and skill gaps recalculated!");
}

function closeQuizModal() {
  stopQuizModalTimer();
  document.getElementById('quiz-modal').classList.add('hidden');
}

// -------------------------------------------------------------
// 11. VIEW: Trainer RAG & AI MCQ Generation Studio
// -------------------------------------------------------------
async function renderTrainerStudioView(container) {
  const [materials, queue] = await Promise.all([
    fetch('/api/v1/materials').then(r => r.json()),
    fetch('/api/v1/mcq/review-queue').then(r => r.json())
  ]);

  container.innerHTML = `
    <div class="space-y-6">
      <div>
        <h2 class="text-lg font-bold text-govNavy-900">Trainer RAG & AI Assessment Studio</h2>
        <p class="text-xs text-slate-500">Upload learning materials, trigger grounded AI MCQ generation with Bloom's taxonomy, and review before publishing</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left: Upload & Generate Form -->
        <div class="gov-card p-5 space-y-4">
          <h3 class="font-bold text-xs text-slate-900 uppercase tracking-wider">1. Generate MCQs from Material</h3>
          
          <div>
            <label class="text-xs font-medium text-slate-700 block mb-1">Select Grounding Material</label>
            <select id="gen-material-id" class="w-full text-xs p-2 rounded-lg border border-slate-300">
              ${materials.map(m => `<option value="${m.id}">${m.title} (${m.total_pages} Pages)</option>`).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium text-slate-700 block mb-1">Question Count</label>
              <select id="gen-count" class="w-full text-xs p-2 rounded-lg border border-slate-300">
                <option value="5">5 Questions</option>
                <option value="10">10 Questions</option>
                <option value="20">20 Questions</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-medium text-slate-700 block mb-1">Difficulty</label>
              <select id="gen-diff" class="w-full text-xs p-2 rounded-lg border border-slate-300">
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
          </div>

          <div>
            <label class="text-xs font-medium text-slate-700 block mb-1">Bloom's Cognitive Level</label>
            <select id="gen-bloom" class="w-full text-xs p-2 rounded-lg border border-slate-300">
              <option value="Understanding">Understanding</option>
              <option value="Application">Application</option>
              <option value="Analysis">Analysis</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          <div>
            <label class="text-xs font-medium text-slate-700 block mb-1">Target Competency</label>
            <input type="text" id="gen-comp" value="Sampling & Survey Design" class="w-full text-xs p-2 rounded-lg border border-slate-300">
          </div>

          <button onclick="triggerMCQGeneration()" class="w-full py-2.5 bg-govNavy-800 text-white rounded-lg text-xs font-bold hover:bg-govNavy-700 transition flex items-center justify-center space-x-2">
            <i data-lucide="sparkles" class="w-4 h-4 text-saffron-500"></i>
            <span>Generate Grounded Questions</span>
          </button>
        </div>

        <!-- Right: Human-in-the-Loop Review Queue -->
        <div class="lg:col-span-2 gov-card p-5 space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="font-bold text-xs text-slate-900 uppercase tracking-wider">2. Trainer Review Queue</h3>
              <p class="text-[11px] text-slate-500">Review AI generated questions before publishing to candidate assessments</p>
            </div>
            <span class="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">${queue.length} Pending Review</span>
          </div>

          <div class="space-y-3 max-h-[500px] overflow-y-auto">
            ${queue.length === 0 ? `
              <div class="text-center py-12 text-slate-400 text-xs">
                <i data-lucide="check-circle" class="w-8 h-8 mx-auto text-emerald-500 mb-2"></i>
                <p>No questions pending review. All generated questions have been approved.</p>
              </div>
            ` : queue.map((q, idx) => `
              <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div class="flex justify-between items-start">
                  <span class="font-bold text-xs text-govNavy-900">Q${idx + 1} (${q.bloom_level} • ${q.difficulty})</span>
                  <span class="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-mono">Confidence: ${q.confidence_score}%</span>
                </div>
                <p class="text-xs text-slate-800 font-medium">${q.stem}</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                  ${q.options.map(opt => `
                    <div class="p-1.5 rounded ${opt.key === q.correct_answer ? 'bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200' : 'bg-white border border-slate-100'}">
                      ${opt.key}. ${opt.text}
                    </div>
                  `).join('')}
                </div>
                <div class="text-[10px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-200">
                  <p><b>Explanation:</b> ${q.explanation}</p>
                  <p><b>Source Grounding:</b> ${q.source_reference}</p>
                </div>
                <div class="flex justify-end space-x-2 pt-1">
                  <button onclick="reviewQuestion(${q.id}, 'REJECT')" class="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-semibold hover:bg-red-100">Reject</button>
                  <button onclick="reviewQuestion(${q.id}, 'APPROVE')" class="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-500">Approve & Publish</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    </div>
  `;
}

async function triggerMCQGeneration() {
  const matId = document.getElementById('gen-material-id').value;
  const count = document.getElementById('gen-count').value;
  const diff = document.getElementById('gen-diff').value;
  const bloom = document.getElementById('gen-bloom').value;
  const comp = document.getElementById('gen-comp').value;

  showToast("RAG Pipeline: Extracting chunks and generating questions...");

  await fetch('/api/v1/mcq/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      material_id: parseInt(matId),
      count: parseInt(count),
      difficulty: diff,
      bloom_level: bloom,
      competency_name: comp
    })
  });

  showToast("Questions successfully generated! Added to Trainer Review Queue.");
  loadView('trainer_studio');
}

async function reviewQuestion(qid, action) {
  await fetch('/api/v1/mcq/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question_id: qid,
      action: action
    })
  });
  showToast(`Question ${action === 'APPROVE' ? 'approved and published' : 'rejected'}.`);
  loadView('trainer_studio');
}

// -------------------------------------------------------------
// 12. VIEW: Workforce Analytics & Heatmaps
// -------------------------------------------------------------
async function renderAnalyticsView(container) {
  const [overview, heatmap, predictions] = await Promise.all([
    fetch('/api/v1/analytics/overview').then(r => r.json()),
    fetch('/api/v1/analytics/heatmap').then(r => r.json()),
    fetch('/api/v1/analytics/predictions').then(r => r.json())
  ]);

  container.innerHTML = `
    <div class="space-y-6">
      <div>
        <h2 class="text-lg font-bold text-govNavy-900">National Statistical System Workforce Analytics</h2>
        <p class="text-xs text-slate-500">Cross-divisional competency benchmarks, skill gap heatmaps, and predictive capacity requirements</p>
      </div>

      <!-- Executive KPIs -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="gov-card p-4">
          <p class="text-[11px] text-slate-500 font-medium">Total Cadre Strength</p>
          <p class="text-2xl font-extrabold text-govNavy-900 mt-1">12,480</p>
          <p class="text-[10px] text-slate-400 mt-1">Central & State Statistical Cadres</p>
        </div>
        <div class="gov-card p-4">
          <p class="text-[11px] text-slate-500 font-medium">Average Workforce Competency</p>
          <p class="text-2xl font-extrabold text-govNavy-900 mt-1">68.2%</p>
          <p class="text-[10px] text-emerald-600 mt-1">+12.4% Annual Improvement</p>
        </div>
        <div class="gov-card p-4">
          <p class="text-[11px] text-slate-500 font-medium">Critical Skill Shortages</p>
          <p class="text-2xl font-extrabold text-red-600 mt-1">1,245</p>
          <p class="text-[10px] text-slate-400 mt-1">Concentrated in AI/ML & Cloud</p>
        </div>
        <div class="gov-card p-4">
          <p class="text-[11px] text-slate-500 font-medium">Training Hours Delivered</p>
          <p class="text-2xl font-extrabold text-govNavy-900 mt-1">84,620 hrs</p>
          <p class="text-[10px] text-blue-600 mt-1">iGOT Karmayogi & NSSTA</p>
        </div>
      </div>

      <!-- Department vs Skill Gap Heatmap Grid -->
      <div class="gov-card p-6">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="font-bold text-sm text-slate-900">Departmental Competency Gap Heatmap</h3>
            <p class="text-xs text-slate-500">Mean identified gap deltas across operational divisions</p>
          </div>
          <div class="flex items-center space-x-3 text-[11px]">
            <span class="flex items-center"><span class="w-3 h-3 rounded bg-red-500 mr-1"></span>Critical Gap</span>
            <span class="flex items-center"><span class="w-3 h-3 rounded bg-amber-500 mr-1"></span>High Gap</span>
            <span class="flex items-center"><span class="w-3 h-3 rounded bg-yellow-400 mr-1"></span>Medium Gap</span>
            <span class="flex items-center"><span class="w-3 h-3 rounded bg-emerald-500 mr-1"></span>No / Low Gap</span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-xs">
            <thead>
              <tr class="border-b border-slate-200">
                <th class="py-2.5 px-4 text-left font-bold text-slate-700">Division</th>
                ${heatmap.skills.map(s => `<th class="py-2.5 px-4 text-center font-bold text-slate-700">${s.name}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${heatmap.departments.map(d => `
                <tr>
                  <td class="py-3 px-4 font-semibold text-slate-900">${d.department_name}</td>
                  ${heatmap.skills.map(s => {
                    const cell = d.skills[s.code] || { status: 'LOW', color: '#22c55e', avg_gap: 5 };
                    return `
                      <td class="py-3 px-4 text-center">
                        <span class="inline-block px-3 py-1 rounded text-white font-bold text-[11px] heatmap-cell" style="background-color: ${cell.color};">
                          ${cell.status} (${cell.avg_gap})
                        </span>
                      </td>
                    `;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Future Skill Predictions -->
      <div class="gov-card p-6">
        <h3 class="font-bold text-sm text-slate-900 mb-1">Emerging Skill Forecasts (Next 12–24 Months)</h3>
        <p class="text-xs text-slate-500 mb-4">Predictive statistical forecasting to prevent cadre shortages</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${predictions.map(p => `
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div class="flex justify-between items-start">
                <h4 class="font-bold text-xs text-slate-900">${p.skill}</h4>
                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-100 text-red-800">${p.growth_factor}</span>
              </div>
              <p class="text-[11px] text-slate-600">${p.reasoning}</p>
              <div class="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                <span>Horizon: <b>${p.horizon}</b></span>
                <span>Cadre: <b>${p.affected_cadres}</b></span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;
}

// -------------------------------------------------------------
// 13. VIEW: System Administration & Governance
// -------------------------------------------------------------
async function renderAdminView(container) {
  const [logs, domains] = await Promise.all([
    fetch('/api/v1/admin/audit-logs').then(r => r.json()),
    fetch('/api/v1/competencies/domains').then(r => r.json())
  ]);

  container.innerHTML = `
    <div class="space-y-6">
      <div>
        <h2 class="text-lg font-bold text-govNavy-900">National Platform Administration & Governance</h2>
        <p class="text-xs text-slate-500">Framework management, immutable audit trails, and integration switches</p>
      </div>

      <!-- Framework Overview -->
      <div class="gov-card p-6">
        <h3 class="font-bold text-sm text-slate-900 mb-3">Official Competency Framework Domains</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${domains.map(d => `
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-[10px] font-bold text-slate-400 uppercase">${d.code}</span>
              <h4 class="font-bold text-xs text-govNavy-900 mt-1">${d.name}</h4>
              <p class="text-xs text-slate-600 mt-2"><b class="text-slate-900">${d.competencies.length}</b> Standardized Competencies</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Audit Log Table -->
      <div class="gov-card p-6">
        <h3 class="font-bold text-sm text-slate-900 mb-1">Cadre Activity & Audit Ledger</h3>
        <p class="text-xs text-slate-500 mb-4">Immutable logs of logins, competency recomputations, and assessment updates</p>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase text-[10px]">
              <tr>
                <th class="py-2.5 px-4 text-left">Action</th>
                <th class="py-2.5 px-4 text-left">Resource</th>
                <th class="py-2.5 px-4 text-left">Details</th>
                <th class="py-2.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${logs.map(l => `
                <tr class="hover:bg-slate-50 font-mono text-[11px]">
                  <td class="py-2.5 px-4 font-bold text-govNavy-900">${l.action}</td>
                  <td class="py-2.5 px-4 text-slate-600">${l.resource_type} #${l.resource_id || ''}</td>
                  <td class="py-2.5 px-4 text-slate-700 font-sans text-xs">${l.details}</td>
                  <td class="py-2.5 px-4 text-right text-slate-400">${l.timestamp}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

// -------------------------------------------------------------
// 14. AI Assistant Drawer Logic
// -------------------------------------------------------------
function toggleAIAssistant() {
  const drawer = document.getElementById('ai-drawer');
  drawer.classList.toggle('hidden');
  if (!drawer.classList.contains('hidden')) {
    if (document.getElementById('chat-messages').children.length === 0) {
      appendChatMessage("assistant", `Namaste, Officer. I am your **Statistical Cadre Intelligence Copilot**.\n\nI can analyze your competency profile, explain recommendation rationale, or clarify statistical methodologies (such as Stratified Sampling or PPS). How can I assist your capacity building today?`);
    }
  }
}

async function handleChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const query = input.value.trim();
  if (!query) return;

  appendChatMessage("user", query);
  input.value = '';

  const loadingId = appendChatLoading();

  try {
    const res = await fetch('/api/v1/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query })
    }).then(r => r.json());

    removeChatLoading(loadingId);
    appendChatMessage("assistant", res.reply, res.sources);
  } catch (err) {
    removeChatLoading(loadingId);
    appendChatMessage("assistant", "I encountered an error connecting to the intelligence server. Please try again.");
  }
}

function sendQuickPrompt(promptText) {
  document.getElementById('chat-input').value = promptText;
  handleChatSubmit(new Event('submit'));
}

function appendChatMessage(sender, text, sources = []) {
  const container = document.getElementById('chat-messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = sender === 'user' ? 'flex justify-end' : 'flex justify-start';

  const innerDiv = document.createElement('div');
  innerDiv.className = sender === 'user' 
    ? 'bg-govNavy-800 text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] text-xs leading-relaxed' 
    : 'bg-slate-100 text-slate-800 p-3.5 rounded-2xl rounded-tl-none max-w-[90%] text-xs leading-relaxed border border-slate-200';

  // Format markdown-like bold and linebreaks
  let formatted = text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>');

  innerDiv.innerHTML = formatted;

  if (sources && sources.length > 0) {
    const srcDiv = document.createElement('div');
    srcDiv.className = 'mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-400 space-y-0.5';
    srcDiv.innerHTML = `<b>Grounding Citations:</b><br>${sources.map(s => `• ${s}`).join('<br>')}`;
    innerDiv.appendChild(srcDiv);
  }

  msgDiv.appendChild(innerDiv);
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function appendChatLoading() {
  const container = document.getElementById('chat-messages');
  const id = 'loading_' + Date.now();
  const div = document.createElement('div');
  div.id = id;
  div.className = 'flex justify-start text-xs text-slate-400 p-2';
  div.innerHTML = `<span class="animate-pulse">Copilot is analyzing cadre context...</span>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeChatLoading(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// -------------------------------------------------------------
// 15. Notifications & Toast Utilities
// -------------------------------------------------------------
async function loadNotifications() {
  try {
    const notes = await fetch('/api/v1/notifications').then(r => r.json());
    state.notifications = notes;
    const list = document.getElementById('notif-list');
    list.innerHTML = notes.map(n => `
      <div class="px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
        <p class="font-bold text-slate-800 text-xs">${n.title}</p>
        <p class="text-slate-500 text-[11px] line-clamp-2 mt-0.5">${n.message}</p>
        <p class="text-[9px] text-slate-400 mt-1">${n.created_at}</p>
      </div>
    `).join('');
  } catch (e) {
    console.error("Error loading notifications:", e);
  }
}

function toggleNotifications() {
  const dropdown = document.getElementById('notif-dropdown');
  dropdown.classList.toggle('hidden');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-message').textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

// -------------------------------------------------------------
// 16. Window Global Exports for Inline DOM Triggers
// -------------------------------------------------------------
window.handleLogout = handleLogout;
window.showAuthPortal = showAuthPortal;
window.selectAuthRole = selectAuthRole;
window.setAuthMode = setAuthMode;
window.handleQuickDemoLogin = handleQuickDemoLogin;
window.handleLoginSubmit = handleLoginSubmit;
window.handleRegisterSubmit = handleRegisterSubmit;
window.promptSwitchAccount = promptSwitchAccount;
window.updateTargetPosition = updateTargetPosition;
window.loadView = loadView;
window.toggleAIAssistant = toggleAIAssistant;
window.toggleNotifications = toggleNotifications;
window.setLanguage = setLanguage;
window.t = t;
window.executeAICourseRecommender = executeAICourseRecommender;
window.setCadreWizardStep = setCadreWizardStep;
window.submitCurrentPosition = submitCurrentPosition;
window.submitTargetPositionAndRunAI = submitTargetPositionAndRunAI;
window.enrollInCourse = enrollInCourse;
window.enrollCourse = enrollCourse;
window.openIGOTCoursePlayer = openIGOTCoursePlayer;
window.closeIGOTPlayerModal = closeIGOTPlayerModal;
window.startMCQExamTimer = startMCQExamTimer;
window.stopMCQExamTimer = stopMCQExamTimer;
window.startQuizModalTimer = startQuizModalTimer;
window.stopQuizModalTimer = stopQuizModalTimer;
window.openAIIntegrationGuideModal = openAIIntegrationGuideModal;


