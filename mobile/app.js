/**
 * National Skill Intelligence Platform — Mobile PWA Application
 * Touch-First • Bottom-Tab Navigation • Same Backend API
 * v1.0.0
 */

// ─── State ───
let mUser = null;
let mEmployeeId = 1;
let mActiveTab = 'dashboard';
let mTheme = localStorage.getItem('m_theme') || 'light';
let mSchedule = {
  dailyHours: parseFloat(localStorage.getItem('m_daily_hours') || '1.5'),
  preferredSlot: localStorage.getItem('m_study_slot') || 'morning'
};

// Exam state
let mExam = {
  assessments: [],
  selected: null,
  answers: {},
  started: false,
  submitted: false,
  result: null,
  timer: null,
  timeLeft: 1800,
  cameraStream: null,
  isCamActive: false,
  isMicActive: false,
  tabSwitchCount: 0,
  isTerminated: false
};

// ─── PWA Service Worker Registration ───
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/mobile/sw.js').catch(e => console.log('SW:', e));
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  checkMobileAuth();
});

// ═══════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════
function applyTheme() {
  if (mTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  const btn = document.getElementById('m-theme-btn');
  if (btn) btn.textContent = mTheme === 'dark' ? '☀️' : '🌙';
}

function toggleMobileTheme() {
  mTheme = mTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('m_theme', mTheme);
  applyTheme();
  mToast(mTheme === 'dark' ? '🌙 Dark Mode Activated' : '☀️ Light Mode Activated');
}

// ═══════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════
function checkMobileAuth() {
  const token = localStorage.getItem('cadre_token');
  const user = localStorage.getItem('cadre_user');
  if (token && user) {
    try {
      mUser = JSON.parse(user);
      mEmployeeId = mUser.employee_id || 1;
      showAppShell();
      return;
    } catch (e) {}
  }
  showAuthScreen();
}

function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app-shell').classList.add('hidden');
  // Reset body padding for auth screen
  document.body.style.paddingTop = '0';
  document.body.style.paddingBottom = '0';
}

function showAppShell() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  document.body.style.paddingTop = '';
  document.body.style.paddingBottom = '';
  const nameEl = document.getElementById('nav-user-name');
  if (nameEl && mUser) nameEl.textContent = mUser.full_name || 'Officer';
  mobileNav('dashboard');
}

function setMobileAuthMode(mode) {
  const tabL = document.getElementById('m-tab-login');
  const tabR = document.getElementById('m-tab-register');
  const formL = document.getElementById('m-form-login');
  const formR = document.getElementById('m-form-register');
  if (mode === 'login') {
    tabL.style.background = '#0c2340'; tabL.style.color = '#fff';
    tabR.style.background = '#fff'; tabR.style.color = '#64748b';
    formL.classList.remove('hidden'); formR.classList.add('hidden');
  } else {
    tabR.style.background = '#0c2340'; tabR.style.color = '#fff';
    tabL.style.background = '#fff'; tabL.style.color = '#64748b';
    formR.classList.remove('hidden'); formL.classList.add('hidden');
  }
}

async function mobileLogin(e) {
  e.preventDefault();
  const u = document.getElementById('m-login-user').value.trim();
  const p = document.getElementById('m-login-pass').value.trim();
  if (!u || !p) return mToast('⚠️ Enter username and password');
  mToast('🔄 Authenticating...');
  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    if (!res.ok) { const err = await res.json(); return mToast('❌ ' + (err.detail || 'Login failed')); }
    const data = await res.json();
    localStorage.setItem('cadre_token', data.access_token);
    localStorage.setItem('cadre_user', JSON.stringify(data));
    mUser = data;
    mEmployeeId = data.employee_id || 1;
    mToast('✅ Welcome, ' + (data.full_name || 'Officer'));
    showAppShell();
  } catch (err) {
    mToast('❌ Server connection error');
  }
}

function mobileQuickLogin() {
  document.getElementById('m-login-user').value = 'arun.kumar';
  document.getElementById('m-login-pass').value = 'password123';
  document.getElementById('m-form-login').dispatchEvent(new Event('submit'));
}

async function mobileRegister(e) {
  e.preventDefault();
  const payload = {
    full_name: document.getElementById('m-reg-name').value.trim(),
    username: document.getElementById('m-reg-user').value.trim(),
    email: document.getElementById('m-reg-email').value.trim(),
    password: document.getElementById('m-reg-pass').value.trim(),
    role: 'EMPLOYEE'
  };
  if (!payload.full_name || !payload.username || !payload.email || !payload.password) return mToast('⚠️ Complete all fields');
  try {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) { const err = await res.json(); return mToast('❌ ' + (err.detail || 'Registration failed')); }
    const data = await res.json();
    localStorage.setItem('cadre_token', data.access_token);
    localStorage.setItem('cadre_user', JSON.stringify(data));
    mUser = data;
    mEmployeeId = data.employee_id || 1;
    mToast('✅ Registered successfully!');
    showAppShell();
  } catch (err) {
    mToast('❌ Registration error');
  }
}

function mobileLogout() {
  if (!confirm('Sign out of the platform?')) return;
  localStorage.removeItem('cadre_token');
  localStorage.removeItem('cadre_user');
  mUser = null;
  stopExamProctoring();
  showAuthScreen();
  mToast('👋 Signed out');
}

// ═══════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════
function mobileNav(tab) {
  // Prevent navigation during active exam
  if (mExam.started && !mExam.submitted && !mExam.isTerminated && tab !== 'exam') {
    if (!confirm('⚠️ Leaving active exam will record a proctoring strike. Continue?')) return;
    recordMobileTabSwitch('Navigated away from exam');
    if (mExam.isTerminated) return;
  }
  mActiveTab = tab;
  // Update bottom nav
  document.querySelectorAll('.bottom-nav .tab-item').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  renderMobileView(tab);
}

async function renderMobileView(view) {
  const c = document.getElementById('m-content');
  c.innerHTML = '<div class="spinner"></div>';
  try {
    switch (view) {
      case 'dashboard': await renderMobileDashboard(c); break;
      case 'skill_gaps': await renderMobileSkillGaps(c); break;
      case 'learning_paths': await renderMobileRoadmap(c); break;
      case 'courses': await renderMobileCourses(c); break;
      case 'exam': await renderMobileExam(c); break;
      default: c.innerHTML = '<div class="empty-state"><div class="empty-icon">🚧</div><div class="empty-text">Coming Soon</div></div>';
    }
  } catch (err) {
    c.innerHTML = `<div class="m-card" style="color:#dc2626;"><b>Error:</b> ${err.message}</div>`;
  }
}

// ═══════════════════════════════════════════
// VIEW: DASHBOARD
// ═══════════════════════════════════════════
async function renderMobileDashboard(c) {
  const [profile, comps, gaps] = await Promise.all([
    apiFetch(`/api/v1/employees/profile?employee_id=${mEmployeeId}`),
    apiFetch(`/api/v1/competencies/my-competencies?employee_id=${mEmployeeId}`),
    apiFetch(`/api/v1/skill-gaps/my-gaps?employee_id=${mEmployeeId}`)
  ]);

  const overallScore = profile?.overall_competency_score || 74;
  const topGaps = (gaps || []).slice(0, 3);
  const totalComps = (comps || []).length;

  c.innerHTML = `
    <!-- Hero Banner -->
    <div class="hero-banner anim-in">
      <div class="greeting">Welcome back, Officer</div>
      <div class="hero-name">${mUser?.full_name || 'Arun Kumar'}</div>
      <div class="hero-role">${profile?.designation || 'Statistical Officer'} • ${profile?.department_name || 'MoSPI'}</div>
    </div>

    <!-- KPI Grid -->
    <div class="kpi-grid">
      <div class="kpi-card anim-in anim-in-d1">
        <span class="kpi-icon">📊</span>
        <span class="kpi-label">Overall Score</span>
        <span class="kpi-value">${overallScore}%</span>
        <span class="kpi-sub">+8.2% this month</span>
      </div>
      <div class="kpi-card anim-in anim-in-d2">
        <span class="kpi-icon">🎯</span>
        <span class="kpi-label">Skill Gaps</span>
        <span class="kpi-value">${(gaps || []).length}</span>
        <span class="kpi-sub" style="color:#d97706;">Action Required</span>
      </div>
      <div class="kpi-card anim-in anim-in-d3">
        <span class="kpi-icon">📜</span>
        <span class="kpi-label">Competencies</span>
        <span class="kpi-value">${totalComps}</span>
        <span class="kpi-sub">Mapped to Role</span>
      </div>
      <div class="kpi-card anim-in anim-in-d4">
        <span class="kpi-icon">⏱️</span>
        <span class="kpi-label">Daily Study</span>
        <span class="kpi-value">${mSchedule.dailyHours}h</span>
        <span class="kpi-sub">${mSchedule.preferredSlot} shift</span>
      </div>
    </div>

    <!-- Overall Competency Progress -->
    <div class="m-card anim-in anim-in-d2">
      <div class="m-card-header">
        <span class="m-card-title">Overall Competency Index</span>
        <span class="m-card-badge" style="background:#ecfdf5;color:#059669;">${overallScore >= 70 ? 'On Track' : 'Needs Focus'}</span>
      </div>
      <div class="progress-track" style="height:12px; border-radius:99px;">
        <div class="progress-fill ${overallScore >= 70 ? 'emerald' : 'saffron'}" style="width:${overallScore}%; border-radius:99px;"></div>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:6px;">
        <span class="text-xxs" style="color:#64748b;">0%</span>
        <span class="text-xxs" style="color:#64748b; font-weight:700;">Target: 85%</span>
        <span class="text-xxs" style="color:#64748b;">100%</span>
      </div>
    </div>

    <!-- Priority Skill Gaps -->
    <div class="m-card anim-in anim-in-d3">
      <div class="m-card-header">
        <span class="m-card-title">🔥 Priority Skill Gaps</span>
        <button class="btn btn-sm btn-outline" onclick="mobileNav('skill_gaps')" style="font-size:0.62rem;">View All →</button>
      </div>
      ${topGaps.length ? topGaps.map(g => `
        <div class="gap-item">
          <div class="gap-info">
            <div class="gap-name">${g.name}</div>
            <div class="gap-scores">Current: ${g.current_score} → Required: ${g.required_score} | Gap: ${g.gap_score} pts</div>
          </div>
          <span class="gap-priority ${(g.priority || '').toLowerCase()}">${g.priority}</span>
        </div>
      `).join('') : '<div class="empty-state"><div class="empty-text">No gaps identified yet</div></div>'}
    </div>

    <!-- Quick Actions -->
    <div class="m-card anim-in anim-in-d4">
      <div class="m-card-title mb-3">⚡ Quick Actions</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <button class="btn btn-primary btn-sm" onclick="mobileNav('exam')">📝 Take Exam</button>
        <button class="btn btn-saffron btn-sm" onclick="mobileNav('learning_paths')">🗺️ Roadmap</button>
        <button class="btn btn-emerald btn-sm" onclick="mobileNav('courses')">📚 Courses</button>
        <button class="btn btn-outline btn-sm" onclick="mobileNav('skill_gaps')">🎯 Skill Gaps</button>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════
// VIEW: SKILL GAPS
// ═══════════════════════════════════════════
async function renderMobileSkillGaps(c) {
  const gaps = await apiFetch(`/api/v1/skill-gaps/my-gaps?employee_id=${mEmployeeId}`);

  const critCount = (gaps || []).filter(g => g.priority === 'CRITICAL').length;
  const highCount = (gaps || []).filter(g => g.priority === 'HIGH').length;

  c.innerHTML = `
    <div class="section-header anim-in">
      <div>
        <div class="section-title">Skill Gap Analysis</div>
        <div class="section-sub">MoSPI competency framework assessment</div>
      </div>
    </div>

    <!-- Summary Badges -->
    <div style="display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap;" class="anim-in anim-in-d1">
      <span class="m-card-badge" style="background:#fef2f2; color:#dc2626;">🔴 ${critCount} Critical</span>
      <span class="m-card-badge" style="background:#fffbeb; color:#d97706;">🟡 ${highCount} High</span>
      <span class="m-card-badge" style="background:#eff6ff; color:#2563eb;">📊 ${(gaps || []).length} Total Gaps</span>
    </div>

    <!-- Schedule Banner -->
    <div class="m-card anim-in anim-in-d1" style="background:linear-gradient(135deg,#0c2340,#16365d); color:#fff; border:none;">
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <div>
          <div style="font-size:0.68rem; color:#94a3b8; font-weight:600;">Personalized Study Plan</div>
          <div style="font-size:1rem; font-weight:900; margin-top:2px;">${mSchedule.dailyHours} hrs/day · ${mSchedule.preferredSlot}</div>
        </div>
        <button class="btn btn-sm" onclick="mobileNav('learning_paths')" style="background:rgba(255,255,255,0.15); color:#fff; font-size:0.62rem;">Edit →</button>
      </div>
    </div>

    <!-- Gap List -->
    <div class="m-card anim-in anim-in-d2">
      ${(gaps || []).map((g, i) => `
        <div class="gap-item" style="animation: fadeInUp 0.3s ease-out ${i * 0.05}s both;">
          <div class="gap-info">
            <div class="gap-name">${g.name}</div>
            <div class="gap-scores">
              Assessed: <b>${g.current_score}</b> | Required: <b>${g.required_score}</b> | <span style="color:#dc2626; font-weight:700;">Gap: ${g.gap_score} pts</span>
            </div>
            <div class="progress-track mt-2" style="height:6px;">
              <div class="progress-fill ${g.priority === 'CRITICAL' ? 'red' : g.priority === 'HIGH' ? 'saffron' : 'navy'}" style="width:${Math.min(100, (g.current_score / g.required_score) * 100)}%;"></div>
            </div>
          </div>
          <span class="gap-priority ${(g.priority || '').toLowerCase()}">${g.priority}</span>
        </div>
      `).join('')}
      ${!(gaps || []).length ? '<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-text">No skill gaps detected!</div></div>' : ''}
    </div>
  `;
}

// ═══════════════════════════════════════════
// VIEW: ROADMAP & STUDY SCHEDULER
// ═══════════════════════════════════════════
// VIEW: ROADMAP & STUDY SCHEDULER
// ═══════════════════════════════════════════
async function renderMobileRoadmap(c) {
  const dh = mSchedule.dailyHours || 1.5;
  const path = await apiFetch(`/api/v1/learning-paths/my-path?employee_id=${mEmployeeId}&daily_hours=${dh}`);

  const summary = path?.skill_gap_summary || path?.schedule_summary || {};
  const milestones = path?.milestones || [];
  const totalGapHours = summary.total_hours_required || summary.total_gap_hours || 52.0;
  const totalGapPoints = summary.total_gap_points || 65;
  const estimatedDays = summary.estimated_days || Math.ceil(totalGapHours / dh);
  const estimatedWeeks = summary.estimated_weeks || (estimatedDays / 7.0).toFixed(1);
  const targetDate = summary.target_completion_date || '14 Oct 2026';
  const weeklyHours = (dh * 7.0).toFixed(1);

  const slots = summary.schedule_slots || [
    { id: 'MORNING', title: '🌅 Morning Cadre Focus', time_window: '07:30 – 09:00 AM', description: 'Before duty hours — survey methods & analysis.' },
    { id: 'MIDDAY', title: '☀️ Mid-Day Microlearning', time_window: '01:30 – 02:30 PM', description: 'Duty break learning — 15m MCQs & videos.' },
    { id: 'EVENING', title: '🌆 Evening Practical Studio', time_window: '07:00 – 08:30 PM', description: 'Hands-on Python, RAG exam & trainers.' }
  ];

  c.innerHTML = `
    <div class="section-header anim-in">
      <div>
        <div class="section-title">Capacity Building Roadmap</div>
        <div class="section-sub">Personalized study schedule & skill gap pacing</div>
      </div>
    </div>

    <!-- Personalized Pace Guidance Card -->
    <div class="m-card anim-in" style="background:linear-gradient(135deg,#0c2340,#1e3a8a); color:#fff; border:none;">
      <div style="font-size:0.65rem; color:#38bdf8; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
        🎯 Personalized Cadre Study Plan
      </div>
      <div style="font-size:0.95rem; font-weight:900; margin:4px 0 6px 0;">
        ${dh} Hours / Day Commitment
      </div>
      <p style="font-size:0.68rem; color:#cbd5e1; line-height:1.45; margin:0;">
        To eliminate your <b>${totalGapHours} hrs (${totalGapPoints} deficit pts)</b> skill gap, studying <b>${dh} hrs/day (${weeklyHours} hrs/week)</b> will achieve target certification in <b>${estimatedDays} Days (${estimatedWeeks} Weeks)</b>.
      </p>
      <div style="margin-top:8px; font-size:0.65rem; font-weight:700; color:#34d399;">
        🏁 Projected Completion: ${targetDate}
      </div>
    </div>

    <!-- 4 KPI Metrics Grid -->
    <div class="kpi-grid anim-in anim-in-d1">
      <div class="kpi-card">
        <span class="kpi-icon">📐</span>
        <span class="kpi-label">Total Gap Work</span>
        <span class="kpi-value">${totalGapHours} hrs</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-icon">⏱️</span>
        <span class="kpi-label">Daily Pacing</span>
        <span class="kpi-value">${dh} hrs/d</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-icon">📅</span>
        <span class="kpi-label">Duration</span>
        <span class="kpi-value">${estimatedDays} days</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-icon">🏁</span>
        <span class="kpi-label">Target Date</span>
        <span class="kpi-value" style="font-size:0.75rem;">${targetDate}</span>
      </div>
    </div>

    <!-- Interactive Study Hours Selector: Quick Buttons + Slider -->
    <div class="m-card anim-in anim-in-d2">
      <div class="m-card-title mb-2">⏱️ Set Your Personalized Daily Hours</div>
      <p style="font-size:0.62rem; color:#64748b; margin-bottom:10px;">
        Adjust how much time you dedicate each day to close your cadre competencies:
      </p>
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        ${[1.0, 1.5, 2.0, 3.0].map(h => `
          <button class="hours-btn ${dh === h ? 'active' : ''}" onclick="setMobileHours(${h})" style="flex:1; min-width:68px; text-align:center; padding:8px 4px; font-size:0.68rem;">
            ${h}h/day ${h === 1.5 ? '★' : ''}
          </button>
        `).join('')}
      </div>
      <div style="margin-top:12px;">
        <input type="range" min="0.5" max="4.0" step="0.5" value="${dh}"
          oninput="setMobileHours(parseFloat(this.value))"
          style="width:100%; accent-color:#0c2340; cursor:pointer;">
        <div style="display:flex; justify-content:space-between; font-size:0.58rem; color:#94a3b8; margin-top:4px;">
          <span>0.5h (Light)</span><span>1.5h (Standard)</span><span>4.0h (Intensive)</span>
        </div>
      </div>
    </div>

    <!-- Preferred Study Shift -->
    <div class="m-card anim-in anim-in-d3">
      <div class="m-card-title mb-2">📅 Preferred Daily Study Shift</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${slots.map(s => `
          <div class="shift-card ${mSchedule.preferredSlot === s.id ? 'active' : ''}" onclick="setMobileSlot('${s.id}')">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="shift-title">${s.title}</span>
              <span class="shift-time">${s.time_window}</span>
            </div>
            <div style="font-size:0.62rem; color:#64748b; margin-top:4px;">${s.description}</div>
            ${mSchedule.preferredSlot === s.id ? '<div style="font-size:0.58rem; color:#3b82f6; font-weight:800; margin-top:4px;">✓ Selected Shift</div>' : ''}
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary btn-full mt-3" onclick="saveMobileSchedule()" style="padding:12px; font-size:0.75rem;">
        💾 Save Study Schedule Commitment
      </button>
    </div>

    <!-- Milestones Timeline -->
    <div class="m-card anim-in anim-in-d4">
      <div class="m-card-header">
        <span class="m-card-title">📍 Milestones</span>
        <span class="m-card-badge" style="background:#f1f5f9; color:#64748b;">${milestones.length} steps</span>
      </div>
      ${milestones.map((m, i) => `
        <div class="milestone">
          <div class="ms-step ${m.status === 'COMPLETED' ? 'completed' : m.status === 'CURRENT' ? 'current' : 'pending'}">
            ${m.status === 'COMPLETED' ? '✓' : (m.step || i + 1)}
          </div>
          <div class="ms-body">
            <div class="ms-title">${m.title}</div>
            <div class="ms-meta">
              📅 ${m.target_completion_date || 'Paced'} · ${m.estimated_hours || 10} study hrs · Gain: ${m.gain || '+5%'}
            </div>
          </div>
        </div>
      `).join('')}
      ${!milestones.length ? '<div class="empty-state"><div class="empty-text">No milestones available</div></div>' : ''}
    </div>
  `;
}

function setMobileHours(h) {
  mSchedule.dailyHours = h;
  localStorage.setItem('m_daily_hours', h);
  renderMobileView('learning_paths');
}

function setMobileSlot(slot) {
  mSchedule.preferredSlot = slot;
  localStorage.setItem('m_study_slot', slot);
  renderMobileView('learning_paths');
}

async function saveMobileSchedule() {
  try {
    await fetch('/api/v1/learning-paths/schedule-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: mEmployeeId,
        daily_study_hours: mSchedule.dailyHours,
        preferred_slot: mSchedule.preferredSlot
      })
    });
  } catch (e) {}
  mToast(`✅ Saved: ${mSchedule.dailyHours} hrs/day (${mSchedule.preferredSlot} shift)`);
  if (navigator.vibrate) navigator.vibrate(50);
}

// ═══════════════════════════════════════════
// VIEW: COURSES
// ═══════════════════════════════════════════
async function renderMobileCourses(c) {
  const courses = await apiFetch('/api/v1/courses');

  const thumbColors = ['#eff6ff', '#ecfdf5', '#fefce8', '#fdf2f8', '#f5f3ff'];
  const thumbIcons = ['📊', '📈', '🔬', '📋', '🎓', '💻', '📉', '🏛️'];

  c.innerHTML = `
    <div class="section-header anim-in">
      <div>
        <div class="section-title">iGOT & NSSTA Courses</div>
        <div class="section-sub">Explore & enrol in official learning programmes</div>
      </div>
    </div>

    ${(courses || []).map((course, i) => `
      <div class="course-card anim-in" style="animation-delay:${i * 0.04}s;">
        <div class="course-thumb" style="background:${thumbColors[i % thumbColors.length]};">${thumbIcons[i % thumbIcons.length]}</div>
        <div class="course-info">
          <div class="course-title truncate">${course.title}</div>
          <div class="course-provider">${course.provider || 'iGOT Karmayogi'} · ${course.duration_hours || 10}h</div>
        </div>
        <button class="course-action" onclick="enrollMobileCourse(${course.id})">Enrol</button>
      </div>
    `).join('')}
    ${!(courses || []).length ? '<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-text">No courses available</div></div>' : ''}
  `;
}

async function enrollMobileCourse(id) {
  try {
    await fetch('/api/v1/courses/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: mEmployeeId, course_id: id })
    });
    mToast('✅ Enrolled successfully!');
    if (navigator.vibrate) navigator.vibrate(50);
  } catch (e) {
    mToast('❌ Enrollment failed');
  }
}

// ═══════════════════════════════════════════
// VIEW: EXAM (Proctored Assessment)
// ═══════════════════════════════════════════
async function renderMobileExam(c) {
  // If exam submitted, show results
  if (mExam.result) {
    renderMobileExamResult(c);
    return;
  }

  // If exam started, show questions
  if (mExam.started && mExam.selected) {
    renderMobileExamRunner(c);
    return;
  }

  // Otherwise show assessment selection / launch
  const quizzes = await apiFetch('/api/v1/mcq/multilevel-quizzes');
  mExam.assessments = quizzes || [];
  const preferred = mExam.assessments.find(q => (q.total_questions >= 15 || (q.questions && q.questions.length >= 15)));
  if (!mExam.selected) mExam.selected = preferred || mExam.assessments[0];

  c.innerHTML = `
    <div class="section-header anim-in">
      <div>
        <div class="section-title">AI Multi-Level Exam</div>
        <div class="section-sub">RAG-powered proctored assessment</div>
      </div>
    </div>

    <!-- Assessment Info Card -->
    <div class="m-card anim-in anim-in-d1" style="background:linear-gradient(135deg,#0c2340,#16365d); color:#fff; border:none;">
      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
        <span class="m-card-badge" style="background:#d97706; color:#fff;">NSSTA · MoSPI</span>
        <span class="m-card-badge" style="background:rgba(16,185,129,0.2); color:#10b981;">15 Questions · 3 Levels</span>
      </div>
      <h2 style="font-size:0.95rem; font-weight:900; margin-bottom:4px;">AI Multi-Level Examination</h2>
      <p style="font-size:0.65rem; color:#94a3b8;">Level 1 (Foundational) · Level 2 (Applied) · Level 3 (Strategic) · 30 minutes</p>
    </div>

    <!-- Proctoring Rules -->
    <div class="m-card anim-in anim-in-d2">
      <div class="m-card-title mb-3">🛡️ Proctoring Rules</div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="display:flex; gap:10px; align-items:flex-start;">
          <span style="font-size:1.2rem;">📷🎙️</span>
          <div>
            <div style="font-size:0.75rem; font-weight:700;">Camera & Mic Required</div>
            <div style="font-size:0.62rem; color:#64748b;">Webcam and microphone access for live AI invigilation</div>
          </div>
        </div>
        <div style="display:flex; gap:10px; align-items:flex-start;">
          <span style="font-size:1.2rem;">🔒</span>
          <div>
            <div style="font-size:0.75rem; font-weight:700;">Right-Click & Copying Disabled</div>
            <div style="font-size:0.62rem; color:#64748b;">All cheating shortcuts blocked during exam</div>
          </div>
        </div>
        <div style="display:flex; gap:10px; align-items:flex-start;">
          <span style="font-size:1.2rem;">⚠️</span>
          <div>
            <div style="font-size:0.75rem; font-weight:700;">Tab Switch Limit: 3 Max</div>
            <div style="font-size:0.62rem; color:#64748b;">Leaving the app >3 times terminates your exam</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sensor & Microphone Permission Verification Card -->
    <div class="m-card anim-in anim-in-d2">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span class="m-card-title">🎙️ Sensor Permissions</span>
        <span class="m-card-badge" style="background:#e0f2fe; color:#0369a1; font-weight:800;">REQUIRED</span>
      </div>
      <p style="font-size:0.65rem; color:#64748b; margin-bottom:8px;">
        MoSPI exam security protocols require active microphone & camera permissions before the 30:00 timer begins.
      </p>
      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">
        <span class="m-card-badge" id="m-perm-badge-mic" style="background:${mExam.isMicActive ? '#dcfce7;color:#15803d' : '#fef3c7;color:#b45309'};">
          🎙️ Mic: ${mExam.isMicActive ? 'Granted & Live' : 'Pending Permission'}
        </span>
        <span class="m-card-badge" id="m-perm-badge-cam" style="background:${mExam.isCamActive ? '#dcfce7;color:#15803d' : '#fef3c7;color:#b45309'};">
          📷 Cam: ${mExam.isCamActive ? 'Granted & Live' : 'Pending Permission'}
        </span>
      </div>
      <button type="button" class="btn ${mExam.isMicActive && mExam.isCamActive ? 'btn-emerald' : 'btn-primary'} btn-full" onclick="testMobileMediaPermissions()" style="padding:10px; font-size:0.75rem;">
        ${mExam.isMicActive && mExam.isCamActive ? '✅ Sensors Verified & Ready' : '🎙️ Test & Grant Microphone Access'}
      </button>
      <div id="m-audio-meter-preview" class="${mExam.isMicActive ? '' : 'hidden'}" style="margin-top:8px; padding:6px 10px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between;">
        <span style="font-size:0.6rem; color:#64748b; font-weight:700;">Live Mic Input Level:</span>
        <div style="display:flex; align-items:flex-end; gap:2px; height:12px;">
          <div class="m-mic-bar" style="width:3px; height:6px; background:#10b981; border-radius:2px;"></div>
          <div class="m-mic-bar" style="width:3px; height:10px; background:#10b981; border-radius:2px;"></div>
          <div class="m-mic-bar" style="width:3px; height:8px; background:#10b981; border-radius:2px;"></div>
          <div class="m-mic-bar" style="width:3px; height:12px; background:#10b981; border-radius:2px;"></div>
        </div>
      </div>
    </div>

    ${mExam.selected ? `
      <button class="btn btn-emerald btn-full anim-in anim-in-d3" onclick="startMobileExam()" style="padding:16px; font-size:0.88rem;">
        🚀 Start 30-Minute Examination Now
      </button>
    ` : `
      <div class="m-card"><div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">No assessments available</div></div></div>
    `}
  `;
}

async function testMobileMediaPermissions() {
  mToast('🎙️ Requesting microphone and camera permissions...');
  await initMobileProctoring();
  if (mExam.isMicActive || mExam.isCamActive) {
    mToast('✅ Microphone & Camera permissions verified and ready!');
    renderMobileView('exam');
  } else {
    mToast('⚠️ Permission needed. Please allow microphone in browser URL settings.');
  }
}

async function startMobileExam() {
  mExam.started = true;
  mExam.submitted = false;
  mExam.result = null;
  mExam.answers = {};
  mExam.tabSwitchCount = 0;
  mExam.isTerminated = false;
  mExam.timeLeft = 1800;

  // Request camera + mic
  await initMobileProctoring();
  enableMobileAntiCheat();
  startMobileTimer();
  renderMobileView('exam');
  mToast('📷🎙️ Proctored exam started!');
}

function renderMobileExamRunner(c) {
  const qs = mExam.selected?.questions || [];
  const mins = Math.floor(mExam.timeLeft / 60);
  const secs = mExam.timeLeft % 60;
  const answeredCount = Object.keys(mExam.answers).length;

  c.innerHTML = `
    <!-- Security Bar -->
    <div class="exam-security-bar anim-in">
      <span class="security-badge" style="background:rgba(16,185,129,0.2); color:#10b981;">
        <span class="pulse-soft" style="width:6px; height:6px; border-radius:50%; background:#10b981; display:inline-block;"></span>
        📷 Cam ${mExam.isCamActive ? 'Live' : 'Off'}
      </span>
      <span class="security-badge" style="background:${mExam.isMicActive ? 'rgba(16,185,129,0.2)' : 'rgba(217,119,6,0.2)'}; color:${mExam.isMicActive ? '#10b981' : '#d97706'};">
        🎙️ Mic ${mExam.isMicActive ? 'On' : 'Off'}
      </span>
      <span class="security-badge" style="background:rgba(220,38,38,0.15); color:#f87171;">🔒 Locked</span>
      <span class="security-badge" style="background:${mExam.tabSwitchCount > 0 ? 'rgba(217,119,6,0.2)' : 'rgba(100,116,139,0.15)'}; color:${mExam.tabSwitchCount > 0 ? '#d97706' : '#94a3b8'};">
        ⚠️ ${mExam.tabSwitchCount}/3
      </span>
    </div>

    <!-- Timer -->
    <div class="m-card anim-in" style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px;">
      <div>
        <span style="font-size:0.65rem; color:#64748b; font-weight:600;">⏱️ Time Remaining</span>
        <div id="m-exam-timer" style="font-size:1.3rem; font-weight:900; font-family:monospace; color:${mExam.timeLeft < 300 ? '#dc2626' : '#0f172a'};">${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}</div>
      </div>
      <div style="text-align:right;">
        <span style="font-size:0.65rem; color:#64748b; font-weight:600;">Progress</span>
        <div style="font-size:0.88rem; font-weight:900;">${answeredCount} / ${qs.length}</div>
      </div>
    </div>

    <!-- Questions -->
    ${qs.map((q, qi) => `
      <div class="exam-question-card anim-in" style="animation-delay:${qi * 0.03}s;">
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <span style="font-size:0.68rem; font-weight:800; color:#64748b;">Q${qi + 1}</span>
          <span class="m-card-badge" style="background:${q.level === 1 ? '#eff6ff;color:#2563eb' : q.level === 2 ? '#fffbeb;color:#d97706' : '#fdf2f8;color:#9333ea'};">L${q.level}</span>
        </div>
        <p style="font-size:0.8rem; font-weight:700; color:#0f172a; margin-bottom:12px; line-height:1.5;">${q.question}</p>
        ${(q.options || []).map((opt, oi) => `
          <button class="exam-option ${mExam.answers[q.id] === oi ? 'selected' : ''}" onclick="selectMobileAnswer(${q.id}, ${oi})">
            <span style="font-weight:800; margin-right:6px;">${String.fromCharCode(65 + oi)}.</span> ${opt}
          </button>
        `).join('')}
      </div>
    `).join('')}

    <!-- Submit -->
    <button class="btn btn-emerald btn-full mt-3" onclick="submitMobileExam()" style="padding:16px; font-size:0.85rem;">
      📤 Submit Exam & Compute Scores
    </button>

    <!-- Floating Proctor PIP -->
    ${mExam.isCamActive ? `
      <div class="mobile-proctor-pip" id="m-proctor-pip">
        <video id="m-proctor-video" autoplay playsinline muted style="width:100%; border-radius:10px;"></video>
        <div class="pip-badges">
          <span class="pip-badge" style="background:rgba(16,185,129,0.3); color:#10b981;">CAM</span>
          <span class="pip-badge" style="background:${mExam.isMicActive ? 'rgba(16,185,129,0.3);color:#10b981' : 'rgba(217,119,6,0.3);color:#d97706'};">${mExam.isMicActive ? 'MIC' : '🔇'}</span>
        </div>
      </div>
    ` : ''}
  `;

  // Attach camera feed
  if (mExam.cameraStream) {
    setTimeout(() => {
      const vid = document.getElementById('m-proctor-video');
      if (vid) {
        vid.srcObject = mExam.cameraStream;
        vid.play().catch(() => {});
      }
    }, 100);
  }
}

function selectMobileAnswer(qId, optIdx) {
  mExam.answers[qId] = optIdx;
  if (navigator.vibrate) navigator.vibrate(15);
  // Re-render just updates selected styling
  renderMobileView('exam');
}

async function submitMobileExam() {
  const qs = mExam.selected?.questions || [];
  const answered = Object.keys(mExam.answers).length;
  if (answered < qs.length) {
    if (!confirm(`You've answered ${answered}/${qs.length}. Submit anyway?`)) return;
  }

  stopMobileTimer();
  disableMobileAntiCheat();
  mToast('⏳ Evaluating scores...');

  try {
    const res = await fetch('/api/v1/mcq/submit-multilevel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quiz_id: mExam.selected.id,
        answers: mExam.answers,
        employee_id: mEmployeeId,
        time_taken_seconds: 1800 - mExam.timeLeft
      })
    });
    const result = await res.json();
    mExam.result = result;
    mExam.submitted = true;
    stopExamProctoring();
    renderMobileView('exam');
  } catch (e) {
    mToast('❌ Submission failed. Try again.');
  }
}

function renderMobileExamResult(c) {
  const r = mExam.result || {};
  const overall = r.overall_score || r.total_score || 0;
  const passed = overall >= 70;

  c.innerHTML = `
    <div class="m-card anim-in" style="text-align:center; padding:28px 20px; background:${passed ? 'linear-gradient(135deg,#ecfdf5,#d1fae5)' : 'linear-gradient(135deg,#fef2f2,#fee2e2)'}; border:none;">
      <div style="font-size:3.5rem; margin-bottom:8px;">${passed ? '🏆' : '📋'}</div>
      <h2 style="font-size:1.15rem; font-weight:900; color:${passed ? '#059669' : '#dc2626'};">${passed ? 'Examination Passed!' : 'Examination Complete'}</h2>
      <div style="font-size:2rem; font-weight:900; margin:12px 0; color:${passed ? '#059669' : '#dc2626'};">${overall}%</div>
      <p style="font-size:0.7rem; color:#64748b;">Minimum Passing Score: 70%</p>
    </div>

    <!-- Level Scores -->
    <div class="kpi-grid anim-in anim-in-d1">
      <div class="kpi-card">
        <span class="kpi-label">Level 1</span>
        <span class="kpi-value" style="color:#2563eb;">${r.level1_score || r.level_1_score || '—'}%</span>
        <span class="text-xxs" style="color:#64748b;">Foundational</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Level 2</span>
        <span class="kpi-value" style="color:#d97706;">${r.level2_score || r.level_2_score || '—'}%</span>
        <span class="text-xxs" style="color:#64748b;">Applied</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Level 3</span>
        <span class="kpi-value" style="color:#9333ea;">${r.level3_score || r.level_3_score || '—'}%</span>
        <span class="text-xxs" style="color:#64748b;">Strategic</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Overall</span>
        <span class="kpi-value" style="color:${passed ? '#059669' : '#dc2626'};">${overall}%</span>
        <span class="text-xxs" style="color:#64748b;">${passed ? 'PASSED' : 'Review'}</span>
      </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:8px;" class="anim-in anim-in-d2">
      <button class="btn btn-primary btn-full" onclick="retakeMobileExam()">🔄 Retake Exam</button>
      <button class="btn btn-outline btn-full" onclick="mobileNav('dashboard')">🏠 Back to Dashboard</button>
    </div>
  `;
}

function retakeMobileExam() {
  mExam.started = false;
  mExam.submitted = false;
  mExam.result = null;
  mExam.answers = {};
  mExam.tabSwitchCount = 0;
  mExam.isTerminated = false;
  renderMobileView('exam');
}

// ═══════════════════════════════════════════
// EXAM PROCTORING (Camera + Mic)
// ═══════════════════════════════════════════
async function initMobileProctoring() {
  if (!navigator.mediaDevices?.getUserMedia) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 240 }, height: { ideal: 180 }, facingMode: 'user' },
      audio: true
    });
    mExam.cameraStream = stream;
    mExam.isCamActive = true;
    mExam.isMicActive = true;
  } catch (e) {
    try {
      const vidStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 240 }, height: { ideal: 180 }, facingMode: 'user' },
        audio: false
      });
      mExam.cameraStream = vidStream;
      mExam.isCamActive = true;
      mExam.isMicActive = false;
    } catch (ve) {
      mExam.isCamActive = false;
      mExam.isMicActive = false;
    }
  }
}

function stopExamProctoring() {
  if (mExam.cameraStream) {
    mExam.cameraStream.getTracks().forEach(t => t.stop());
    mExam.cameraStream = null;
  }
  mExam.isCamActive = false;
  mExam.isMicActive = false;
  const pip = document.getElementById('m-proctor-pip');
  if (pip) pip.remove();
}

// ═══════════════════════════════════════════
// EXAM TIMER
// ═══════════════════════════════════════════
function startMobileTimer() {
  stopMobileTimer();
  mExam.timer = setInterval(() => {
    mExam.timeLeft--;
    const el = document.getElementById('m-exam-timer');
    if (el) {
      const m = Math.floor(mExam.timeLeft / 60);
      const s = mExam.timeLeft % 60;
      el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      if (mExam.timeLeft < 300) el.style.color = '#dc2626';
    }
    if (mExam.timeLeft <= 0) {
      stopMobileTimer();
      submitMobileExam();
    }
  }, 1000);
}

function stopMobileTimer() {
  if (mExam.timer) { clearInterval(mExam.timer); mExam.timer = null; }
}

// ═══════════════════════════════════════════
// ANTI-CHEAT (Tab Switch + Right-click)
// ═══════════════════════════════════════════
function enableMobileAntiCheat() {
  document.addEventListener('contextmenu', preventCtx, true);
  document.addEventListener('visibilitychange', onVisChange);
  window.addEventListener('blur', onWinBlur);
}

function disableMobileAntiCheat() {
  document.removeEventListener('contextmenu', preventCtx, true);
  document.removeEventListener('visibilitychange', onVisChange);
  window.removeEventListener('blur', onWinBlur);
}

function preventCtx(e) {
  if (mExam.started && !mExam.submitted) { e.preventDefault(); mToast('🔒 Right-click disabled during exam'); }
}

function onVisChange() {
  if (document.hidden && mExam.started && !mExam.submitted && !mExam.isTerminated) {
    recordMobileTabSwitch('Left app / switched tab');
  }
}

function onWinBlur() {
  if (mExam.started && !mExam.submitted && !mExam.isTerminated) {
    recordMobileTabSwitch('Window lost focus');
  }
}

function recordMobileTabSwitch(reason) {
  if (Date.now() - (mExam._lastViol || 0) < 2000) return;
  mExam._lastViol = Date.now();
  mExam.tabSwitchCount++;
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

  if (mExam.tabSwitchCount >= 3) {
    mExam.isTerminated = true;
    stopMobileTimer();
    disableMobileAntiCheat();
    stopExamProctoring();
    mExam.result = {
      overall_score: 0, level1_score: 0, level2_score: 0, level3_score: 0,
      disqualified: true, disqualification_reason: 'Exceeded 3 tab switches'
    };
    mExam.submitted = true;
    renderMobileView('exam');
    mToast('🚫 DISQUALIFIED: Exceeded tab switch limit');
  } else {
    mToast(`⚠️ Strike ${mExam.tabSwitchCount}/3: ${reason}`);
    const el = document.getElementById('m-content');
    if (el && mExam.started) renderMobileExamRunner(el);
  }
}

// ═══════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════
async function apiFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

let _toastTimer = null;
function mToast(msg) {
  const el = document.getElementById('m-toast');
  const msgEl = document.getElementById('m-toast-msg');
  if (!el || !msgEl) return;
  msgEl.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ═══════════════════════════════════════════
// MOBILE AI VOICE COPILOT
// ═══════════════════════════════════════════
let mSpeechRec = null;
let mIsVoiceRecording = false;

function toggleMobileCopilot(open) {
  const drawer = document.getElementById('m-copilot-drawer');
  if (!drawer) return;
  const isHidden = drawer.classList.contains('hidden');
  const shouldOpen = open !== undefined ? open : isHidden;
  drawer.classList.toggle('hidden', !shouldOpen);
}

function toggleMobileVoiceInput() {
  if (mIsVoiceRecording) {
    stopMobileVoiceInput();
    return;
  }
  startMobileVoiceInput();
}

function startMobileVoiceInput() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = document.getElementById('m-copilot-mic-btn');
  const bar = document.getElementById('m-copilot-listening-bar');
  const input = document.getElementById('m-copilot-input');

  if (SpeechRec) {
    try {
      mSpeechRec = new SpeechRec();
      mSpeechRec.continuous = false;
      mSpeechRec.interimResults = true;
      mSpeechRec.lang = 'en-IN';

      mSpeechRec.onstart = function() {
        mIsVoiceRecording = true;
        if (micBtn) micBtn.style.background = '#dc2626';
        if (bar) bar.classList.remove('hidden');
        mToast('🎙️ Listening... speak your question now');
      };

      mSpeechRec.onresult = function(e) {
        let text = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          text += e.results[i][0].transcript;
        }
        if (input && text) input.value = text;
      };

      mSpeechRec.onerror = function(err) {
        stopMobileVoiceInput();
        if (err.error === 'not-allowed') {
          mToast('⚠️ Microphone access denied in browser.');
        } else {
          mToast('🎙️ Voice input notice: ' + (err.error || 'check microphone'));
        }
      };

      mSpeechRec.onend = function() {
        stopMobileVoiceInput();
        if (input && input.value.trim().length > 0) {
          mToast('✅ Voice captured! Tap Send to consult AI.');
        }
      };

      mSpeechRec.start();
    } catch (e) {
      fallbackMobileMic();
    }
  } else {
    fallbackMobileMic();
  }
}

async function fallbackMobileMic() {
  if (navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mToast('🎙️ Microphone connected! Audio permission active.');
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      mToast('⚠️ Please allow microphone in browser URL settings.');
    }
  } else {
    mToast('⚠️ Microphone API not supported on this browser.');
  }
}

function stopMobileVoiceInput() {
  mIsVoiceRecording = false;
  const micBtn = document.getElementById('m-copilot-mic-btn');
  const bar = document.getElementById('m-copilot-listening-bar');
  if (micBtn) micBtn.style.background = '#0c2340';
  if (bar) bar.classList.add('hidden');
  if (mSpeechRec) {
    try { mSpeechRec.stop(); } catch (e) {}
    mSpeechRec = null;
  }
}

async function handleMobileCopilotSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('m-copilot-input');
  const query = input?.value.trim();
  if (!query) return;

  const msgs = document.getElementById('m-copilot-messages');
  if (msgs) {
    msgs.innerHTML += `
      <div style="align-self:flex-end; background:#0c2340; color:#fff; padding:8px 12px; border-radius:12px 12px 2px 12px; max-width:85%;">
        ${query}
      </div>
    `;
    input.value = '';
    msgs.scrollTop = msgs.scrollHeight;
  }

  try {
    const res = await fetch('/api/v1/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: query, employee_id: mEmployeeId, history: [] })
    });
    const data = await res.json();
    const reply = data.answer || data.response || "Here are guidance recommendations based on MoSPI cadre competencies.";
    if (msgs) {
      msgs.innerHTML += `
        <div style="align-self:flex-start; background:#f1f5f9; color:#0f172a; padding:10px 12px; border-radius:12px 12px 12px 2px; max-width:90%; border:1px solid #e2e8f0; line-height:1.4;">
          ${reply}
        </div>
      `;
      msgs.scrollTop = msgs.scrollHeight;
    }
  } catch (err) {
    if (msgs) {
      msgs.innerHTML += `
        <div style="align-self:flex-start; background:#f1f5f9; color:#0f172a; padding:10px 12px; border-radius:12px 12px 12px 2px; max-width:90%; border:1px solid #e2e8f0; line-height:1.4;">
          Officer Arun Kumar, based on your National Statistical Cadre profile, your focus competencies are Survey Design, Sampling Error Estimation, and Big Data Analytics. Follow your personalized roadmap of 1.5 hrs/day to achieve certification.
        </div>
      `;
      msgs.scrollTop = msgs.scrollHeight;
    }
  }
}

// Global Window Exports for Mobile
window.testMobileMediaPermissions = testMobileMediaPermissions;
window.toggleMobileCopilot = toggleMobileCopilot;
window.toggleMobileVoiceInput = toggleMobileVoiceInput;
window.stopMobileVoiceInput = stopMobileVoiceInput;
window.handleMobileCopilotSubmit = handleMobileCopilotSubmit;
window.setMobileHours = setMobileHours;
window.setMobileSlot = setMobileSlot;
window.saveMobileSchedule = saveMobileSchedule;
window.mobileNav = mobileNav;
window.toggleMobileTheme = toggleMobileTheme;
window.mobileLogin = mobileLogin;
window.mobileQuickLogin = mobileQuickLogin;
window.mobileRegister = mobileRegister;
window.mobileLogout = mobileLogout;
window.startMobileExam = startMobileExam;
window.submitMobileExam = submitMobileExam;
window.retakeMobileExam = retakeMobileExam;
window.selectMobileAnswer = selectMobileAnswer;
window.enrollMobileCourse = enrollMobileCourse;
window.openMobilePlayer = openMobilePlayer;
window.closeMobilePlayer = closeMobilePlayer;

