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

    // 7. AI Course Recommendations & Cadre Transition Plan (Dynamic by Role)
    if (url.includes('/ai/recommend-igot-courses') || url.includes('/cadre/career-transition-plan')) {
      let b = {};
      try { b = JSON.parse(opts.body || '{}'); } catch(e){}
      const currentRole = b.current_job_role_id || 1;
      const targetRole = b.target_job_role_id || 2;

      let courses = [];
      let rationale = "";

      if (targetRole >= 5) {
        // Executive / Senior Leadership (Director, Joint Director)
        courses = [
          {
            id: 110,
            title: "Applied Machine Learning for Official Statistics & Predictive Imputation",
            provider: "iGOT Karmayogi & IIT Partner",
            duration_hours: 24,
            skill_level: "Advanced",
            phase: "Phase 3: Executive Analytics",
            match_score_pct: 99,
            gap_match_score: 98,
            role_match_score: 99,
            ai_rationale: "Addresses critical machine learning imputation deficits required for macro-level statistical forecasting and automated outlier screening at the Director/JD cadre level.",
            external_url: "https://igotkarmayogi.gov.in",
            is_enrolled: false
          },
          {
            id: 104,
            title: "Advanced Survey Methodology & National Accounts Compilation",
            provider: "NSSTA TPAC 2026",
            duration_hours: 30,
            skill_level: "Advanced",
            phase: "Phase 2: Core Cadre Elevation",
            match_score_pct: 95,
            gap_match_score: 94,
            role_match_score: 96,
            ai_rationale: "Essential for supervisory oversight of supply-use tables, national income accounting, and macroeconomic deflation standards.",
            external_url: "https://igotkarmayogi.gov.in",
            is_enrolled: false
          },
          {
            id: 108,
            title: "Official Statistics Dissemination, Policy Communication & Leadership",
            provider: "iGOT Karmayogi & IIM",
            duration_hours: 14,
            skill_level: "Advanced",
            phase: "Phase 1: Cadre Transition",
            match_score_pct: 91,
            gap_match_score: 90,
            role_match_score: 92,
            ai_rationale: "Prepares senior statisticians for ministerial briefings, press conferences, and strategic inter-departmental statistical coordination.",
            external_url: "https://igotkarmayogi.gov.in",
            is_enrolled: true
          }
        ];
        rationale = "Transitioning to Senior Executive Cadre (Director/Joint Director) requires elevating key leadership, machine learning governance, and national income compilation standards.";
      } else if (targetRole === 3 || targetRole === 4) {
        // Mid Cadre / Assistant Director / Deputy Director
        courses = [
          {
            id: 105,
            title: "Data Visualization & Executive Dashboards for MoSPI Bulletins",
            provider: "iGOT Karmayogi Bharat",
            duration_hours: 18,
            skill_level: "Intermediate",
            phase: "Phase 1: Foundational Bridging",
            match_score_pct: 96,
            gap_match_score: 95,
            role_match_score: 97,
            ai_rationale: "Builds high-impact interactive data visualization capabilities for parliamentary reports and national statistical releases.",
            external_url: "https://igotkarmayogi.gov.in",
            is_enrolled: false
          },
          {
            id: 106,
            title: "Geospatial Data Analysis & GIS Mapping in Official Statistics",
            provider: "NSSTA & Survey of India",
            duration_hours: 22,
            skill_level: "Intermediate",
            phase: "Phase 2: Technical Specialization",
            match_score_pct: 92,
            gap_match_score: 90,
            role_match_score: 94,
            ai_rationale: "Enables thematic boundary mapping and spatial stratification for regional survey blocks and economic census rounds.",
            external_url: "https://igotkarmayogi.gov.in",
            is_enrolled: false
          },
          {
            id: 107,
            title: "Large-Scale Data Engineering with PySpark & Cloud Analytics",
            provider: "iGOT Karmayogi Bharat",
            duration_hours: 28,
            skill_level: "Advanced",
            phase: "Phase 3: Data Infrastructure",
            match_score_pct: 88,
            gap_match_score: 87,
            role_match_score: 89,
            ai_rationale: "Equips intermediate cadre officers to process billions of census and administrative tax records on MoSPI National Data Warehouse cloud infrastructure.",
            external_url: "https://igotkarmayogi.gov.in",
            is_enrolled: false
          }
        ];
        rationale = "Targeting Assistant / Deputy Director focuses on modernizing large-scale data engineering pipelines, interactive dashboard reporting, and geospatial analytics.";
      } else {
        // Operational Cadre (SSO / Statistical Officer)
        courses = [
          {
            id: 101,
            title: "Sampling Methods & Survey Design for Official Statistics",
            provider: "iGOT Karmayogi & NSSTA",
            duration_hours: 16,
            skill_level: "Intermediate",
            phase: "Phase 1: Foundational Cadre Bridging",
            match_score_pct: 97,
            gap_match_score: 98,
            role_match_score: 96,
            ai_rationale: "Directly targets the primary gap in Probability Proportional to Size (PPS) and multistage sample selection for nationwide household surveys.",
            external_url: "https://igotkarmayogi.gov.in",
            is_enrolled: false
          },
          {
            id: 102,
            title: "Python for Automated Data Validation & Microdata Processing",
            provider: "iGOT Karmayogi Bharat",
            duration_hours: 20,
            skill_level: "Intermediate",
            phase: "Phase 2: Core Cadre Competency Elevation",
            match_score_pct: 93,
            gap_match_score: 92,
            role_match_score: 94,
            ai_rationale: "Automates range validations and structural checks across PLFS and Annual Survey of Industries microdata batches.",
            external_url: "https://igotkarmayogi.gov.in",
            is_enrolled: true
          },
          {
            id: 103,
            title: "Relational Database Management & SQL for Statistical Registries",
            provider: "iGOT Karmayogi Bharat",
            duration_hours: 14,
            skill_level: "Foundational",
            phase: "Phase 3: Specialized Operational Proficiency",
            match_score_pct: 89,
            gap_match_score: 88,
            role_match_score: 90,
            ai_rationale: "Provides fundamental relational schema querying skills for linking enterprise registers and demographic sampling frames.",
            external_url: "https://igotkarmayogi.gov.in",
            is_enrolled: false
          }
        ];
        rationale = "Targeting Senior Statistical Officer prioritizes survey sampling design, microdata automated cleaning with Python, and SQL registry operations.";
      }

      const curRoleObj = MOCK_CADRE_OPTIONS.job_roles.find(r => r.id === currentRole) || MOCK_CADRE_OPTIONS.job_roles[0];
      const tgtRoleObj = MOCK_CADRE_OPTIONS.job_roles.find(r => r.id === targetRole) || MOCK_CADRE_OPTIONS.job_roles[1];

      return jsonResponse({
        status: 'SUCCESS',
        current_role: curRoleObj,
        target_role: tgtRoleObj,
        promotion_readiness_pct: targetRole >= 5 ? 72.9 : targetRole >= 3 ? 78.4 : 84.5,
        readiness_status: targetRole >= 5 ? "Near Readiness — Targeted Gap Closure Needed" : "On Track — High Promotion Eligibility",
        transition_rationale: rationale,
        ai_strategic_roadmap: `${rationale} Aligned with the MoSPI National Competency Framework for official statistical personnel.`,
        recommended_courses: courses,
        competency_deltas: [
          { competency_id: 1, competency_name: "Sampling & Survey Design", current_score: 55, target_score: 85, gap_points: 30, is_met: false },
          { competency_id: 2, competency_name: "National Accounts Compilation", current_score: 50, target_score: 80, gap_points: 30, is_met: false },
          { competency_id: 7, competency_name: "Python Programming for Official Stats", current_score: 62, target_score: 85, gap_points: 23, is_met: false },
          { competency_id: 8, competency_name: "AI / Machine Learning Imputation", current_score: 35, target_score: 85, gap_points: 50, is_met: false },
          { competency_id: 3, competency_name: "Price Statistics & Index Numbers", current_score: 72, target_score: 70, gap_points: 0, is_met: true }
        ]
      });
    }

    // 8. Course Preview & iGOT Player (Dynamic for any course ID)
    if (url.includes('/igot-preview')) {
      const match = url.match(/\/courses\/(\d+)\/igot-preview/);
      const requestedId = match ? parseInt(match[1]) : 101;
      const foundCourse = (MOCK_RECOMMENDATIONS && MOCK_RECOMMENDATIONS.find(c => c.id === requestedId)) || {
        id: requestedId,
        title: requestedId >= 109 ? "Applied Machine Learning for Official Statistics & Predictive Imputation" :
               requestedId >= 106 ? "Geospatial Data Analysis & GIS Mapping in Official Statistics" :
               requestedId >= 104 ? "Advanced Survey Methodology & National Accounts Compilation" :
               requestedId === 102 ? "Python for Automated Data Validation & Microdata Processing" :
               "Sampling Methods & Survey Design for Official Statistics",
        provider: requestedId >= 109 ? "iGOT Karmayogi & IIT Partner" : requestedId >= 104 ? "NSSTA TPAC 2026" : "iGOT Karmayogi & NSSTA",
        duration_hours: 24,
        skill_level: requestedId >= 104 ? "Advanced" : "Intermediate",
        external_url: "https://igotkarmayogi.gov.in",
        is_enrolled: false,
        syllabus: [
          "Module 1: Principles & Frameworks in Indian Official Statistics",
          "Module 2: Practical Data Processing & Empirical Modeling",
          "Module 3: Advanced Cadre Methodologies & Imputation",
          "Module 4: Quality Assurance & Dissemination Standards"
        ]
      };
      return jsonResponse(foundCourse);
    }

    // 8b. Course Curriculum Notes (for RAG Assessment Generation)
    if (url.includes('/curriculum-notes')) {
      return jsonResponse({
        course_id: 1,
        title: "Foundations of Sample Survey Design & NSS Methodologies",
        course_code: "IGOT-MOSPI-SSD-01",
        provider: "NSSTA / MoSPI",
        category: "Domain / Statistical Cadre",
        skill_level: "Intermediate",
        description: "Official MoSPI curriculum covering sampling theory, probability proportional to size (PPS), stratified multistage sampling, calibration weighting, and PLFS microdata validation.",
        syllabus: [
          "Module 1: Principles of Sample Design & Sampling Frames (MoSPI Standards)",
          "Module 2: Multistage Stratified Sampling & PPS Selection",
          "Module 3: Calibration Weighting, Post-Stratification & Weight Trimming",
          "Module 4: Quality Assurance, Hot-Deck Imputation & Microdata Release"
        ],
        curriculum_text: `### iGOT Official Course Curriculum: Foundations of Sample Survey Design & NSS Methodologies\n**Course Code**: IGOT-MOSPI-SSD-01 | **MoSPI Cadre Competency**: Sampling & Survey Design\n\n#### Module 1: Foundations of Sample Survey Design & Sampling Frames\n- Sampling vs Complete Enumeration in Official Indian Statistics (MoSPI, NSS, PLFS)\n- Construction and maintenance of Urban Frame Survey (UFS) blocks and Rural Frame directories\n- Simple Random Sampling (SRS) without replacement vs with replacement; sampling variance estimation\n\n#### Module 2: Multistage Stratified Sampling & PPS Selection\n- Stratification principles: allocation strategies (Equal, Proportional, and Neyman Optimal Allocation)\n- Probability Proportional to Size (PPS) with replacement and systematic PPS without replacement\n- Primary Sampling Unit (PSU) and Ultimate Sampling Unit (USU) selection in NSS household rounds\n\n#### Module 3: Calibration Weighting, Post-Stratification & Outliers\n- Design weight calculation (inverse probability of selection: 1 / π_i)\n- Multiplier formulation and multiplier adjustment for non-response\n- Generalised Regression Estimator (GREG) post-stratification using administrative control totals\n- Weight trimming and Winsorization at 99th percentile to suppress variance spikes\n\n#### Module 4: Quality Assurance, Imputation & Microdata Release\n- Item and unit non-response handling: deterministic vs stochastic hot-deck imputation\n- Calculation of design effect (Deff) and intra-cluster correlation (roh)\n- MoSPI National Data Warehouse validation and microdata dissemination guidelines`
      });
    }

    // 8c. NSSTA Trainers & Guides API Integration
    if (url.includes('/nssta/trainers')) {
      return jsonResponse([
        {
          id: 1,
          name: "Dr. Priya Sharma",
          designation: "Course Director & Senior Faculty (Sampling & Methodology)",
          department: "National Statistical Systems Training Academy (NSSTA)",
          specialization: "Complex Survey Sampling, PPS, & Hansen-Hurwitz Multipliers",
          avatar: "PS"
        },
        {
          id: 2,
          name: "Prof. K. R. Ramanathan",
          designation: "Professor of Macroeconomic Accounting & Price Statistics",
          department: "National Statistical Systems Training Academy (NSSTA)",
          specialization: "System of National Accounts (SNA), Double Deflation, & CPI/WPI Formulation",
          avatar: "KR"
        },
        {
          id: 3,
          name: "Dr. Ananya Sengupta",
          designation: "Associate Professor & Lead AI/ML Instructor",
          department: "NSSTA & IIT Delhi Collaborative Statistical Cell",
          specialization: "Machine Learning Imputation, PySpark Big Data, & Spatial GIS",
          avatar: "AS"
        }
      ]);
    }

    // 8d. Publish as Official Main Assessment
    if (url.includes('/mcq/publish-as-main-assessment')) {
      let b = {};
      try { b = JSON.parse(opts.body || '{}'); } catch(e){}
      return jsonResponse({
        status: "SUCCESS",
        message: "Assessment successfully published as the Official Main Cadre Assessment across the platform!",
        assessment_id: b.assessment_id || 1,
        course_id: b.course_id || 1
      });
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

    // 11. Multi-Level MCQ Quizzes
    // 11. Multi-Level MCQ Quizzes (15 Questions: 5 Level 1, 5 Level 2, 5 Level 3 • 30 Mins)
    if (url.includes('/mcq/multilevel-quizzes')) {
      const multiQuizzes = [
        {
          id: 1,
          title: "AI RAG Cadre Comprehensive Multi-Level Exam (15 MCQs • 30 Mins)",
          course_title: "Foundations of Sample Survey Design & NSS Methodologies",
          competency_name: "Sampling & Survey Design",
          passing_score: 70,
          duration_minutes: 30,
          total_questions: 15,
          questions: [
            // LEVEL 1: FOUNDATIONAL / RECALL & DEFINITIONS (5 Questions)
            {
              id: 201,
              level: 1,
              bloom_level: "Recall",
              difficulty: "Easy",
              source_reference: "NSSTA Guide Section 1.2 — Foundations of PPS",
              source_note_citation: "NSS Survey Design Module 1",
              stem: "In official sample survey methodology, what is the fundamental operating principle of Probability Proportional to Size (PPS) sampling?",
              options: [
                { key: "A", text: "Selection probabilities are directly proportional to a designated auxiliary measure of unit size (such as village population or factory turnover)." },
                { key: "B", text: "Every primary sampling unit is assigned an identical and uniform selection probability regardless of size." },
                { key: "C", text: "Only units exceeding a fixed numerical threshold are surveyed, omitting all smaller units." },
                { key: "D", text: "Sample allocation is determined solely by the interviewer's subjective field discretion." }
              ],
              correct: "A",
              explanation: "PPS sampling assigns higher selection probabilities to larger primary units, drastically lowering sampling variance for aggregate economic and demographic totals."
            },
            {
              id: 202,
              level: 1,
              bloom_level: "Understanding",
              difficulty: "Easy",
              source_reference: "NSSTA Guide Section 2.1 — Index Number Principles",
              source_note_citation: "Price Statistics Compendium",
              stem: "Which mathematical index formula is primarily utilized as the basis for the headline Consumer Price Index (CPI) in India?",
              options: [
                { key: "A", text: "Modified Laspeyres Index using fixed base-period consumption basket weights." },
                { key: "B", text: "Paasche Index with continuously updating current-period weights." },
                { key: "C", text: "Fisher Ideal Geometric Mean of unweighted commodity price relatives." },
                { key: "D", text: "Simple Marshall-Edgeworth arithmetic aggregator without expenditure weights." }
              ],
              correct: "A",
              explanation: "Official CPI compilation employs the modified Laspeyres formula, measuring the cost change over time of an itemized consumption basket fixed at the base year."
            },
            {
              id: 207,
              level: 1,
              bloom_level: "Recall",
              difficulty: "Easy",
              source_reference: "NSSTA Guide Section 4.1 — Production Accounts & Output Valuation",
              source_note_citation: "System of National Accounts Framework",
              stem: "In the System of National Accounts (SNA), how is Gross Value Added (GVA) at Basic Prices formally defined?",
              options: [
                { key: "A", text: "Gross Output at basic prices minus Intermediate Consumption at purchasers' prices." },
                { key: "B", text: "Gross Domestic Product (GDP) plus Net Product Taxes and Subsidies." },
                { key: "C", text: "Total compensation of employees plus gross fixed capital depreciation only." },
                { key: "D", text: "Final consumption expenditure plus net exports of goods and services." }
              ],
              correct: "A",
              explanation: "GVA at basic prices measures the net value generated in production by subtracting intermediate consumption from total gross production output."
            },
            {
              id: 208,
              level: 1,
              bloom_level: "Understanding",
              difficulty: "Easy",
              source_reference: "NSSTA Guide Section 6.1 — Introduction to Machine Learning in Official Statistics",
              source_note_citation: "Cadre Data Science Handbook",
              stem: "What is the key distinction between Supervised and Unsupervised Machine Learning when processing national census and survey data?",
              options: [
                { key: "A", text: "Supervised learning models predict known target outcomes from labeled training examples, whereas unsupervised learning identifies intrinsic patterns without ground-truth labels." },
                { key: "B", text: "Supervised learning requires zero mathematical assumptions, whereas unsupervised learning requires linear normality." },
                { key: "C", text: "Unsupervised learning is solely restricted to numerical regression models." },
                { key: "D", text: "Supervised models cannot process tabular survey data." }
              ],
              correct: "A",
              explanation: "Supervised algorithms map inputs to labeled outputs, while unsupervised methods discover natural groupings or clusters without labeled targets."
            },
            {
              id: 209,
              level: 1,
              bloom_level: "Recall",
              difficulty: "Easy",
              source_reference: "NSSTA Guide Section 1.1 — Error Taxonomy in Official Statistical Surveys",
              source_note_citation: "MoSPI Quality Framework Manual",
              stem: "How is Sampling Error distinguished from Non-Sampling Error in official government sample surveys?",
              options: [
                { key: "A", text: "Sampling error arises solely from observing a sample rather than the complete population, whereas non-sampling error stems from measurement, coverage, non-response, and data entry defects." },
                { key: "B", text: "Sampling error is present in a complete 100% census, while non-sampling error only exists in small samples." },
                { key: "C", text: "Sampling error can never be quantified mathematically." },
                { key: "D", text: "Non-sampling error decreases automatically to zero whenever sample size increases." }
              ],
              correct: "A",
              explanation: "Sampling error is the mathematical variation inherent in probability sampling; non-sampling errors occur across all survey stages and affect both sample surveys and complete censuses."
            },

            // LEVEL 2: APPLIED / OPERATIONAL PROBLEM SOLVING (5 Questions)
            {
              id: 203,
              level: 2,
              bloom_level: "Application",
              difficulty: "Medium",
              source_reference: "NSSTA Guide Section 3.2 — Non-Sampling Errors & Missing Data",
              source_note_citation: "PLFS Field Manual Chapter 4",
              stem: "In the Periodic Labour Force Survey (PLFS), when an enumerated household temporarily refuses to report monthly consumption expenditure, what is the approved statistical procedure?",
              options: [
                { key: "A", text: "Hot-deck imputation borrowing values from an identically stratified donor household in the same Primary Sampling Unit (PSU)." },
                { key: "B", text: "Recording zero expenditure and proceeding with sample computation without adjustment." },
                { key: "C", text: "Discarding the entire village cluster and re-listing the primary sampling frame." },
                { key: "D", text: "Estimating expenditure based on national per-capita GDP without regional weighting." }
              ],
              correct: "A",
              explanation: "Official NSS protocol dictates hot-deck donor matching within the same stratum to preserve empirical distributional variance without introducing arbitrary mean shrinkage."
            },
            {
              id: 204,
              level: 2,
              bloom_level: "Application",
              difficulty: "Medium",
              source_reference: "NSSTA Guide Section 1.5 — Stratification & Neyman Allocation",
              source_note_citation: "NSS Survey Design Module 2",
              stem: "Under Neyman Optimal Allocation for stratified sampling, how is sample size allocated across strata?",
              options: [
                { key: "A", text: "Directly proportional to the product of stratum size (N_h) and stratum standard deviation (S_h)." },
                { key: "B", text: "Equally divided among all strata regardless of size or variability." },
                { key: "C", text: "Inversely proportional to stratum variance to penalize volatile groups." },
                { key: "D", text: "Allocated strictly based on administrative district boundaries." }
              ],
              correct: "A",
              explanation: "Neyman allocation minimizes the overall variance of the estimator by allocating larger sample fractions to strata that are larger and exhibit higher internal variance."
            },
            {
              id: 210,
              level: 2,
              bloom_level: "Application",
              difficulty: "Medium",
              source_reference: "NSSTA Guide Section 1.5 — Operational Field Design for Self-Weighting Samples",
              source_note_citation: "Cadre Household Survey Manual",
              stem: "In a nationwide socioeconomic survey, a state stratum contains rural villages of vastly disparate population counts. What is the optimal two-stage design to achieve self-weighting sample households?",
              options: [
                { key: "A", text: "Select First Stage Units (villages) with PPS systematic sampling, and select a fixed number of households (SSUs) via SRSWOR within each selected village." },
                { key: "B", text: "Select villages with Simple Random Sampling and enumerate 100% of households in each chosen village." },
                { key: "C", text: "Select both villages and households using non-probability purposive quota selection." },
                { key: "D", text: "Select villages with PPS and choose an identical proportion of households in each village regardless of village size." }
              ],
              correct: "A",
              explanation: "Selecting PSUs with PPS and taking a fixed sample size of SSUs per PSU yields an overall equal probability of selection for households, making the design self-weighting."
            },
            {
              id: 211,
              level: 2,
              bloom_level: "Application",
              difficulty: "Medium",
              source_reference: "NSSTA Guide Section 2.4 — Substitution Bias and Chained Index Solutions",
              source_note_citation: "Price Statistics Technical Directive",
              stem: "When relative prices of mutton and chicken diverge sharply and consumers substitute towards cheaper chicken, how does the fixed-basket Laspeyres CPI behave relative to the true cost-of-living index?",
              options: [
                { key: "A", text: "It overstates the true cost of living increase because it holds consumption quantities rigidly fixed at base period preferences." },
                { key: "B", text: "It understates the true inflation rate because it ignores intermediate goods." },
                { key: "C", text: "It matches the true cost-of-living index perfectly through implicit geometric averaging." },
                { key: "D", text: "It becomes negative due to downward commodity substitution." }
              ],
              correct: "A",
              explanation: "The Laspeyres formula fails to account for consumer substitution toward relatively cheaper alternatives, leading to an upward substitution bias relative to the true Cost of Living Index."
            },
            {
              id: 212,
              level: 2,
              bloom_level: "Application",
              difficulty: "Medium",
              source_reference: "NSSTA Guide Section 6.4 — Survey Resampling & Clustered Cross-Validation",
              source_note_citation: "Official ML Analytics Guidelines",
              stem: "When fitting a predictive gradient boosted model to classify informal household enterprise profitability, why must cross-validation folds be grouped at the Primary Sampling Unit (cluster) level rather than randomly split by household?",
              options: [
                { key: "A", text: "To prevent data leakage caused by spatial and socioeconomic correlation among households within the same cluster, preventing overly optimistic validation performance." },
                { key: "B", text: "To ensure that all tree algorithms run in strictly polynomial time." },
                { key: "C", text: "To eliminate the need for survey sampling weights in the loss function." },
                { key: "D", text: "Because standard Python packages cannot execute random household splitting." }
              ],
              correct: "A",
              explanation: "Clustered survey data exhibit intra-cluster correlation. Clustered CV prevents spatial leakage and provides realistic out-of-cluster generalization evaluation."
            },

            // LEVEL 3: ADVANCED / STRATEGIC ANALYTICAL EVALUATION (5 Questions)
            {
              id: 205,
              level: 3,
              bloom_level: "Analysis",
              difficulty: "Hard",
              source_reference: "NSSTA Guide Section 4.3 — Small Area Estimation (SAE)",
              source_note_citation: "Advanced Statistical Methodology Guide",
              stem: "When sub-district sample sizes in a national survey yield a Relative Standard Error (RSE) exceeding 20%, which modeling framework is mandated by official guidelines?",
              options: [
                { key: "A", text: "Fay-Herriot area-level Empirical Best Linear Unbiased Prediction (EBLUP) borrowing strength from auxiliary administrative records." },
                { key: "B", text: "Direct unweighted expansion estimators using simple random sampling assumptions." },
                { key: "C", text: "Arbitrary suppression of all district data without replacement." },
                { key: "D", text: "Standard Ordinary Least Squares (OLS) regression ignoring survey design weights." }
              ],
              correct: "A",
              explanation: "When direct sample sizes cannot support domain publication (RSE > 20%), Fay-Herriot EBLUP shrinkage models borrow strength from auxiliary registers (GST, Census, Satellite Data)."
            },
            {
              id: 206,
              level: 3,
              bloom_level: "Analysis",
              difficulty: "Hard",
              source_reference: "NSSTA Guide Section 5.1 — National Accounts Deflation",
              source_note_citation: "System of National Accounts Handbook",
              stem: "In the compilation of Gross Value Added (GVA) at constant prices, why is Double Deflation recognized as superior to Single Indicator Deflation?",
              options: [
                { key: "A", text: "It deflates gross output and intermediate consumption separately using specific price indices, avoiding distortions from divergent input-output price trends." },
                { key: "B", text: "It eliminates the requirement of maintaining an annual supply-use table." },
                { key: "C", text: "It doubles the measured real growth rate of manufacturing sectors automatically." },
                { key: "D", text: "It uses only wholesale price index (WPI) for all tertiary service sectors." }
              ],
              correct: "A",
              explanation: "Single deflation creates severe statistical distortions when input prices (energy, commodities) move differently from output prices. Double deflation correctly isolates genuine real volume change."
            },
            {
              id: 213,
              level: 3,
              bloom_level: "Analysis",
              difficulty: "Hard",
              source_reference: "NSSTA Guide Section 1.8 — Complex Survey Variance Estimation & Deff Diagnostics",
              source_note_citation: "Cadre Advanced Sampling Compendium",
              stem: "A state statistical bureau plans a two-stage survey where the intra-class correlation rho = 0.18 for key welfare indicators. If the cluster sample size is increased from m = 8 to m = 20 households per village, what is the design impact on survey efficiency?",
              options: [
                { key: "A", text: "The Design Effect (Deff = 1 + (m-1)*rho) expands from 2.26 to 4.42, causing a severe penalty in effective sample size and requiring higher PSU dispersion instead." },
                { key: "B", text: "The standard error decreases proportionally to sqrt(20/8) with zero variance inflation." },
                { key: "C", text: "The Design Effect drops to zero because within-cluster sample size is larger." },
                { key: "D", text: "Non-sampling errors are mathematically eliminated by higher cluster density." }
              ],
              correct: "A",
              explanation: "Deff = 1 + (m - 1)*rho. When rho is positive (0.18), increasing m from 8 to 20 nearly doubles the design effect from 2.26 to 4.42, drastically degrading statistical efficiency per surveyed household."
            },
            {
              id: 214,
              level: 3,
              bloom_level: "Analysis",
              difficulty: "Hard",
              source_reference: "NSSTA Guide Section 1.7 — Unequal Probability Theory & Horvitz-Thompson Variance",
              source_note_citation: "Official Cadre Sampling Directives",
              stem: "When evaluating unequal probability sampling without replacement (WOR) versus with replacement (WR), why is the Horvitz-Thompson estimator preferred over the Hansen-Hurwitz estimator?",
              options: [
                { key: "A", text: "Horvitz-Thompson operates on distinct units without replacement using first-order inclusion probabilities (pi_i), achieving substantially lower sampling variance by eliminating redundant sampling of identical units." },
                { key: "B", text: "Hansen-Hurwitz is statistically invalid for all government surveys." },
                { key: "C", text: "Horvitz-Thompson requires zero knowledge of unit inclusion probabilities." },
                { key: "D", text: "Because without-replacement sampling always inflates standard errors proportionally to stratum size." }
              ],
              correct: "A",
              explanation: "Sampling without replacement avoids resampling identical units. The Horvitz-Thompson estimator weighted by 1/pi_i delivers strictly lower variance than with-replacement Hansen-Hurwitz estimation under PPS."
            },
            {
              id: 215,
              level: 3,
              bloom_level: "Analysis",
              difficulty: "Hard",
              source_reference: "NSSTA Guide Section 2.8 — Axiomatic and Economic Approaches to Superlative Indices",
              source_note_citation: "Macroeconomic Price Statistics Division",
              stem: "According to Diewert's superlative index theory, why are the Fisher Ideal and Törnqvist price indexes mathematically superior to the Laspeyres and Paasche formulas for official inflation tracking?",
              options: [
                { key: "A", text: "They represent flexible second-order approximations to an arbitrary twice-continuously differentiable true Cost of Living aggregator function, passing both time-reversal and factor-reversal axiomatic tests." },
                { key: "B", text: "They completely avoid collecting commodity price quotations in rural markets." },
                { key: "C", text: "They assume consumer price elasticity is zero across all expenditure classes." },
                { key: "D", text: "They are arithmetic sums that can be computed without computer assistance." }
              ],
              correct: "A",
              explanation: "Superlative indices treat base and current period consumer substitutions symmetrically, providing exact approximations to flexible utility aggregators and eliminating first-order substitution bias."
            }
          ]
        }
      ];
      return jsonResponse(multiQuizzes);
    }

    // 12. Multi-Level Exam Submission (15 Questions • 30 Mins)
    if (url.includes('/mcq/submit-multilevel-test')) {
      return jsonResponse({
        status: "SUCCESS",
        passed: true,
        score_percentage: 86.7,
        total_correct: 13,
        total_questions: 15,
        passing_score: 70,
        assessed_level: 3,
        updated_competency_score: 88.5,
        competency_gain: "+1 Level (Accredited on Official Cadre Competency Ledger)",
        level_breakdown: {
          level_1: { correct: 5, total: 5, score_pct: 100 },
          level_2: { correct: 4, total: 5, score_pct: 80 },
          level_3: { correct: 4, total: 5, score_pct: 80 }
        },
        detailed_feedback: [
          { question_id: 201, is_correct: true, correct_answer: "A", explanation: "PPS allocates probability proportional to size, lowering aggregate variance." },
          { question_id: 202, is_correct: true, correct_answer: "A", explanation: "Official CPI is compiled via Modified Laspeyres formula with base basket weights." },
          { question_id: 207, is_correct: true, correct_answer: "A", explanation: "GVA at basic prices is defined as Gross Output minus Intermediate Consumption." },
          { question_id: 208, is_correct: true, correct_answer: "A", explanation: "Supervised models predict known labels while unsupervised finds hidden clusters." },
          { question_id: 209, is_correct: true, correct_answer: "A", explanation: "Sampling error is mathematically quantified probability variation; non-sampling affects all stages." },
          { question_id: 203, is_correct: true, correct_answer: "A", explanation: "Hot-deck imputation in the same stratum prevents sample distortion." },
          { question_id: 204, is_correct: true, correct_answer: "A", explanation: "Neyman allocation distributes proportional to N_h * S_h." },
          { question_id: 210, is_correct: true, correct_answer: "A", explanation: "PPS PSUs with fixed SSU take per PSU creates equal overall selection probability." },
          { question_id: 211, is_correct: true, correct_answer: "A", explanation: "Fixed basket Laspeyres suffers from upward substitution bias." },
          { question_id: 212, is_correct: false, correct_answer: "A", explanation: "Clustered CV avoids optimistic validation results from intra-cluster neighborhood correlation." },
          { question_id: 205, is_correct: true, correct_answer: "A", explanation: "Fay-Herriot EBLUP borrows auxiliary strength when domain sample RSE is high." },
          { question_id: 206, is_correct: true, correct_answer: "A", explanation: "Double deflation separately deflates output and intermediate inputs to preserve real value added." },
          { question_id: 213, is_correct: true, correct_answer: "A", explanation: "Design Effect Deff = 1 + (m-1)*rho expands severely when cluster take expands under positive rho." },
          { question_id: 214, is_correct: true, correct_answer: "A", explanation: "Horvitz-Thompson without replacement avoids resampling identical units, minimizing variance." },
          { question_id: 215, is_correct: false, correct_answer: "A", explanation: "Fisher and Törnqvist superlative indices pass time and factor reversal tests, eliminating substitution bias." }
        ]
      });
    }

    // 12a. AI RAG Multi-Level Assessment Synthesis (Faculty Upload Studio)
    if (url.includes('/mcq/generate-multilevel-quiz')) {
      let reqBody = {};
      try { reqBody = typeof init?.body === 'string' ? JSON.parse(init.body) : {}; } catch(e) {}
      const guideTitle = reqBody.guide_title || "NSSTA Cadre Statistical Training Guide — 2026 Edition";
      const countPerLevel = reqBody.count_per_level || 2;
      const targetLevels = reqBody.levels || [1, 2, 3];

      const generatedAssessment = {
        status: "SUCCESS",
        assessment_id: Date.now(),
        title: reqBody.assessment_title || `AI RAG Assessment: ${guideTitle}`,
        course_title: "Survey Sampling & Multi-Level Official Statistics (iGOT & NSSTA)",
        competency_name: "Advanced Statistical Methodology & National Accounts",
        passing_score: 70,
        duration_minutes: targetLevels.length * countPerLevel * 3,
        total_questions: targetLevels.length * countPerLevel,
        questions: [
          {
            id: 901,
            level: 1,
            bloom_level: "Recall",
            difficulty: "Easy",
            source_reference: `${guideTitle} • Ch. 1: Sampling Principles`,
            source_note_citation: "Directly Extracted from Uploaded NSSTA Notes",
            stem: "In official sample survey methodology, what is the fundamental operating principle of Probability Proportional to Size (PPS) sampling?",
            options: [
              { key: "A", text: "Selection probabilities are directly proportional to an auxiliary measure of unit size (e.g. population or factory turnover)." },
              { key: "B", text: "Every primary sampling unit has identical selection probability regardless of size." },
              { key: "C", text: "Only units exceeding a fixed numerical threshold are surveyed." },
              { key: "D", text: "Sample allocation is determined solely by the interviewer's subjective discretion." }
            ],
            correct: "A",
            explanation: "PPS sampling assigns higher selection probability to larger primary units, drastically lowering sampling variance for aggregate economic and demographic totals."
          },
          {
            id: 902,
            level: 2,
            bloom_level: "Application",
            difficulty: "Medium",
            source_reference: `${guideTitle} • Ch. 3: Optimal Allocation & Imputation`,
            source_note_citation: "Directly Extracted from Uploaded NSSTA Notes",
            stem: "In a nationwide multi-stratum survey where within-stratum standard deviations vary substantially, which allocation method guarantees the minimum estimator variance for a fixed total sample size?",
            options: [
              { key: "A", text: "Neyman Optimal Allocation, allocating sample size proportionally to stratum size multiplied by stratum standard deviation (N_h * S_h)." },
              { key: "B", text: "Equal Sample Allocation distributing identical observation counts across all strata." },
              { key: "C", text: "Proportional Allocation relying solely on stratum population size (N_h)." },
              { key: "D", text: "Quota allocation based on field staff availability." }
            ],
            correct: "A",
            explanation: "Neyman Optimal Allocation minimizes estimator variance by accounting for both stratum size and internal stratum variance."
          },
          {
            id: 903,
            level: 3,
            bloom_level: "Evaluation",
            difficulty: "Hard",
            source_reference: `${guideTitle} • Ch. 5: Double Deflation & Macro-Aggregates`,
            source_note_citation: "Directly Extracted from Uploaded NSSTA Notes",
            stem: "In the compilation of Gross Value Added (GVA) at constant prices, why is Double Deflation recognized as superior to Single Indicator Deflation?",
            options: [
              { key: "A", text: "It deflates gross output and intermediate consumption separately using specific price indices, avoiding distortions from divergent input-output price trends." },
              { key: "B", text: "It eliminates the requirement of maintaining an annual supply-use table." },
              { key: "C", text: "It doubles the measured real growth rate of manufacturing sectors automatically." },
              { key: "D", text: "It uses only wholesale price index (WPI) for all tertiary service sectors." }
            ],
            correct: "A",
            explanation: "Single deflation creates severe statistical distortions when input prices move differently from output prices. Double deflation correctly isolates genuine real volume change."
          }
        ]
      };
      return jsonResponse(generatedAssessment);
    }

    // 12b. File Text Extraction Mock
    if (url.includes('/mcq/extract-guide-text')) {
      return jsonResponse({
        status: "SUCCESS",
        filename: "uploaded_guide.pdf",
        text_length: 4280,
        extracted_text: "NATIONAL STATISTICAL SYSTEMS TRAINING ACADEMY (NSSTA)\nCadre Training Manual & Methodological Notes 2026\n\nModule 1: Principles of Probability Proportional to Size (PPS) Sampling\nModule 2: Modified Laspeyres Consumer Price Index Formulation\nModule 3: Stratified Neyman Allocation & Hot-Deck Imputation\nModule 4: Small Area Estimation using Fay-Herriot EBLUP Models\nModule 5: Double Deflation in System of National Accounts (SNA)"
      });
    }

    // 13. Single Assessment (by ID or query)
    if (url.match(/\/assessments\/\d+/) || (url.includes('/assessments/') && !url.includes('/submit'))) {
      return jsonResponse(MOCK_ASSESSMENTS[0]);
    }

    // 14. Assessments List
    if (url.includes('/assessments') && !url.includes('/submit')) {
      return jsonResponse(MOCK_ASSESSMENTS);
    }

    // 15. Assessment Submission
    if (url.includes('/assessments/submit') || url.includes('/assessments/') && url.includes('/submit')) {
      return jsonResponse({
        status: 'PASSED',
        score_percentage: 85.0,
        updated_score: 82.0,
        level_title: 'Level 3 — Operational Practitioner',
        title: 'Diagnostic Assessment Passed',
        correct_count: 4,
        total_questions: 5,
        passed: true,
        strengths: 'Strong grasp of Probability Proportional to Size (PPS) and Modified Laspeyres Index principles.',
        weaknesses: 'Review double deflation principles in National Accounts compilation.',
        action_plan: 'Enroll in Module 3 of the NSSTA National Accounts Compendium on iGOT Karmayogi.'
      });
    }

    // Default Fallback
    return jsonResponse({ status: 'OK', message: 'Demo fallback response' });
  };

  console.info("⚡ SIH 2026 Resilient Client Interceptor initialized. Ready for GitHub Pages and offline evaluation.");
})();
