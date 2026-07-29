import json
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.db.models.user import User
from app.db.repository.chat_repo import chat_repo
from app.db.repository.dashboard_repo import dashboard_repo
from app.schemas.speaking import SpeakingChatRequest, SpeakingChatResponse, SpeakingSubmitRequest
from app.core.services.ai import get_groq_client

router = APIRouter()

@router.post("/chat", response_model=SpeakingChatResponse)
async def speaking_chat(
    payload: SpeakingChatRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Submits user speech transcript to conversational speaking AI coach.
    Saves message logs to standard database conversation history.
    """
    user_text = payload.message.strip()
    if not user_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcription is empty."
        )

    # 1. Resolve conversation thread
    conversation_id = payload.conversation_id
    if not conversation_id:
        title = f"Speaking: {date.today().isoformat()}"
        conversation = chat_repo.create_conversation(db, user_id=current_user.id, title=title)
        conversation_id = conversation.id
    else:
        conversation = chat_repo.get_conversation_detail(db, conversation_id=conversation_id, user_id=current_user.id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Speaking session not found."
            )

    # 2. Log user message
    chat_repo.add_message(db, conversation_id=conversation_id, role="user", content=user_text)

    # 3. Get history for context
    messages_history = chat_repo.get_conversation_detail(db, conversation_id=conversation_id, user_id=current_user.id).messages
    
    # Format messages for the Groq API (excluding the user's message we just logged, to pass it separately or include)
    formatted_history = []
    # System Instruction
    system_prompt = (
        "You are Jarvis, a friendly English speaking partner and coach. Speak in a natural, casual, and highly conversational style. "
        "CRITICAL: Keep your responses brief, natural, and friendly (1 to 3 short sentences max) so it feels like a real spoken conversation. "
        "Do not use markdown lists, headers, bullet points, or code blocks. "
        "At the very end of your response, if the user made any grammatical, pronunciation, or spelling errors in their last message, "
        "add a polite correction line starting with '[Correction: ...]' (keep the correction brief, e.g. '[Correction: You said \"He go\" instead of \"He goes\".]')."
    )
    
    formatted_history.append({"role": "system", "content": system_prompt})
    
    # We pass the conversation context (limit to last 10 messages to avoid token bloat)
    for m in messages_history[-10:]:
        formatted_history.append({"role": m.role, "content": m.content})

    # 4. Query AI Coach
    client = get_groq_client()
    
    if client is None:
        # Curated offline response fallbacks
        import random
        offline_responses = [
            "That sounds really interesting! Tell me more about it.",
            "I completely agree. Speaking practice is key to master English.",
            "That's wonderful! What are you planning to do next? [Correction: You said 'Next week I write' instead of 'Next week I will write'.]",
            "English is a beautiful language. I'm happy to help you practice! [Correction: You said 'help for me' instead of 'help me'.]",
            "Indeed, practice makes perfect. Tell me about your day!"
        ]
        reply_content = random.choice(offline_responses)
    else:
        try:
            completion = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=formatted_history,
                max_tokens=150
            )
            reply_content = completion.choices[0].message.content.strip()
        except Exception as e:
            reply_content = f"I'm sorry, I had trouble processing your voice. Could you repeat that? [Correction error: {e}]"

    # 5. Log assistant response
    chat_repo.add_message(db, conversation_id=conversation_id, role="assistant", content=reply_content)

    return SpeakingChatResponse(
        conversation_id=conversation_id,
        reply=reply_content
    )

@router.post("/submit", response_model=dict)
def submit_speaking_session(
    payload: SpeakingSubmitRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Finalizes speaking session, logging dashboard activity, awarding +50 XP,
    updating active daily minutes completed, and advancing user streak.
    """
    xp_gained = 50
    session_minutes = max(1, payload.duration_seconds // 60) if payload.duration_seconds > 0 else 0
    
    # 1. Update daily minutes and streak in UserStats
    stats = dashboard_repo.get_or_create_stats(db, current_user.id)
    stats.daily_minutes_completed = min(stats.daily_goal_minutes, stats.daily_minutes_completed + session_minutes)
    
    from datetime import date as dt_date, timedelta
    today = dt_date.today()
    if stats.last_active_date != today:
        if stats.last_active_date == today - timedelta(days=1):
            stats.streak += 1
        elif stats.last_active_date is None or stats.last_active_date < today - timedelta(days=1):
            stats.streak = 1
        stats.last_active_date = today
    
    db.add(stats)
    db.commit()

    # 2. Log activity and award XP
    dashboard_repo.add_xp_and_log_activity(
        db,
        user_id=current_user.id,
        activity_type="speaking",
        description=f"Completed speaking practice with Jarvis AI for {session_minutes} min ({payload.turns_completed} conversational turns).",
        xp_gained=xp_gained
    )

    return {
        "status": "success",
        "xp_gained": xp_gained,
        "message": f"Great job! Earned +{xp_gained} XP."
    }
