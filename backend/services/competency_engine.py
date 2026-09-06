import datetime
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from backend.models.entities import (
    EmployeeProfile, EmployeeCompetency, CompetencyEvidence, CompetencyHistory,
    Competency, CompetencyLevel, AssessmentAttempt
)

class CompetencyEngine:
    """
    Production-grade competency engine:
    - Calculates composite competency score (0-100) based on weighted evidence:
      * Assessment / Quiz scores: 45% weight
      * Verified course completions: 30% weight
      * Practical / Work experience: 15% weight
      * Self-assessment baseline: 10% weight
    - Evaluates standardized Competency Level (1 to 5):
      * Level 1 (Awareness): 0 - 29%
      * Level 2 (Basic): 30 - 49%
      * Level 3 (Intermediate): 50 - 69%
      * Level 4 (Advanced): 70 - 89%
      * Level 5 (Expert): 90 - 100%
    - Calculates evidence-based statistical confidence (0 - 100%)
    - Maintains immutable, audit-ready competency history ledger
    """

    @staticmethod
    def calculate_level(score: float) -> int:
        if score >= 90.0:
            return 5
        elif score >= 70.0:
            return 4
        elif score >= 50.0:
            return 3
        elif score >= 30.0:
            return 2
        else:
            return 1

    @staticmethod
    def level_to_title(level: int) -> str:
        mapping = {
            1: "Level 1 — Awareness",
            2: "Level 2 — Basic",
            3: "Level 3 — Intermediate",
            4: "Level 4 — Advanced",
            5: "Level 5 — Expert"
        }
        return mapping.get(level, f"Level {level}")

    @classmethod
    def recompute_employee_competency(
        cls,
        db: Session,
        employee_comp: EmployeeCompetency
    ) -> EmployeeCompetency:
        """
        Recalculates a single competency score from its registered evidence items.
        """
        evidences = employee_comp.evidence_records

        if not evidences:
            employee_comp.current_level = cls.calculate_level(employee_comp.current_score)
            return employee_comp

        quiz_scores: List[float] = []
        course_scores: List[float] = []
        exp_scores: List[float] = []
        self_scores: List[float] = []

        for ev in evidences:
            if ev.evidence_type == "ASSESSMENT_QUIZ" and ev.score_value is not None:
                quiz_scores.append(ev.score_value)
            elif ev.evidence_type == "COURSE_COMPLETION" and ev.score_value is not None:
                course_scores.append(ev.score_value)
            elif ev.evidence_type == "WORK_EXPERIENCE" and ev.score_value is not None:
                exp_scores.append(ev.score_value)
            elif ev.evidence_type == "SELF_ASSESSMENT" and ev.score_value is not None:
                self_scores.append(ev.score_value)

        # Weighted calculation
        total_weight = 0.0
        weighted_sum = 0.0

        if quiz_scores:
            avg_quiz = sum(quiz_scores) / len(quiz_scores)
            weighted_sum += avg_quiz * 0.45
            total_weight += 0.45

        if course_scores:
            avg_course = sum(course_scores) / len(course_scores)
            weighted_sum += avg_course * 0.30
            total_weight += 0.30

        if exp_scores:
            avg_exp = sum(exp_scores) / len(exp_scores)
            weighted_sum += avg_exp * 0.15
            total_weight += 0.15

        if self_scores:
            avg_self = sum(self_scores) / len(self_scores)
            weighted_sum += avg_self * 0.10
            total_weight += 0.10

        old_score = employee_comp.current_score
        old_level = employee_comp.current_level

        if total_weight > 0:
            new_score = round(weighted_sum / total_weight, 1)
        else:
            new_score = old_score

        new_level = cls.calculate_level(new_score)

        # Confidence is derived from the breadth of multi-source evidence
        evidence_sources = sum([
            1 if quiz_scores else 0,
            1 if course_scores else 0,
            1 if exp_scores else 0,
            1 if self_scores else 0
        ])
        confidence = min(98.0, 40.0 + (evidence_sources * 15.0) + (len(evidences) * 2.0))

        employee_comp.current_score = new_score
        employee_comp.current_level = new_level
        employee_comp.confidence_score = confidence
        employee_comp.last_assessed_at = datetime.datetime.utcnow()

        # Record history if changed
        if old_score != new_score or old_level != new_level:
            history = CompetencyHistory(
                employee_competency_id=employee_comp.id,
                old_score=old_score,
                new_score=new_score,
                old_level=old_level,
                new_level=new_level,
                reason="Auto-recomputed from multi-source evidence",
                confidence=confidence,
                recorded_at=datetime.datetime.utcnow()
            )
            db.add(history)

        return employee_comp

    @classmethod
    def record_assessment_impact(
        cls,
        db: Session,
        employee_id: int,
        competency_id: int,
        quiz_score: float,
        assessment_title: str
    ) -> EmployeeCompetency:
        """
        Records an assessment score as official evidence and triggers score update.
        """
        emp_comp = db.query(EmployeeCompetency).filter(
            EmployeeCompetency.employee_id == employee_id,
            EmployeeCompetency.competency_id == competency_id
        ).first()

        if not emp_comp:
            emp_comp = EmployeeCompetency(
                employee_id=employee_id,
                competency_id=competency_id,
                current_score=0.0,
                current_level=1,
                confidence_score=50.0
            )
            db.add(emp_comp)
            db.flush()

        old_score = emp_comp.current_score
        old_level = emp_comp.current_level

        evidence = CompetencyEvidence(
            employee_competency_id=emp_comp.id,
            evidence_type="ASSESSMENT_QUIZ",
            score_value=quiz_score,
            description=f"Completed {assessment_title} with score {quiz_score:.1f}%",
            source_reference=f"Assessment Attempt #{datetime.datetime.utcnow().strftime('%Y%m%d%H%M')}"
        )
        db.add(evidence)
        db.flush()

        # Recalculate
        emp_comp = cls.recompute_employee_competency(db, emp_comp)

        # Update overall employee competency score
        cls.recompute_overall_employee_score(db, employee_id)

        db.commit()
        db.refresh(emp_comp)
        return emp_comp

    @classmethod
    def recompute_overall_employee_score(cls, db: Session, employee_id: int) -> float:
        comps = db.query(EmployeeCompetency).filter(
            EmployeeCompetency.employee_id == employee_id
        ).all()

        if not comps:
            return 0.0

        avg_score = sum(c.current_score for c in comps) / len(comps)
        profile = db.query(EmployeeProfile).filter(EmployeeProfile.id == employee_id).first()
        if profile:
            profile.overall_competency_score = round(avg_score, 1)
            db.flush()

        return round(avg_score, 1)
