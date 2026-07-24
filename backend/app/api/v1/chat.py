import json
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api import deps
from app.config import settings
from app.db.models.user import User
from app.db.repository.chat_repo import chat_repo
from app.schemas.chat import (
    ConversationOut,
    ConversationDetail,
    ConversationTitleUpdate,
    ChatRequest,
    MessageOut
)
from app.core.services.ai import get_chat_stream

router = APIRouter()

@router.get("", response_model=List[ConversationOut])
def get_conversations(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    List all chat conversations belonging to the authenticated user.
    """
    return chat_repo.get_conversations(db, user_id=current_user.id)

@router.get("/search", response_model=List[ConversationOut])
def search_conversations(
    q: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Search conversations containing query matches in title or content.
    """
    return chat_repo.search_conversations(db, user_id=current_user.id, query=q)

@router.get("/{id}", response_model=ConversationDetail)
def get_conversation_detail(
    id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Fetch a detailed conversation thread checking owner permissions.
    """
    conversation = chat_repo.get_conversation_detail(db, conversation_id=id, user_id=current_user.id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found."
        )
    return conversation

@router.put("/{id}", response_model=ConversationOut)
def rename_conversation(
    id: str,
    title_in: ConversationTitleUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Rename an existing conversation title.
    """
    conversation = chat_repo.update_conversation_title(
        db, conversation_id=id, user_id=current_user.id, title=title_in.title
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied."
        )
    return conversation

@router.delete("/{id}")
def delete_conversation(
    id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Delete a conversation thread.
    """
    success = chat_repo.delete_conversation(db, conversation_id=id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied."
        )
    return {"message": "Conversation successfully deleted."}

@router.post("/stream")
async def chat_stream(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    chat_in: ChatRequest
) -> StreamingResponse:
    """
    Submit a message and stream the AI coach response word-by-word (SSE).
    Saves the user message on request, and the assistant message on stream completion.
    """
    conversation_id = chat_in.conversation_id
    is_new = False
    
    # 1. Initialize conversation if not provided
    if not conversation_id:
        title = chat_in.message[:30] + ("..." if len(chat_in.message) > 30 else "")
        conversation = chat_repo.create_conversation(db, user_id=current_user.id, title=title)
        conversation_id = conversation.id
        is_new = True
    else:
        conversation = chat_repo.get_conversation_detail(db, conversation_id=conversation_id, user_id=current_user.id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation thread not found."
            )

    # 2. Log user message to the database
    chat_repo.add_message(db, conversation_id=conversation_id, role="user", content=chat_in.message)
    
    # Get conversation messages history for context (excluding the just-added user message for generation)
    history = [] if is_new else conversation.messages[:-1]

    # 3. Create the Server-Sent Events generator
    async def event_generator():
        # If this is a new conversation session, emit metadata first
        if is_new:
            yield f"data: {json.dumps({'conversation_id': conversation_id, 'title': title})}\n\n"
        
        full_response = ""
        try:
            async for chunk in get_chat_stream(chat_in.message, history=history):
                full_response += chunk
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        # 4. Save the compiled assistant response on complete
        if full_response:
            chat_repo.add_message(db, conversation_id=conversation_id, role="assistant", content=full_response)
            
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
