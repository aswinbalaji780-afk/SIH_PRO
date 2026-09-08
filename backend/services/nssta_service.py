from typing import List, Dict, Any, Optional
from backend.core.config import settings

class NSSTATrainingService:
    """
    Service for National Statistical Systems Training Academy (NSSTA)
    TPAC (Training Programme Advisory Committee) recommended executive & specialist training.
    """

    def __init__(self):
        self.is_mock = settings.MOCK_NSSTA
        self.base_url = settings.NSSTA_API_BASE_URL

    def get_programmes(self) -> List[Dict[str, Any]]:
        return [
            {
                "programme_id": "NSSTA-TPAC-2026-01",
                "title": "Advanced Survey Methodology & National Accounts Compilation",
                "training_domain": "Official Statistical Systems",
                "competency_code": "NAT_ACCOUNTS",
                "competency_name": "National Accounts & Survey Design",
                "target_roles": "Statistical Officer, Senior Statistical Officer, Data Analyst",
                "level": "Advanced (Level 4)",
                "duration_days": 5,
                "mode": "Residential (NSSTA Greater Noida) / Hybrid",
                "eligibility": "Minimum 2 years service in central or state statistical cadre",
                "recommended_by": "NSSTA TPAC 2026-27",
                "schedule": "Batch A: October 12–16, 2026",
                "source": "NSSTA TPAC",
                "description": "Intensive hands-on workshop on System of National Accounts (SNA 2008), supply-use tables, CPI/IIP base revision methodologies, and enterprise survey analytics."
            },
            {
                "programme_id": "NSSTA-TPAC-2026-02",
                "title": "Executive Workshop on Big Data & AI in Official Statistics",
                "training_domain": "Advanced Emerging Technologies",
                "competency_code": "AI_ML",
                "competency_name": "AI / Machine Learning",
                "target_roles": "Data Analyst, Data Scientist, Joint Director",
                "level": "Executive / Intermediate (Level 3-4)",
                "duration_days": 3,
                "mode": "Interactive Residential & Lab",
                "eligibility": "Officers working with high-frequency indicators, GSTN data, or satellite data",
                "recommended_by": "NSSTA TPAC Technical Advisory Group",
                "schedule": "Batch B: November 03–05, 2026",
                "source": "NSSTA TPAC",
                "description": "Utilizing scanner data, satellite luminosity, high-frequency transaction data, and LLM-assisted coding for national classification of products and occupations."
            },
            {
                "programme_id": "NSSTA-TPAC-2026-03",
                "title": "SDG Indicators Monitoring & Sub-National Data Harmonization",
                "training_domain": "Sustainable Development Goals",
                "competency_code": "SDG_INDICATORS",
                "competency_name": "SDG Indicators & Data Harmonization",
                "target_roles": "Statistical Officer, Statistical Investigator, DES Officials",
                "level": "Intermediate (Level 3)",
                "duration_days": 4,
                "mode": "Virtual Interactive Session",
                "eligibility": "Open to all officers engaged in State Indicator Framework (SIF) monitoring",
                "recommended_by": "NSSTA TPAC",
                "schedule": "Batch C: November 24–27, 2026",
                "source": "NSSTA TPAC",
                "description": "Standardized metadata documentation, Tier I/II/III indicator computation protocols, disaggregation methods, and state dashboard reporting."
            }
        ]

    def get_trainers(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": 1,
                "name": "Dr. Priya Sharma",
                "designation": "Course Director & Senior Faculty (Sampling & Methodology)",
                "department": "National Statistical Systems Training Academy (NSSTA)",
                "specialization": "Complex Survey Sampling, PPS, & Hansen-Hurwitz Multipliers",
                "bio": "Lead architect of NSSTA's sampling curriculum with 18+ years designing household survey rounds and training Indian Statistical Service (ISS) probationers.",
                "avatar": "PS",
                "guides": [
                    {
                        "guide_id": "NSSTA-G-SAMPLING-2026",
                        "title": "NSSTA Comprehensive Guide: Complex Survey Design & Multi-Stage Sampling",
                        "category": "Survey Sampling & Estimation",
                        "level": "Foundational to Advanced",
                        "pages": 48,
                        "modules": ["Module 1: Principles of PPS Sampling", "Module 2: Intra-Cluster Correlation & Deff", "Module 3: Stratified Neyman Allocation", "Module 4: Hansen-Hurwitz Variance Estimation"],
                        "content": (
                            "NATIONAL STATISTICAL SYSTEMS TRAINING ACADEMY (NSSTA)\n"
                            "Cadre Training Manual & Methodological Notes 2026\n"
                            "Faculty: Dr. Priya Sharma, Course Director (Sampling Methodology)\n\n"
                            "Module 1: Complex Survey Designs & Sampling Variance Optimization\n"
                            "Primary Sampling Units (PSUs) in national household surveys must strictly adhere to Probability Proportional to Size (PPS) selection based on updated Census EBs. "
                            "Intra-cluster correlation (rho) severely penalizes variance when cluster take (m) expands. As established in Hansen-Hurwitz and Horvitz-Thompson theory, "
                            "the Design Effect Deff = 1 + (m-1)*rho. Increasing cluster size under positive intra-cluster correlation inflates standard errors; multi-stage dispersion across geographically balanced PSUs is mandatory.\n\n"
                            "Module 2: Optimal Stratum Allocation & Non-Response Imputation\n"
                            "When strata variances vary markedly, Neyman Allocation n_h = n*(N_h*S_h) / sum(N_k*S_k) guarantees minimal sampling variance. Non-response must be handled via deterministic or stochastic hot-deck imputation within matching imputation cells."
                        )
                    },
                    {
                        "guide_id": "NSSTA-G-ESTIMATION-2026",
                        "title": "NSSTA Field Manual: Small Area Estimation (SAE) & Multiplier Calibration",
                        "category": "Empirical Estimation",
                        "level": "Advanced (Level 3-4)",
                        "pages": 36,
                        "modules": ["Module 1: Calibrated Multipliers", "Module 2: Winsorization & Outlier Suppression", "Module 3: Fay-Herriot EBLUP Area Shrinkage Models"],
                        "content": (
                            "NSSTA ADVANCED ESTIMATION WORKSHOP — FACULTY GUIDE\n"
                            "Course Director: Dr. Priya Sharma\n\n"
                            "Part A: Multiplier Calibration & Post-Stratification\n"
                            "Design weights (1/pi_i) often produce district aggregates deviating from known administrative totals. Generalised Regression Estimator (GREG) calibrated weights match external control totals (e.g. Aadhaar enrollment, GST filings) while minimizing distance metrics.\n\n"
                            "Part B: Small Area Estimation (SAE) with Fay-Herriot EBLUP\n"
                            "When domain sample sizes cannot achieve Relative Standard Error (RSE) below 15%, Fay-Herriot empirical best linear unbiased predictors borrow strength from auxiliary administrative registers."
                        )
                    }
                ]
            },
            {
                "id": 2,
                "name": "Prof. K. R. Ramanathan",
                "designation": "Professor of Macroeconomic Accounting & Price Statistics",
                "department": "National Statistical Systems Training Academy (NSSTA)",
                "specialization": "System of National Accounts (SNA), Double Deflation, & CPI/WPI Formulation",
                "bio": "Former Deputy Director General at MoSPI National Accounts Division. Principal instructor for senior cadre refresher programmes.",
                "avatar": "KR",
                "guides": [
                    {
                        "guide_id": "NSSTA-G-SNA-2026",
                        "title": "NSSTA National Accounts Compendium: SNA 2008 & Real GVA Double Deflation",
                        "category": "National Accounts & Macroeconomics",
                        "level": "Advanced (Level 4)",
                        "pages": 62,
                        "modules": ["Module 1: Supply and Use Tables (SUT)", "Module 2: Real Gross Value Added (GVA)", "Module 3: Double Deflation Methodology", "Module 4: FISIM & Capital Formation"],
                        "content": (
                            "NATIONAL STATISTICAL SYSTEMS TRAINING ACADEMY (NSSTA)\n"
                            "Macroeconomic Statistics Division — Training Directive 2026\n"
                            "Faculty: Prof. K. R. Ramanathan, Macroeconomic Accounts Chair\n\n"
                            "Module 1: System of National Accounts (SNA 2008) Framework\n"
                            "Gross Value Added (GVA) at basic prices is defined as Gross Output at basic prices minus Intermediate Consumption at purchasers' prices. Net product taxes and subsidies reconcile basic GVA to GDP at market prices.\n\n"
                            "Module 2: The Imperative of Double Deflation for Real Output\n"
                            "Single indicator deflation introduces critical distortions whenever input inflation deviates from output inflation. Double Deflation deflates gross output with specific output producer price indices and intermediate inputs with dedicated input price indices, ensuring real value added accurately isolates physical productivity growth."
                        )
                    },
                    {
                        "guide_id": "NSSTA-G-CPI-2026",
                        "title": "NSSTA Price Statistics Handbook: Modified Laspeyres & Hedonic Quality Adjustments",
                        "category": "Price Statistics",
                        "level": "Intermediate to Advanced",
                        "pages": 44,
                        "modules": ["Module 1: Base Revision Cycles", "Module 2: Modified Laspeyres Index", "Module 3: Hedonic Price Modeling", "Module 4: Elementary Aggregates & Jevons Index"],
                        "content": (
                            "NSSTA TECHNICAL BULLETIN: PRICE INDEX COMPILATIONS\n"
                            "Faculty: Prof. K. R. Ramanathan\n\n"
                            "Headline Consumer Price Index (CPI) in India is compiled using the Modified Laspeyres formula with fixed base-period consumption basket weights. "
                            "Elementary aggregates across retail centers utilize the geometric mean (Jevons Index) to mitigate upward arithmetic bias. "
                            "When technological specifications shift rapidly (e.g. mobile electronics), hedonic regression adjustments isolate pure price increases from quality enhancements."
                        )
                    }
                ]
            },
            {
                "id": 3,
                "name": "Dr. Ananya Sengupta",
                "designation": "Associate Professor & Lead AI/ML Instructor",
                "department": "NSSTA & IIT Delhi Collaborative Statistical Cell",
                "specialization": "Machine Learning Imputation, PySpark Big Data, & Spatial GIS",
                "bio": "Pioneers automated outlier detection algorithms and predictive imputation pipelines across MoSPI National Data Warehouse registers.",
                "avatar": "AS",
                "guides": [
                    {
                        "guide_id": "NSSTA-G-AIML-2026",
                        "title": "NSSTA AI Laboratory Guide: Machine Learning Imputation & Algorithmic Anomaly Detection",
                        "category": "Emerging Technologies",
                        "level": "Advanced (Level 3-4)",
                        "pages": 52,
                        "modules": ["Module 1: Automated Missing Value Imputation", "Module 2: Isolation Forests for Survey Outliers", "Module 3: PySpark Distributed Pipelines", "Module 4: LLM-Assisted NIC/NCO Classification"],
                        "content": (
                            "NSSTA ADVANCED COMPUTATIONAL LAB MANUAL (2026)\n"
                            "Faculty: Dr. Ananya Sengupta, Lead AI Instructor\n\n"
                            "Module 1: Machine Learning Based Hedonic Imputation\n"
                            "Traditional mean/median imputation distorts variance and correlation structures. K-Nearest Neighbors and Gradient Boosted Trees impute missing economic microdata while preserving multivariate relationships across enterprise strata.\n\n"
                            "Module 2: Unsupervised Outlier Detection with Isolation Forests\n"
                            "Extreme records in Annual Survey of Industries (ASI) frequently reflect data entry errors rather than genuine industrial outliers. Isolation Forests and Local Outlier Factors (LOF) assign continuous anomaly scores, flagging suspicious records for targeted verification."
                        )
                    },
                    {
                        "guide_id": "NSSTA-G-GIS-2026",
                        "title": "NSSTA Geospatial Workshop: GIS Boundary Mapping & Spatial Stratification",
                        "category": "Geospatial Statistics",
                        "level": "Intermediate (Level 2-3)",
                        "pages": 38,
                        "modules": ["Module 1: Urban Frame Survey (UFS) Digitization", "Module 2: Spatial Point Pattern Analysis", "Module 3: Satellite Nightlight Proxy Estimation"],
                        "content": (
                            "NSSTA GEOSPATIAL CADRE TRAINING DIRECTIVE\n"
                            "Faculty: Dr. Ananya Sengupta\n\n"
                            "Module 1: Urban Frame Survey (UFS) Digital Modernization\n"
                            "Spatial stratification combines satellite imagery with Census Enumeration Blocks. High-resolution boundary shapefiles eliminate coverage gaps in peri-urban industrial zones, ensuring uniform sampling coverage across expanding metropolitan areas."
                        )
                    }
                ]
            }
        ]

    def get_trainer_by_id(self, trainer_id: int) -> Optional[Dict[str, Any]]:
        for t in self.get_trainers():
            if t["id"] == trainer_id:
                return t
        return None

    def get_guide_by_id(self, guide_id: str) -> Optional[Dict[str, Any]]:
        for t in self.get_trainers():
            for g in t.get("guides", []):
                if g["guide_id"] == guide_id:
                    return {
                        **g,
                        "trainer_name": t["name"],
                        "trainer_designation": t["designation"],
                        "trainer_avatar": t["avatar"]
                    }
        return None

    def get_programme_by_id(self, programme_id: str) -> Optional[Dict[str, Any]]:
        for p in self.get_programmes():
            if p["programme_id"] == programme_id:
                return p
        return None

nssta_service = NSSTATrainingService()

