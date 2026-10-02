from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Boolean,
    Float, JSON, Enum as SQLEnum, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum as PyEnum
from backend.database import Base


class UserRole(str, PyEnum):
    USER = "user"
    ADMIN = "admin"


class InterviewStatus(str, PyEnum):
    IDLE = "idle"
    PROFILE_READY = "profile_ready"
    APTITUDE = "aptitude"
    CODING = "coding"
    COMMUNICATION = "communication"
    HR = "hr"
    EVALUATION = "evaluation"
    REPORT = "report"
    COMPLETED = "completed"


class RoundType(str, PyEnum):
    APTITUDE = "aptitude"
    CODING = "coding"
    COMMUNICATION = "communication"
    HR = "hr"


class QuestionType(str, PyEnum):
    APTITUDE = "aptitude"
    CODING = "coding"
    GD_TOPIC = "gd_topic"
    HR = "hr"
    BEHAVIORAL = "behavioral"
    TECHNICAL = "technical"


class Difficulty(str, PyEnum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class CodingLanguage(str, PyEnum):
    PYTHON = "python"
    C = "c"
    CPP = "cpp"
    JAVA = "java"


class AIProvider(str, PyEnum):
    OLLAMA = "ollama"
    OPENROUTER = "openrouter"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(SQLEnum(UserRole), default=UserRole.USER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    profiles = relationship("Profile", back_populates="user", cascade="all, delete-orphan")
    interview_sessions = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    college = Column(String(255))
    degree = Column(String(255))
    branch = Column(String(255))
    graduation_year = Column(Integer)
    programming_languages = Column(JSON, default=list)
    frameworks = Column(JSON, default=list)
    databases = Column(JSON, default=list)
    projects = Column(JSON, default=list)
    skills = Column(JSON, default=list)
    experience = Column(Text)
    achievements = Column(Text)
    target_role = Column(String(255))
    target_company = Column(String(255))
    experience_level = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="profiles")
    resumes = relationship("Resume", back_populates="profile", cascade="all, delete-orphan")
    interview_sessions = relationship("InterviewSession", back_populates="profile")


class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    filename = Column(String(255))
    file_path = Column(String(512))
    file_type = Column(String(50))
    original_text = Column(Text)
    parsed_sections = Column(JSON, default=dict)
    extracted_skills = Column(JSON, default=list)
    extracted_projects = Column(JSON, default=list)
    extracted_experience = Column(JSON, default=list)
    extracted_education = Column(JSON, default=list)
    extracted_achievements = Column(JSON, default=list)
    extracted_certifications = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    profile = relationship("Profile", back_populates="resumes")


class JobDescription(Base):
    __tablename__ = "job_descriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=True)
    title = Column(String(255))
    company = Column(String(255))
    raw_text = Column(Text)
    required_skills = Column(JSON, default=list)
    preferred_skills = Column(JSON, default=list)
    responsibilities = Column(JSON, default=list)
    experience_required = Column(String(100))
    technical_topics = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    profile = relationship("Profile")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    job_description_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=True)
    status = Column(SQLEnum(InterviewStatus), default=InterviewStatus.IDLE)
    current_round = Column(SQLEnum(RoundType), nullable=True)
    current_question_index = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    configuration = Column(JSON, default=dict)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    total_duration_seconds = Column(Integer, default=0)
    overall_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="interview_sessions")
    profile = relationship("Profile", back_populates="interview_sessions")
    job_description = relationship("JobDescription")


class InterviewRound(Base):
    __tablename__ = "interview_rounds"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    round_type = Column(SQLEnum(RoundType), nullable=False)
    status = Column(String(50), default="pending")
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, default=0)
    configuration = Column(JSON, default=dict)
    score = Column(Float, nullable=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    round_id = Column(Integer, ForeignKey("interview_rounds.id"), nullable=False)
    question_type = Column(SQLEnum(QuestionType), nullable=False)
    difficulty = Column(SQLEnum(Difficulty), default=Difficulty.MEDIUM)
    content = Column(JSON, nullable=False)
    correct_answer = Column(JSON, nullable=True)
    explanation = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    topics = Column(JSON, default=list)
    time_limit_seconds = Column(Integer, default=60)
    order_index = Column(Integer, default=0)
    is_hidden = Column(Boolean, default=False)
    generated_by = Column(String(50), default="local_llm")
    generation_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    hr_questions = relationship("HRQuestion", back_populates="question", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    user_response = Column(Text, nullable=True)
    response_data = Column(JSON, default=dict)
    started_at = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, default=0)
    is_correct = Column(Boolean, nullable=True)
    score = Column(Float, nullable=True)
    evaluation = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AptitudeAttempt(Base):
    __tablename__ = "aptitude_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_option = Column(String(10), nullable=True)
    is_correct = Column(Boolean, nullable=True)
    time_taken_seconds = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CodingSubmission(Base):
    __tablename__ = "coding_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    language = Column(SQLEnum(CodingLanguage), nullable=False)
    code = Column(Text, nullable=False)
    status = Column(String(50), default="pending")
    stdout = Column(Text, nullable=True)
    stderr = Column(Text, nullable=True)
    compile_error = Column(Text, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)
    memory_used_kb = Column(Integer, nullable=True)
    test_results = Column(JSON, default=list)
    passed_tests = Column(Integer, default=0)
    total_tests = Column(Integer, default=0)
    score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SpeechTranscript(Base):
    __tablename__ = "speech_transcripts"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    round_id = Column(Integer, ForeignKey("interview_rounds.id"), nullable=True)
    audio_file_path = Column(String(512), nullable=True)
    transcript = Column(Text, nullable=True)
    language = Column(String(10), default="en")
    duration_seconds = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    segments = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CommunicationMetrics(Base):
    __tablename__ = "communication_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    round_id = Column(Integer, ForeignKey("interview_rounds.id"), nullable=True)
    transcript_id = Column(Integer, ForeignKey("speech_transcripts.id"), nullable=True)
    content_score = Column(Float, nullable=True)
    clarity_score = Column(Float, nullable=True)
    fluency_score = Column(Float, nullable=True)
    vocabulary_score = Column(Float, nullable=True)
    structure_score = Column(Float, nullable=True)
    relevance_score = Column(Float, nullable=True)
    filler_word_count = Column(Integer, default=0)
    filler_words = Column(JSON, default=list)
    words_per_minute = Column(Float, nullable=True)
    pause_count = Column(Integer, default=0)
    average_pause_duration = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class HRQuestion(Base):
    __tablename__ = "hr_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    question_category = Column(String(50), nullable=True)
    follow_up_to = Column(Integer, ForeignKey("hr_questions.id"), nullable=True)
    expected_concepts = Column(JSON, default=list)
    evaluation_criteria = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    question = relationship("Question", back_populates="hr_questions")
    follow_ups = relationship("HRQuestion", backref="parent_question", remote_side=[id])


class HRAnswer(Base):
    __tablename__ = "hr_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    hr_question_id = Column(Integer, ForeignKey("hr_questions.id"), nullable=False)
    answer_id = Column(Integer, ForeignKey("answers.id"), nullable=False)
    relevance_score = Column(Float, nullable=True)
    technical_depth_score = Column(Float, nullable=True)
    completeness_score = Column(Float, nullable=True)
    structure_score = Column(Float, nullable=True)
    has_situation = Column(Boolean, default=False)
    has_task = Column(Boolean, default=False)
    has_action = Column(Boolean, default=False)
    has_result = Column(Boolean, default=False)
    detected_topics = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Mistake(Base):
    __tablename__ = "mistakes"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    round_type = Column(SQLEnum(RoundType), nullable=False)
    category = Column(String(100), nullable=True)
    question_text = Column(Text, nullable=True)
    user_answer = Column(Text, nullable=True)
    problem = Column(Text, nullable=True)
    severity = Column(String(20), default="medium")
    expected_concept = Column(Text, nullable=True)
    improvement = Column(Text, nullable=True)
    example_better_answer = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    category = Column(String(100), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Integer, default=1)
    resources = Column(JSON, default=list)
    practice_questions = Column(JSON, default=list)
    estimated_days = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Score(Base):
    __tablename__ = "scores"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    round_type = Column(SQLEnum(RoundType), nullable=False)
    category = Column(String(100), nullable=True)
    score = Column(Float, nullable=False)
    max_score = Column(Float, default=100.0)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    report_data = Column(JSON, nullable=False)
    pdf_path = Column(String(512), nullable=True)
    json_path = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())