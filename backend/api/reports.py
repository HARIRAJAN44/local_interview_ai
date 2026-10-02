from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from backend.database import get_db
from backend.models import (
    InterviewSession, InterviewRound, Question, Answer,
    Score, Mistake, Recommendation, Report, RoundType
)

router = APIRouter()


class ReportResponse(BaseModel):
    id: int
    session_id: int
    report_data: dict
    pdf_path: Optional[str]
    json_path: Optional[str]

    class Config:
        from_attributes = True


@router.post("/session/{session_id}/generate")
async def generate_report(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    rounds = db.query(InterviewRound).filter(InterviewRound.session_id == session_id).all()
    
    report_data = {
        "candidate": {
            "name": session.profile.name if session.profile else "Unknown",
            "target_role": session.profile.target_role if session.profile else "Unknown",
            "target_company": session.profile.target_company if session.profile else "Unknown",
            "experience_level": session.profile.experience_level if session.profile else "Unknown",
        },
        "interview_config": session.configuration,
        "overall_score": session.overall_score,
        "rounds": {},
    }
    
    for round_obj in rounds:
        report_data["rounds"][round_obj.round_type.value] = {
            "score": round_obj.score,
            "duration_seconds": round_obj.duration_seconds,
            "status": round_obj.status,
        }
    
    existing_report = db.query(Report).filter(Report.session_id == session_id).first()
    if existing_report:
        existing_report.report_data = report_data
        db.commit()
        db.refresh(existing_report)
        return ReportResponse.from_orm(existing_report)
    
    report = Report(
        session_id=session_id,
        report_data=report_data,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return ReportResponse.from_orm(report)


@router.get("/session/{session_id}", response_model=ReportResponse)
async def get_report(session_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.session_id == session_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportResponse.from_orm(report)


@router.get("/session/{session_id}/summary")
async def get_report_summary(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    rounds = db.query(InterviewRound).filter(InterviewRound.session_id == session_id).all()
    
    round_scores = {}
    for r in rounds:
        if r.score is not None:
            round_scores[r.round_type.value] = r.score
    
    return {
        "session_id": session_id,
        "candidate_name": session.profile.name if session.profile else "Unknown",
        "target_role": session.profile.target_role if session.profile else "Unknown",
        "overall_score": session.overall_score,
        "round_scores": round_scores,
    }