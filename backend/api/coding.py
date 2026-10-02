from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from backend.database import get_db
from backend.models import (
    InterviewSession, InterviewRound, Question, Answer,
    CodingSubmission, RoundType, CodingLanguage
)

router = APIRouter()


class CodingQuestionResponse(BaseModel):
    id: int
    title: str
    description: str
    constraints: List[str]
    examples: List[dict]
    starter_code: str
    visible_test_cases: List[dict]
    difficulty: str
    topics: List[str]
    order_index: int

    class Config:
        from_attributes = True


class CodeRunRequest(BaseModel):
    question_id: int
    language: str
    code: str


class CodeRunResponse(BaseModel):
    submission_id: int
    status: str
    stdout: Optional[str]
    stderr: Optional[str]
    compile_error: Optional[str]
    execution_time_ms: Optional[int]
    memory_used_kb: Optional[int]
    test_results: List[dict]
    passed_tests: int
    total_tests: int


@router.get("/session/{session_id}/questions", response_model=List[CodingQuestionResponse])
async def get_coding_questions(session_id: int, db: Session = Depends(get_db)):
    round_obj = db.query(InterviewRound).filter(
        InterviewRound.session_id == session_id,
        InterviewRound.round_type == RoundType.CODING
    ).first()
    
    if not round_obj:
        raise HTTPException(status_code=404, detail="Coding round not found")
    
    questions = db.query(Question).filter(
        Question.round_id == round_obj.id
    ).order_by(Question.order_index).all()
    
    return [
        CodingQuestionResponse(
            id=q.id,
            title=q.content.get("title", ""),
            description=q.content.get("description", ""),
            constraints=q.content.get("constraints", []),
            examples=q.content.get("examples", []),
            starter_code=q.content.get("starter_code", ""),
            visible_test_cases=q.content.get("visible_test_cases", []),
            difficulty=q.difficulty.value if q.difficulty else "medium",
            topics=q.topics or [],
            order_index=q.order_index,
        )
        for q in questions
    ]


@router.post("/run", response_model=CodeRunResponse)
async def run_code(request: CodeRunRequest, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == request.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    try:
        lang = CodingLanguage(request.language.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {request.language}")
    
    test_cases = question.content.get("visible_test_cases", [])
    hidden_tests = question.correct_answer.get("hidden_test_cases", []) if question.correct_answer else []
    all_tests = test_cases + hidden_tests
    
    passed = 0
    test_results = []
    for i, tc in enumerate(all_tests):
        test_results.append({
            "index": i,
            "input": tc.get("input", ""),
            "expected": tc.get("expected", ""),
            "actual": "N/A",
            "passed": False,
            "execution_time_ms": 0,
            "error": "Local execution not implemented in this minimal version",
        })
    
    submission = CodingSubmission(
        question_id=request.question_id,
        language=lang,
        code=request.code,
        status="partial",
        stdout="",
        stderr="Local execution not implemented",
        compile_error=None,
        execution_time_ms=0,
        memory_used_kb=0,
        test_results=test_results,
        passed_tests=passed,
        total_tests=len(all_tests),
        score=0.0,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    return CodeRunResponse(
        submission_id=submission.id,
        status=submission.status,
        stdout=submission.stdout,
        stderr=submission.stderr,
        compile_error=submission.compile_error,
        execution_time_ms=submission.execution_time_ms,
        memory_used_kb=submission.memory_used_kb,
        test_results=submission.test_results,
        passed_tests=submission.passed_tests,
        total_tests=submission.total_tests,
    )


@router.post("/submit", response_model=CodeRunResponse)
async def submit_code(request: CodeRunRequest, db: Session = Depends(get_db)):
    return await run_code(request, db)


@router.get("/session/{session_id}/results")
async def get_coding_results(session_id: int, db: Session = Depends(get_db)):
    round_obj = db.query(InterviewRound).filter(
        InterviewRound.session_id == session_id,
        InterviewRound.round_type == RoundType.CODING
    ).first()
    
    if not round_obj:
        raise HTTPException(status_code=404, detail="Coding round not found")
    
    questions = db.query(Question).filter(Question.round_id == round_obj.id).all()
    submissions = db.query(CodingSubmission).filter(
        CodingSubmission.question_id.in_([q.id for q in questions])
    ).all()
    
    total_problems = len(questions)
    passed_problems = sum(1 for s in submissions if s.passed_tests == s.total_tests and s.total_tests > 0)
    
    avg_score = sum(s.score or 0 for s in submissions) / len(submissions) if submissions else 0
    
    return {
        "total_problems": total_problems,
        "passed_problems": passed_problems,
        "failed_problems": total_problems - passed_problems,
        "average_score": round(avg_score, 1),
        "submissions": [
            {
                "question_id": s.question_id,
                "language": s.language.value,
                "passed_tests": s.passed_tests,
                "total_tests": s.total_tests,
                "score": s.score,
                "status": s.status,
            }
            for s in submissions
        ],
    }