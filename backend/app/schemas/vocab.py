from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class DailyWordResponse(BaseModel):
    word: str
    meaning: str
    pronunciation: Optional[str] = None
    synonyms: List[str]
    antonyms: List[str]
    examples: List[str]

class SavedWordCreate(BaseModel):
    word: str
    meaning: str
    pronunciation: Optional[str] = None
    synonyms: List[str]
    antonyms: List[str]
    examples: List[str]

class SavedWordResponse(BaseModel):
    id: str
    word: str
    meaning: str
    pronunciation: Optional[str] = None
    synonyms: List[str]
    antonyms: List[str]
    examples: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: int
    explanation: str

class QuizResponse(BaseModel):
    questions: List[QuizQuestion]

class QuizSubmitRequest(BaseModel):
    score: int
    total_questions: int
