import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, Response

from backend.core.config import settings
from backend.models.database import engine, Base
from backend.api.routes import router as api_router
from backend.seed_data import seed_database

# Initialize FastAPI app
app = FastAPI(
    title="National Skill Intelligence & Learning Platform",
    description="AI-Enabled Competency Assessment, Skill Gap Analysis & Capacity Building for India's Official Statistical System (MoSPI / NSSTA / iGOT Karmayogi)",
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router)

# Health & Observability Endpoints
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "2.4.0",
        "database": "connected"
    }

@app.get("/readiness")
def readiness_check():
    return {"status": "ready", "traffic_enabled": True}

@app.get("/liveness")
def liveness_check():
    return {"status": "alive"}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)

# Frontend Mount
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/frontend", StaticFiles(directory=frontend_dir), name="frontend")
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

    @app.get("/")
    async def serve_index():
        root_index = os.path.join(os.path.dirname(os.path.dirname(__file__)), "index.html")
        if os.path.exists(root_index):
            return FileResponse(root_index)
        index_file = os.path.join(frontend_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse({"message": "Platform API running. Frontend static directory initializing."})

# Mobile PWA Mount (html=True auto-serves index.html at /mobile/)
mobile_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mobile")
if os.path.exists(mobile_dir):
    app.mount("/mobile", StaticFiles(directory=mobile_dir, html=True), name="mobile")

@app.on_event("startup")
def startup_event():
    # Ensure database tables and initial seed data are populated
    seed_database()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
