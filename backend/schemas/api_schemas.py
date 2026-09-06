from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "EMPLOYEE" # EMPLOYEE, TRAINER, DEPT_ADMIN, SYSTEM_ADMIN
    # Learner / Official fields
    department_id: Optional[int] = None
    job_role_id: Optional[int] = None
    designation: Optional[str] = "Statistical Officer"
    employee_code: Optional[str] = None
    years_of_experience: Optional[float] = 1.0
    current_assignment: Optional[str] = None
    # Trainer fields
    institution: Optional[str] = None
    training_domain: Optional[str] = None
    # System Admin key
    admin_token: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    full_name: str
    role: str
    employee_id: Optional[int] = None

class QuizAnswerItem(BaseModel):
    question_id: int
    selected_answer: str

class QuizSubmissionRequest(BaseModel):
    assessment_id: int
    answers: List[QuizAnswerItem]

class MCQGenerateRequest(BaseModel):
    material_id: int
    count: int = 5
    difficulty: str = "Medium"
    bloom_level: str = "Understanding"
    competency_name: str = "Sampling & Survey Design"

class QuestionReviewRequest(BaseModel):
    question_id: int
    action: str # APPROVE, REJECT, EDIT
    updated_stem: Optional[str] = None
    updated_correct: Optional[str] = None
    updated_explanation: Optional[str] = None

class AssistantQueryRequest(BaseModel):
    query: str

class SSOSwitchRequest(BaseModel):
    target_username: str
    target_password: str

class TargetPositionUpdateRequest(BaseModel):
    target_job_role_id: int


class SelfAssessmentUpdateRequest(BaseModel):
    competency_id: int
    self_score: float

class AICourseRecommendRequest(BaseModel):
    employee_id: int = 1
    current_job_role_id: int
    target_job_role_id: int
    provider: Optional[str] = None

class CourseEnrollRequest(BaseModel):
    employee_id: int = 1
    course_id: int

class TrainerGuideUploadRequest(BaseModel):
    title: str
    content: str
    file_type: str = "txt"
    course_id: Optional[int] = None
    uploaded_by_user_id: int = 2

class MultiLevelMCQGenerateRequest(BaseModel):
    material_id: Optional[int] = None
    guide_title: Optional[str] = "NSSTA Cadre Statistical Training Guide"
    guide_content: Optional[str] = None
    course_id: Optional[int] = 1
    levels: List[int] = [1, 2, 3] # Level 1 (Foundational), Level 2 (Applied), Level 3 (Advanced)
    count_per_level: int = 4
    assessment_title: Optional[str] = None

class MultiLevelQuizSubmissionRequest(BaseModel):
    assessment_id: int
    employee_id: int = 1
    answers: List[QuizAnswerItem]

