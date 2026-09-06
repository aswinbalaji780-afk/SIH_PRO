import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.models.entities import (
    EmployeeProfile, RoleCompetency, EmployeeCompetency, SkillGap, Competency
)
from backend.core.config import settings

class SkillGapEngine:
    """
    Skill Gap Engine:
    - Calculates: Skill Gap = Required Competency Score - Current Competency Score
    - Classifies priority:
        0 - 5   -> NO_GAP
        6 - 15  -> LOW
        16 - 30 -> MEDIUM
        31 - 50 -> HIGH
        51+     -> CRITICAL
    - Auto-refreshes when competencies or job roles change
    """

    @staticmethod
    def classify_priority(gap: float) -> str:
        if gap >= settings.SKILL_GAP_CRITICAL_THRESHOLD:
            return "CRITICAL"
        elif gap >= settings.SKILL_GAP_HIGH_THRESHOLD:
            return "HIGH"
        elif gap >= settings.SKILL_GAP_MEDIUM_THRESHOLD:
            return "MEDIUM"
        elif gap >= settings.SKILL_GAP_LOW_THRESHOLD:
            return "LOW"
        else:
            return "NO_GAP"

    @classmethod
    def recompute_employee_skill_gaps(cls, db: Session, employee_id: int) -> List[SkillGap]:
        employee = db.query(EmployeeProfile).filter(EmployeeProfile.id == employee_id).first()
        if not employee:
            return []

        # Get role competencies for the employee's assigned job role
        role_comps = db.query(RoleCompetency).filter(
            RoleCompetency.job_role_id == employee.job_role_id
        ).all()

        existing_gaps = {
            g.competency_id: g
            for g in db.query(SkillGap).filter(SkillGap.employee_id == employee_id).all()
        }

        emp_comps = {
            c.competency_id: c
            for c in db.query(EmployeeCompetency).filter(EmployeeCompetency.employee_id == employee_id).all()
        }

        updated_gaps = []

        for rc in role_comps:
            comp_id = rc.competency_id
            required_score = rc.required_score

            emp_c = emp_comps.get(comp_id)
            current_score = emp_c.current_score if emp_c else 0.0

            gap_score = max(0.0, required_score - current_score)
            priority = cls.classify_priority(gap_score)

            if comp_id in existing_gaps:
                sg = existing_gaps[comp_id]
                sg.required_score = required_score
                sg.current_score = current_score
                sg.gap_score = round(gap_score, 1)
                sg.priority = priority
                sg.updated_at = datetime.datetime.utcnow()
            else:
                sg = SkillGap(
                    employee_id=employee_id,
                    competency_id=comp_id,
                    required_score=required_score,
                    current_score=current_score,
                    gap_score=round(gap_score, 1),
                    priority=priority
                )
                db.add(sg)

            updated_gaps.append(sg)

        db.commit()
        return updated_gaps

    @classmethod
    def get_summary(cls, db: Session, employee_id: int) -> Dict[str, Any]:
        gaps = db.query(SkillGap).filter(SkillGap.employee_id == employee_id).all()

        summary = {
            "total_evaluated": len(gaps),
            "critical_count": 0,
            "high_count": 0,
            "medium_count": 0,
            "low_count": 0,
            "no_gap_count": 0,
            "top_gaps": []
        }

        sorted_gaps = sorted(gaps, key=lambda g: g.gap_score, reverse=True)

        for g in sorted_gaps:
            if g.priority == "CRITICAL":
                summary["critical_count"] += 1
            elif g.priority == "HIGH":
                summary["high_count"] += 1
            elif g.priority == "MEDIUM":
                summary["medium_count"] += 1
            elif g.priority == "LOW":
                summary["low_count"] += 1
            else:
                summary["no_gap_count"] += 1

        for g in sorted_gaps[:5]:
            summary["top_gaps"].append({
                "competency_id": g.competency_id,
                "name": g.competency.name if g.competency else "Unknown",
                "current_score": g.current_score,
                "required_score": g.required_score,
                "gap_score": g.gap_score,
                "priority": g.priority
            })

        return summary
