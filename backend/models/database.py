from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.core.config import settings

# For SQLite, ensure check_same_thread is False
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_sqlite_migrations():
    if "sqlite" not in settings.DATABASE_URL:
        return
    import sqlite3
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Assessments
        cursor.execute("PRAGMA table_info(assessments)")
        cols = [c[1] for c in cursor.fetchall()]
        if "course_id" not in cols:
            cursor.execute("ALTER TABLE assessments ADD COLUMN course_id INTEGER")
        if "level" not in cols:
            cursor.execute("ALTER TABLE assessments ADD COLUMN level VARCHAR(50) DEFAULT 'Multi-Level'")

        # Questions
        cursor.execute("PRAGMA table_info(questions)")
        q_cols = [c[1] for c in cursor.fetchall()]
        if "level" not in q_cols:
            cursor.execute("ALTER TABLE questions ADD COLUMN level INTEGER DEFAULT 1")
        if "course_id" not in q_cols:
            cursor.execute("ALTER TABLE questions ADD COLUMN course_id INTEGER")
        if "source_note_citation" not in q_cols:
            cursor.execute("ALTER TABLE questions ADD COLUMN source_note_citation VARCHAR(255)")

        # Assessment Attempts
        cursor.execute("PRAGMA table_info(assessment_attempts)")
        att_cols = [c[1] for c in cursor.fetchall()]
        if "level_scores_json" not in att_cols:
            cursor.execute("ALTER TABLE assessment_attempts ADD COLUMN level_scores_json TEXT")

        conn.commit()
        conn.close()
    except Exception:
        pass

run_sqlite_migrations()

