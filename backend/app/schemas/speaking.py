from typing import Optional
from pydantic import BaseModel

class SpeakingChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class SpeakingChatResponse(BaseModel):
    conversation_id: str
    reply: str

class SpeakingSubmitRequest(BaseModel):
    duration_seconds: int
    turns_completed: int
