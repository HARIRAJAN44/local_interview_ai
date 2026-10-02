from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from backend.core.config import settings
from backend.database import init_db
from backend.services.ai.service import ai_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("data", exist_ok=True)
    os.makedirs("data/resumes", exist_ok=True)
    os.makedirs("data/audio", exist_ok=True)
    os.makedirs("data/code", exist_ok=True)
    os.makedirs("data/reports", exist_ok=True)
    os.makedirs("data/questions", exist_ok=True)
    os.makedirs("data/sessions", exist_ok=True)
    
    init_db()
    await ai_service.initialize()
    
    yield


app = FastAPI(
    title="AI Mock Interview Studio",
    description="Local-first AI-powered interview preparation platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "AI Mock Interview Studio API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/api/providers")
async def list_providers():
    return {"providers": ai_service.list_providers(), "default": ai_service.get_default_provider().get_provider_name()}


@app.get("/api/models")
async def list_models(provider: str = None):
    models = await ai_service.list_models(provider)
    return {"models": [m.model_dump() for m in models]}


@app.post("/api/health/check")
async def check_provider_health(provider: str = None):
    healthy = await ai_service.health_check(provider)
    return {"healthy": healthy, "provider": provider or ai_service.get_default_provider().get_provider_name()}


from backend.api import profile, resume, job_description, interview, aptitude, coding, communication, hr, reports, settings as settings_api

app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])
app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])
app.include_router(job_description.router, prefix="/api/job-description", tags=["Job Description"])
app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
app.include_router(aptitude.router, prefix="/api/aptitude", tags=["Aptitude"])
app.include_router(coding.router, prefix="/api/coding", tags=["Coding"])
app.include_router(communication.router, prefix="/api/communication", tags=["Communication"])
app.include_router(hr.router, prefix="/api/hr", tags=["HR"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(settings_api.router, prefix="/api/settings", tags=["Settings"])