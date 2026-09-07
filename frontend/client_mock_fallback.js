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

    // 11. Multi-Level MCQ Quizzes
    if (url.includes('/mcq/multilevel-quizzes')) {
      const multiQuizzes = [
        {
          id: 1,
          title: "Multi-Level Assessment: Sampling Design & Price Statistics (NSSTA)",
          course_title: "Foundations of Sample Survey Design & NSS Methodologies",
          competency_name: "Sampling & Survey Design",
          passing_score: 70,
          duration_minutes: 36,
          total_questions: 6,
          questions: [
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
            }
          ]
        }
      ];
      return jsonResponse(multiQuizzes);
    }

    // 12. Multi-Level Exam Submission
    if (url.includes('/mcq/submit-multilevel-test')) {
      return jsonResponse({
        status: "SUCCESS",
        passed: true,
        score_percentage: 83.3,
        total_correct: 5,
        total_questions: 6,
        passing_score: 70,
        competency_gain: "+1 Level (Accredited on Competency Ledger)",
        level_breakdown: {
          level_1: { correct: 2, total: 2, score_pct: 100 },
          level_2: { correct: 2, total: 2, score_pct: 100 },
          level_3: { correct: 1, total: 2, score_pct: 50 }
        },
        detailed_feedback: [
          { question_id: 201, is_correct: true, correct_answer: "A", explanation: "PPS allocates probability proportional to size, lowering aggregate variance." },
          { question_id: 202, is_correct: true, correct_answer: "A", explanation: "Official CPI is compiled via Modified Laspeyres formula with base basket weights." },
          { question_id: 203, is_correct: true, correct_answer: "A", explanation: "Hot-deck imputation in the same stratum prevents sample distortion." },
          { question_id: 204, is_correct: true, correct_answer: "A", explanation: "Neyman allocation distributes proportional to N_h * S_h." },
          { question_id: 205, is_correct: true, correct_answer: "A", explanation: "Fay-Herriot EBLUP borrows auxiliary strength when domain sample RSE is high." },
          { question_id: 206, is_correct: false, correct_answer: "A", explanation: "Double deflation separately deflates output and intermediate inputs to preserve real value added." }
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
