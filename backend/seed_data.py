import datetime
import json
from sqlalchemy.orm import Session
from backend.models.database import Base, engine, SessionLocal
from backend.models.entities import (
    Department, JobRole, User, EmployeeProfile, Education, Experience, TrainingHistory,
    CompetencyDomain, Competency, CompetencyLevel, RoleCompetency, EmployeeCompetency,
    CompetencyEvidence, CompetencyHistory, Course, CourseCompetency, TrainingProgramme,
    Enrollment, SkillGap, Recommendation, LearningPath, LearningPathItem,
    LearningMaterial, MaterialChunk, Assessment, Question, AuditLog, SystemNotification
)
from backend.core.security import get_password_hash
from backend.services.skill_gap_engine import SkillGapEngine
from backend.services.recommendation_engine import HybridRecommendationEngine

def seed_database(force: bool = False):
    db: Session = SessionLocal()
    try:
        if force:
            print("Force reseed requested: Refreshing database schema and data...")
            Base.metadata.drop_all(bind=engine)

        print("Ensuring database schema exists...")
        Base.metadata.create_all(bind=engine)

        # Check if already seeded
        if not force and db.query(User).first():
            print("Database already contains data. Skipping initial seeding.")
            return

        print("Seeding new database with official cadres, competencies, and learning catalog...")

        # -------------------------------------------------------------
        # 1. Departments
        # -------------------------------------------------------------
        print("Seeding Departments...")
        depts_data = [
            {"code": "DAID", "name": "Data Analytics & Innovation Division (DAID)", "desc": "Big data analytics, machine learning pipelines, and modern dissemination."},
            {"code": "SOD", "name": "Survey Operations Division (SOD)", "desc": "Field listing, primary sampling design, and nationwide socioeconomic surveys."},
            {"code": "FOD", "name": "Field Operations Division (FOD)", "desc": "Primary field enumeration, regional offices network, and household surveys execution."},
            {"code": "NAD", "name": "National Accounts Division (NAD)", "desc": "Gross Domestic Product (GDP), input-output tables, and national capital stock."},
            {"code": "ESD", "name": "Economic Statistics Division (ESD)", "desc": "Index of Industrial Production (IIP) and Annual Survey of Industries (ASI)."},
            {"code": "PLSD", "name": "Price & Labor Statistics Division (PLSD)", "desc": "Consumer Price Index (CPI) and Periodic Labour Force Survey (PLFS)."},
            {"code": "NSSTA", "name": "National Statistical Systems Training Academy (NSSTA)", "desc": "Official apex capacity building and statistical pedagogy institute."}
        ]
        dept_objs = {}
        for d in depts_data:
            obj = Department(code=d["code"], name=d["name"], description=d["desc"])
            db.add(obj)
            db.flush()
            dept_objs[d["code"]] = obj

        # -------------------------------------------------------------
        # 2. Competency Domains & Competencies
        # -------------------------------------------------------------
        print("Seeding Competency Framework...")
        domains_data = [
            {
                "code": "STATISTICAL",
                "name": "Domain 1 — Statistical Competencies",
                "desc": "Foundational and advanced mathematical, survey, and national accounting methodologies.",
                "weight": 1.2,
                "skills": [
                    ("SAMPLING", "Sampling & Survey Design", "Probability sampling, stratification, PPS, and complex survey estimators."),
                    ("NAT_ACCOUNTS", "National Accounts Compilation", "SNA 2008 framework, supply-use tables, and deflator estimation."),
                    ("PRICE_STATS", "Price Statistics & Index Numbers", "CPI/WPI formulation, chain-linking, and hedonic pricing."),
                    ("LABOUR_STATS", "Labour & Employment Statistics", "PLFS activity statuses, worker-population ratios, and informal sector tracking."),
                    ("SDG_INDICATORS", "SDG Indicators & Harmonization", "UN SDG monitoring, tier classification, and sub-national indicator frameworks."),
                    ("DATA_QUALITY", "Data Quality Assurance Frameworks", "DQAF standards, non-sampling error reduction, and audit trails.")
                ]
            },
            {
                "code": "TECHNICAL",
                "name": "Domain 2 — Technical Competencies",
                "desc": "Modern computational tools, automated scripting, spatial analytics, and AI/ML.",
                "weight": 1.3,
                "skills": [
                    ("PYTHON", "Python Programming", "Pandas, NumPy, automated statistical pipelines, and API scripting."),
                    ("AI_ML", "AI / Machine Learning", "Supervised/unsupervised algorithms, automated data imputation, and predictive models."),
                    ("SQL", "Relational Database & SQL", "Complex queries, indexing, data warehousing, and relational modeling."),
                    ("GIS", "GIS & Spatial Analytics", "Geospatial layers, satellite imagery integration, and micro-cluster mapping."),
                    ("DATA_VIZ", "Data Visualization & Dashboards", "Interactive statistical charts, narrative data journalism, and BI reporting."),
                    ("CLOUD", "Cloud Computing", "MeghRaj sovereign cloud, microservices, and containerized pipelines.")
                ]
            },
            {
                "code": "DIGITAL_GOV",
                "name": "Domain 3 — Digital Governance & Security",
                "desc": "Sovereignty, data privacy compliance, cybersecurity, and digital public infrastructure.",
                "weight": 1.0,
                "skills": [
                    ("CYBERSECURITY", "Cybersecurity & Data Privacy", "DPDP Act compliance, respondent microdata anonymization, and threat response."),
                    ("DPI", "Digital Public Infrastructure", "API-first government architecture, Aadhaar authentication, and Open Data standards."),
                    ("DIGITAL_SIG", "Digital Signatures & Records Management", "e-Sign protocols, archival standards, and document integrity.")
                ]
            },
            {
                "code": "BEHAVIOURAL",
                "name": "Domain 4 — Behavioural & Managerial",
                "desc": "Public leadership, team orchestration, stakeholder communication, and administrative ethics.",
                "weight": 0.9,
                "skills": [
                    ("LEADERSHIP", "Strategic Leadership & Mentorship", "Directing survey teams, motivating field cadres, and institutional foresight."),
                    ("COMMUNICATION", "Statistical Communication & Storytelling", "Translating complex statistical findings for policy makers and citizens."),
                    ("PROJECT_MGMT", "Project Management & Delivery", "Survey timetable monitoring, budget allocation, and milestone control."),
                    ("ETHICS", "Official Statistics Professional Ethics", "UN Fundamental Principles of Official Statistics, integrity, and confidentiality.")
                ]
            }
        ]

        comp_objs = {}
        for dom in domains_data:
            dom_obj = CompetencyDomain(code=dom["code"], name=dom["name"], description=dom["desc"], weight=dom["weight"])
            db.add(dom_obj)
            db.flush()

            for code, name, desc in dom["skills"]:
                c_obj = Competency(domain_id=dom_obj.id, code=code, name=name, description=desc)
                db.add(c_obj)
                db.flush()
                comp_objs[code] = c_obj

                # Create 5 standardized levels for each competency
                for lvl in range(1, 6):
                    titles = ["Awareness", "Basic", "Intermediate", "Advanced", "Expert"]
                    cl = CompetencyLevel(
                        competency_id=c_obj.id,
                        level=lvl,
                        title=f"Level {lvl} — {titles[lvl-1]}",
                        benchmark_score=lvl * 20.0,
                        behavioral_indicators=f"Demonstrates {titles[lvl-1].lower()} capabilities in {name}.",
                        assessment_criteria=f"Pass score: {lvl * 20}% on standardized test."
                    )
                    db.add(cl)

        # -------------------------------------------------------------
        # 3. Job Roles & Role Competencies
        # -------------------------------------------------------------
        print("Seeding Job Roles & Requirements...")
        role_jso = JobRole(
            title="Junior Statistical Officer (JSO)",
            code="ROLE_JSO",
            description="Executes field data collection, preliminary validation, and basic statistical tabulation.",
            department_id=dept_objs["FOD"].id
        )
        role_stat_analyst = JobRole(
            title="Statistical Data Analyst",
            code="ROLE_SDA",
            description="Analyzes sample survey data, models economic indicators, and builds statistical reports.",
            department_id=dept_objs["DAID"].id
        )
        role_sso = JobRole(
            title="Senior Statistical Officer (SSO)",
            code="ROLE_SSO",
            description="Supervises statistical compilation, survey monitoring, and regional data audits.",
            department_id=dept_objs["SOD"].id
        )
        role_ad = JobRole(
            title="Assistant Director (AD, ISS)",
            code="ROLE_AD",
            description="Leads division-level statistical production, survey design, and index formulation.",
            department_id=dept_objs["NAD"].id
        )
        role_dd = JobRole(
            title="Deputy Director (DD, ISS)",
            code="ROLE_DD",
            description="Directs policy formulation, national data architecture, and macro-economic estimation.",
            department_id=dept_objs["DAID"].id
        )
        role_jd = JobRole(
            title="Joint Director (JD, ISS)",
            code="ROLE_JD",
            description="Oversees national data governance, AI/ML transformation, and cross-ministry data integration.",
            department_id=dept_objs["DAID"].id
        )
        role_dir = JobRole(
            title="Director / Chief Statistician (ISS)",
            code="ROLE_DIR",
            description="Strategic leadership of India's Official Statistical System and international compliance.",
            department_id=dept_objs["NSSTA"].id
        )
        db.add_all([role_jso, role_stat_analyst, role_sso, role_ad, role_dd, role_jd, role_dir])
        db.flush()

        # Benchmarks for Statistical Data Analyst (Current role for Arun Kumar)
        analyst_reqs = [
            ("SAMPLING", 3, 75.0, 1.2),
            ("NAT_ACCOUNTS", 2, 50.0, 1.0),
            ("PYTHON", 3, 80.0, 1.4),       # High requirement
            ("AI_ML", 3, 75.0, 1.5),        # High requirement (critical gap for Arun)
            ("SQL", 3, 75.0, 1.1),
            ("GIS", 2, 60.0, 1.0),
            ("DATA_VIZ", 3, 75.0, 1.1),
            ("CLOUD", 2, 60.0, 1.0),
            ("CYBERSECURITY", 2, 60.0, 1.0),
            ("COMMUNICATION", 3, 70.0, 1.0)
        ]
        for c_code, req_lvl, req_scr, p_wt in analyst_reqs:
            rc = RoleCompetency(
                job_role_id=role_stat_analyst.id,
                competency_id=comp_objs[c_code].id,
                required_level=req_lvl,
                required_score=req_scr,
                priority_weight=p_wt
            )
            db.add(rc)

        # Benchmarks for Senior Statistical Officer (SSO - Primary Promotion Target)
        sso_reqs = [
            ("SAMPLING", 4, 85.0, 1.4),
            ("NAT_ACCOUNTS", 3, 75.0, 1.2),
            ("PYTHON", 4, 85.0, 1.3),
            ("AI_ML", 3, 80.0, 1.4),
            ("SQL", 4, 85.0, 1.2),
            ("GIS", 3, 75.0, 1.1),
            ("DATA_VIZ", 4, 85.0, 1.3),
            ("CLOUD", 3, 75.0, 1.1),
            ("CYBERSECURITY", 3, 75.0, 1.1),
            ("COMMUNICATION", 4, 85.0, 1.3)
        ]
        for c_code, req_lvl, req_scr, p_wt in sso_reqs:
            rc = RoleCompetency(
                job_role_id=role_sso.id,
                competency_id=comp_objs[c_code].id,
                required_level=req_lvl,
                required_score=req_scr,
                priority_weight=p_wt
            )
            db.add(rc)

        # Benchmarks for Assistant Director (AD, ISS - Executive Promotion Target)
        ad_reqs = [
            ("SAMPLING", 4, 90.0, 1.5),
            ("NAT_ACCOUNTS", 4, 85.0, 1.4),
            ("PYTHON", 4, 85.0, 1.3),
            ("AI_ML", 4, 85.0, 1.5),
            ("SQL", 4, 85.0, 1.2),
            ("DATA_VIZ", 4, 90.0, 1.4),
            ("CLOUD", 4, 80.0, 1.2),
            ("CYBERSECURITY", 4, 80.0, 1.2),
            ("COMMUNICATION", 4, 90.0, 1.5)
        ]
        for c_code, req_lvl, req_scr, p_wt in ad_reqs:
            rc = RoleCompetency(
                job_role_id=role_ad.id,
                competency_id=comp_objs[c_code].id,
                required_level=req_lvl,
                required_score=req_scr,
                priority_weight=p_wt
            )
            db.add(rc)

        # Benchmarks for Junior Statistical Officer (JSO - Foundational)
        jso_reqs = [
            ("SAMPLING", 2, 60.0, 1.2),
            ("NAT_ACCOUNTS", 2, 55.0, 1.0),
            ("PYTHON", 2, 50.0, 1.0),
            ("SQL", 2, 55.0, 1.0),
            ("DATA_VIZ", 2, 60.0, 1.0),
            ("COMMUNICATION", 2, 60.0, 1.0)
        ]
        for c_code, req_lvl, req_scr, p_wt in jso_reqs:
            db.add(RoleCompetency(
                job_role_id=role_jso.id,
                competency_id=comp_objs[c_code].id,
                required_level=req_lvl,
                required_score=req_scr,
                priority_weight=p_wt
            ))

        # Benchmarks for Deputy Director (DD, ISS)
        dd_reqs = [
            ("SAMPLING", 4, 92.0, 1.5),
            ("NAT_ACCOUNTS", 4, 88.0, 1.4),
            ("PYTHON", 4, 88.0, 1.3),
            ("AI_ML", 4, 88.0, 1.5),
            ("SQL", 4, 88.0, 1.2),
            ("DATA_VIZ", 5, 92.0, 1.4),
            ("CLOUD", 4, 85.0, 1.2),
            ("CYBERSECURITY", 4, 85.0, 1.2),
            ("COMMUNICATION", 5, 92.0, 1.5)
        ]
        for c_code, req_lvl, req_scr, p_wt in dd_reqs:
            db.add(RoleCompetency(
                job_role_id=role_dd.id,
                competency_id=comp_objs[c_code].id,
                required_level=req_lvl,
                required_score=req_scr,
                priority_weight=p_wt
            ))

        # Benchmarks for Joint Director (JD, ISS)
        jd_reqs = [
            ("SAMPLING", 5, 95.0, 1.5),
            ("NAT_ACCOUNTS", 5, 92.0, 1.5),
            ("PYTHON", 4, 90.0, 1.3),
            ("AI_ML", 5, 92.0, 1.5),
            ("SQL", 4, 90.0, 1.2),
            ("DATA_VIZ", 5, 95.0, 1.4),
            ("CLOUD", 4, 88.0, 1.2),
            ("COMMUNICATION", 5, 95.0, 1.5)
        ]
        for c_code, req_lvl, req_scr, p_wt in jd_reqs:
            db.add(RoleCompetency(
                job_role_id=role_jd.id,
                competency_id=comp_objs[c_code].id,
                required_level=req_lvl,
                required_score=req_scr,
                priority_weight=p_wt
            ))

        # Benchmarks for Director / Chief Statistician (ISS)
        dir_reqs = [
            ("SAMPLING", 5, 98.0, 1.5),
            ("NAT_ACCOUNTS", 5, 96.0, 1.5),
            ("AI_ML", 5, 95.0, 1.5),
            ("DATA_VIZ", 5, 96.0, 1.4),
            ("COMMUNICATION", 5, 98.0, 1.5)
        ]
        for c_code, req_lvl, req_scr, p_wt in dir_reqs:
            db.add(RoleCompetency(
                job_role_id=role_dir.id,
                competency_id=comp_objs[c_code].id,
                required_level=req_lvl,
                required_score=req_scr,
                priority_weight=p_wt
            ))

        # -------------------------------------------------------------
        # 4. Users & Demo Personas
        # -------------------------------------------------------------
        print("Seeding Demo Personas...")

        # Persona 1: Arun Kumar (Employee / Learner)
        user_arun = User(
            username="arun.kumar",
            email="arun.kumar@mospi.gov.in",
            password_hash=get_password_hash("password123"),
            full_name="Arun Kumar",
            role="EMPLOYEE"
        )
        # Persona 2: Dr. Priya Sharma (Trainer)
        user_priya = User(
            username="priya.sharma",
            email="priya.sharma@nssta.gov.in",
            password_hash=get_password_hash("password123"),
            full_name="Dr. Priya Sharma",
            role="TRAINER"
        )
        # Persona 3: Rajesh Verma (Dept Admin)
        user_rajesh = User(
            username="rajesh.verma",
            email="rajesh.verma@mospi.gov.in",
            password_hash=get_password_hash("password123"),
            full_name="Rajesh Verma, ISS",
            role="DEPT_ADMIN"
        )
        # Persona 4: System Admin
        user_admin = User(
            username="admin.system",
            email="sysadmin@mospi.gov.in",
            password_hash=get_password_hash("password123"),
            full_name="National Systems Administrator",
            role="SYSTEM_ADMIN"
        )
        db.add_all([user_arun, user_priya, user_rajesh, user_admin])
        db.flush()

        # Create Arun Kumar's Employee Profile
        emp_arun = EmployeeProfile(
            user_id=user_arun.id,
            employee_code="MOSPI-2021-0482",
            designation="Statistical Officer",
            department_id=dept_objs["DAID"].id,
            job_role_id=role_stat_analyst.id,
            target_job_role_id=role_sso.id,
            years_of_experience=5.0,
            current_assignment="Periodic Labour Force Survey (PLFS) Microdata Validation",
            reporting_officer="Rajesh Verma, Director",
            career_aspirations="Aspiring to qualify for Senior Statistical Officer (SSO) and Assistant Director (ISS) with advanced specialization in Machine Learning and National Economic Modeling.",
            target_skills="AI/ML, Python, Cloud Architecture, GIS Spatial Analysis",
            overall_competency_score=74.0,
            profile_completion_pct=95
        )
        db.add(emp_arun)
        db.flush()

        # Educations & Experience for Arun
        edu = Education(
            employee_id=emp_arun.id,
            degree="Master of Statistics (M.Stat)",
            specialization="Applied Econometrics & Sample Survey",
            institution="Indian Statistical Institute (ISI), Kolkata",
            graduation_year=2020
        )
        exp = Experience(
            employee_id=emp_arun.id,
            title="Statistical Officer",
            organization="Ministry of Statistics and Programme Implementation (MoSPI)",
            duration_months=60,
            description="Responsible for survey weighting, non-sampling error audits, and quarterly bulletin releases."
        )
        th = TrainingHistory(
            employee_id=emp_arun.id,
            course_name="Foundational Statistics & Survey Administration",
            provider="NSSTA Greater Noida",
            completion_date=datetime.datetime(2022, 5, 15),
            score_pct=88.5,
            certificate_id="NSSTA-CERT-2022-891"
        )
        db.add_all([edu, exp, th])

        # -------------------------------------------------------------
        # 5. Arun Kumar's Assessed Competencies & Gaps
        # -------------------------------------------------------------
        print("Seeding Arun Kumar's Assessed Competency Ledger...")
        # Arun is strong in Statistics (82%) and SQL (72%), but has gaps in Python (55%), AI/ML (42%), Cloud (38%), GIS (45%)
        arun_competency_states = [
            ("SAMPLING", 82.0, 4, 88.0, "Verified through NSS field audit and high exam score"),
            ("NAT_ACCOUNTS", 68.0, 3, 75.0, "Intermediate experience in quarterly GDP compilation"),
            ("PYTHON", 55.0, 3, 80.0, "Completed basic scripts; lacks advanced ML & optimization libraries"), # Gap = 25
            ("AI_ML", 42.0, 2, 70.0, "Self-study only; no official automated pipeline deployment"),          # Gap = 33 (HIGH)
            ("SQL", 72.0, 4, 85.0, "Extensive SQL queries on PLFS microdata databases"),
            ("GIS", 45.0, 2, 65.0, "Basic QGIS cartography; needs automated shapefile joins"),               # Gap = 15
            ("DATA_VIZ", 74.0, 4, 82.0, "Built multiple PowerBI and Matplotlib executive briefings"),
            ("CLOUD", 38.0, 2, 60.0, "Minimal cloud exposure; works mainly on local workstations"),          # Gap = 22 (HIGH)
            ("CYBERSECURITY", 62.0, 3, 75.0, "Passed annual security training"),
            ("COMMUNICATION", 78.0, 4, 85.0, "Presented findings at annual state conference")
        ]

        for code, cur_score, cur_lvl, conf, ev_desc in arun_competency_states:
            comp_obj = comp_objs[code]
            ec = EmployeeCompetency(
                employee_id=emp_arun.id,
                competency_id=comp_obj.id,
                current_score=cur_score,
                current_level=cur_lvl,
                confidence_score=conf,
                is_self_assessed=False
            )
            db.add(ec)
            db.flush()

            # Add Evidence Record
            ev = CompetencyEvidence(
                employee_competency_id=ec.id,
                evidence_type="WORK_EXPERIENCE",
                score_value=cur_score,
                description=ev_desc,
                source_reference="Cadre Competency Audit 2026-Q1"
            )
            db.add(ev)

        # -------------------------------------------------------------
        # 6. Courses Catalogue (iGOT & NSSTA)
        # -------------------------------------------------------------
        print("Seeding Course Catalogue...")
        courses_data = [
            {
                "id": "IGOT-STAT-101",
                "title": "Sampling Methods & Survey Design for Official Statistics",
                "provider": "iGOT Karmayogi & NSSTA",
                "source": "iGOT Karmayogi",
                "category": "Statistical Competencies",
                "skill_level": "Intermediate",
                "duration": 16.0,
                "rating": 4.9,
                "url": "https://igotkarmayogi.gov.in/learn/course/IGOT-STAT-101",
                "desc": "Practical course covering probability sampling, stratified multi-stage design, sample size estimation, and sampling weights.",
                "comp_code": "SAMPLING",
                "gain": 20.0
            },
            {
                "id": "IGOT-PY-201",
                "title": "Python for Statistical Data Analysis & Automation",
                "provider": "iGOT Karmayogi (MoSPI Cadre)",
                "source": "iGOT Karmayogi",
                "category": "Technical Competencies",
                "skill_level": "Intermediate",
                "duration": 20.0,
                "rating": 4.8,
                "url": "https://igotkarmayogi.gov.in/learn/course/IGOT-PY-201",
                "desc": "Hands-on training on Pandas, NumPy, statistical testing with SciPy, automated data cleaning pipelines, and standardizing data workflows.",
                "comp_code": "PYTHON",
                "gain": 25.0
            },
            {
                "id": "IGOT-AIML-301",
                "title": "Applied Machine Learning for Official Statistics",
                "provider": "iGOT Karmayogi & IIT Partner",
                "source": "iGOT Karmayogi",
                "category": "Technical Competencies",
                "skill_level": "Advanced",
                "duration": 24.0,
                "rating": 4.9,
                "url": "https://igotkarmayogi.gov.in/learn/course/IGOT-AIML-301",
                "desc": "Explores supervised/unsupervised algorithms, automated data imputation using ML, outlier detection in enterprise surveys, and predictive forecasting.",
                "comp_code": "AI_ML",
                "gain": 35.0
            },
            {
                "id": "IGOT-CLOUD-101",
                "title": "Government Cloud (MeghRaj) & Secure Data Architecture",
                "provider": "iGOT Karmayogi & MeitY",
                "source": "iGOT Karmayogi",
                "category": "Digital Governance",
                "skill_level": "Basic",
                "duration": 12.0,
                "rating": 4.7,
                "url": "https://igotkarmayogi.gov.in/learn/course/IGOT-CLOUD-101",
                "desc": "Government cloud infrastructure, data sovereignty, containerized deployment of statistical dashboards, and security governance.",
                "comp_code": "CLOUD",
                "gain": 25.0
            },
            {
                "id": "IGOT-GIS-101",
                "title": "Spatial Analysis & GIS for Survey Disaggregation",
                "provider": "iGOT Karmayogi & ISRO / NRSC",
                "source": "iGOT Karmayogi",
                "category": "Technical Competencies",
                "skill_level": "Basic",
                "duration": 14.0,
                "rating": 4.8,
                "url": "https://igotkarmayogi.gov.in/learn/course/IGOT-GIS-101",
                "desc": "Geospatial mapping of agricultural and economic census data using QGIS, shapefiles, raster overlays, and satellite imagery cross-validation.",
                "comp_code": "GIS",
                "gain": 20.0
            },
            {
                "id": "NSSTA-TPAC-01",
                "title": "Advanced Survey Methodology & National Accounts Compilation",
                "provider": "NSSTA TPAC 2026",
                "source": "NSSTA TPAC",
                "category": "Statistical Competencies",
                "skill_level": "Advanced",
                "duration": 30.0,
                "rating": 4.95,
                "url": "https://nssta.gov.in/tpac/programmes/2026-01",
                "desc": "5-day residential executive training at NSSTA Greater Noida covering advanced sampling design, non-response weighting, and supply-use tables.",
                "comp_code": "SAMPLING",
                "gain": 25.0
            }
        ]

        course_objs = {}
        for c in courses_data:
            course = Course(
                course_id=c["id"],
                title=c["title"],
                description=c["desc"],
                provider=c["provider"],
                source=c["source"],
                category=c["category"],
                skill_level=c["skill_level"],
                duration_hours=c["duration"],
                language="English / Hindi",
                format="Blended / Self-Paced",
                rating=c["rating"],
                external_url=c["url"]
            )
            db.add(course)
            db.flush()
            course_objs[c["id"]] = course

            # Map to competency
            cc = CourseCompetency(
                course_id=course.id,
                competency_id=comp_objs[c["comp_code"]].id,
                target_level=3,
                target_score_gain=c["gain"]
            )
            db.add(cc)

        # -------------------------------------------------------------
        # 7. Learning Materials & RAG Document Store
        # -------------------------------------------------------------
        print("Seeding Training Materials for RAG MCQ Generator...")
        mat_text = """
The Ministry of Statistics and Programme Implementation (MoSPI) conducts large-scale sample surveys across India.
Section 1: Probability Proportional to Size (PPS) Sampling
In multi-stage designs, primary sampling units (PSUs) such as villages or urban blocks vary widely in population size.
Selecting units with Probability Proportional to Size (PPS) ensures that larger units have a higher probability of selection,
which dramatically reduces sampling variance for aggregate economic indicators such as gross value added and household expenditure.

Section 2: Stratification and Within-Stratum Variance
Stratification groups heterogeneous populations into homogeneous subpopulations. Precision gains are achieved when within-stratum variance
is minimized and between-strata variance is maximized. In the Periodic Labour Force Survey (PLFS), stratification is conducted at district level
and further sub-stratified by rural and urban sectors.

Section 3: Design Effect (Deff)
The design effect (Deff) is defined as the ratio of the variance of an estimator under the complex sample design to the variance under Simple Random Sampling (SRS)
of the exact same sample size. Clustering inflates Deff, which requires sample size inflation or increasing the number of PSUs while reducing cluster sizes.

Section 4: Missing Data & Imputation Protocols
Non-response errors are mitigated using Hot-Deck Imputation, which replaces missing variables with observed values from a donor unit within the same
homogeneous demographic or geographic cell. This preserves natural correlations and variances better than mean imputation.
        """
        material = LearningMaterial(
            title="MoSPI Survey Sampling Methodology & Microdata Standards Manual",
            filename="mospi_sampling_manual_2026.pdf",
            file_type="pdf",
            file_size_bytes=145200,
            uploaded_by_user_id=user_priya.id,
            status="READY",
            total_pages=4,
            extracted_text_preview=mat_text[:300] + "..."
        )
        db.add(material)
        db.flush()

        # Chunk the text
        paragraphs = [p.strip() for p in mat_text.strip().split("\n\n") if p.strip()]
        for idx, para in enumerate(paragraphs, 1):
            chunk = MaterialChunk(
                material_id=material.id,
                chunk_index=idx,
                page_number=idx,
                chunk_text=para,
                embedding_json=json.dumps({"sampling": 3, "variance": 2, "stratum": 2})
            )
            db.add(chunk)

        # -------------------------------------------------------------
        # 8. Assessments & Approved MCQs
        # -------------------------------------------------------------
        # -------------------------------------------------------------
        # 8. Assessments & Approved MCQ Bank (22 Authentic Questions)
        # -------------------------------------------------------------
        print("Seeding Assessments & 22 Authentic Grounded MCQs...")
        
        # Assessment 1: Sampling & Survey Methodology
        assessment1 = Assessment(
            title="National Statistical System: Competency Assessment in Sampling & Analytics",
            description="Standardized adaptive assessment evaluating probability sampling, design effects, and survey data validation.",
            competency_id=comp_objs["SAMPLING"].id,
            target_level=3,
            duration_minutes=20,
            passing_score=70.0,
            is_adaptive=True,
            is_published=True
        )
        # Assessment 2: National Accounts & Economic Statistics
        assessment2 = Assessment(
            title="National Accounts & Macro-Economic Statistics Competency Assessment",
            description="Official evaluation of System of National Accounts (SNA 2008), GVA/GDP estimation, price deflators, and SUT frameworks.",
            competency_id=comp_objs["NAT_ACCOUNTS"].id,
            target_level=3,
            duration_minutes=20,
            passing_score=70.0,
            is_adaptive=True,
            is_published=True
        )
        # Assessment 3: AI, Machine Learning & Modern Data Analytics
        assessment3 = Assessment(
            title="AI, Machine Learning & Modern Data Analytics for Official Statistics",
            description="Specialized assessment evaluating Python/Pandas workflows, anomaly detection, statistical NLP, and microdata privacy.",
            competency_id=comp_objs["AI_ML"].id,
            target_level=3,
            duration_minutes=20,
            passing_score=70.0,
            is_adaptive=True,
            is_published=True
        )
        db.add_all([assessment1, assessment2, assessment3])
        db.flush()

        questions_to_seed = [
            # --- Assessment 1: Sampling & Survey Design (Questions 1 to 8) ---
            Question(
                assessment_id=assessment1.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="Under which sampling condition is Probability Proportional to Size (PPS) sampling preferred over Simple Random Sampling in multi-stage surveys?",
                options_json=json.dumps([
                    {"key": "A", "text": "When sampling units vary substantially in size and larger units contribute disproportionately to the total aggregate."},
                    {"key": "B", "text": "When the sampling frame has zero variance across all administrative clusters."},
                    {"key": "C", "text": "When non-response rates are completely negligible across all rural districts."},
                    {"key": "D", "text": "When equal selection probability is strictly mandated for all second-stage units."}
                ]),
                correct_answer="A",
                explanation="PPS sampling assigns higher selection probabilities to larger primary sampling units, significantly reducing sampling variance for aggregate estimates.",
                difficulty="Medium",
                bloom_level="Application",
                competency_name="Sampling & Survey Design",
                source_reference=f"{material.title} — Page 1 (Sec. 1)",
                status="APPROVED",
                confidence_score=98.0
            ),
            Question(
                assessment_id=assessment1.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="What is the primary mathematical justification for constructing homogeneous strata prior to drawing sampling units in National Sample Surveys?",
                options_json=json.dumps([
                    {"key": "A", "text": "To minimize within-stratum variance and maximize between-strata variance, reducing overall standard error."},
                    {"key": "B", "text": "To artificially inflate the design effect (Deff) of the estimator."},
                    {"key": "C", "text": "To eliminate the necessity of collecting field listing data."},
                    {"key": "D", "text": "To convert stratified sampling into a non-probability convenience sample."}
                ]),
                correct_answer="A",
                explanation="Stratification gains precision when units within each stratum are as homogeneous as possible (small within-stratum variance) while differences between strata are maximized.",
                difficulty="Hard",
                bloom_level="Analysis",
                competency_name="Sampling & Survey Design",
                source_reference=f"{material.title} — Page 2 (Sec. 2)",
                status="APPROVED",
                confidence_score=97.5
            ),
            Question(
                assessment_id=assessment1.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="In official survey methodology, how is the Design Effect (Deff) defined?",
                options_json=json.dumps([
                    {"key": "A", "text": "The ratio of the variance of an estimator under complex sample design to the variance under Simple Random Sampling of the same size."},
                    {"key": "B", "text": "The absolute difference between survey cost and respondent burden."},
                    {"key": "C", "text": "The ratio of non-response bias to total enumeration cost."},
                    {"key": "D", "text": "The multiplicative factor applied solely to census data during non-survey years."}
                ]),
                correct_answer="A",
                explanation="Deff = Var(complex) / Var(SRS). It quantifies the efficiency loss or gain resulting from clustering and stratification compared to simple random sampling.",
                difficulty="Medium",
                bloom_level="Recall",
                competency_name="Sampling & Survey Design",
                source_reference=f"{material.title} — Page 3 (Sec. 3)",
                status="APPROVED",
                confidence_score=99.0
            ),
            Question(
                assessment_id=assessment1.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="Which imputation technique preserves observed distributional properties and variances of microdata better than mean imputation?",
                options_json=json.dumps([
                    {"key": "A", "text": "Hot-Deck Imputation matching donors from the same homogeneous imputation cell."},
                    {"key": "B", "text": "Unconditional Grand Mean substitution."},
                    {"key": "C", "text": "Assigning zeros to all missing non-response fields."},
                    {"key": "D", "text": "Excluding all records with any missing variable from the entire survey database."}
                ]),
                correct_answer="A",
                explanation="Hot-deck imputation substitutes values from an actual matching respondent within the same demographic/geographic cell, preserving realistic item variances.",
                difficulty="Easy",
                bloom_level="Understanding",
                competency_name="Sampling & Survey Design",
                source_reference=f"{material.title} — Page 4 (Sec. 4)",
                status="APPROVED",
                confidence_score=96.0
            ),
            Question(
                assessment_id=assessment1.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="In official sample survey weighting, how are Generalized Regression (GREG) calibration estimators used with auxiliary census data?",
                options_json=json.dumps([
                    {"key": "A", "text": "To adjust initial design weights so that weighted sample totals match known administrative census benchmarks, reducing non-response and sampling bias."},
                    {"key": "B", "text": "To randomize cluster allocation during post-enumeration audit checks."},
                    {"key": "C", "text": "To increase sample size without conducting additional fieldwork."},
                    {"key": "D", "text": "To replace survey questionnaires with non-probability web scraping."}
                ]),
                correct_answer="A",
                explanation="GREG calibration adjusts base design weights using known population totals from auxiliary census data, enforcing consistency and reducing mean squared error.",
                difficulty="Hard",
                bloom_level="Application",
                competency_name="Sampling & Survey Design",
                source_reference="MoSPI Survey Compendium — Sec. 5",
                status="APPROVED",
                confidence_score=98.5
            ),
            Question(
                assessment_id=assessment1.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="When cluster sampling primary sampling units (PSUs) in rural surveys, what effect does a positive intra-class correlation coefficient (rho > 0) have on the estimator's variance?",
                options_json=json.dumps([
                    {"key": "A", "text": "It inflates the variance relative to simple random sampling, necessitating a larger overall sample size to achieve equal precision."},
                    {"key": "B", "text": "It reduces the variance to zero across all secondary units."},
                    {"key": "C", "text": "It converts cluster sampling into stratified random sampling."},
                    {"key": "D", "text": "It guarantees that design effect (Deff) is strictly less than 1.0."}
                ]),
                correct_answer="A",
                explanation="Because elements within clusters tend to resemble one another (positive rho), cluster sampling reduces effective sample size and inflates variance compared to SRS.",
                difficulty="Medium",
                bloom_level="Analysis",
                competency_name="Sampling & Survey Design",
                source_reference="NSSTA Advanced Sampling Manual — Module 3",
                status="APPROVED",
                confidence_score=97.0
            ),
            Question(
                assessment_id=assessment1.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="Which pioneering technique introduced by Prof. P.C. Mahalanobis in the National Sample Survey is specifically designed to isolate and measure investigator bias and non-sampling error?",
                options_json=json.dumps([
                    {"key": "A", "text": "Interpenetrating Sub-Samples, where two or more independent sub-samples are drawn and assigned to distinct enumerator teams."},
                    {"key": "B", "text": "Unconditional single-stage census enumeration."},
                    {"key": "C", "text": "Deterministic nearest-neighbor value replacement."},
                    {"key": "D", "text": "Convenience quota sampling without probability frames."}
                ]),
                correct_answer="A",
                explanation="Mahalanobis' Interpenetrating Sub-Samples provide valid estimates of non-sampling error and enumerator variance by assigning statistically identical sub-samples to separate teams.",
                difficulty="Medium",
                bloom_level="Recall",
                competency_name="Sampling & Survey Design",
                source_reference="Indian Statistical System Legacy Compendium — Chapter 1",
                status="APPROVED",
                confidence_score=99.0
            ),
            Question(
                assessment_id=assessment1.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="In a two-stage survey design with fixed budget constraints, when the between-PSU variance is significantly higher than within-PSU variance, optimal sample allocation requires:",
                options_json=json.dumps([
                    {"key": "A", "text": "Sampling a larger number of primary sampling units (PSUs) with fewer secondary units (households) per PSU."},
                    {"key": "B", "text": "Sampling only one large PSU and enumerating all households within it."},
                    {"key": "C", "text": "Disregarding administrative costs and applying equal allocation across all geographic blocks."},
                    {"key": "D", "text": "Allocating the entire sample to second-stage units only."}
                ]),
                correct_answer="A",
                explanation="When between-PSU variation dominates, sampling more clusters (PSUs) captures more population heterogeneity and minimizes overall sampling variance.",
                difficulty="Hard",
                bloom_level="Evaluation",
                competency_name="Sampling & Survey Design",
                source_reference="NSSO Survey Design Guidelines — Sec. 8",
                status="APPROVED",
                confidence_score=96.5
            ),

            # --- Assessment 2: National Accounts & Economic Statistics (Questions 9 to 15) ---
            Question(
                assessment_id=assessment2.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="Under the System of National Accounts (SNA 2008) adopted by India, how is Gross Domestic Product (GDP) at market prices derived from Gross Value Added (GVA) at basic prices?",
                options_json=json.dumps([
                    {"key": "A", "text": "GDP at market prices = GVA at basic prices + Product Taxes - Product Subsidies."},
                    {"key": "B", "text": "GDP at market prices = GVA at basic prices - Production Taxes + Production Subsidies."},
                    {"key": "C", "text": "GDP at market prices = GVA at factor cost + Net Factor Income from Abroad."},
                    {"key": "D", "text": "GDP at market prices = GVA at basic prices divided by the wholesale price index."}
                ]),
                correct_answer="A",
                explanation="Basic prices measure value before product taxes are added and product subsidies subtracted; adding net product taxes yields market prices.",
                difficulty="Medium",
                bloom_level="Application",
                competency_name="National Accounts & Economic Statistics",
                source_reference="National Accounts Statistics Manual (MoSPI) — Chapter 2",
                status="APPROVED",
                confidence_score=99.0
            ),
            Question(
                assessment_id=assessment2.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="In National Accounts estimation, what does Financial Intermediation Services Indirectly Measured (FISIM) represent?",
                options_json=json.dumps([
                    {"key": "A", "text": "The value of financial services provided by banks without explicit fees, measured by interest rate margins against a reference rate."},
                    {"key": "B", "text": "Explicit bank processing fees and transaction surcharge revenues."},
                    {"key": "C", "text": "Bad debts written off by scheduled commercial banks."},
                    {"key": "D", "text": "Direct government subsidies provided to micro-finance institutions."}
                ]),
                correct_answer="A",
                explanation="FISIM captures indirect financial service output where financial intermediaries pay depositors less than the reference rate and charge borrowers more than the reference rate.",
                difficulty="Hard",
                bloom_level="Understanding",
                competency_name="National Accounts & Economic Statistics",
                source_reference="SNA 2008 & Central Statistics Office Guidelines — Sec. 4",
                status="APPROVED",
                confidence_score=97.5
            ),
            Question(
                assessment_id=assessment2.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="Why is the GDP Deflator considered a broader measure of economy-wide price changes than the Consumer Price Index (CPI)?",
                options_json=json.dumps([
                    {"key": "A", "text": "Because it measures price changes for all domestically produced goods and services including capital and exports, rather than a fixed consumer basket."},
                    {"key": "B", "text": "Because the GDP deflator is published weekly while CPI is published once a decade."},
                    {"key": "C", "text": "Because the GDP deflator excludes all government expenditures."},
                    {"key": "D", "text": "Because the GDP deflator is strictly based on wholesale mandi auctions."}
                ]),
                correct_answer="A",
                explanation="The implicit GDP deflator reflects price changes across total domestic production (consumption, investment, government, and net exports) with shifting current weights.",
                difficulty="Medium",
                bloom_level="Analysis",
                competency_name="National Accounts & Economic Statistics",
                source_reference="Economic Statistics Training Module — NSSTA 2026",
                status="APPROVED",
                confidence_score=98.0
            ),
            Question(
                assessment_id=assessment2.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="What is the primary rationale for periodically rebasing the National Accounts and Price Index series in official statistics?",
                options_json=json.dumps([
                    {"key": "A", "text": "To update the structural weighting diagram, capture emerging industries, and eliminate substitution bias caused by shifting consumption patterns."},
                    {"key": "B", "text": "To artificially elevate the official growth rate without recalculating historical series."},
                    {"key": "C", "text": "To avoid collecting primary market surveys in urban centers."},
                    {"key": "D", "text": "To comply with commercial retail marketing standards."}
                ]),
                correct_answer="A",
                explanation="Rebasing incorporates contemporary production structures, technological shifts, and new goods, preventing outdated base weights from distorting real growth estimates.",
                difficulty="Medium",
                bloom_level="Understanding",
                competency_name="National Accounts & Economic Statistics",
                source_reference="MoSPI Advisory Committee on National Accounts — 2024 Report",
                status="APPROVED",
                confidence_score=98.5
            ),
            Question(
                assessment_id=assessment2.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="In an official Supply and Use Table (SUT) framework, which macro accounting identity must be maintained for every economic product?",
                options_json=json.dumps([
                    {"key": "A", "text": "Total Supply at purchasers' prices = Total Use at purchasers' prices (Intermediate Consumption + Final Uses)."},
                    {"key": "B", "text": "Domestic Output = Government Final Consumption Expenditure."},
                    {"key": "C", "text": "Imports of Goods = Gross Capital Formation."},
                    {"key": "D", "text": "Operating Surplus = Net Indirect Taxes."}
                ]),
                correct_answer="A",
                explanation="For every product commodity, total supply (domestic output + imports + net taxes/margins) must balance total use (intermediate consumption + exports + final consumption + capital formation).",
                difficulty="Medium",
                bloom_level="Recall",
                competency_name="National Accounts & Economic Statistics",
                source_reference="Input-Output & SUT Compilation Manual — MoSPI",
                status="APPROVED",
                confidence_score=99.0
            ),
            Question(
                assessment_id=assessment2.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="Which mathematical index number formula is utilized by the National Statistical Office (NSO) for compiling India's All-India CPI (Rural, Urban, Combined)?",
                options_json=json.dumps([
                    {"key": "A", "text": "Modified Laspeyres base-weighted formula using elementary aggregate geometric and arithmetic means."},
                    {"key": "B", "text": "Unweighted Simple Average of Price Relatives."},
                    {"key": "C", "text": "Paasche current-period weighted index without base period weights."},
                    {"key": "D", "text": "Fisher's ideal index computed directly at each retail pricing center."}
                ]),
                correct_answer="A",
                explanation="NSO compiles Consumer Price Indices using a Modified Laspeyres formulation aggregating price relatives weighted by base period Consumer Expenditure Survey expenditure shares.",
                difficulty="Easy",
                bloom_level="Application",
                competency_name="National Accounts & Economic Statistics",
                source_reference="CPI Compilation Guidelines (Price Statistics Division) — Page 12",
                status="APPROVED",
                confidence_score=99.5
            ),
            Question(
                assessment_id=assessment2.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="Under modern National Accounts standards, how is expenditure on Research and Development (R&D) and customized database software classified?",
                options_json=json.dumps([
                    {"key": "A", "text": "As Gross Fixed Capital Formation (intellectual property assets) providing future economic benefits, rather than intermediate consumption."},
                    {"key": "B", "text": "As immediate current intermediate operational expense."},
                    {"key": "C", "text": "As transfer payments to academic institutions."},
                    {"key": "D", "text": "As household final consumption expenditure."}
                ]),
                correct_answer="A",
                explanation="SNA 2008 recognizes R&D and software as produced intellectual property assets capitalized into Gross Fixed Capital Formation because they deliver benefits across multiple accounting years.",
                difficulty="Hard",
                bloom_level="Analysis",
                competency_name="National Accounts & Economic Statistics",
                source_reference="National Accounts Asset Boundary Guidelines — MoSPI",
                status="APPROVED",
                confidence_score=97.0
            ),

            # --- Assessment 3: AI, Machine Learning & Statistical Computing (Questions 16 to 22) ---
            Question(
                assessment_id=assessment3.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="When auditing high-frequency export/import commodity declarations for unit-value anomalies, why is an Isolation Forest model preferred over univariate Z-score filtering?",
                options_json=json.dumps([
                    {"key": "A", "text": "It isolates multi-attribute outliers across non-linear correlations of volume, freight mode, and price without assuming normality."},
                    {"key": "B", "text": "It only works on strictly Gaussian bell-curve distributions."},
                    {"key": "C", "text": "It requires exhaustive manual rule encoding for all 10,000 HS codes."},
                    {"key": "D", "text": "It replaces customs declarations with synthetic random variables."}
                ]),
                correct_answer="A",
                explanation="Isolation Forest operates by partitioning feature spaces randomly; anomalous transactions require fewer splits to isolate in high-dimensional multimodal trade data.",
                difficulty="Medium",
                bloom_level="Application",
                competency_name="AI / Machine Learning",
                source_reference="AI in Official Statistics Working Paper — DAID 2025",
                status="APPROVED",
                confidence_score=98.0
            ),
            Question(
                assessment_id=assessment3.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="In large-scale socio-economic survey microdata, why is Multivariate Imputation by Chained Equations (MICE) superior to single mean imputation?",
                options_json=json.dumps([
                    {"key": "A", "text": "It preserves complex multivariate relationships and captures imputation uncertainty by generating multiple plausibly complete datasets."},
                    {"key": "B", "text": "It converts numerical variables into binary categorical strings."},
                    {"key": "C", "text": "It deletes all survey records that contain at least one null value."},
                    {"key": "D", "text": "It assigns identical values to all households within the state."}
                ]),
                correct_answer="A",
                explanation="MICE specifies variable-by-variable regression models conditioning on all other predictors, accurately preserving joint distributions and standard errors.",
                difficulty="Hard",
                bloom_level="Evaluation",
                competency_name="AI / Machine Learning",
                source_reference="Modern Survey Analytics Guide — NSSTA Faculty",
                status="APPROVED",
                confidence_score=97.5
            ),
            Question(
                assessment_id=assessment3.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="For automated classification of free-text economic enterprise descriptions into 5-digit National Industrial Classification (NIC-2008) codes, which architecture provides highest precision?",
                options_json=json.dumps([
                    {"key": "A", "text": "A fine-tuned domain-adapted transformer embedding model combined with hierarchical classification heads."},
                    {"key": "B", "text": "A static alphabetical keyword substring regex lookup table."},
                    {"key": "C", "text": "Random coin-flip round-robin code assignment."},
                    {"key": "D", "text": "Single-layer perceptron without tokenization or semantic embeddings."}
                ]),
                correct_answer="A",
                explanation="Domain-adapted transformers capture context, colloquial phrasing, and multilingual nuances in unstructured descriptions to classify into deep hierarchical taxonomies accurately.",
                difficulty="Hard",
                bloom_level="Analysis",
                competency_name="AI / Machine Learning",
                source_reference="Data Analytics & Innovation Division (DAID) Technical Brief — 2025",
                status="APPROVED",
                confidence_score=98.5
            ),
            Question(
                assessment_id=assessment3.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="Under official National Data Sharing policies, what does achieving 5-anonymity (k=5) for a public survey microdata release ensure?",
                options_json=json.dumps([
                    {"key": "A", "text": "Every combination of quasi-identifying attributes (e.g. age, gender, district) is shared by at least 5 distinct individuals in the released table."},
                    {"key": "B", "text": "Exactly 5 attributes are published and all other variables are removed."},
                    {"key": "C", "text": "The dataset can only be accessed by 5 certified researchers."},
                    {"key": "D", "text": "The survey sample size is capped at 5% of the census population."}
                ]),
                correct_answer="A",
                explanation="k-anonymity prevents re-identification by ensuring each quasi-identifier equivalence class has at least k matching records, protecting citizen confidentiality.",
                difficulty="Hard",
                bloom_level="Application",
                competency_name="AI / Machine Learning",
                source_reference="National Data Quality & Privacy Framework — MoSPI",
                status="APPROVED",
                confidence_score=99.0
            ),
            Question(
                assessment_id=assessment3.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="When processing 10 million rows of Periodic Labour Force Survey (PLFS) records in Python, why should vectorized Pandas/NumPy operations be used instead of iterating with df.iterrows()?",
                options_json=json.dumps([
                    {"key": "A", "text": "Vectorized operations run in compiled C/SIMD memory buffers without Python interpreter overhead, running hundreds of times faster."},
                    {"key": "B", "text": "Iterative loops consume less CPU RAM on Windows workstations."},
                    {"key": "C", "text": "iterrows() automatically computes survey expansion weights while vectorization cannot."},
                    {"key": "D", "text": "Python forbids looping over tabular data frames."}
                ]),
                correct_answer="A",
                explanation="Vectorization delegates computation to compiled C/Fortran array loops with vector SIMD instructions, sidestepping GIL and per-row Python object creation.",
                difficulty="Easy",
                bloom_level="Recall",
                competency_name="Python Programming",
                source_reference="Statistical Computing in Python — NSSTA Training Module",
                status="APPROVED",
                confidence_score=99.5
            ),
            Question(
                assessment_id=assessment3.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="In preliminary digital listing for the Economic Census, why is high Recall generally prioritized over high Precision in automated computer-vision building detection?",
                options_json=json.dumps([
                    {"key": "A", "text": "To minimize false negatives and ensure very few potential commercial establishments are missed prior to field verification."},
                    {"key": "B", "text": "Because false positives result in permanent deletion of census blocks."},
                    {"key": "C", "text": "Because high precision eliminates the need for any field supervisor checks."},
                    {"key": "D", "text": "To reduce overall computational GPU training expenses."}
                ]),
                correct_answer="A",
                explanation="In census listing frames, omitting an active economic unit (false negative) causes permanent undercounting, whereas false positives can be weeded out by enumerators.",
                difficulty="Medium",
                bloom_level="Understanding",
                competency_name="AI / Machine Learning",
                source_reference="Digital Fieldwork & Computer Vision in Official Enumeration — FOD",
                status="APPROVED",
                confidence_score=97.0
            ),
            Question(
                assessment_id=assessment3.id,
                learning_material_id=material.id,
                question_type="SINGLE_CHOICE",
                stem="When seasonally adjusting the monthly Index of Industrial Production (IIP), what is the primary objective of the X-13ARIMA-SEATS methodology?",
                options_json=json.dumps([
                    {"key": "A", "text": "To isolate and remove calendar-day, moving holiday, and regular seasonal fluctuations, revealing underlying cyclical-trend movements."},
                    {"key": "B", "text": "To replace actual manufacturing production data with theoretical forecasts."},
                    {"key": "C", "text": "To force all monthly indices to sum up to exactly zero."},
                    {"key": "D", "text": "To convert monthly series into annual census figures."}
                ]),
                correct_answer="A",
                explanation="X-13ARIMA-SEATS decomposes time series into trend, seasonal, trading-day, and irregular components so policymakers observe true economic acceleration or slowdown.",
                difficulty="Hard",
                bloom_level="Analysis",
                competency_name="Statistical Data Analysis",
                source_reference="Time Series Analysis & IIP Handbook — MoSPI Economic Division",
                status="APPROVED",
                confidence_score=98.0
            )
        ]
        db.add_all(questions_to_seed)

        # -------------------------------------------------------------
        # 9. System Notifications & Audit Logs
        # -------------------------------------------------------------
        note1 = SystemNotification(
            user_id=user_arun.id,
            category="RECOMMENDATION",
            title="High-Priority Training Recommended",
            message="Your role as Statistical Data Analyst requires Level 3 AI/ML. 'Applied Machine Learning for Official Statistics' is now available on iGOT Karmayogi."
        )
        note2 = SystemNotification(
            user_id=user_arun.id,
            category="ASSESSMENT",
            title="Competency Assessment Open",
            message="The 2026 Q1 Official Statistical Sampling & Analytics assessment is available. Complete it to refresh your verified competency scores."
        )
        audit_init = AuditLog(
            user_id=user_admin.id,
            action="SYSTEM_INITIALIZATION",
            resource_type="SYSTEM",
            resource_id="1",
            details="National Skill Intelligence Platform initialized with MoSPI & NSSTA competency frameworks."
        )
        db.add_all([note1, note2, audit_init])
        db.commit()

        # -------------------------------------------------------------
        # 10. Run Engines to generate Initial Gaps & Recommendations
        # -------------------------------------------------------------
        print("Running initial Skill Gap Engine & Hybrid Recommendation Engine for Arun Kumar...")
        SkillGapEngine.recompute_employee_skill_gaps(db, emp_arun.id)
        HybridRecommendationEngine.generate_recommendations_for_employee(db, emp_arun.id)

        print("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
