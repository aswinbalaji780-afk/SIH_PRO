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

    def get_programme_by_id(self, programme_id: str) -> Optional[Dict[str, Any]]:
        for p in self.get_programmes():
            if p["programme_id"] == programme_id:
                return p
        return None

nssta_service = NSSTATrainingService()
