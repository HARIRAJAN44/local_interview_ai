from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import os
import shutil
from pathlib import Path

from backend.database import get_db
from backend.models import Profile, Resume

router = APIRouter()

UPLOAD_DIR = Path("data/resumes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class ResumeResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    parsed_sections: dict
    extracted_skills: List[str]
    extracted_projects: List[dict]
    extracted_experience: List[dict]
    extracted_education: List[dict]
    extracted_achievements: List[dict]
    extracted_certifications: List[dict]

    class Config:
        from_attributes = True


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    profile_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in [".pdf", ".docx", ".txt"]:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, DOCX, or TXT")
    
    file_path = UPLOAD_DIR / f"{profile_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    resume = Resume(
        profile_id=profile_id,
        filename=file.filename,
        file_path=str(file_path),
        file_type=file_ext[1:],
        original_text="",
        parsed_sections={},
        extracted_skills=[],
        extracted_projects=[],
        extracted_experience=[],
        extracted_education=[],
        extracted_achievements=[],
        extracted_certifications=[],
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.get("/profile/{profile_id}", response_model=List[ResumeResponse])
async def list_resumes(profile_id: int, db: Session = Depends(get_db)):
    return db.query(Resume).filter(Resume.profile_id == profile_id).all()


@router.delete("/{resume_id}")
async def delete_resume(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    if resume.file_path and os.path.exists(resume.file_path):
        os.remove(resume.file_path)
    
    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted"}