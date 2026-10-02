from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from backend.database import get_db
from backend.models import (
    InterviewSession, InterviewRound, Question, Answer,
    HRQuestion, HRAnswer, RoundType, QuestionType
)

router = APIRouter()


class HRQuestionResponse(BaseModel):
    id: int
    question: str
    category: str
    expected_concepts: List[str]
    order_index: int

    class Config:
        from_attributes = True


class HRAnswerRequest(BaseModel):
    question_id: int
    answer: str


class HRAnswerResponse(BaseModel):
    id: int
    question_id: int
    answer: str
    relevance_score: Optional[float]
    technical_depth_score: Optional[float]
    completeness_score: Optional[float]
    structure_score: Optional[float]
    has_situation: bool
    has_task: bool
    has_action: bool
    has_result: bool
    detected_topics: List[str]

    class Config:
        from_attributes = True


class HRNextQuestionRequest(BaseModel):
    session_id: int
    previous_question_id: Optional[int] = None
    previous_answer: Optional[str] = None


@router.get("/session/{session_id}/questions", response_model=List[HRQuestionResponse])
async def get_hr_questions(session_id: int, db: Session = Depends(get_db)):
    round_obj = db.query(InterviewRound).filter(
        InterviewRound.session_id == session_id,
        InterviewRound.round_type == RoundType.HR
    ).first()
    
    if not round_obj:
        raise HTTPException(status_code=404, detail="HR round not found")
    
    questions = db.query(Question).filter(
        Question.round_id == round_obj.id
    ).order_by(Question.order_index).all()
    
    result = []
    for q in questions:
        hr_q = db.query(HRQuestion).filter(HRQuestion.question_id == q.id).first()
        result.append(HRQuestionResponse(
            id=q.id,
            question=q.content.get("question", ""),
            category=q.category or "hr",
            expected_concepts=hr_q.expected_concepts if hr_q else [],
            order_index=q.order_index,
        ))
    
    return result


@router.post("/session/{session_id}/start")
async def start_hr_interview(session_id: int, db: Session = Depends(get_db)):
    round_obj = db.query(InterviewRound).filter(
        InterviewRound.session_id == session_id,
        InterviewRound.round_type == RoundType.HR
    ).first()
    
    if not round_obj:
        raise HTTPException(status_code=404, detail="HR round not found")
    
    round_obj.status = "in_progress"
    db.commit()
    
    first_question = db.query(Question).filter(
        Question.round_id == round_obj.id
    ).order_by(Question.order_index).first()
    
    if not first_question:
        raise HTTPException(status_code=404, detail="No HR questions found")
    
    return {
        "question_id": first_question.id,
        "question": first_question.content.get("question", ""),
        "category": first_question.category,
    }


@router.post("/answer", response_model=HRAnswerResponse)
async def submit_hr_answer(request: HRAnswerRequest, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == request.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    hr_question = db.query(HRQuestion).filter(HRQuestion.question_id == question.id).first()
    
    answer = Answer(
        question_id=request.question_id,
        user_response=request.answer,
    )
    db.add(answer)
    db.flush()
    
    hr_answer = HRAnswer(
        hr_question_id=hr_question.id if hr_question else 0,
        answer_id=answer.id,
        relevance_score=50.0,
        technical_depth_score=50.0,
        completeness_score=50.0,
        structure_score=50.0,
        has_situation=False,
        has_task=False,
        has_action=False,
        has_result=False,
        detected_topics=[],
    )
    db.add(hr_answer)
    db.commit()
    db.refresh(hr_answer)
    
    return HRAnswerResponse(
        id=hr_answer.id,
        question_id=hr_answer.hr_question_id,
        answer=request.answer,
        relevance_score=hr_answer.relevance_score,
        technical_depth_score=hr_answer.technical_depth_score,
        completeness_score=hr_answer.completeness_score,
        structure_score=hr_answer.structure_score,
        has_situation=hr_answer.has_situation,
        has_task=hr_answer.has_task,
        has_action=hr_answer.has_action,
        has_result=hr_answer.has_result,
        detected_topics=hr_answer.detected_topics,
    )


@router.post("/next-question")
async def get_next_hr_question(request: HRNextQuestionRequest, db: Session = Depends(get_db)):
    round_obj = db.query(InterviewRound).filter(
        InterviewRound.session_id == request.session_id,
        InterviewRound.round_type == RoundType.HR
    ).first()
    
    if not round_obj:
        raise HTTPException(status_code=404, detail="HR round not found")
    
    if request.previous_question_id:
        prev_question = db.query(Question).filter(Question.id == request.previous_question_id).first()
        if prev_question:
            next_q = db.query(Question).filter(
                Question.round_id == round_obj.id,
                Question.order_index > prev_question.order_index
            ).order_by(Question.order_index).first()
            
            if next_q:
                return {
                    "question_id": next_q.id,
                    "question": next_q.content.get("question", ""),
                    "category": next_q.category,
                }
    
    first_question = db.query(Question).filter(
        Question.round_id == round_obj.id
    ).order_by(Question.order_index).first()
    
    if first_question:
        return {
            "question_id": first_question.id,
            "question": first_question.content.get("question", ""),
            "category": first_question.category,
        }
    
    return {"message": "No more questions"}


@router.get("/session/{session_id}/results")
async def get_hr_results(session_id: int, db: Session = Depends(get_db)):
    return {"message": "HR results - implement with HR interviewer"}