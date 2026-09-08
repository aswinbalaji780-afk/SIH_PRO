import os
import json
import datetime
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.entities import (
    User, EmployeeProfile, Department, JobRole, CompetencyDomain, Competency,
    EmployeeCompetency, CompetencyEvidence, SkillGap, Recommendation, LearningPath,
    Course, Enrollment, TrainingProgramme, LearningMaterial, MaterialChunk,
    Assessment, Question, AssessmentAttempt, AuditLog, SystemNotification, RoleCompetency
)
from backend.schemas.api_schemas import (
    LoginRequest, RegisterRequest, TokenResponse, QuizSubmissionRequest, MCQGenerateRequest,
    QuestionReviewRequest, AssistantQueryRequest, SelfAssessmentUpdateRequest,
    SSOSwitchRequest, TargetPositionUpdateRequest, AICourseRecommendRequest, CourseEnrollRequest,
    TrainerGuideUploadRequest, MultiLevelMCQGenerateRequest, MultiLevelQuizSubmissionRequest
)
from backend.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from backend.services.competency_engine import CompetencyEngine
from backend.services.skill_gap_engine import SkillGapEngine
from backend.services.recommendation_engine import HybridRecommendationEngine
from backend.services.ai_course_recommender import AICourseRecommender, get_role_hierarchy_level
from backend.services.document_service import DocumentProcessingService
from backend.services.mcq_generator import AIMCQGenerator
from backend.services.quiz_engine import QuizEngine
from backend.services.ai_assistant import AIAssistantService
from backend.services.analytics_engine import AnalyticsEngine
from backend.services.nssta_service import nssta_service
from backend.services.igot_service import igot_service

router = APIRouter(prefix="/api/v1")

# -------------------------------------------------------------
# Dependency: Current User & RBAC Helper
# -------------------------------------------------------------
def get_current_user(token: Optional[str] = None, db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.username == "arun.kumar").first()
    if not user:
        user = db.query(User).first()
    return user

# -------------------------------------------------------------
# 1. Authentication, Registration & Personas
# -------------------------------------------------------------
@router.post("/auth/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # Check if username or email exists
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username is already registered in the official directory.")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Official email is already registered.")

    # Create user
    user = User(
        username=payload.username.strip().lower(),
        email=payload.email.strip().lower(),
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        role=payload.role
    )
    db.add(user)
    db.flush()

    # Determine department and job role defaults
    default_dept = db.query(Department).first()
    dept_id = payload.department_id or (default_dept.id if default_dept else 1)
    
    default_role = db.query(JobRole).first()
    role_id = payload.job_role_id or (default_role.id if default_role else 1)

    code_prefix = "CADRE"
    if payload.role == "TRAINER":
        code_prefix = "NSSTA-TR"
    elif payload.role == "DEPT_ADMIN":
        code_prefix = "MOSPI-DIR"
    elif payload.role == "SYSTEM_ADMIN":
        code_prefix = "SYS-ADM"
    else:
        code_prefix = "MOSPI-SO"

    emp_code = payload.employee_code or f"{code_prefix}-{user.id:04d}"

    # Create EmployeeProfile
    profile = EmployeeProfile(
        user_id=user.id,
        employee_code=emp_code,
        designation=payload.designation or ("Senior Faculty" if payload.role == "TRAINER" else "Director" if payload.role == "DEPT_ADMIN" else "Administrator" if payload.role == "SYSTEM_ADMIN" else "Statistical Officer"),
        department_id=dept_id,
        job_role_id=role_id,
        years_of_experience=payload.years_of_experience or 1.0,
        current_assignment=payload.current_assignment or "Official Cadre Capacity Building & Data Compilation",
        reporting_officer="Cadre Controlling Authority",
        career_aspirations="Enhance advanced data analytics and modern survey methodologies.",
        overall_competency_score=50.0,
        profile_completion_pct=90
    )
    db.add(profile)
    db.flush()

    # If role is EMPLOYEE, bind all role competencies from JobRole to initialize baseline scores
    if payload.role == "EMPLOYEE":
        role_comps = db.query(RoleCompetency).filter(RoleCompetency.job_role_id == role_id).all()
        for rc in role_comps:
            base_score = max(20.0, rc.required_score - 25.0) # Start with a realistic baseline gap
            ec = EmployeeCompetency(
                employee_id=profile.id,
                competency_id=rc.competency_id,
                current_score=base_score,
                current_level=CompetencyEngine.calculate_level(base_score),
                confidence_score=55.0,
                is_self_assessed=True
            )
            db.add(ec)
            db.flush()

            # Add initial self-assessment evidence
            ev = CompetencyEvidence(
                employee_competency_id=ec.id,
                evidence_type="SELF_ASSESSMENT",
                score_value=base_score,
                description="Initial onboarding baseline assessment",
                source_reference="Registration Cadre Setup"
            )
            db.add(ev)

        # Recompute overall score, gaps, and initial recommendations
        CompetencyEngine.recompute_overall_employee_score(db, profile.id)
        SkillGapEngine.recompute_employee_skill_gaps(db, profile.id)
        HybridRecommendationEngine.generate_recommendations_for_employee(db, profile.id)

    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="USER_REGISTRATION",
        resource_type="USER",
        resource_id=str(user.id),
        details=f"Official account registered for {user.username} with role {user.role}"
    )
    db.add(audit)
    db.commit()

    token = create_access_token({"sub": user.username, "role": user.role, "user_id": user.id})

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        employee_id=profile.id
    )

@router.get("/meta/cadre-options")
def get_cadre_options(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    roles = db.query(JobRole).all()
    return {
        "departments": [{"id": d.id, "code": d.code, "name": d.name} for d in depts],
        "job_roles": [{"id": r.id, "code": r.code, "title": r.title, "department_id": r.department_id} for r in roles]
    }

@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username.strip().lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid official credentials. Please check username and password.")

    token = create_access_token({"sub": user.username, "role": user.role, "user_id": user.id})
    emp_id = user.employee_profile.id if user.employee_profile else None

    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="LOGIN",
        resource_type="USER",
        resource_id=str(user.id),
        details=f"User {user.username} logged in successfully"
    )
    db.add(audit)
    db.commit()

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        employee_id=emp_id
    )

@router.post("/auth/switch-account", response_model=TokenResponse)
@router.post("/auth/sso-switch", response_model=TokenResponse)
def switch_cadre_account(payload: SSOSwitchRequest, db: Session = Depends(get_db)):
    """
    Authenticated Cadre Account Switcher.
    Requires and verifies target account credentials before issuing a token.
    """
    target_username = payload.target_username.strip().lower()
    user = db.query(User).filter(User.username == target_username).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"Target cadre user '{target_username}' not found in registry.")

    if not verify_password(payload.target_password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Security Verification Failed: Valid password is required to switch to this cadre account."
        )

    token = create_access_token({"sub": user.username, "role": user.role, "user_id": user.id})
    emp_id = user.employee_profile.id if user.employee_profile else None

    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="CADRE_ACCOUNT_SWITCH",
        resource_type="USER",
        resource_id=str(user.id),
        details=f"Verified cadre account switch executed for {user.username} ({user.role})"
    )
    db.add(audit)
    db.commit()

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        employee_id=emp_id
    )


@router.get("/auth/personas")
def get_demo_personas(db: Session = Depends(get_db)):
    users = db.query(User).all()
    personas = []
    for u in users:
        emp = u.employee_profile
        personas.append({
            "user_id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "employee_id": emp.id if emp else None,
            "designation": emp.designation if emp else u.role.replace("_", " ").title(),
            "department": emp.department.name if emp and emp.department else "MoSPI Headquarters"
        })
    return personas

# -------------------------------------------------------------
# 2. Employee Profile & Career Goals
# -------------------------------------------------------------
@router.get("/employees/me")
def get_my_profile(employee_id: Optional[int] = None, db: Session = Depends(get_db)):
    emp_id = employee_id or 1
    emp = db.query(EmployeeProfile).filter(EmployeeProfile.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    return {
        "id": emp.id,
        "employee_code": emp.employee_code,
        "full_name": emp.user.full_name if emp.user else "Officer",
        "email": emp.user.email if emp.user else "",
        "designation": emp.designation,
        "department_name": emp.department.name if emp.department else "",
        "job_role_title": emp.job_role.title if emp.job_role else "",
        "years_of_experience": emp.years_of_experience,
        "current_assignment": emp.current_assignment,
        "reporting_officer": emp.reporting_officer,
        "career_aspirations": emp.career_aspirations,
        "target_skills": emp.target_skills,
        "target_job_role_id": emp.target_job_role_id,
        "target_job_role_title": emp.target_job_role.title if emp.target_job_role else "Senior Statistical Officer (SSO)",
        "overall_competency_score": emp.overall_competency_score,
        "profile_completion_pct": emp.profile_completion_pct,
        "educations": [
            {
                "degree": ed.degree,
                "specialization": ed.specialization,
                "institution": ed.institution,
                "graduation_year": ed.graduation_year
            } for ed in emp.educations
        ],
        "training_histories": [
            {
                "course_name": th.course_name,
                "provider": th.provider,
                "completion_date": th.completion_date.strftime("%b %Y"),
                "score_pct": th.score_pct,
                "certificate_id": th.certificate_id
            } for th in emp.training_histories
        ]
    }

@router.get("/profile/{employee_id}/target-position")
def get_target_position_readiness(employee_id: int, db: Session = Depends(get_db)):
    emp = db.query(EmployeeProfile).filter(EmployeeProfile.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    all_roles = db.query(JobRole).all()
    target_role = emp.target_job_role
    if not target_role:
        target_role = db.query(JobRole).filter(JobRole.code == "ROLE_SSO").first() or (all_roles[1] if len(all_roles) > 1 else all_roles[0])

    emp_comp_map = {ec.competency_id: ec for ec in emp.competencies}
    target_role_comps = db.query(RoleCompetency).filter(RoleCompetency.job_role_id == target_role.id).all()
    
    total_weight = 0.0
    weighted_readiness = 0.0
    target_gaps = []

    for rc in target_role_comps:
        comp = rc.competency
        curr = emp_comp_map.get(rc.competency_id)
        current_score = curr.current_score if curr else 0.0
        current_level = curr.current_level if curr else 1
        
        ratio = min(1.0, current_score / rc.required_score) if rc.required_score > 0 else 1.0
        total_weight += rc.priority_weight
        weighted_readiness += ratio * rc.priority_weight

        gap_points = max(0.0, rc.required_score - current_score)
        
        target_gaps.append({
            "competency_id": rc.competency_id,
            "competency_name": comp.name if comp else "",
            "competency_code": comp.code if comp else "",
            "current_score": round(current_score, 1),
            "current_level": current_level,
            "required_score": rc.required_score,
            "required_level": rc.required_level,
            "gap_points": round(gap_points, 1),
            "is_met": current_score >= rc.required_score,
            "priority_weight": rc.priority_weight
        })

    readiness_pct = round((weighted_readiness / total_weight * 100.0), 1) if total_weight > 0 else 100.0

    readiness_status = "High Competency Benchmark Met — Promotion Eligible"
    if readiness_pct < 70.0:
        readiness_status = "Emerging Readiness — Skill Acquisition Required"
    elif readiness_pct < 85.0:
        readiness_status = "Near Readiness — Targeted Gap Closure Needed"

    # Targeted promotion pathway courses
    gap_comp_ids = [g["competency_id"] for g in target_gaps if not g["is_met"]]
    promo_courses = []
    if gap_comp_ids:
        from backend.models.entities import CourseCompetency
        recs = db.query(Course).join(CourseCompetency).filter(CourseCompetency.competency_id.in_(gap_comp_ids)).limit(4).all()
        promo_courses = [{
            "id": c.id,
            "title": c.title,
            "provider": c.provider,
            "duration_hours": c.duration_hours,
            "url": c.external_url or "https://igotkarmayogi.gov.in"
        } for c in recs]

    return {
        "employee_id": emp.id,
        "employee_name": emp.user.full_name if emp.user else "Officer",
        "current_role": {
            "id": emp.job_role.id if emp.job_role else 0,
            "code": emp.job_role.code if emp.job_role else "",
            "title": emp.job_role.title if emp.job_role else "Statistical Officer",
            "hierarchy_level": get_role_hierarchy_level(emp.job_role)
        },
        "target_role": {
            "id": target_role.id,
            "code": target_role.code,
            "title": target_role.title,
            "description": target_role.description,
            "hierarchy_level": get_role_hierarchy_level(target_role)
        },
        "available_roles": sorted([{
            "id": r.id,
            "code": r.code,
            "title": r.title,
            "description": r.description,
            "hierarchy_level": get_role_hierarchy_level(r)
        } for r in all_roles], key=lambda x: x["hierarchy_level"]),
        "promotion_readiness_pct": readiness_pct,
        "readiness_status": readiness_status,
        "career_aspirations": emp.career_aspirations,
        "target_gaps": target_gaps,
        "promotion_courses": promo_courses
    }

@router.post("/profile/{employee_id}/target-position")
def update_target_position(employee_id: int, payload: TargetPositionUpdateRequest, db: Session = Depends(get_db)):
    emp = db.query(EmployeeProfile).filter(EmployeeProfile.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    target_role = db.query(JobRole).filter(JobRole.id == payload.target_job_role_id).first()
    if not target_role:
        raise HTTPException(status_code=404, detail="Target job role not found")

    current_level = get_role_hierarchy_level(emp.job_role)
    target_level = get_role_hierarchy_level(target_role)
    if target_level <= current_level:
        raise HTTPException(
            status_code=400,
            detail=f"Target position '{target_role.title}' (Level {target_level}) must be higher in hierarchy than your current position '{emp.job_role.title if emp.job_role else 'Current Role'}' (Level {current_level})."
        )

    emp.target_job_role_id = target_role.id
    emp.career_aspirations = f"Aspirational goal: Promotion to {target_role.title}. Actively completing recommended gap pathways."
    db.commit()

    return get_target_position_readiness(employee_id, db)

# -------------------------------------------------------------
# 3. Competencies & Evidence Ledger
# -------------------------------------------------------------
@router.get("/competencies/domains")
def get_competency_domains(db: Session = Depends(get_db)):
    domains = db.query(CompetencyDomain).all()
    results = []
    for d in domains:
        results.append({
            "id": d.id,
            "code": d.code,
            "name": d.name,
            "description": d.description,
            "competencies": [
                {
                    "id": c.id,
                    "code": c.code,
                    "name": c.name,
                    "description": c.description
                } for c in d.competencies
            ]
        })
    return results

@router.get("/competencies/my-competencies")
def get_my_competencies(employee_id: Optional[int] = None, db: Session = Depends(get_db)):
    emp_id = employee_id or 1
    comps = db.query(EmployeeCompetency).filter(EmployeeCompetency.employee_id == emp_id).all()
    results = []
    for ec in comps:
        results.append({
            "id": ec.id,
            "competency_id": ec.competency_id,
            "code": ec.competency.code if ec.competency else "",
            "name": ec.competency.name if ec.competency else "",
            "domain": ec.competency.domain.name if ec.competency and ec.competency.domain else "",
            "current_score": ec.current_score,
            "current_level": ec.current_level,
            "level_title": CompetencyEngine.level_to_title(ec.current_level),
            "confidence_score": ec.confidence_score,
            "is_self_assessed": ec.is_self_assessed,
            "last_assessed_at": ec.last_assessed_at.strftime("%d %b %Y"),
            "evidence_count": len(ec.evidence_records)
        })
    return results

@router.get("/competencies/evidence/{emp_comp_id}")
def get_competency_evidence(emp_comp_id: int, db: Session = Depends(get_db)):
    ec = db.query(EmployeeCompetency).filter(EmployeeCompetency.id == emp_comp_id).first()
    if not ec:
        raise HTTPException(status_code=404, detail="Competency record not found")

    evidences = []
    for ev in ec.evidence_records:
        evidences.append({
            "id": ev.id,
            "evidence_type": ev.evidence_type,
            "score_value": ev.score_value,
            "description": ev.description,
            "source_reference": ev.source_reference,
            "created_at": ev.created_at.strftime("%d %b %Y, %H:%M")
        })

    histories = []
    for h in ec.history:
        histories.append({
            "old_score": h.old_score,
            "new_score": h.new_score,
            "old_level": h.old_level,
            "new_level": h.new_level,
            "reason": h.reason,
            "confidence": h.confidence,
            "recorded_at": h.recorded_at.strftime("%d %b %Y, %H:%M")
        })

    return {
        "competency_name": ec.competency.name if ec.competency else "",
        "current_score": ec.current_score,
        "current_level": ec.current_level,
        "confidence_score": ec.confidence_score,
        "evidences": evidences,
        "history": histories
    }

# -------------------------------------------------------------
# 4. Skill Gap Analysis
# -------------------------------------------------------------
@router.get("/skill-gaps/my-gaps")
def get_my_skill_gaps(employee_id: Optional[int] = None, db: Session = Depends(get_db)):
    emp_id = employee_id or 1
    # Refresh to ensure latest status
    gaps = SkillGapEngine.recompute_employee_skill_gaps(db, emp_id)

    results = []
    for g in gaps:
        results.append({
            "id": g.id,
            "competency_id": g.competency_id,
            "code": g.competency.code if g.competency else "",
            "name": g.competency.name if g.competency else "",
            "domain": g.competency.domain.name if g.competency and g.competency.domain else "",
            "required_score": g.required_score,
            "current_score": g.current_score,
            "gap_score": g.gap_score,
            "priority": g.priority,
            "updated_at": g.updated_at.strftime("%d %b %Y")
        })
    results.sort(key=lambda x: x["gap_score"], reverse=True)
    return results

@router.get("/skill-gaps/summary")
def get_skill_gap_summary(employee_id: Optional[int] = None, db: Session = Depends(get_db)):
    emp_id = employee_id or 1
    return SkillGapEngine.get_summary(db, emp_id)

# -------------------------------------------------------------
# 5. AI Recommendations & Personalized Learning Paths
# -------------------------------------------------------------
@router.get("/recommendations/my-recommendations")
def get_my_recommendations(employee_id: Optional[int] = None, db: Session = Depends(get_db)):
    emp_id = employee_id or 1
    recs = db.query(Recommendation).filter(
        Recommendation.employee_id == emp_id,
        Recommendation.status == "ACTIVE"
    ).order_by(Recommendation.recommendation_score.desc()).all()

    if not recs:
        recs = HybridRecommendationEngine.generate_recommendations_for_employee(db, emp_id)

    results = []
    for r in recs:
        c = r.course
        if not c:
            continue
        results.append({
            "id": c.id,
            "recommendation_id": r.id,
            "course_db_id": c.id,
            "course_id": c.course_id,
            "title": c.title,
            "description": c.description,
            "provider": c.provider,
            "source": c.source,
            "category": c.category,
            "skill_level": c.skill_level,
            "duration_hours": c.duration_hours,
            "format": c.format,
            "rating": c.rating,
            "external_url": c.external_url,
            "recommendation_score": r.recommendation_score,
            "priority": r.priority,
            "why_recommended": r.why_recommended,
            "gap_match_score": r.gap_match_score,
            "role_match_score": r.role_match_score,
            "career_match_score": r.career_match_score,
            "prerequisite_match_score": r.prerequisite_match_score
        })
    return results

@router.get("/learning-paths/my-path")
def get_my_learning_path(employee_id: Optional[int] = None, db: Session = Depends(get_db)):
    emp_id = employee_id or 1
    path = db.query(LearningPath).filter(LearningPath.employee_id == emp_id).first()
    if not path:
        return {}

    items = []
    for it in path.items:
        items.append({
            "step": it.sequence_order,
            "title": it.step_title,
            "status": it.status,
            "gain": it.competency_gain_expected
        })

    return {
        "title": path.title,
        "description": path.description,
        "starting_level": path.starting_competency_level,
        "target_level": path.target_competency_level,
        "duration_weeks": path.estimated_duration_weeks,
        "completion_percentage": path.completion_percentage,
        "milestones": items
    }

# -------------------------------------------------------------
# 6. Courses & NSSTA TPAC Training Programmes
# -------------------------------------------------------------
@router.get("/courses")
def list_courses(
    source: Optional[str] = None,
    category: Optional[str] = None,
    query: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Course)
    if source:
        q = q.filter(Course.source == source)
    if category:
        q = q.filter(Course.category == category)
    courses = q.all()

    if query:
        query_str = query.lower()
        courses = [c for c in courses if query_str in c.title.lower() or query_str in c.description.lower()]

    return [
        {
            "id": c.id,
            "course_id": c.course_id,
            "title": c.title,
            "description": c.description,
            "provider": c.provider,
            "source": c.source,
            "category": c.category,
            "skill_level": c.skill_level,
            "duration_hours": c.duration_hours,
            "language": c.language,
            "format": c.format,
            "rating": c.rating,
            "external_url": c.external_url
        } for c in courses
    ]

def resolve_course_entity(db: Session, identifier: Any) -> Optional[Course]:
    """
    Robustly resolves a Course entity from DB by:
    1. Primary key ID (e.g. 1..6)
    2. Recommendation ID (e.g. 98 -> resolves to associated Course)
    3. Course code string (e.g. 'IGOT-STAT-101')
    4. First catalog course fallback
    """
    if identifier is None:
        return db.query(Course).first()
    try:
        id_int = int(identifier)
        c = db.query(Course).filter(Course.id == id_int).first()
        if c:
            return c
        rec = db.query(Recommendation).filter(Recommendation.id == id_int).first()
        if rec and rec.course:
            return rec.course
    except (ValueError, TypeError):
        pass

    c = db.query(Course).filter(Course.course_id == str(identifier)).first()
    if c:
        return c

    return db.query(Course).first()

@router.post("/courses/{course_id}/enroll")
def enroll_in_course_by_id(course_id: int, employee_id: Optional[int] = None, db: Session = Depends(get_db)):
    emp_id = employee_id or 1
    course = resolve_course_entity(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = db.query(Enrollment).filter(
        Enrollment.employee_id == emp_id,
        Enrollment.course_id == course.id
    ).first()

    clean_url = (course.external_url or "https://igotkarmayogi.gov.in").replace("igot-karmayogi.gov.in", "igotkarmayogi.gov.in")

    if existing:
        return {
            "status": "ALREADY_ENROLLED",
            "enrollment_id": existing.id,
            "message": f"Officer is already enrolled in '{course.title}'.",
            "external_url": clean_url
        }

    emp = db.query(EmployeeProfile).filter(EmployeeProfile.id == emp_id).first()
    officer_name = emp.name if emp else "MoSPI Officer"
    email = emp.email if emp else ""
    igot_resp = igot_service.enroll_course(emp_id, course.id, course.course_id, officer_name=officer_name, email=email)

    enrollment = Enrollment(
        employee_id=emp_id,
        course_id=course.id,
        status="IN_PROGRESS",
        progress_pct=10.0,
        enrolled_at=datetime.datetime.utcnow()
    )
    db.add(enrollment)
    db.commit()
    return {
        "status": "SUCCESS",
        "enrollment_id": enrollment.id,
        "igot_enrollment_id": igot_resp.get("igot_enrollment_id"),
        "sync_status": igot_resp.get("sync_status"),
        "message": f"Successfully enrolled in '{course.title}' via iGOT Karmayogi API.",
        "external_url": clean_url
    }

@router.get("/courses/{course_id}/igot-preview")
def get_course_igot_preview(course_id: int, db: Session = Depends(get_db)):
    course = resolve_course_entity(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    details = igot_service.get_course_details(course.course_id)
    clean_url = (course.external_url or "https://igotkarmayogi.gov.in").replace("igot-karmayogi.gov.in", "igotkarmayogi.gov.in")
    return {
        "id": course.id,
        "course_id": course.course_id,
        "title": course.title,
        "provider": course.provider,
        "category": course.category,
        "skill_level": course.skill_level,
        "duration_hours": course.duration_hours,
        "description": course.description,
        "rating": course.rating,
        "external_url": clean_url,
        "syllabus": details.get("syllabus", []) if details else [
            "Module 1: Foundational Framework & MoSPI Mandates",
            "Module 2: Practical Statistical Methodologies",
            "Module 3: Quality Control & Validation",
            "Module 4: Cadre Implementation & Case Studies"
        ]
    }

@router.get("/courses/{course_id}/curriculum-notes")
def get_course_curriculum_notes(course_id: int, db: Session = Depends(get_db)):
    """
    Extracts structured iGOT course curriculum and syllabus text for RAG ingestion.
    """
    course = resolve_course_entity(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    details = igot_service.get_course_details(course.course_id or course.title)
    curriculum_text = igot_service.get_curriculum_text(course.course_id or course.title)
    return {
        "course_id": course.id,
        "title": course.title,
        "course_code": course.course_id,
        "provider": course.provider,
        "category": course.category,
        "skill_level": course.skill_level,
        "description": course.description,
        "syllabus": details.get("syllabus", []) if details else [],
        "curriculum_text": curriculum_text
    }

@router.get("/nssta/programmes")
def get_nssta_programmes():
    return nssta_service.get_programmes()

@router.get("/nssta/trainers")
def get_nssta_trainers():
    """
    Returns official NSSTA trainers, designations, and authored guides/materials.
    """
    return nssta_service.get_trainers()

@router.get("/nssta/trainers/{trainer_id}")
def get_nssta_trainer(trainer_id: int):
    t = nssta_service.get_trainer_by_id(trainer_id)
    if not t:
        raise HTTPException(status_code=404, detail="NSSTA trainer not found")
    return t

@router.get("/nssta/guides/{guide_id}")
def get_nssta_guide(guide_id: str):
    g = nssta_service.get_guide_by_id(guide_id)
    if not g:
        raise HTTPException(status_code=404, detail="NSSTA guide not found")
    return g

# -------------------------------------------------------------
# 7. Learning Material & Document RAG Pipeline
# -------------------------------------------------------------
@router.post("/materials/upload")
async def upload_learning_material(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    content = await file.read()
    filename = file.filename or "training_material.txt"
    ext = filename.split(".")[-1].lower()

    # Simple text decode for txt or mock extracted text for docs/pdf
    try:
        raw_text = content.decode("utf-8", errors="ignore")
    except Exception:
        raw_text = "Standard Operating Procedure & Sampling Methodology for Official Statistics."

    material = LearningMaterial(
        title=title,
        filename=filename,
        file_type=ext,
        file_size_bytes=len(content),
        uploaded_by_user_id=2, # Trainer Persona Dr. Priya Sharma
        status="PROCESSING"
    )
    db.add(material)
    db.flush()

    chunks = DocumentProcessingService.process_text_content(db, material, raw_text)

    return {
        "material_id": material.id,
        "title": material.title,
        "status": material.status,
        "chunks_generated": len(chunks),
        "total_pages": material.total_pages
    }

@router.get("/materials")
def get_learning_materials(db: Session = Depends(get_db)):
    materials = db.query(LearningMaterial).all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "filename": m.filename,
            "file_type": m.file_type,
            "file_size_bytes": m.file_size_bytes,
            "status": m.status,
            "total_pages": m.total_pages,
            "chunks_count": len(m.chunks),
            "uploaded_at": m.uploaded_at.strftime("%d %b %Y, %H:%M")
        } for m in materials
    ]

# -------------------------------------------------------------
# 8. AI MCQ Generator & Trainer Review Queue
# -------------------------------------------------------------
@router.post("/mcq/generate")
def generate_mcqs(payload: MCQGenerateRequest, db: Session = Depends(get_db)):
    questions = AIMCQGenerator.generate_mcqs_from_material(
        db=db,
        material_id=payload.material_id,
        count=payload.count,
        difficulty=payload.difficulty,
        bloom_level=payload.bloom_level,
        competency_name=payload.competency_name
    )
    return {
        "generated_count": len(questions),
        "status": "DRAFT_PENDING_REVIEW",
        "message": "Questions generated successfully and placed in Trainer Review Queue."
    }

@router.get("/mcq/review-queue")
def get_review_queue(db: Session = Depends(get_db)):
    questions = db.query(Question).filter(
        Question.status == "DRAFT_PENDING_REVIEW"
    ).all()
    results = []
    for q in questions:
        results.append({
            "id": q.id,
            "stem": q.stem,
            "options": json.loads(q.options_json),
            "correct_answer": q.correct_answer,
            "explanation": q.explanation,
            "difficulty": q.difficulty,
            "bloom_level": q.bloom_level,
            "competency": q.competency_name,
            "source_reference": q.source_reference,
            "confidence_score": q.confidence_score,
            "status": q.status
        })
    return results

@router.post("/mcq/review")
def review_question(payload: QuestionReviewRequest, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == payload.question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    if payload.action == "APPROVE":
        q.status = "APPROVED"
        # Attach to the main assessment
        assessment = db.query(Assessment).first()
        if assessment:
            q.assessment_id = assessment.id
    elif payload.action == "REJECT":
        q.status = "REJECTED"
    elif payload.action == "EDIT":
        if payload.updated_stem:
            q.stem = payload.updated_stem
        if payload.updated_correct:
            q.correct_answer = payload.updated_correct
        if payload.updated_explanation:
            q.explanation = payload.updated_explanation
        q.status = "APPROVED"

    db.commit()
    return {"status": q.status, "question_id": q.id}

# -------------------------------------------------------------
# 9. Assessments & Live Interactive Quiz
# -------------------------------------------------------------
@router.get("/assessments")
def get_assessments(db: Session = Depends(get_db)):
    assessments = db.query(Assessment).order_by(Assessment.is_published.desc(), Assessment.id.desc()).all()
    results = []
    for a in assessments:
        is_multi = bool(a.level and "Multi-Level" in a.level)
        level_counts = {1: 0, 2: 0, 3: 0}
        for q in a.questions:
            lvl = q.level or 1
            if lvl in level_counts:
                level_counts[lvl] += 1

        results.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "level": a.level or "Standard Assessment",
            "is_multi_level": is_multi,
            "target_level": a.target_level,
            "level_title": "Multi-Level (Levels 1, 2 & 3)" if is_multi else CompetencyEngine.level_to_title(a.target_level),
            "course_id": a.course_id,
            "course_title": a.course.title if a.course else "National Statistical System Core Curriculum",
            "duration_minutes": a.duration_minutes,
            "passing_score": a.passing_score,
            "total_questions": len(a.questions),
            "level_counts": level_counts,
            "competency_name": a.competency.name if a.competency else "Core Statistical Competency",
            "is_published": a.is_published
        })
    # Sort multi-level assessments to the top so RAG assessments are the primary assessments
    results.sort(key=lambda x: (1 if x["is_multi_level"] else 0, x["id"]), reverse=True)
    return results

@router.get("/assessments/{assessment_id}")
def get_assessment_details(assessment_id: int, db: Session = Depends(get_db)):
    a = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")

    questions = []
    for q in a.questions:
        if q.status == "APPROVED":
            questions.append({
                "id": q.id,
                "stem": q.stem,
                "options": json.loads(q.options_json),
                "difficulty": q.difficulty,
                "bloom_level": q.bloom_level,
                "competency": q.competency_name,
                "source_reference": q.source_reference
            })

    return {
        "id": a.id,
        "title": a.title,
        "description": a.description,
        "duration_minutes": a.duration_minutes,
        "passing_score": a.passing_score,
        "competency_name": a.competency.name if a.competency else "",
        "questions": questions
    }

@router.post("/assessments/{assessment_id}/submit")
def submit_assessment(
    assessment_id: int,
    payload: QuizSubmissionRequest,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    emp_id = employee_id or 1
    raw_answers = [{"question_id": a.question_id, "selected_answer": a.selected_answer} for a in payload.answers]
    result = QuizEngine.evaluate_quiz_submission(
        db=db,
        employee_id=emp_id,
        assessment_id=assessment_id,
        answers=raw_answers
    )
    return result

# -------------------------------------------------------------
# 9B. Multi-Level MCQ Test System (NSSTA Trainer Guide & Course Notes)
# -------------------------------------------------------------
@router.post("/mcq/upload-trainer-guide")
def upload_trainer_guide(payload: TrainerGuideUploadRequest, db: Session = Depends(get_db)):
    """
    Upload or paste NSSTA Trainer's Guide / Technical Notes for AI RAG synthesis.
    """
    filename = f"{payload.title.replace(' ', '_').lower()[:30]}.{payload.file_type}"
    material = LearningMaterial(
        title=payload.title,
        filename=filename,
        file_type=payload.file_type,
        file_size_bytes=len(payload.content.encode("utf-8")),
        uploaded_by_user_id=payload.uploaded_by_user_id,
        status="READY",
        extracted_text_preview=payload.content[:500]
    )
    db.add(material)
    db.flush()

    chunks = DocumentProcessingService.process_text_content(db, material, payload.content)
    db.commit()

    return {
        "material_id": material.id,
        "title": material.title,
        "status": material.status,
        "chunks_generated": len(chunks),
        "total_pages": material.total_pages,
        "preview": material.extracted_text_preview
    }

@router.post("/mcq/parse-document-file")
async def parse_document_file(file: UploadFile = File(...)):
    """
    Parses an uploaded PDF, DOCX, or text file and extracts full raw text
    for immediate viewing and quiz synthesis in the NSSTA Trainer Studio.
    """
    content = await file.read()
    filename = file.filename or "uploaded_guide.txt"
    extracted_text = DocumentProcessingService.extract_text_from_file_bytes(content, filename)

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract readable text from the uploaded file.")

    return {
        "filename": filename,
        "extracted_text": extracted_text,
        "char_count": len(extracted_text),
        "word_count": len(extracted_text.split()),
        "message": f"Successfully extracted {len(extracted_text.split())} words from {filename}"
    }

@router.post("/mcq/generate-multilevel-quiz")
def generate_multilevel_quiz(payload: MultiLevelMCQGenerateRequest, db: Session = Depends(get_db)):
    """
    Generate an AI Multi-Level Exam (Level 1 Foundational, Level 2 Applied, Level 3 Advanced)
    synthesizing content automatically extracted from the chosen iGOT Course and optional NSSTA Trainer's Guide.
    """
    mat_id = payload.material_id
    course_obj = None
    combined_content = payload.guide_content or ""

    # Automatically fetch and inject official iGOT course curriculum notes
    if payload.course_id:
        course_obj = db.query(Course).filter(Course.id == payload.course_id).first()
        if course_obj:
            igot_curriculum = igot_service.get_curriculum_text(course_obj.course_id or course_obj.title)
            if combined_content and combined_content.strip() != igot_curriculum.strip():
                combined_content = f"{igot_curriculum}\n\n=== ADDITIONAL NSSTA TRAINER GUIDE NOTES ===\n{combined_content}"
            else:
                combined_content = igot_curriculum

    if not mat_id and combined_content:
        mat_title = payload.guide_title or (f"iGOT Curriculum Grounding: {course_obj.title}" if course_obj else "NSSTA Cadre Guide")
        material = LearningMaterial(
            title=mat_title,
            filename="curriculum_notes.txt",
            file_type="txt",
            file_size_bytes=len(combined_content.encode("utf-8")),
            uploaded_by_user_id=2,
            status="READY",
            extracted_text_preview=combined_content[:500]
        )
        db.add(material)
        db.flush()
        DocumentProcessingService.process_text_content(db, material, combined_content)
        db.commit()
        mat_id = material.id

    quiz = AIMCQGenerator.generate_multilevel_quiz_from_guide_and_course(
        db=db,
        material_id=mat_id,
        course_id=payload.course_id,
        levels=payload.levels or [1, 2, 3],
        count_per_level=payload.count_per_level or 5,
        assessment_title=payload.assessment_title or (f"AI Multi-Level Assessment: {course_obj.title}" if course_obj else None)
    )
    return quiz

@router.post("/mcq/publish-as-main-assessment")
def publish_as_main_assessment(payload: dict, db: Session = Depends(get_db)):
    """
    Publish an AI RAG Multi-Level Assessment as the Official Main Assessment for a course.
    """
    assessment_id = payload.get("assessment_id")
    if not assessment_id:
        raise HTTPException(status_code=400, detail="assessment_id is required")
    a = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")

    a.is_published = True
    a.level = "Multi-Level (Levels 1, 2 & 3) — Official Main Assessment"
    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"'{a.title}' is now published as the Official Main Cadre Assessment across the platform!",
        "assessment_id": a.id,
        "course_id": a.course_id
    }

@router.get("/mcq/multilevel-quizzes")
def get_multilevel_quizzes(course_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Retrieve all Multi-Level Assessments with question sets across Level 1, 2, and 3.
    """
    q = db.query(Assessment).filter(Assessment.level.like("%Multi-Level%"))
    if course_id:
        q = q.filter(Assessment.course_id == course_id)
    assessments = q.order_by(Assessment.created_at.desc()).all()

    # Ensure an official 15-question assessment exists
    has_15_q = any(len([q_item for q_item in a.questions if q_item.status == "APPROVED"]) >= 15 for a in assessments)
    if not assessments or not has_15_q:
        default_course = db.query(Course).first()
        AIMCQGenerator.generate_multilevel_quiz_from_guide_and_course(
            db=db,
            material_id=None,
            course_id=default_course.id if default_course else 1,
            levels=[1, 2, 3],
            count_per_level=5,
            assessment_title="AI RAG Cadre Comprehensive Multi-Level Exam (15 MCQs • 30 Mins)"
        )
        assessments = db.query(Assessment).filter(Assessment.level.like("%Multi-Level%")).order_by(Assessment.created_at.desc()).all()

    # Prioritize 15+ question comprehensive exams at the top, then newest
    assessments.sort(key=lambda a: (len([qi for qi in a.questions if qi.status == "APPROVED"]) >= 15, a.created_at), reverse=True)

    results = []
    for a in assessments:
        level_counts = {1: 0, 2: 0, 3: 0}
        for q_item in a.questions:
            lvl = q_item.level or 1
            if lvl in level_counts:
                level_counts[lvl] += 1

        results.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "level": a.level or "Multi-Level (Levels 1, 2 & 3)",
            "course_id": a.course_id,
            "course_title": a.course.title if a.course else "Statistical Cadre Methodology",
            "competency_name": a.competency.name if a.competency else "Core Statistical Competency",
            "duration_minutes": a.duration_minutes,
            "passing_score": a.passing_score,
            "total_questions": len(a.questions),
            "level_counts": level_counts,
            "questions": [
                {
                    "id": q_item.id,
                    "level": q_item.level or 1,
                    "level_label": f"Level {q_item.level or 1} ({'Foundational' if (q_item.level or 1)==1 else 'Applied' if (q_item.level or 1)==2 else 'Advanced'})",
                    "stem": q_item.stem,
                    "options": json.loads(q_item.options_json),
                    "difficulty": q_item.difficulty,
                    "bloom_level": q_item.bloom_level,
                    "competency_name": q_item.competency_name,
                    "source_reference": q_item.source_reference,
                    "source_note_citation": q_item.source_note_citation,
                    "is_from_uploaded_file": ("Uploaded" in (q_item.source_reference or "")) or ("Uploaded" in (q_item.source_note_citation or "")) or ("Directly Extracted" in (q_item.source_note_citation or ""))
                } for q_item in a.questions if q_item.status == "APPROVED"
            ]
        })
    return results

@router.post("/mcq/submit-multilevel-test")
def submit_multilevel_test(payload: MultiLevelQuizSubmissionRequest, db: Session = Depends(get_db)):
    """
    Submit answers for a multi-level assessment and return granular level-wise score breakdown.
    """
    raw_answers = [{"question_id": a.question_id, "selected_answer": a.selected_answer} for a in payload.answers]
    result = AIMCQGenerator.evaluate_multilevel_submission(
        db=db,
        assessment_id=payload.assessment_id,
        employee_id=payload.employee_id,
        answers=raw_answers
    )
    return result

# -------------------------------------------------------------
# 10. AI Assistant
# -------------------------------------------------------------
@router.post("/assistant/chat")
def chat_with_assistant(
    payload: AssistantQueryRequest,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    emp_id = employee_id or 1
    return AIAssistantService.process_query(db, emp_id, payload.query)

# -------------------------------------------------------------
# 11. Organizational Workforce Analytics & Forecasts
# -------------------------------------------------------------
@router.get("/analytics/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    return AnalyticsEngine.get_organization_overview(db)

@router.get("/analytics/heatmap")
def get_analytics_heatmap(db: Session = Depends(get_db)):
    return AnalyticsEngine.get_skill_gap_heatmap(db)

@router.get("/analytics/predictions")
def get_future_predictions():
    return AnalyticsEngine.get_future_skill_predictions()

# -------------------------------------------------------------
# 12. Audit Logs & System Notifications
# -------------------------------------------------------------
@router.get("/admin/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(20).all()
    return [
        {
            "id": l.id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": l.details,
            "ip_address": l.ip_address,
            "timestamp": l.timestamp.strftime("%d %b %Y, %H:%M:%S")
        } for l in logs
    ]

@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db)):
    notes = db.query(SystemNotification).order_by(SystemNotification.created_at.desc()).limit(10).all()
    return [
        {
            "id": n.id,
            "category": n.category,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.strftime("%d %b, %H:%M")
        } for n in notes
    ]

# -------------------------------------------------------------
# 13. AI & RAG iGOT Course Recommendation System
# -------------------------------------------------------------
@router.post("/ai/recommend-igot-courses")
def recommend_igot_courses_ai(payload: AICourseRecommendRequest, db: Session = Depends(get_db)):
    """
    AI & RAG Course Recommender for iGOT Karmayogi.
    Takes Current Cadre Role and Target Expected Cadre Role, evaluates
    the competency benchmark delta, and semantically retrieves tailored
    iGOT Karmayogi courses with pedagogical justifications.
    """
    try:
        return AICourseRecommender.recommend_for_roles(
            db=db,
            employee_id=payload.employee_id,
            current_job_role_id=payload.current_job_role_id,
            target_job_role_id=payload.target_job_role_id,
            preferred_provider=payload.provider
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Course Recommender Error: {str(e)}")

@router.post("/courses/enroll")
def enroll_in_course_payload(payload: CourseEnrollRequest, db: Session = Depends(get_db)):
    """
    1-Click Enrollment for recommended iGOT / NSSTA courses using iGOT Karmayogi API.
    """
    course = resolve_course_entity(db, payload.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = db.query(Enrollment).filter(
        Enrollment.employee_id == payload.employee_id,
        Enrollment.course_id == course.id
    ).first()

    clean_url = (course.external_url or f"https://igotkarmayogi.gov.in").replace("igot-karmayogi.gov.in", "igotkarmayogi.gov.in")

    if existing:
        return {
            "status": "ALREADY_ENROLLED",
            "message": f"Officer is already enrolled in '{course.title}'.",
            "enrollment_id": existing.id,
            "external_url": clean_url
        }

    emp = db.query(EmployeeProfile).filter(EmployeeProfile.id == payload.employee_id).first()
    officer_name = emp.name if emp else "MoSPI Officer"
    email = emp.email if emp else ""
    igot_resp = igot_service.enroll_course(payload.employee_id, course.id, course.course_id, officer_name=officer_name, email=email)

    new_enrollment = Enrollment(
        employee_id=payload.employee_id,
        course_id=course.id,
        status="IN_PROGRESS",
        progress_pct=10.0,
        enrolled_at=datetime.datetime.utcnow()
    )
    db.add(new_enrollment)
    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Successfully enrolled in '{course.title}' via iGOT Karmayogi API.",
        "enrollment_id": new_enrollment.id,
        "igot_enrollment_id": igot_resp.get("igot_enrollment_id"),
        "sync_status": igot_resp.get("sync_status"),
        "external_url": clean_url
    }

@router.get("/ai/integration-info")
def get_ai_integration_info():
    """
    Returns the active AI model status and configuration instructions for
    connecting Google Gemini, OpenAI GPT, or Local Ollama.
    """
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    active_provider = "Built-in Grounded Statistical RAG (Offline, Zero-Cost)"
    if gemini_key and gemini_key not in ["development_mode_key", ""]:
        active_provider = "Google Gemini 1.5 Flash (Active)"
    elif openai_key and openai_key.startswith("sk-"):
        active_provider = "OpenAI GPT-4o-mini (Active)"

    return {
        "active_provider": active_provider,
        "supported_providers": [
            {
                "name": "Built-in Grounded Statistical RAG",
                "status": "Active & Ready",
                "description": "Deterministic semantic RAG engine tuned specifically to MoSPI Cadre competencies and iGOT course catalogs. Requires no API keys.",
                "env_var": None
            },
            {
                "name": "Google Gemini (Gemini 1.5 Flash / Pro)",
                "status": "Configured" if gemini_key and gemini_key != "development_mode_key" else "Available",
                "description": "State-of-the-art Google AI reasoning for personalized career pathway planning.",
                "env_var": "GEMINI_API_KEY"
            },
            {
                "name": "OpenAI (GPT-4o / GPT-4o-mini)",
                "status": "Configured" if openai_key else "Available",
                "description": "High-accuracy natural language roadmap synthesis.",
                "env_var": "OPENAI_API_KEY"
            },
            {
                "name": "Local Ollama (Llama 3 / Mistral 7B)",
                "status": "Available",
                "description": "Self-hosted private LLM running on your local server. Zero data leaves your infrastructure.",
                "env_var": "OLLAMA_BASE_URL (Default: http://localhost:11434)"
            }
        ]
    }
