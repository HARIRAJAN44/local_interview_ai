from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from backend.database import get_db
from backend.models import User, Profile
from backend.core.config import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()


class ProfileCreate(BaseModel):
    name: str
    college: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    programming_languages: List[str] = []
    frameworks: List[str] = []
    databases: List[str] = []
    projects: List[dict] = []
    skills: List[str] = []
    experience: Optional[str] = None
    achievements: Optional[str] = None
    target_role: Optional[str] = None
    target_company: Optional[str] = None
    experience_level: Optional[str] = None


class ProfileResponse(BaseModel):
    id: int
    name: str
    college: Optional[str]
    degree: Optional[str]
    branch: Optional[str]
    graduation_year: Optional[int]
    programming_languages: List[str]
    frameworks: List[str]
    databases: List[str]
    projects: List[dict]
    skills: List[str]
    experience: Optional[str]
    achievements: Optional[str]
    target_role: Optional[str]
    target_company: Optional[str]
    experience_level: Optional[str]

    class Config:
        from_attributes = True


class ProfileUpdate(ProfileCreate):
    pass


@router.post("/", response_model=ProfileResponse)
async def create_profile(profile_data: ProfileCreate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        user = User(email="user@local", hashed_password=pwd_context.hash("localpassword"))
        db.add(user)
        db.commit()
        db.refresh(user)
    
    profile = Profile(user_id=user.id, **profile_data.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/", response_model=List[ProfileResponse])
async def list_profiles(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        return []
    return db.query(Profile).filter(Profile.user_id == user.id).all()


@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/{profile_id}", response_model=ProfileResponse)
async def update_profile(profile_id: int, profile_data: ProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    for key, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/{profile_id}")
async def delete_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    db.delete(profile)
    db.commit()
    return {"message": "Profile deleted"}