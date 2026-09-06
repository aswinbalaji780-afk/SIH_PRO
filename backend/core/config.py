import os
from typing import Dict, Any

class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "AI-Enabled Skill Intelligence & Learning Platform")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "127.0.0.1")

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./skill_intelligence.db")

    JWT_SECRET: str = os.getenv("JWT_SECRET", "mospi-secret-key-capacity-building-2026-production-ready")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

    MOCK_IGOT: bool = os.getenv("MOCK_IGOT", "True").lower() == "true"
    IGOT_API_BASE_URL: str = os.getenv("IGOT_API_BASE_URL", "https://api.igotkarmayogi.gov.in/v1")
    IGOT_CLIENT_ID: str = os.getenv("IGOT_CLIENT_ID", "igot_mock_client_id")
    IGOT_CLIENT_SECRET: str = os.getenv("IGOT_CLIENT_SECRET", "igot_mock_client_secret")
    IGOT_AUTH_URL: str = os.getenv("IGOT_AUTH_URL", "https://auth.igotkarmayogi.gov.in/oauth2/token")

    MOCK_NSSTA: bool = os.getenv("MOCK_NSSTA", "True").lower() == "true"
    NSSTA_API_BASE_URL: str = os.getenv("NSSTA_API_BASE_URL", "https://api.nssta.gov.in/tpac/v1")

    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "grounded_rag_llm")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-1.5-pro")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "development_mode_key")

    STORAGE_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))

    # Skill Gap & Priority Thresholds
    SKILL_GAP_CRITICAL_THRESHOLD: int = 51
    SKILL_GAP_HIGH_THRESHOLD: int = 31
    SKILL_GAP_MEDIUM_THRESHOLD: int = 16
    SKILL_GAP_LOW_THRESHOLD: int = 6

    # Recommendation Weights
    WEIGHT_GAP_RELEVANCE: float = 0.35
    WEIGHT_ROLE_RELEVANCE: float = 0.25
    WEIGHT_PREREQUISITE_FIT: float = 0.15
    WEIGHT_DIFFICULTY_FIT: float = 0.15
    WEIGHT_DEPT_PRIORITY: float = 0.10

settings = Settings()
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
