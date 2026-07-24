from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

# Schema properties for messages
class MessageCreate(BaseModel):
    role: str = Field(..., description="Role of message sender (user or assistant)")
    content: str = Field(..., description="Content text of the message")

class MessageOut(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Schema properties for conversations
class ConversationCreate(BaseModel):
    title: Optional[str] = Field(None, description="Optional title, default auto-generated")

class ConversationOut(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationDetail(ConversationOut):
    messages: List[MessageOut] = []

    model_config = ConfigDict(from_attributes=True)

class ConversationTitleUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="New conversation title")

# Request schemas for chat endpoints
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="The message string to send to the coach")
    conversation_id: Optional[str] = Field(None, description="ID of conversation thread if appending to existing one")
