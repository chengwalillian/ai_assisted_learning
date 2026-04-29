from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class QuizSubmission(BaseModel):
    student_id: int
    topic: str
    question: str
    difficulty: str = "medium"
    student_answer: str
    correct_answer: str
    time_taken_seconds: float = Field(gt=0, le=3600)

class QuizResponse(BaseModel):
    quiz_result_id: int
    is_correct: bool
    ai_feedback: str
    follow_up_question: Optional[str] = None

class GenerateQuestionRequest(BaseModel):
    topic: str
    difficulty: str = Field(..., pattern="^(easy|medium|hard)$")
    previous_questions: Optional[List[str]] = None

class GenerateQuestionResponse(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

class StudentCreate(BaseModel):
    name: str
    email: str

class StudentResponse(BaseModel):
    id: int
    name: str
    email: str
    joined_at: datetime