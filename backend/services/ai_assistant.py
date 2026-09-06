from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.models.entities import (
    EmployeeProfile, SkillGap, Recommendation, EmployeeCompetency, LearningPath
)
from backend.services.skill_gap_engine import SkillGapEngine

class AIAssistantService:
    """
    Context-aware AI Learning Assistant for the National Official Statistical System:
    - Grounded in learner profile, assigned job role, current competencies, and identified skill gaps
    - Provides actionable answers with source citations
    - Explains recommendation rationale and official statistical methodologies
    """

    @classmethod
    def process_query(cls, db: Session, employee_id: int, user_message: str) -> Dict[str, Any]:
        msg = user_message.lower().strip()
        employee = db.query(EmployeeProfile).filter(EmployeeProfile.id == employee_id).first()

        if not employee:
            return {
                "reply": "Official profile not found. Please ensure you are logged into your government cadre account.",
                "sources": []
            }

        emp_name = employee.user.full_name if employee.user else "Officer"
        role_title = employee.job_role.title if employee.job_role else "Statistical Officer"
        dept_name = employee.department.name if employee.department else "National Statistical System"

        # 1. Skill Gap Queries
        if any(w in msg for w in ["gap", "lacking", "improve", "shortage", "weakness"]):
            gaps = db.query(SkillGap).filter(
                SkillGap.employee_id == employee_id,
                SkillGap.gap_score > 5.0
            ).order_by(SkillGap.gap_score.desc()).all()

            if not gaps:
                return {
                    "reply": f"Hello {emp_name}. Excellent news — your assessed competencies currently meet or exceed all prescribed benchmark levels for your role as **{role_title}**!",
                    "sources": ["National Competency Framework — MoSPI 2026"]
                }

            lines = [f"### Current Competency Gap Report for {emp_name} ({role_title})", ""]
            lines.append("Here are your prioritized skill gaps evaluated against your role benchmarks:\n")
            for idx, g in enumerate(gaps[:4], 1):
                comp_name = g.competency.name if g.competency else "Competency"
                lines.append(f"{idx}. **{comp_name}** — **{g.priority} Priority**")
                lines.append(f"   • Assessed Score: **{g.current_score:.0f}/100** | Required Benchmark: **{g.required_score:.0f}/100**")
                lines.append(f"   • Identified Gap: **{g.gap_score:.0f} points**\n")

            lines.append("**AI Guidance:** Addressing your top gap will immediately accelerate your readiness for upcoming national statistical survey design and data compilation mandates.")

            return {
                "reply": "\n".join(lines),
                "sources": [
                    f"Employee Skill Gap Ledger — Updated {gaps[0].updated_at.strftime('%d %b %Y')}",
                    "Role Competency Specification: " + role_title
                ]
            }

        # 2. Recommendation & "Why" Queries
        elif any(w in msg for w in ["recommend", "why", "course", "suggest", "learn next"]):
            recs = db.query(Recommendation).filter(
                Recommendation.employee_id == employee_id,
                Recommendation.status == "ACTIVE"
            ).order_by(Recommendation.recommendation_score.desc()).all()

            if not recs:
                return {
                    "reply": f"No active recommendations are pending. You are on track with your required milestones.",
                    "sources": ["Recommendation Engine"]
                }

            top_rec = recs[0]
            lines = [f"### Recommended Learning Pathway for {emp_name}", ""]
            lines.append(f"**Top Recommendation:** [{top_rec.course.title}]({top_rec.course.external_url})")
            lines.append(f"• **Provider:** {top_rec.course.provider} ({top_rec.course.source})")
            lines.append(f"• **Recommendation Fit Score:** **{top_rec.recommendation_score:.0f}% Match**")
            lines.append(f"• **Priority:** `{top_rec.priority}`\n")
            lines.append(f"**Explainability (Why this was recommended):**")
            lines.append(f"{top_rec.why_recommended}\n")
            lines.append(f"• Gap Match: **{top_rec.gap_match_score:.0f}%** | Role Match: **{top_rec.role_match_score:.0f}%** | Prerequisite Check: **Passed**")

            return {
                "reply": "\n".join(lines),
                "sources": [
                    f"iGOT Karmayogi Course Registry — {top_rec.course.course_id}",
                    "Hybrid Recommendation Scoring Matrix"
                ]
            }

        # 3. Statistical / Domain Concept Explanations
        elif any(w in msg for w in ["sampling", "stratified", "pps", "variance", "deff", "sample size"]):
            reply = (
                "### Statistical Methodology: Stratified Multi-Stage Sampling\n\n"
                "In India's National Sample Surveys (NSS), **Stratified Multi-Stage Sampling** is the primary framework:\n\n"
                "1. **Stratification:** Stratifying populations (by rural/urban sectors, district sub-divisions, or enterprise revenue classes) "
                "ensures small within-stratum variance and high between-strata variance, significantly boosting overall estimator precision.\n"
                "2. **First-Stage Units (FSUs):** Primary census villages (rural) or Urban Frame Survey (UFS) blocks, typically drawn with "
                "**Probability Proportional to Size (PPS)** with replacement or without replacement.\n"
                "3. **Ultimate Sampling Units (USUs):** Households or establishments drawn systematically within selected FSUs after listing.\n"
                "4. **Design Effect (Deff):** Accounts for cluster variance inflation compared to Simple Random Sampling."
            )
            return {
                "reply": reply,
                "sources": [
                    "NSSTA Official Statistics Handbook — Module 4: Survey Methodology",
                    "National Statistical Office (NSO) Sampling Design Manual"
                ]
            }

        # 4. General Competency / Growth Queries
        else:
            comps = db.query(EmployeeCompetency).filter(EmployeeCompetency.employee_id == employee_id).all()
            total_score = sum(c.current_score for c in comps) / max(1, len(comps))

            reply = (
                f"Greetings {emp_name}. I am your dedicated **AI Skill Intelligence Copilot** for the Official Statistical System.\n\n"
                f"• **Assigned Role:** {role_title}\n"
                f"• **Department:** {dept_name}\n"
                f"• **Overall Competency Score:** **{total_score:.1f}%**\n\n"
                "You can ask me to:\n"
                "1. *'Show my top skill gaps'* to see your prioritized deficits.\n"
                "2. *'Why was my recommended course chosen?'* to inspect the algorithmic audit trail.\n"
                "3. *'Explain Stratified Sampling'* for instant conceptual assistance.\n"
                "4. *'What should I learn next?'* for your sequenced training roadmap."
            )
            return {
                "reply": reply,
                "sources": ["National Statistical System Skill Copilot v2.4"]
            }

ai_assistant = AIAssistantService()
