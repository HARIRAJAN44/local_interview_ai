from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from backend.database import get_db
from backend.models import (
    Profile, InterviewSession, InterviewRound, RoundType, InterviewStatus
)

router = APIRouter()


class InterviewConfig(BaseModel):
    target_role: str
    difficulty: str = "medium"
    rounds: List[str] = ["aptitude", "coding", "communication", "hr"]
    aptitude_questions: int = 20
    coding_problems: int = 2
    gd_duration_minutes: int = 10
    hr_duration_minutes: int = 15


class InterviewStartRequest(BaseModel):
    profile_id: int
    job_description_id: Optional[int] = None
    configuration: InterviewConfig


class InterviewSessionResponse(BaseModel):
    id: int
    profile_id: int
    job_description_id: Optional[int]
    status: str
    current_round: Optional[str]
    current_question_index: int
    total_questions: int
    configuration: dict
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    overall_score: Optional[float]

    class Config:
        from_attributes = True


@router.post("/start", response_model=InterviewSessionResponse)
async def start_interview(request: InterviewStartRequest, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == request.profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    session = InterviewSession(
        user_id=1,
        profile_id=request.profile_id,
        job_description_id=request.job_description_id,
        status=InterviewStatus.PROFILE_READY,
        configuration=request.configuration.model_dump(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    rounds = request.configuration.rounds
    for round_name in rounds:
        round_type = RoundType(round_name)
        round_obj = InterviewRound(
            session_id=session.id,
            round_type=round_type,
            status="pending",
            configuration={
                "question_count": request.configuration.aptitude_questions if round_name == "aptitude" else 
                                request.configuration.coding_problems if round_name == "coding" else 1,
                "duration_minutes": request.configuration.gd_duration_minutes if round_name == "communication" else
                                  request.configuration.hr_duration_minutes if round_name == "hr" else 15,
            }
        )
        db.add(round_obj)
    
    db.commit()
    
    return session


@router.get("/{session_id}", response_model=InterviewSessionResponse)
async def get_interview(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session


@router.get("/", response_model=List[InterviewSessionResponse])
async def list_interviews(profile_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(InterviewSession)
    if profile_id:
        query = query.filter(InterviewSession.profile_id == profile_id)
    return query.order_by(InterviewSession.created_at.desc()).all()


@router.post("/{session_id}/pause")
async def pause_interview(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return {"message": "Interview paused", "session_id": session_id}


@router.post("/{session_id}/resume")
async def resume_interview(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return {"message": "Interview resumed", "session_id": session_id}


@router.delete("/{session_id}")
async def delete_interview(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    db.delete(session)
    db.commit()
    return {"message": "Interview session deleted"}