from typing import List
from datetime import datetime
from pydantic import BaseModel

class GrammarCheckRequest(BaseModel):
    text: str

class GrammarCheckResponse(BaseModel):
    id: str
    original_text: str
    corrected_text: str
    explanation: str
    alternatives: List[str]
    mistakes_highlighted: str
    created_at: datetime

    class Config:
        from_attributes = True
