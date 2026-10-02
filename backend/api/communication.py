from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from backend.database import get_db
from backend.models import (
    InterviewSession, InterviewRound, Question, Answer,
    SpeechTranscript, CommunicationMetrics, RoundType
)

router = APIRouter()


class GDTopicResponse(BaseModel):
    id: int
    topic: str
    description: str
    key_points: List[str]
    time_limit_minutes: int

    class Config:
        from_attributes = True


class GDStartResponse(BaseModel):
    question_id: int
    topic: str
    description: str
    key_points: List[str]
    time_limit_seconds: int


@router.get("/session/{session_id}/topic", response_model=GDStartResponse)
async def get_gd_topic(session_id: int, db: Session = Depends(get_db)):
    round_obj = db.query(InterviewRound).filter(
        InterviewRound.session_id == session_id,
        InterviewRound.round_type == RoundType.COMMUNICATION
    ).first()
    
    if not round_obj:
        raise HTTPException(status_code=404, detail="Communication round not found")
    
    question = db.query(Question).filter(Question.round_id == round_obj.id).first()
    if not question:
        raise HTTPException(status_code=404, detail="GD topic not found")
    
    return GDStartResponse(
        question_id=question.id,
        topic=question.content.get("topic", ""),
        description=question.content.get("description", ""),
        key_points=question.content.get("key_points", []),
        time_limit_seconds=question.time_limit_seconds,
    )


class SpeechTranscriptRequest(BaseModel):
    question_id: int
    transcript: str
    audio_file_path: Optional[str] = None
    duration_seconds: Optional[float] = None
    language: str = "en"
    confidence: Optional[float] = None
    segments: List[dict] = []


@router.post("/transcript")
async def save_transcript(request: SpeechTranscriptRequest, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == request.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    transcript = SpeechTranscript(
        session_id=question.session_id,
        round_id=question.round_id,
        audio_file_path=request.audio_file_path,
        transcript=request.transcript,
        language=request.language,
        duration_seconds=request.duration_seconds,
        confidence=request.confidence,
        segments=request.segments,
    )
    db.add(transcript)
    db.commit()
    
    answer = Answer(
        question_id=request.question_id,
        user_response=request.transcript,
        response_data={"audio_file": request.audio_file_path},
    )
    db.add(answer)
    db.commit()
    
    return {"message": "Transcript saved", "transcript_id": transcript.id}


@router.get("/session/{session_id}/results")
async def get_communication_results(session_id: int, db: Session = Depends(get_db)):
    return {"message": "Communication results - implement with speech processor"}