from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from backend.database import get_db
from backend.models import InterviewSession, InterviewRound, Question, Answer, AptitudeAttempt, RoundType

router = APIRouter()


class AptitudeQuestionResponse(BaseModel):
    id: int
    question: str
    options: List[str]
    category: str
    difficulty: str
    time_limit: int
    order_index: int

    class Config:
        from_attributes = True


class AptitudeAnswerRequest(BaseModel):
    question_id: int
    selected_option: str
    notes: Optional[str] = None


class AptitudeAnswerResponse(BaseModel):
    id: int
    question_id: int
    selected_option: str
    is_correct: bool
    time_taken_seconds: int
    notes: Optional[str]

    class Config:
        from_attributes = True


@router.get("/session/{session_id}/questions", response_model=List[AptitudeQuestionResponse])
async def get_aptitude_questions(session_id: int, db: Session = Depends(get_db)):
    round_obj = db.query(InterviewRound).filter(
        InterviewRound.session_id == session_id,
        InterviewRound.round_type == RoundType.APTITUDE
    ).first()
    
    if not round_obj:
        raise HTTPException(status_code=404, detail="Aptitude round not found")
    
    questions = db.query(Question).filter(
        Question.round_id == round_obj.id
    ).order_by(Question.order_index).all()
    
    return [
        AptitudeQuestionResponse(
            id=q.id,
            question=q.content.get("question", ""),
            options=q.content.get("options", []),
            category=q.category or "",
            difficulty=q.difficulty.value if q.difficulty else "medium",
            time_limit=q.time_limit_seconds,
            order_index=q.order_index,
        )
        for q in questions
    ]


@router.post("/answer", response_model=AptitudeAnswerResponse)
async def submit_aptitude_answer(request: AptitudeAnswerRequest, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == request.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    correct_answer = question.correct_answer.get("answer") if question.correct_answer else None
    is_correct = correct_answer and request.selected_option.upper() == correct_answer.upper()
    
    attempt = AptitudeAttempt(
        question_id=request.question_id,
        selected_option=request.selected_option.upper(),
        is_correct=is_correct,
        time_taken_seconds=0,
        notes=request.notes,
    )
    db.add(attempt)
    
    answer = Answer(
        question_id=request.question_id,
        user_response=request.selected_option,
        response_data={"notes": request.notes},
        is_correct=is_correct,
        score=1.0 if is_correct else 0.0,
    )
    db.add(answer)
    
    db.commit()
    db.refresh(attempt)
    
    return AptitudeAnswerResponse(
        id=attempt.id,
        question_id=attempt.question_id,
        selected_option=attempt.selected_option,
        is_correct=attempt.is_correct or False,
        time_taken_seconds=attempt.time_taken_seconds,
        notes=attempt.notes,
    )


@router.get("/session/{session_id}/results")
async def get_aptitude_results(session_id: int, db: Session = Depends(get_db)):
    round_obj = db.query(InterviewRound).filter(
        InterviewRound.session_id == session_id,
        InterviewRound.round_type == RoundType.APTITUDE
    ).first()
    
    if not round_obj:
        raise HTTPException(status_code=404, detail="Aptitude round not found")
    
    questions = db.query(Question).filter(Question.round_id == round_obj.id).all()
    attempts = db.query(AptitudeAttempt).filter(
        AptitudeAttempt.question_id.in_([q.id for q in questions])
    ).all()
    
    total = len(questions)
    correct = sum(1 for a in attempts if a.is_correct)
    wrong = total - correct
    
    category_stats = {}
    for q in questions:
        cat = q.category or "Unknown"
        if cat not in category_stats:
            category_stats[cat] = {"total": 0, "correct": 0}
        category_stats[cat]["total"] += 1
        attempt = next((a for a in attempts if a.question_id == q.id), None)
        if attempt and attempt.is_correct:
            category_stats[cat]["correct"] += 1
    
    category_percentages = {
        cat: round((stats["correct"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0
        for cat, stats in category_stats.items()
    }
    
    return {
        "total_questions": total,
        "correct": correct,
        "wrong": wrong,
        "score": round((correct / total) * 100, 1) if total > 0 else 0,
        "category_breakdown": category_percentages,
    }