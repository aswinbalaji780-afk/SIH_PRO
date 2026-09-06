# National Skill Intelligence & Learning Platform
### Capacity Building & Continuous Skill Intelligence for India's Official Statistical System
**Ministry of Statistics and Programme Implementation (MoSPI) • NSSTA • iGOT Karmayogi**

---

## 1. Overview & Product Philosophy

The **National Skill Intelligence & Learning Platform** is an enterprise AI-enabled capacity building system architected specifically for officers and statistical cadres across India's Official Statistical System (ISS, SSS, DES, and Central/State statistical divisions).

Unlike traditional CRUD Learning Management Systems (LMS) that only offer static course catalogs, this platform implements a closed-loop intelligence cycle:

```text
WHO ARE YOU? (Cadre Profile: Experience, Education, Role)
       ↓
WHAT SKILLS DO YOU HAVE? (Assessed Multi-Source Evidence)
       ↓
WHAT DOES YOUR ROLE REQUIRE? (Role Competency Benchmarks)
       ↓
WHERE ARE YOUR GAPS? (Skill Gap Engine: Critical/High/Medium/Low)
       ↓
WHAT SHOULD YOU LEARN FIRST? (Hybrid AI Recommendation Engine)
       ↓
WHICH iGOT / NSSTA TRAINING? (iGOT Karmayogi & NSSTA TPAC Integration)
       ↓
DID YOU ACTUALLY LEARN IT? (RAG-Grounded Adaptive Assessment)
       ↓
HOW HAS COMPETENCY CHANGED? (Evidence Ledger & Level Promotion)
       ↓
WHAT SHOULD YOU LEARN NEXT? (Continuous Recalculation & Next Step)
```

---

## 2. Core Architecture & Feature Matrix

1. **Multi-Source Competency Engine**:
   - Evidence-weighted evaluation: Assessment Quizzes (45%), Course Completions (30%), Practical Experience (15%), Self-Assessments (10%).
   - 5 Standardized Levels: Awareness (L1), Basic (L2), Intermediate (L3), Advanced (L4), Expert (L5).
   - Multi-source statistical confidence score calculation (0–100%).
   - Immutable historical audit ledger tracking score progression.

2. **Skill Gap Engine**:
   - `Skill Gap = Required Role Benchmark - Assessed Competency Score`.
   - Threshold prioritization: `NO_GAP (0-5)`, `LOW (6-15)`, `MEDIUM (16-30)`, `HIGH (31-50)`, `CRITICAL (51+)`.

3. **Hybrid Recommendation Engine**:
   - Multi-variable objective function: Gap Relevance (35%), Role Relevance (25%), Prerequisite Readiness (15%), Difficulty & Career Fit (15%), Department Priority (10%).
   - Transparent explainability: Generates human-readable audit reasons explaining *"Why this course was recommended"*.
   - Sequenced milestone learning pathways preventing out-of-order course enrollment.

4. **iGOT Karmayogi & NSSTA TPAC Integrations**:
   - Abstracted service providers with dual-mode support (`MOCK_IGOT=True` / `MOCK_NSSTA=True` for sandbox demo; seamless toggle to live APIs).
   - Comprehensive course metadata including providers, duration, level, format, competencies, and direct enrollment triggers.

5. **Document Processing & RAG MCQ Studio (Trainer Portal)**:
   - Drag-and-drop document ingestion (PDF, DOCX, TXT) with semantic chunking and page indexing.
   - Grounded AI MCQ generation configured by Bloom's cognitive level (Recall, Understanding, Application, Analysis) and difficulty.
   - Exact source citations on every question (e.g. *"Sampling Manual — Page 2"*).
   - **Human-in-the-Loop Review Queue**: Generated questions remain in draft until approved, edited, or rejected by trainers.

6. **Live Adaptive Quiz Engine**:
   - Timed examination mode with question navigator.
   - Auto-grading with personalized AI feedback detailing strengths, weaknesses, and next steps.
   - **Instant Competency Boost**: Submitting the assessment automatically recalculates competency, narrows skill gaps, and updates recommendations!

7. **Workforce Analytics & Heatmaps (Department Admin Portal)**:
   - 2D Cross-Divisional Heatmap Grid (Divisions vs Key Competencies: Python, AI/ML, SQL, GIS, Cloud, Sampling).
   - 12–24 Month Predictive Future Skill Demand Forecasts.
   - Executive KPIs (12,480 Cadre Members, 68% Avg Competency, 1,245 Critical Shortages).

8. **Conversational AI Cadre Copilot**:
   - Grounded conversational assistant aware of user profile, gaps, recommended courses, and official statistical methodologies.
   - Pre-canned prompts and grounded responses with source citations.

9. **Bilingual Accessibility**:
   - Instant toggle between English and Hindi (हिंदी) across all headers, navigation, and KPI labels.

---

## 3. Four Target Personas

The platform includes a quick Persona Switcher in the top navigation bar:
- **Arun Kumar** (`arun.kumar`): Statistical Officer (Learner) — Strong in Statistics & SQL, critical gaps in AI/ML & Cloud.
- **Dr. Priya Sharma** (`priya.sharma`): Senior Faculty / Trainer, NSSTA — RAG Material Upload, Question Generation & Review Queue.
- **Rajesh Verma, ISS** (`rajesh.verma`): Director, Data Analytics Division (Dept Admin) — Department Heatmaps, Analytics & Demand Forecasting.
- **System Administrator** (`admin.system`): National Data Center, MoSPI — Frameworks, Role Mappings, and Audit Logs.

---

## 4. Quick Start (Running Locally)

### Prerequisites
- Python 3.10+ (Verified on Python 3.13)
- Modern web browser (Chrome, Edge, Firefox, Safari)

### 1. Launch the Server
```powershell
python run.py
```

### 2. Access the Platform
- **Web UI Application**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Interactive Swagger API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check Endpoint**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 5. Running Automated Tests

Run the complete suite of unit and integration tests:
```powershell
# Run engine unit tests
python -m unittest tests.test_engines

# Run API & end-to-end learning loop integration tests
python -m unittest tests.test_api
```

---

## 6. Project Structure

```text
SIH1/
├── backend/
│   ├── api/
│   │   └── routes.py              # REST API Router (/api/v1/...)
│   ├── core/
│   │   ├── config.py              # Application settings & thresholds
│   │   └── security.py            # Password hashing & JWT tokens
│   ├── models/
│   │   ├── database.py            # SQLAlchemy engine & session
│   │   └── entities.py            # Relational models (Users, Gaps, Courses, Quizzes)
│   ├── schemas/
│   │   └── api_schemas.py         # Pydantic request/response schemas
│   ├── services/
│   │   ├── competency_engine.py   # Multi-source competency weighting
│   │   ├── skill_gap_engine.py    # Role gap delta calculation
│   │   ├── recommendation_engine.py# Hybrid recommendation & explainability
│   │   ├── igot_service.py        # iGOT Karmayogi integration adapter
│   │   ├── nssta_service.py       # NSSTA TPAC training service
│   │   ├── document_service.py    # Document text extraction & RAG chunking
│   │   ├── mcq_generator.py       # Grounded AI MCQ generation & review
│   │   ├── quiz_engine.py         # Timed quiz runner & auto evaluation
│   │   ├── ai_assistant.py        # Context-aware cadre copilot
│   │   └── analytics_engine.py    # Workforce heatmaps & demand forecasting
│   ├── seed_data.py               # Official seed data generator
│   └── main.py                    # FastAPI application & static server
├── frontend/
│   ├── index.html                 # Government Enterprise UI shell
│   ├── styles.css                 # MoSPI / Karmayogi design system tokens
│   └── app.js                     # Reactive frontend controller & i18n
├── tests/
│   ├── test_engines.py            # Unit tests for scoring & thresholds
│   └── test_api.py                # Integration tests for end-to-end loop
├── docs/                          # Architecture & API specifications
├── Dockerfile                     # Container deployment specification
├── docker-compose.yml             # Container orchestration
├── run.py                         # Single-command launcher
├── requirements.txt               # Python dependencies
└── README.md                      # Comprehensive documentation
```

---

## 7. License & Sovereign Deployment

Developed for the Ministry of Statistics and Programme Implementation (MoSPI) and National Statistical Systems Training Academy (NSSTA). Ready for deployment on MeghRaj (Government of India Cloud) and integration with Karmayogi Bharat API gateways.
