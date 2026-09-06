import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime, Enum, JSON
)
from sqlalchemy.orm import relationship
from backend.models.database import Base

# ==========================================
# 1. Identity, Roles & Organization
# ==========================================

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    employees = relationship("EmployeeProfile", back_populates="department")
    job_roles = relationship("JobRole", back_populates="department")

class JobRole(Base):
    __tablename__ = "job_roles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    department = relationship("Department", back_populates="job_roles")
    role_competencies = relationship("RoleCompetency", back_populates="job_role", cascade="all, delete-orphan")
    employees = relationship("EmployeeProfile", foreign_keys="[EmployeeProfile.job_role_id]", back_populates="job_role")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=False)
    role = Column(String(50), nullable=False, default="EMPLOYEE") # EMPLOYEE, TRAINER, DEPT_ADMIN, SYSTEM_ADMIN
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    employee_profile = relationship("EmployeeProfile", back_populates="user", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("SystemNotification", back_populates="user")

class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    designation = Column(String(150), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    job_role_id = Column(Integer, ForeignKey("job_roles.id"), nullable=False)
    target_job_role_id = Column(Integer, ForeignKey("job_roles.id"), nullable=True)
    years_of_experience = Column(Float, default=1.0)
    current_assignment = Column(String(255), nullable=True)
    reporting_officer = Column(String(150), nullable=True)
    career_aspirations = Column(Text, nullable=True)
    target_skills = Column(Text, nullable=True) # comma separated or JSON string
    overall_competency_score = Column(Float, default=0.0)
    profile_completion_pct = Column(Integer, default=95)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="employee_profile")
    department = relationship("Department", back_populates="employees")
    job_role = relationship("JobRole", foreign_keys=[job_role_id], back_populates="employees")
    target_job_role = relationship("JobRole", foreign_keys=[target_job_role_id])
    educations = relationship("Education", back_populates="employee", cascade="all, delete-orphan")
    experiences = relationship("Experience", back_populates="employee", cascade="all, delete-orphan")
    training_histories = relationship("TrainingHistory", back_populates="employee", cascade="all, delete-orphan")
    competencies = relationship("EmployeeCompetency", back_populates="employee", cascade="all, delete-orphan")
    skill_gaps = relationship("SkillGap", back_populates="employee", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="employee", cascade="all, delete-orphan")
    learning_paths = relationship("LearningPath", back_populates="employee", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="employee", cascade="all, delete-orphan")
    assessment_attempts = relationship("AssessmentAttempt", back_populates="employee", cascade="all, delete-orphan")

class Education(Base):
    __tablename__ = "educations"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employee_profiles.id"), nullable=False)
    degree = Column(String(150), nullable=False)
    specialization = Column(String(150), nullable=False)
    institution = Column(String(200), nullable=False)
    graduation_year = Column(Integer, nullable=False)

    employee = relationship("EmployeeProfile", back_populates="educations")

class Experience(Base):
    __tablename__ = "experiences"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employee_profiles.id"), nullable=False)
    title = Column(String(150), nullable=False)
    organization = Column(String(200), nullable=False)
    duration_months = Column(Integer, default=12)
    description = Column(Text, nullable=True)

    employee = relationship("EmployeeProfile", back_populates="experiences")

class TrainingHistory(Base):
    __tablename__ = "training_histories"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employee_profiles.id"), nullable=False)
    course_name = Column(String(255), nullable=False)
    provider = Column(String(150), nullable=False) # iGOT, NSSTA, etc.
    completion_date = Column(DateTime, nullable=False)
    score_pct = Column(Float, nullable=True)
    certificate_id = Column(String(100), nullable=True)

    employee = relationship("EmployeeProfile", back_populates="training_histories")

# ==========================================
# 2. Competency Framework & Evidence Model
# ==========================================

class CompetencyDomain(Base):
    __tablename__ = "competency_domains"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False) # Statistical, Technical, Digital Governance, Behavioural
    description = Column(Text, nullable=True)
    weight = Column(Float, default=1.0)

    competencies = relationship("Competency", back_populates="domain")

class Competency(Base):
    __tablename__ = "competencies"
    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("competency_domains.id"), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    domain = relationship("CompetencyDomain", back_populates="competencies")
    levels = relationship("CompetencyLevel", back_populates="competency", cascade="all, delete-orphan")
    role_competencies = relationship("RoleCompetency", back_populates="competency")
    employee_competencies = relationship("EmployeeCompetency", back_populates="competency")
    course_competencies = relationship("CourseCompetency", back_populates="competency")
    skill_gaps = relationship("SkillGap", back_populates="competency")

class CompetencyLevel(Base):
    __tablename__ = "competency_levels"
    id = Column(Integer, primary_key=True, index=True)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False)
    level = Column(Integer, nullable=False) # 1 to 5
    title = Column(String(100), nullable=False) # Level 1 — Awareness ... Level 5 — Expert
    benchmark_score = Column(Float, default=20.0) # Score mapping (e.g. 20, 40, 60, 80, 100)
    behavioral_indicators = Column(Text, nullable=True)
    assessment_criteria = Column(Text, nullable=True)

    competency = relationship("Competency", back_populates="levels")

class RoleCompetency(Base):
    __tablename__ = "role_competencies"
    id = Column(Integer, primary_key=True, index=True)
    job_role_id = Column(Integer, ForeignKey("job_roles.id"), nullable=False)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False)
    required_level = Column(Integer, nullable=False, default=3)
    required_score = Column(Float, nullable=False, default=60.0)
    priority_weight = Column(Float, default=1.0) # High, Critical, etc.

    job_role = relationship("JobRole", back_populates="role_competencies")
    competency = relationship("Competency", back_populates="role_competencies")

class EmployeeCompetency(Base):
    __tablename__ = "employee_competencies"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employee_profiles.id"), nullable=False)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False)
    current_score = Column(Float, nullable=False, default=0.0) # 0 to 100
    current_level = Column(Integer, nullable=False, default=1) # 1 to 5
    confidence_score = Column(Float, nullable=False, default=50.0) # 0 to 100%
    is_self_assessed = Column(Boolean, default=False)
    last_assessed_at = Column(DateTime, default=datetime.datetime.utcnow)

    employee = relationship("EmployeeProfile", back_populates="competencies")
    competency = relationship("Competency", back_populates="employee_competencies")
    evidence_records = relationship("CompetencyEvidence", back_populates="employee_competency", cascade="all, delete-orphan")
    history = relationship("CompetencyHistory", back_populates="employee_competency", cascade="all, delete-orphan")

class CompetencyEvidence(Base):
    __tablename__ = "competency_evidences"
    id = Column(Integer, primary_key=True, index=True)
    employee_competency_id = Column(Integer, ForeignKey("employee_competencies.id"), nullable=False)
    evidence_type = Column(String(50), nullable=False) # ASSESSMENT_QUIZ, COURSE_COMPLETION, WORK_EXPERIENCE, SELF_ASSESSMENT
    score_value = Column(Float, nullable=True)
    description = Column(Text, nullable=False)
    source_reference = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    employee_competency = relationship("EmployeeCompetency", back_populates="evidence_records")

class CompetencyHistory(Base):
    __tablename__ = "competency_histories"
    id = Column(Integer, primary_key=True, index=True)
    employee_competency_id = Column(Integer, ForeignKey("employee_competencies.id"), nullable=False)
    old_score = Column(Float, nullable=False)
    new_score = Column(Float, nullable=False)
    old_level = Column(Integer, nullable=False)
    new_level = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False)
    confidence = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

    employee_competency = relationship("EmployeeCompetency", back_populates="history")

# ==========================================
# 3. Learning Catalog (iGOT & NSSTA)
# ==========================================

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. IGOT-PY-101
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    provider = Column(String(100), nullable=False) # iGOT Karmayogi, NSSTA TPAC, etc.
    source = Column(String(50), nullable=False) # iGOT, NSSTA, MoSPI Academy
    category = Column(String(100), nullable=False)
    skill_level = Column(String(50), default="Intermediate") # Beginner, Intermediate, Advanced
    duration_hours = Column(Float, default=10.0)
    language = Column(String(50), default="English")
    format = Column(String(50), default="Self-Paced Online")
    rating = Column(Float, default=4.8)
    external_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    competency_mappings = relationship("CourseCompetency", back_populates="course", cascade="all, delete-orphan")
    prerequisites = relationship("CoursePrerequisite", foreign_keys="CoursePrerequisite.course_id", back_populates="course")
    enrollments = relationship("Enrollment", back_populates="course")
    recommendations = relationship("Recommendation", back_populates="course")

class CourseCompetency(Base):
    __tablename__ = "course_competencies"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False)
    target_level = Column(Integer, default=3)
    target_score_gain = Column(Float, default=25.0)

    course = relationship("Course", back_populates="competency_mappings")
    competency = relationship("Competency", back_populates="course_competencies")

class CoursePrerequisite(Base):
    __tablename__ = "course_prerequisites"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    prerequisite_course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    is_mandatory = Column(Boolean, default=True)

    course = relationship("Course", foreign_keys=[course_id], back_populates="prerequisites")

class TrainingProgramme(Base):
    __tablename__ = "training_programmes"
    id = Column(Integer, primary_key=True, index=True)
    programme_id = Column(String(100), unique=True, index=True, nullable=False) # NSSTA-TPAC-2026-01
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    training_domain = Column(String(100), nullable=False)
    target_roles = Column(String(255), nullable=True)
    level = Column(String(50), default="Advanced")
    duration_days = Column(Integer, default=5)
    mode = Column(String(50), default="Residential / In-Person")
    eligibility = Column(Text, nullable=True)
    recommended_by = Column(String(100), default="NSSTA TPAC")
    schedule = Column(String(100), default="Next Batch: October 2026")
    source = Column(String(50), default="NSSTA TPAC")

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employee_profiles.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    status = Column(String(50), default="IN_PROGRESS") # ENROLLED, IN_PROGRESS, COMPLETED
    progress_pct = Column(Integer, default=0)
    enrolled_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    final_score = Column(Float, nullable=True)
    certificate_url = Column(String(255), nullable=True)

    employee = relationship("EmployeeProfile", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

# ==========================================
# 4. Skill Gaps, Recommendations & Pathways
# ==========================================

class SkillGap(Base):
    __tablename__ = "skill_gaps"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employee_profiles.id"), nullable=False)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False)
    required_score = Column(Float, nullable=False)
    current_score = Column(Float, nullable=False)
    gap_score = Column(Float, nullable=False) # required - current
    priority = Column(String(50), default="MEDIUM") # NO_GAP, LOW, MEDIUM, HIGH, CRITICAL
    target_deadline = Column(String(50), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    employee = relationship("EmployeeProfile", back_populates="skill_gaps")
    competency = relationship("Competency", back_populates="skill_gaps")

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employee_profiles.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    recommendation_score = Column(Float, nullable=False) # 0 to 100
    priority = Column(String(50), default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW
    why_recommended = Column(Text, nullable=False)
    gap_match_score = Column(Float, default=90.0)
    role_match_score = Column(Float, default=95.0)
    career_match_score = Column(Float, default=85.0)
    prerequisite_match_score = Column(Float, default=100.0)
    status = Column(String(50), default="ACTIVE") # ACTIVE, ENROLLED, DISMISSED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    employee = relationship("EmployeeProfile", back_populates="recommendations")
    course = relationship("Course", back_populates="recommendations")

class LearningPath(Base):
    __tablename__ = "learning_paths"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employee_profiles.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    starting_competency_level = Column(String(100), nullable=False)
    target_competency_level = Column(String(100), nullable=False)
    estimated_duration_weeks = Column(Integer, default=6)
    completion_percentage = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    employee = relationship("EmployeeProfile", back_populates="learning_paths")
    items = relationship("LearningPathItem", back_populates="learning_path", cascade="all, delete-orphan", order_by="LearningPathItem.sequence_order")

class LearningPathItem(Base):
    __tablename__ = "learning_path_items"
    id = Column(Integer, primary_key=True, index=True)
    learning_path_id = Column(Integer, ForeignKey("learning_paths.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    sequence_order = Column(Integer, nullable=False)
    step_title = Column(String(255), nullable=False)
    status = Column(String(50), default="LOCKED") # COMPLETED, CURRENT, LOCKED
    competency_gain_expected = Column(String(150), nullable=True)

    learning_path = relationship("LearningPath", back_populates="items")
    course = relationship("Course")

# ==========================================
# 5. Assessment, Quiz & RAG Pipeline
# ==========================================

class LearningMaterial(Base):
    __tablename__ = "learning_materials"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # pdf, docx, pptx, txt
    file_size_bytes = Column(Integer, nullable=False)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="READY") # UPLOADING, PROCESSING, EXTRACTING, VECTORIZING, READY, FAILED
    extracted_text_preview = Column(Text, nullable=True)
    total_pages = Column(Integer, default=1)
    error_message = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    chunks = relationship("MaterialChunk", back_populates="material", cascade="all, delete-orphan")

class MaterialChunk(Base):
    __tablename__ = "material_chunks"
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("learning_materials.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, default=1)
    chunk_text = Column(Text, nullable=False)
    embedding_json = Column(Text, nullable=True) # Vector representation serialized as JSON

    material = relationship("LearningMaterial", back_populates="chunks")

class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    level = Column(String(50), default="Multi-Level") # Level 1, Level 2, Level 3, Multi-Level
    target_level = Column(Integer, default=3)
    duration_minutes = Column(Integer, default=20)
    passing_score = Column(Float, default=70.0)
    is_adaptive = Column(Boolean, default=True)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    competency = relationship("Competency")
    course = relationship("Course")
    questions = relationship("Question", back_populates="assessment", cascade="all, delete-orphan")
    attempts = relationship("AssessmentAttempt", back_populates="assessment", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=True)
    learning_material_id = Column(Integer, ForeignKey("learning_materials.id"), nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    question_type = Column(String(50), default="SINGLE_CHOICE") # SINGLE_CHOICE, MULTI_CHOICE
    level = Column(Integer, default=1) # 1: Foundational, 2: Applied, 3: Advanced
    stem = Column(Text, nullable=False)
    options_json = Column(Text, nullable=False) # JSON array of options: [{"key": "A", "text": "..."}, ...]
    correct_answer = Column(String(50), nullable=False) # "A", "B", etc.
    explanation = Column(Text, nullable=False)
    difficulty = Column(String(50), default="Medium") # Easy, Medium, Hard
    bloom_level = Column(String(50), default="Understanding") # Recall, Understanding, Application, Analysis
    competency_name = Column(String(100), nullable=False)
    source_reference = Column(String(255), nullable=False) # e.g. "Sampling Methodology Doc - Page 14"
    source_note_citation = Column(String(255), nullable=True) # e.g. "NSSTA Trainer Guide Sec. 3.2 • Course Notes Summary"
    status = Column(String(50), default="APPROVED") # DRAFT_PENDING_REVIEW, APPROVED, REJECTED
    confidence_score = Column(Float, default=95.0)

    assessment = relationship("Assessment", back_populates="questions")
    course = relationship("Course")

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employee_profiles.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    score_percentage = Column(Float, default=0.0)
    level_scores_json = Column(Text, nullable=True) # JSON: {"level_1": 100.0, "level_2": 75.0, "level_3": 50.0}
    passed = Column(Boolean, default=False)
    previous_level = Column(Integer, default=1)
    updated_level = Column(Integer, default=1)
    status = Column(String(50), default="COMPLETED") # IN_PROGRESS, COMPLETED

    assessment = relationship("Assessment", back_populates="attempts")
    employee = relationship("EmployeeProfile", back_populates="assessment_attempts")
    answers = relationship("AssessmentAnswer", back_populates="attempt", cascade="all, delete-orphan")
    feedback = relationship("AssessmentFeedback", back_populates="attempt", uselist=False, cascade="all, delete-orphan")

class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"
    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("assessment_attempts.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_answer = Column(String(50), nullable=False)
    is_correct = Column(Boolean, nullable=False)

    attempt = relationship("AssessmentAttempt", back_populates="answers")
    question = relationship("Question")

class AssessmentFeedback(Base):
    __tablename__ = "assessment_feedbacks"
    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("assessment_attempts.id"), nullable=False)
    strengths = Column(Text, nullable=False)
    weaknesses = Column(Text, nullable=False)
    actionable_recommendations = Column(Text, nullable=False)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)

    attempt = relationship("AssessmentAttempt", back_populates="feedback")

# ==========================================
# 6. Governance, Audit & Notifications
# ==========================================

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False) # LOGIN, ASSESSMENT_SUBMISSION, COMPETENCY_UPDATE, QUESTION_APPROVAL
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")

class SystemNotification(Base):
    __tablename__ = "system_notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(50), default="RECOMMENDATION") # TRAINING, ASSESSMENT, SKILL_GAP, SYSTEM
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")
