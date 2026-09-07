/**
 * Smart India Hackathon 2026 - Client Mock & Resilient Fallback Engine
 * Automatically activates on static hosting (GitHub Pages) or when the backend server is offline.
 * Allows 100% of the UI (Auth, Dashboards, Gap Analysis, iGOT player, Assessments) to work in-browser!
 */
(function() {
  const originalFetch = window.fetch;

  // Pre-configured official personas matching backend/seed_data.py
  const MOCK_USERS = {
    'arun.kumar': {
      access_token: 'mock_jwt_arun_kumar_2026',
      token_type: 'bearer',
      user_id: 1,
      employee_id: 1,
      username: 'arun.kumar',
      full_name: 'Arun Kumar',
      email: 'arun.kumar@mospi.gov.in',
      role: 'EMPLOYEE',
      designation: 'Statistical Officer (JSO)',
      department_name: 'Data Analytics & Innovation Division (DAID)',
      overall_competency: 74.0
    },
    'priya.sharma': {
      access_token: 'mock_jwt_priya_sharma_2026',
      token_type: 'bearer',
      user_id: 2,
      employee_id: 2,
      username: 'priya.sharma',
      full_name: 'Dr. Priya Sharma',
      email: 'priya.sharma@nssta.gov.in',
      role: 'TRAINER',
      designation: 'Senior Faculty & Course Director',
      department_name: 'National Statistical Systems Training Academy (NSSTA)',
      overall_competency: 92.5
    },
    'rajesh.verma': {
      access_token: 'mock_jwt_rajesh_verma_2026',
      token_type: 'bearer',
      user_id: 3,
      employee_id: 3,
      username: 'rajesh.verma',
      full_name: 'Rajesh Verma, ISS',
      email: 'rajesh.verma@mospi.gov.in',
      role: 'DEPT_ADMIN',
      designation: 'Director / DDG, ISS',
      department_name: 'Field Operations Division (FOD)',
      overall_competency: 96.0
    },
    'admin.system': {
      access_token: 'mock_jwt_admin_system_2026',
      token_type: 'bearer',
      user_id: 4,
      employee_id: 4,
      username: 'admin.system',
      full_name: 'National Systems Administrator',
      email: 'sysadmin@mospi.gov.in',
      role: 'SYSTEM_ADMIN',
      designation: 'National Governance Administrator',
      department_name: 'MoSPI National Cloud Center',
      overall_competency: 98.0
    }
  };

  const MOCK_CADRE_OPTIONS = {
    departments: [
      { id: 1, code: 'DAID', name: 'Data Analytics & Innovation Division (DAID)' },
      { id: 2, code: 'SOD', name: 'Survey Operations Division (SOD)' },
      { id: 3, code: 'FOD', name: 'Field Operations Division (FOD)' },
      { id: 4, code: 'NAD', name: 'National Accounts Division (NAD)' },
      { id: 5, code: 'ESD', name: 'Economic Statistics Division (ESD)' },
      { id: 6, code: 'PLSD', name: 'Price & Labor Statistics Division (PLSD)' },
      { id: 7, code: 'NSSTA', name: 'National Statistical Systems Training Academy (NSSTA)' }
    ],
    job_roles: [
      { id: 1, title: 'Junior Statistical Officer (JSO)', hierarchy_level: 1 },
      { id: 2, title: 'Senior Statistical Officer (SSO)', hierarchy_level: 2 },
      { id: 3, title: 'Assistant Director (ISS)', hierarchy_level: 3 },
      { id: 4, title: 'Deputy Director (ISS)', hierarchy_level: 4 },
      { id: 5, title: 'Joint Director (ISS)', hierarchy_level: 5 },
      { id: 6, title: 'Director / Chief Statistician (ISS)', hierarchy_level: 6 }
    ]
  };

  const MOCK_ARUN_PROFILE = {
    id: 1,
    employee_code: 'MOSPI-2021-0482',
    full_name: 'Arun Kumar',
    designation: 'Statistical Officer',
    department_name: 'Data Analytics & Innovation Division (DAID)',
    job_role: 'Junior Statistical Officer (JSO)',
    target_role: 'Senior Statistical Officer (SSO)',
    years_of_experience: 5.0,
    current_assignment: 'Periodic Labour Force Survey (PLFS) Microdata Validation & Survey Weighting',
    overall_competency_score: 74.0,
    profile_completion_pct: 95,
    reporting_officer: 'Rajesh Verma, Director',
    career_aspirations: 'Aspiring to qualify for Senior Statistical Officer (SSO) and Assistant Director (ISS).'
  };

  const MOCK_SKILL_GAPS = [
    {
      competency_id: 1,
      competency_name: 'Sampling & Survey Design',
      domain_name: 'Statistical Competencies',
      current_score: 55.0,
      target_score: 85.0,
      gap_score: 30.0,
      current_level: 2,
      target_level: 4,
      priority: 'HIGH'
    },
    {
      competency_id: 2,
      competency_name: 'National Accounts Compilation',
      domain_name: 'Statistical Competencies',
      current_score: 50.0,
      target_score: 80.0,
      gap_score: 30.0,
      current_level: 2,
      target_level: 4,
      priority: 'HIGH'
    },
    {
      competency_id: 7,
      competency_name: 'Python Programming for Official Stats',
      domain_name: 'Technical Competencies',
      current_score: 62.0,
      target_score: 85.0,
      gap_score: 23.0,
      current_level: 3,
      target_level: 4,
      priority: 'MEDIUM'
    },
    {
      competency_id: 8,
      competency_name: 'AI / Machine Learning Imputation',
      domain_name: 'Technical Competencies',
      current_score: 35.0,
      target_score: 85.0,
      gap_score: 50.0,
      current_level: 1,
      target_level: 4,
      priority: 'CRITICAL'
    }
  ];

  const MOCK_RECOMMENDATIONS = [
    {
      id: 101,
      title: 'Advanced Sampling Theory, Stratification & PPS Estimators',
      provider: 'NSSTA Greater Noida',
      duration_hours: 32,
      skill_level: 'Advanced',
      external_url: 'https://igotkarmayogi.gov.in',
      is_enrolled: false,
      syllabus: [
        'Module 1: Foundations of Unequal Probability Sampling & PPS',
        'Module 2: Multistage Stratified Sampling in Household Surveys',
        'Module 3: Non-response Imputation & Hansen-Hurwitz Multipliers',
        'Module 4: Variance Estimation & Jackknife Techniques'
      ]
    },
    {
      id: 102,
      title: 'Python for Automated Data Validation & Microdata Processing',
      provider: 'iGOT Karmayogi Bharat',
      duration_hours: 24,
      skill_level: 'Intermediate',
      external_url: 'https://igotkarmayogi.gov.in',
      is_enrolled: true,
      syllabus: [
        'Module 1: Pandas DataFrames for Survey Microdata',
        'Module 2: Outlier Detection & Automated Range Validation',
        'Module 3: Handling Missing Values with Hedonic Imputation',
        'Module 4: Exporting National Statistical Bulletins & APIs'
      ]
    }
  ];

  const MOCK_COMPETENCIES = [
    { id: 1, name: 'Sampling & Survey Design', domain: 'Statistical', score: 55, level: 2, evidence_count: 4 },
    { id: 2, name: 'National Accounts Compilation', domain: 'Statistical', score: 50, level: 2, evidence_count: 3 },
    { id: 3, name: 'Price Statistics & Index Numbers', domain: 'Statistical', score: 72, level: 3, evidence_count: 5 },
    { id: 4, name: 'Labour & Employment Stats', domain: 'Statistical', score: 80, level: 4, evidence_count: 6 },
    { id: 5, name: 'Python Programming', domain: 'Technical', score: 62, level: 3, evidence_count: 4 },
    { id: 6, name: 'AI / Machine Learning', domain: 'Technical', score: 35, level: 1, evidence_count: 2 },
    { id: 7, name: 'Relational Database & SQL', domain: 'Technical', score: 75, level: 3, evidence_count: 4 },
    { id: 8, name: 'Official Communication', domain: 'Managerial', score: 85, level: 4, evidence_count: 5 }
  ];

  const MOCK_ASSESSMENTS = [
    {
      id: 1,
      title: 'Quarterly Diagnostic: Sample Survey Design & Field Rules',
      duration_minutes: 20,
      total_questions: 5,
      pass_percentage: 60,
      bloom_distribution: 'Recall, Understanding, Application',
      questions: [
        {
          id: 101,
          stem: 'In official sample survey methodology, what is the primary operational objective of applying Probability Proportional to Size (PPS) sampling?',
          bloom_level: 'Recall',
          options: [
            { key: 'A', text: 'Selection probabilities are directly proportional to a designated auxiliary measure of unit size.' },
            { key: 'B', text: 'Every primary sampling unit receives an identical probability regardless of size.' },
            { key: 'C', text: 'Only large manufacturing units are chosen, omitting all small units.' },
            { key: 'D', text: 'Sample units are selected arbitrarily by field enumerators.' }
          ],
          correct: 'A',
          explanation: 'PPS sampling assigns higher selection probabilities to larger primary units, drastically lowering sampling variance.'
        },
        {
          id: 102,
          stem: 'Which mathematical formula underpins the headline Consumer Price Index (CPI) compiled in India?',
          bloom_level: 'Understanding',
          options: [
            { key: 'A', text: 'Modified Laspeyres Index using fixed base-period consumption basket weights.' },
            { key: 'B', text: 'Paasche Index with continuously updating current-period weights.' },
            { key: 'C', text: 'Fisher Ideal Geometric Mean of unweighted price relatives.' },
            { key: 'D', text: 'Simple Marshall-Edgeworth arithmetic aggregator.' }
          ],
          correct: 'A',
          explanation: 'Official CPI compilation employs the modified Laspeyres formula, measuring the cost change of a fixed base basket.'
        },
        {
          id: 103,
          stem: 'Under the System of National Accounts (SNA 2008), how is Gross Value Added (GVA) at Basic Prices defined?',
          bloom_level: 'Recall',
          options: [
            { key: 'A', text: 'Gross Output at basic prices minus Intermediate Consumption at purchasers\' prices.' },
            { key: 'B', text: 'Gross Domestic Product (GDP) plus Net Product Taxes and Subsidies.' },
            { key: 'C', text: 'Total compensation of employees plus gross fixed capital depreciation only.' },
            { key: 'D', text: 'Final household consumption expenditure plus gross capital formation.' }
          ],
          correct: 'A',
          explanation: 'GVA at basic prices measures the net value generated in production by subtracting intermediate consumption from total gross output.'
        }
      ]
    }
  ];

  function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status: status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Intercept window.fetch
  window.fetch = async function(resource, init = {}) {
    const url = typeof resource === 'string' ? resource : resource.url;

    // Only intercept /api/ calls
    if (!url.includes('/api/')) {
      return originalFetch(resource, init);
    }

    // Try real fetch first
    try {
      const response = await originalFetch(resource, init);
      // If server returned ok or client error with body, return it
      if (response.ok || response.status === 400 || response.status === 401 || response.status === 422) {
        return response;
      }
      // If 404/500/502/503 on static hosting (like GitHub Pages), fall through to mock
      console.warn(`[SIH Live Interceptor] Backend returned ${response.status} for ${url}. Engaging resilient client demo mode.`);
    } catch (netErr) {
      console.warn(`[SIH Live Interceptor] Network fetch failed for ${url}. Engaging resilient client demo mode.`, netErr);
    }

    // -------------------------------------------------------------
    // CLIENT FALLBACK ENGINE
    // -------------------------------------------------------------
    const method = (init.method || 'GET').toUpperCase();
    let body = {};
    try {
      if (init.body && typeof init.body === 'string') {
        body = JSON.parse(init.body);
      }
    } catch (e) {}

    // 1. Auth Login
    if (url.includes('/auth/login')) {
      const u = (body.username || 'arun.kumar').toLowerCase();
      const mockUser = MOCK_USERS[u] || MOCK_USERS['arun.kumar'];
      return jsonResponse(mockUser);
    }

    // 2. Cadre Options & Metadata
    if (url.includes('/meta/cadre-options')) {
      return jsonResponse(MOCK_CADRE_OPTIONS);
    }

    // 3. Employee Profile
    if (url.includes('/employees/me') || url.includes('/profile/me')) {
      return jsonResponse(MOCK_ARUN_PROFILE);
    }

    // 4. Skill Gaps
    if (url.includes('/skill-gaps/my-gaps') || url.includes('/skill-gaps')) {
      return jsonResponse(MOCK_SKILL_GAPS);
    }

    // 5. Recommendations
    if (url.includes('/recommendations/my-recommendations') || url.includes('/recommendations')) {
      return jsonResponse(MOCK_RECOMMENDATIONS);
    }

    // 6. Target Position
    if (url.includes('/target-position')) {
      return jsonResponse({
        current_role: MOCK_CADRE_OPTIONS.job_roles[0],
        target_role: MOCK_CADRE_OPTIONS.job_roles[1],
        available_roles: MOCK_CADRE_OPTIONS.job_roles
      });
    }

    // 7. AI Course Recommendations
    if (url.includes('/ai/recommend-igot-courses')) {
      return jsonResponse({
        status: 'SUCCESS',
        recommended_courses: MOCK_RECOMMENDATIONS,
        transition_rationale: 'Curated 4-module pathway closing statistical sampling and microdata validation gaps for promotion to Senior Statistical Officer.'
      });
    }

    // 8. Course Preview & iGOT Player
    if (url.includes('/igot-preview')) {
      return jsonResponse(MOCK_RECOMMENDATIONS[0]);
    }

    // 9. Course Enrollment
    if (url.includes('/courses/enroll')) {
      return jsonResponse({
        status: 'SUCCESS',
        message: 'Successfully enrolled on iGOT Karmayogi Bharat! Course progress will be tracked via SCORM telemetry.',
        enrollment_id: 'IGOT-ENR-2026-9482'
      });
    }

    // 10. Competencies List
    if (url.includes('/competencies')) {
      return jsonResponse(MOCK_COMPETENCIES);
    }

    // 11. Assessments
    if (url.includes('/assessments')) {
      return jsonResponse(MOCK_ASSESSMENTS);
    }

    // 12. Assessment Submission
    if (url.includes('/assessments/submit')) {
      return jsonResponse({
        status: 'PASSED',
        score_pct: 85.0,
        correct_count: 4,
        total_questions: 5,
        passed: true,
        competency_increment: '+1 Level (Promotional Point Credited)',
        message: 'Outstanding performance! Competency Ledger updated with tamper-evident audit hash.'
      });
    }

    // Default Fallback
    return jsonResponse({ status: 'OK', message: 'Demo fallback response' });
  };

  console.info("⚡ SIH 2026 Resilient Client Interceptor initialized. Ready for GitHub Pages and offline evaluation.");
})();
