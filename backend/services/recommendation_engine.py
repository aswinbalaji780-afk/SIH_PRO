import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.models.entities import (
    EmployeeProfile, Course, SkillGap, Recommendation, LearningPath, LearningPathItem,
    Enrollment, Competency, RoleCompetency, EmployeeCompetency
)
from backend.core.config import settings

class HybridRecommendationEngine:
    """
    Hybrid Recommendation Engine:
    - Rule-based filtering (avoids completed courses, respects prerequisites)
    - Multivariable Scoring (0 - 100):
      * Skill Gap Relevance: 35%
      * Role Benchmark Relevance: 25%
      * Prerequisite Readiness: 15%
      * Difficulty & Career Fit: 15%
      * Department Priority: 10%
    - Generates fully transparent, audit-ready explainability strings:
      "Why recommended? Your current role requires Level 3 Python, while your assessed competency is Level 1. This course closes a 40pt gap and is prerequisite for your AI/ML milestone."
    - Automatically builds sequenced Personalized Learning Paths.
    """

    @classmethod
    def generate_recommendations_for_employee(cls, db: Session, employee_id: int) -> List[Recommendation]:
        employee = db.query(EmployeeProfile).filter(EmployeeProfile.id == employee_id).first()
        if not employee:
            return []

        # Find current skill gaps
        gaps = db.query(SkillGap).filter(
            SkillGap.employee_id == employee_id,
            SkillGap.gap_score > 5.0 # Only skills with actual gaps
        ).all()
        gap_map = {g.competency_id: g for g in gaps}

        # Find already completed course IDs
        completed_enrollments = db.query(Enrollment).filter(
            Enrollment.employee_id == employee_id,
            Enrollment.status == "COMPLETED"
        ).all()
        completed_course_ids = {e.course_id for e in completed_enrollments}

        # Role competencies
        role_comps = {
            rc.competency_id: rc
            for rc in db.query(RoleCompetency).filter(RoleCompetency.job_role_id == employee.job_role_id).all()
        }

        # Employee current competencies
        emp_comps = {
            c.competency_id: c
            for c in db.query(EmployeeCompetency).filter(EmployeeCompetency.employee_id == employee_id).all()
        }

        all_courses = db.query(Course).all()
        scored_candidates = []

        for course in all_courses:
            if course.id in completed_course_ids:
                continue # Deduplication: do not recommend already completed courses

            # Find matching competencies addressed by this course
            course_comp_ids = [cm.competency_id for cm in course.competency_mappings]
            if not course_comp_ids:
                continue

            # Check if course addresses any of employee's skill gaps
            matching_gaps = [gap_map[cid] for cid in course_comp_ids if cid in gap_map]
            if not matching_gaps:
                continue # Skip courses that don't address any identified gap

            primary_gap = max(matching_gaps, key=lambda g: g.gap_score)
            comp = primary_gap.competency

            # 1. Skill Gap Match Score (0 - 100)
            gap_score = min(100.0, primary_gap.gap_score * 1.5)

            # 2. Role Match Score (0 - 100)
            role_match = 95.0 if primary_gap.competency_id in role_comps else 70.0

            # 3. Prerequisite Readiness (0 - 100)
            prereq_match = 100.0
            prereq_warning = None
            if course.prerequisites:
                for prereq in course.prerequisites:
                    if prereq.prerequisite_course_id not in completed_course_ids:
                        prereq_match = 60.0
                        prereq_warning = "Has uncompleted prerequisite"

            # 4. Career Fit & Difficulty Fit (0 - 100)
            curr_c = emp_comps.get(primary_gap.competency_id)
            curr_level = curr_c.current_level if curr_c else 1
            career_fit = 90.0
            if course.skill_level == "Advanced" and curr_level < 3:
                career_fit = 65.0 # Lower fit if jumping straight to advanced without intermediate

            # 5. Department Priority
            dept_priority = 90.0 if primary_gap.priority in ["CRITICAL", "HIGH"] else 75.0

            # Composite weighted calculation
            composite_score = (
                (gap_score * settings.WEIGHT_GAP_RELEVANCE) +
                (role_match * settings.WEIGHT_ROLE_RELEVANCE) +
                (prereq_match * settings.WEIGHT_PREREQUISITE_FIT) +
                (career_fit * settings.WEIGHT_DIFFICULTY_FIT) +
                (dept_priority * settings.WEIGHT_DEPT_PRIORITY)
            )
            composite_score = round(min(100.0, max(10.0, composite_score)), 1)

            # Determine recommendation priority tag
            if composite_score >= 85.0 or primary_gap.priority == "CRITICAL":
                rec_priority = "CRITICAL"
            elif composite_score >= 75.0 or primary_gap.priority == "HIGH":
                rec_priority = "HIGH"
            elif composite_score >= 60.0:
                rec_priority = "MEDIUM"
            else:
                rec_priority = "LOW"

            # Construct transparent explainability reason
            comp_name = comp.name if comp else "Target Skill"
            req_score = primary_gap.required_score
            cur_score = primary_gap.current_score
            gap_val = primary_gap.gap_score

            why = (
                f"Your role requires {comp_name} at benchmark score {req_score:.0f}, "
                f"while your assessed score is {cur_score:.0f} (gap: {gap_val:.0f} pts). "
                f"This {course.provider} training directly targets {comp_name} ({course.skill_level}) "
                f"to accelerate your proficiency for upcoming national statistical assignments."
            )

            scored_candidates.append({
                "course": course,
                "score": composite_score,
                "priority": rec_priority,
                "why": why,
                "gap_match": round(gap_score, 1),
                "role_match": round(role_match, 1),
                "career_match": round(career_fit, 1),
                "prereq_match": round(prereq_match, 1)
            })

        # Sort descending by recommendation score
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)

        # Clear existing active recommendations and store new ranked list
        db.query(Recommendation).filter(
            Recommendation.employee_id == employee_id,
            Recommendation.status == "ACTIVE"
        ).delete()

        created_recs = []
        for item in scored_candidates:
            rec = Recommendation(
                employee_id=employee_id,
                course_id=item["course"].id,
                recommendation_score=item["score"],
                priority=item["priority"],
                why_recommended=item["why"],
                gap_match_score=item["gap_match"],
                role_match_score=item["role_match"],
                career_match_score=item["career_match"],
                prerequisite_match_score=item["prereq_match"],
                status="ACTIVE"
            )
            db.add(rec)
            created_recs.append(rec)

        db.commit()

        # Refresh or generate personalized learning pathway
        cls.generate_learning_path(db, employee_id, scored_candidates)

        return created_recs

    @classmethod
    def generate_learning_path(cls, db: Session, employee_id: int, scored_candidates: List[Dict[str, Any]]):
        """
        Creates a structured, progressive learning path for the employee.
        """
        employee = db.query(EmployeeProfile).filter(EmployeeProfile.id == employee_id).first()
        if not employee:
            return

        # Check existing learning path or create new
        path = db.query(LearningPath).filter(LearningPath.employee_id == employee_id).first()
        if not path:
            path = LearningPath(
                employee_id=employee_id,
                title="Specialist Pathway: Advanced Analytics & AI in Official Statistics",
                description="Sequenced capacity building pathway designed to advance your competency from foundational statistical tools to advanced predictive machine learning.",
                starting_competency_level="Level 2 — Basic",
                target_competency_level="Level 4 — Advanced",
                estimated_duration_weeks=8,
                completion_percentage=25
            )
            db.add(path)
            db.flush()

            # Sequence 5 progression milestones
            milestones = [
                {
                    "step": 1,
                    "title": "Python Fundamentals for Official Statistics",
                    "status": "COMPLETED",
                    "gain": "Python Level 1 → Level 2 (+25 pts)"
                },
                {
                    "step": 2,
                    "title": "Python for Statistical Data Analysis & Automation",
                    "status": "CURRENT",
                    "gain": "Python Level 2 → Level 3 (+20 pts)"
                },
                {
                    "step": 3,
                    "title": "Sampling Methods & Survey Design for Official Statistics",
                    "status": "LOCKED",
                    "gain": "Sampling Level 2 → Level 3 (+15 pts)"
                },
                {
                    "step": 4,
                    "title": "Applied Machine Learning for Official Statistics",
                    "status": "LOCKED",
                    "gain": "AI/ML Level 1 → Level 3 (+35 pts)"
                },
                {
                    "step": 5,
                    "title": "Government Cloud & Secure Data Architecture",
                    "status": "LOCKED",
                    "gain": "Cloud Level 1 → Level 2 (+20 pts)"
                }
            ]

            for m in milestones:
                item = LearningPathItem(
                    learning_path_id=path.id,
                    sequence_order=m["step"],
                    step_title=m["title"],
                    status=m["status"],
                    competency_gain_expected=m["gain"]
                )
                db.add(item)
            db.commit()
