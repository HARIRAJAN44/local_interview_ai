from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from backend.database import get_db
from backend.models import Profile, JobDescription

router = APIRouter()


class JobDescriptionCreate(BaseModel):
    profile_id: Optional[int] = None
    title: Optional[str] = None
    company: Optional[str] = None
    raw_text: str


class JobDescriptionResponse(BaseModel):
    id: int
    profile_id: Optional[int]
    title: Optional[str]
    company: Optional[str]
    required_skills: List[str]
    preferred_skills: List[str]
    responsibilities: List[str]
    experience_required: Optional[str]
    technical_topics: List[str]

    class Config:
        from_attributes = True


@router.post("/", response_model=JobDescriptionResponse)
async def create_job_description(jd_data: JobDescriptionCreate, db: Session = Depends(get_db)):
    if jd_data.profile_id:
        profile = db.query(Profile).filter(Profile.id == jd_data.profile_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
    
    jd = JobDescription(
        profile_id=jd_data.profile_id,
        title=jd_data.title,
        company=jd_data.company,
        raw_text=jd_data.raw_text,
        required_skills=[],
        preferred_skills=[],
        responsibilities=[],
        experience_required="",
        technical_topics=[],
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)
    return jd


@router.get("/{jd_id}", response_model=JobDescriptionResponse)
async def get_job_description(jd_id: int, db: Session = Depends(get_db)):
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
    return jd


@router.get("/profile/{profile_id}", response_model=List[JobDescriptionResponse])
async def list_job_descriptions(profile_id: int, db: Session = Depends(get_db)):
    return db.query(JobDescription).filter(JobDescription.profile_id == profile_id).all()


@router.delete("/{jd_id}")
async def delete_job_description(jd_id: int, db: Session = Depends(get_db)):
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
    db.delete(jd)
    db.commit()
    return {"message": "Job description deleted"}