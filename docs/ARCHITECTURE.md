# System Architecture & Technical Specifications
### National Skill Intelligence & Learning Platform (MoSPI / NSSTA / iGOT)

## 1. High-Level Architectural Flow

The platform implements a multi-tier, stateless microservice architecture:

```text
                                 GOVERNMENT CLIENTS
                     (Desktop, Tablets, Mobile Responsive Web)
                                        │
                                        ▼
                                 FASTAPI GATEWAY
               [CORS, JWT Authentication, RBAC, Request Audit Logging]
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
      COMPETENCY ENGINE          SKILL GAP ENGINE        RECOMMENDATION ENGINE
    (Evidence Weighting:        (Role Benchmarks:       (Hybrid Scoring:
     Quiz 45%, Course 30%,       Delta = Req - Curr;     Gap 35%, Role 25%,
     Exp 15%, Self 10%)          Priority Buckets)       Prereq 15%, Career 15%)
             │                          │                          │
             └──────────────────────────┼──────────────────────────┘
                                        │
                                        ▼
                           INTEGRATIONS & AI LAYER
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
     iGOT KARMAYOGI             NSSTA TPAC SERVICE         RAG & MCQ STUDIO
   (Course Catalogue,         (Residential/Executive    (Document Chunking,
    Progress, Webhooks)        Programmes, Calendar)     Bloom's Levels, Review)
                                        │
                                        ▼
                               PERSISTENCE LAYER
     ┌──────────────────────────────────┴──────────────────────────────────┐
     ▼                                                                     ▼
  RELATIONAL DATABASE (SQLite / PostgreSQL)                   VECTOR & OBJECT STORE
  (Normalized Tables: Users, Roles, Competencies,              (Indexed Chunks, Page
   Evidence, Gaps, Recommendations, Quizzes, Logs)              Offsets, Embeddings)
```

---

## 2. Mathematical Models & Formulas

### 2.1 Composite Competency Score ($S_{comp}$)
The composite competency score for any given employee competency $c$ is calculated using an evidence-weighted multi-source ledger:

$$S_{comp} = \frac{\sum_{i} w_i \cdot \bar{s}_i}{\sum_{i} w_i}$$

Where:
- $\bar{s}_{quiz}$ (Weight $w_{quiz} = 0.45$): Mean score across standardized assessment attempts.
- $\bar{s}_{course}$ (Weight $w_{course} = 0.30$): Verified course completion and practical score gain.
- $\bar{s}_{exp}$ (Weight $w_{exp} = 0.15$): Work experience and cadre seniority score.
- $\bar{s}_{self}$ (Weight $w_{self} = 0.10$): Self-assessed baseline score.

### 2.2 Standardized Competency Levels ($L$)
Scores are mapped to standardized civil service competency levels:
- **Level 1 (Awareness)**: $0.0 \le S_{comp} < 30.0$
- **Level 2 (Basic)**: $30.0 \le S_{comp} < 50.0$
- **Level 3 (Intermediate)**: $50.0 \le S_{comp} < 70.0$
- **Level 4 (Advanced)**: $70.0 \le S_{comp} < 90.0$
- **Level 5 (Expert)**: $90.0 \le S_{comp} \le 100.0$

### 2.3 Statistical Confidence Score ($C$)
Confidence is not arbitrary; it represents evidence multi-sourcing:

$$C = \min\left(98.0, 40.0 + (N_{sources} \times 15.0) + (N_{records} \times 2.0)\right)$$

Where $N_{sources} \in [1, 4]$ represents distinct evidence types present in the ledger.

### 2.4 Skill Gap ($\Delta_{gap}$) & Priority Classification
For a job role requiring benchmark score $R_{comp}$:

$$\Delta_{gap} = \max(0.0, R_{comp} - S_{comp})$$

Priority classification thresholds:
- **NO_GAP**: $\Delta_{gap} \le 5$
- **LOW**: $6 \le \Delta_{gap} \le 15$
- **MEDIUM**: $16 \le \Delta_{gap} \le 30$
- **HIGH**: $31 \le \Delta_{gap} \le 50$
- **CRITICAL**: $\Delta_{gap} \ge 51$

### 2.5 Hybrid Recommendation Score ($R_{score}$)
Courses are ranked using a multi-dimensional objective function:

$$R_{score} = (w_{gap} \cdot M_{gap}) + (w_{role} \cdot M_{role}) + (w_{prereq} \cdot M_{prereq}) + (w_{career} \cdot M_{career}) + (w_{dept} \cdot M_{dept})$$

Normalized to $0 - 100$, where:
- $w_{gap} = 0.35$ (Relevance to identified skill gap)
- $w_{role} = 0.25$ (Alignment with assigned cadre benchmark)
- $w_{prereq} = 0.15$ (Prerequisite fulfillment)
- $w_{career} = 0.15$ (Difficulty fit & career goal match)
- $w_{dept} = 0.10$ (Divisional priority)

---

## 3. Grounded RAG Document Pipeline & MCQ Generation

To eliminate LLM hallucinations and enforce official curriculum fidelity:
1. **Document Ingestion**: Training materials (PDF, DOCX, TXT) are uploaded by verified trainers.
2. **Text Chunking**: Content is split into semantic passages ($\sim 300$ words) indexed with explicit page numbers and section offsets.
3. **Retrieval**: Relevant chunks matching target competencies are extracted.
4. **Synthesis with Cognitive Framing**: Questions are generated with Bloom's taxonomy:
   - *Recall*: Foundational definitions, statutory terms.
   - *Understanding*: Explaining methodology choices.
   - *Application*: Calculating design effects, choosing sampling strategies.
   - *Analysis*: Estimating intra-class correlations, diagnosing non-sampling biases.
5. **Mandatory Source Citation**: Every question strictly incorporates `source_reference` (e.g. *"MoSPI Sampling Manual — Page 2 (Sec. 2)"*).
6. **Trainer Review Queue**: Questions remain in `DRAFT_PENDING_REVIEW` until an authorized trainer approves, edits, or rejects them.
