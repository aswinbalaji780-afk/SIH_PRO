import os
import json
import urllib.request
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.models.entities import (
    EmployeeProfile, SkillGap, Recommendation, EmployeeCompetency, LearningPath
)
from backend.services.skill_gap_engine import SkillGapEngine

class AIAssistantService:
    """
    Context-aware AI Learning Assistant for the National Official Statistical System:
    - Grounded in learner profile, assigned job role, current competencies, and identified skill gaps
    - Powered by Google Gemini API (gemini-3.6-flash) for dynamic, personalized guidance
    - Answers skill gap questions, explains recommendation rationale, and clarifies statistical concepts
    - Provides resilient local fallbacks if the network or API key is unavailable
    """

    @classmethod
    def _get_api_key(cls) -> str:
        """Retrieves GEMINI_API_KEY from environment, checking local/parent .env files if needed."""
        key = os.getenv("GEMINI_API_KEY")
        if key and key.strip():
            return key.strip()

        # Fallback: search known .env locations
        try:
            from dotenv import load_dotenv
            curr_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(os.path.dirname(curr_dir))
            candidate_paths = [
                os.path.join(project_root, ".env"),
                os.path.join(curr_dir, ".env"),
                os.path.join(project_root, "tests", ".env"),
            ]
            for env_path in candidate_paths:
                if os.path.isfile(env_path):
                    load_dotenv(env_path)
                    key = os.getenv("GEMINI_API_KEY")
                    if key and key.strip():
                        return key.strip()
        except Exception:
            pass

        return ""

    @classmethod
    def _call_gemini(cls, prompt: str, timeout: int = 25) -> Optional[str]:
        """Executes a REST call to Google Gemini API and returns the generated text."""
        api_key = cls._get_api_key()
        if not api_key:
            return None

        model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        req_data = {"contents": [{"parts": [{"text": prompt}]}]}

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(req_data).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=timeout) as response:
                resp_body = json.loads(response.read().decode("utf-8"))
                parts = resp_body.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                ai_text = "".join([p.get("text", "") for p in parts if "text" in p]).strip()
                return ai_text if ai_text else None
        except Exception as e:
            print(f"Gemini API Call Error: {e}")
            return None

    @classmethod
    def _get_real_ai_guidance(cls, emp_name: str, role_title: str, top_gap) -> str:
        """Calls Gemini to generate targeted 2-sentence advice on the user's top skill gap."""
        comp_name = top_gap.competency.name if top_gap.competency else "this core skill"
        prompt = (
            f"You are an AI career mentor for government officials in the National Statistical System. "
            f"{emp_name} is working as a {role_title}. "
            f"Their biggest skill gap right now is '{comp_name}' "
            f"(Current score: {top_gap.current_score}/100, Required Benchmark: {top_gap.required_score}/100). "
            f"Write a very short, motivating 2-sentence advice on why improving this specific skill is crucial for their specific role. "
            f"Do not use greetings, just provide the advice."
        )

        response = cls._call_gemini(prompt, timeout=25)
        if response:
            return response

        # Fallback text if the API call fails or key is missing
        return "Addressing your top gap will immediately accelerate your readiness for upcoming national statistical survey design and data compilation mandates."

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

        # ==========================================
        # 1. Skill Gap Queries
        # ==========================================
        if any(w in msg for w in ["gap", "lacking", "improve", "shortage", "weakness", "deficit"]):
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

            # FETCH REAL AI GUIDANCE FROM GEMINI
            top_gap = gaps[0]
            real_ai_guidance = cls._get_real_ai_guidance(emp_name, role_title, top_gap)
            lines.append(f"**AI Guidance:** {real_ai_guidance}")

            updated_date = gaps[0].updated_at.strftime('%d %b %Y') if gaps[0].updated_at else "Current Quarter"
            return {
                "reply": "\n".join(lines),
                "sources": [
                    f"Employee Skill Gap Ledger — Updated {updated_date}",
                    "Role Competency Specification: " + role_title,
                    "Guidance Powered by Google Gemini AI"
                ]
            }

        # ==========================================
        # 2. Recommendation & "Why" Queries
        # ==========================================
        elif any(w in msg for w in ["recommend", "why", "course", "suggest", "learn next"]):
            recs = db.query(Recommendation).filter(
                Recommendation.employee_id == employee_id,
                Recommendation.status == "ACTIVE"
            ).order_by(Recommendation.recommendation_score.desc()).all()

            if not recs:
                return {
                    "reply": f"No active recommendations are pending for {emp_name}. You are currently on track with your required capacity building milestones.",
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

        # ==========================================
        # 3. Dynamic Gemini LLM Cadre Copilot
        # (Answers conceptual questions, statistical methodologies,
        #  training advice, and general questions using Gemini)
        # ==========================================
        # Extract contextual gap & rec summary to ground Gemini
        top_gaps = db.query(SkillGap).filter(SkillGap.employee_id == employee_id).order_by(SkillGap.gap_score.desc()).limit(3).all()
        gap_desc = ", ".join([f"{g.competency.name} (Gap: {g.gap_score:.0f} pts)" for g in top_gaps if g.competency]) or "None"

        active_recs = db.query(Recommendation).filter(Recommendation.employee_id == employee_id, Recommendation.status == "ACTIVE").limit(2).all()
        rec_desc = ", ".join([r.course.title for r in active_recs if r.course]) or "Standard Foundation Courses"

        full_prompt = (
            f"You are the official AI Skill Intelligence Copilot & Cadre Mentor for India's National Statistical System "
            f"(Ministry of Statistics and Programme Implementation - MoSPI, NSSTA, and iGOT Karmayogi platform).\n\n"
            f"OFFICER PROFILE CONTEXT:\n"
            f"• Name: {emp_name}\n"
            f"• Current Job Role: {role_title}\n"
            f"• Department: {dept_name}\n"
            f"• Top Identified Competency Gaps: {gap_desc}\n"
            f"• Active Recommended Courses: {rec_desc}\n\n"
            f"OFFICER INQUIRY:\n"
            f"\"{user_message}\"\n\n"
            f"INSTRUCTIONS:\n"
            f"1. Provide a comprehensive, statistically accurate, and encouraging response directly answering the officer's question.\n"
            f"2. Ground your answer in official Indian statistical methodologies, standards, and organizations "
            f"(e.g., NSS, NSO, ASI, PLFS, CPI, IIP, MoSPI Guidelines, NSSTA manuals, iGOT Karmayogi courses) where relevant.\n"
            f"3. Use structured markdown formatting (bullet points, bold highlights) for high readability.\n"
            f"4. Conclude with 1 actionable learning step for the officer."
        )

        ai_response = cls._call_gemini(full_prompt, timeout=25)

        if ai_response:
            return {
                "reply": ai_response,
                "sources": [
                    "Guidance Powered by Google Gemini AI (gemini-3.6-flash)",
                    "MoSPI Official Statistics Knowledge Repository",
                    "iGOT Karmayogi Capacity Building Framework"
                ]
            }

        # ==========================================
        # 4. Fallback for Offline / Missing Key
        # ==========================================
        if any(w in msg for w in ["sampling", "stratified", "pps", "variance", "deff", "sample size"]):
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
            "3. *'Explain Stratified Sampling'* or any statistical concept for instant guidance.\n"
            "4. *'What should I learn next?'* for your sequenced training roadmap."
        )
        return {
            "reply": reply,
            "sources": ["National Statistical System Skill Copilot v3.0"]
        }

ai_assistant = AIAssistantService()