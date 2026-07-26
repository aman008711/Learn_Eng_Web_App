import json
from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.db.models.user import User
from app.db.repository.vocab_repo import vocab_repo
from app.db.repository.dashboard_repo import dashboard_repo
from app.schemas.vocab import (
    DailyWordResponse,
    SavedWordCreate,
    SavedWordResponse,
    QuizResponse,
    QuizSubmitRequest
)
from app.core.services.ai import get_daily_word, get_vocab_quiz

router = APIRouter()

@router.get("/daily", response_model=DailyWordResponse)
async def fetch_daily_word():
    """
    Fetch the Word of the Day dynamically based on the current date calendar seed.
    """
    today_seed = date.today().isoformat()
    ai_result = await get_daily_word(today_seed)
    
    return DailyWordResponse(
        word=ai_result.get("word", ""),
        meaning=ai_result.get("meaning", ""),
        pronunciation=ai_result.get("pronunciation"),
        synonyms=ai_result.get("synonyms", []),
        antonyms=ai_result.get("antonyms", []),
        examples=ai_result.get("examples", [])
    )

@router.post("/save", response_model=SavedWordResponse)
def bookmark_word(
    payload: SavedWordCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Bookmark a vocabulary word, saving it to database history.
    """
    # Check if already bookmarked
    existing = vocab_repo.get_saved_word_by_name(db, word=payload.word, user_id=current_user.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The word '{payload.word}' is already saved in your bookmarks."
        )

    # Serialize arrays to JSON strings
    synonyms_str = json.dumps(payload.synonyms)
    antonyms_str = json.dumps(payload.antonyms)
    examples_str = json.dumps(payload.examples)

    db_obj = vocab_repo.save_word(
        db,
        user_id=current_user.id,
        word=payload.word,
        meaning=payload.meaning,
        pronunciation=payload.pronunciation,
        synonyms=synonyms_str,
        antonyms=antonyms_str,
        examples=examples_str
    )

    return SavedWordResponse(
        id=db_obj.id,
        word=db_obj.word,
        meaning=db_obj.meaning,
        pronunciation=db_obj.pronunciation,
        synonyms=payload.synonyms,
        antonyms=payload.antonyms,
        examples=payload.examples,
        created_at=db_obj.created_at
    )

@router.get("/bookmarks", response_model=List[SavedWordResponse])
def get_bookmarks(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Fetch all bookmarked words for the active user.
    """
    bookmarks = vocab_repo.get_saved_words(db, user_id=current_user.id)
    
    response_items = []
    for b in bookmarks:
        try:
            syn_list = json.loads(b.synonyms)
        except Exception:
            syn_list = [b.synonyms] if b.synonyms else []
            
        try:
            ant_list = json.loads(b.antonyms)
        except Exception:
            ant_list = [b.antonyms] if b.antonyms else []
            
        try:
            ex_list = json.loads(b.examples)
        except Exception:
            ex_list = [b.examples] if b.examples else []
            
        response_items.append(
            SavedWordResponse(
                id=b.id,
                word=b.word,
                meaning=b.meaning,
                pronunciation=b.pronunciation,
                synonyms=syn_list,
                antonyms=ant_list,
                examples=ex_list,
                created_at=b.created_at
            )
        )
    return response_items

@router.delete("/bookmarks/{record_id}", response_model=dict)
def delete_bookmark(
    record_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Remove a word from bookmarks.
    """
    success = vocab_repo.delete_saved_word(db, record_id=record_id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Bookmark record not found or unauthorized."
        )
    return {"status": "success", "message": "Word removed from bookmarks."}

@router.get("/quiz", response_model=QuizResponse)
async def generate_quiz(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Generate a 5-question vocabulary quiz.
    Uses user's bookmarked words if they have at least 3 bookmarks.
    Otherwise, generates a generic advanced vocabulary quiz.
    """
    bookmarks = vocab_repo.get_saved_words(db, user_id=current_user.id)
    
    words_seed = None
    if len(bookmarks) >= 3:
        # Extract up to 5 words to test on
        import random
        selected = random.sample(bookmarks, min(len(bookmarks), 5))
        words_seed = [b.word for b in selected]

    ai_result = await get_vocab_quiz(words=words_seed)
    return QuizResponse(questions=ai_result.get("questions", []))

@router.post("/quiz/submit", response_model=dict)
def submit_quiz_score(
    payload: QuizSubmitRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Submits quiz score, logs activity, and awards XP.
    """
    # 10 XP per correct answer
    xp_gained = payload.score * 10
    
    # Log activity and update stats
    dashboard_repo.add_xp_and_log_activity(
        db,
        user_id=current_user.id,
        activity_type="quiz",
        description=f"Completed Vocabulary Quiz scoring {payload.score}/{payload.total_questions}.",
        xp_gained=xp_gained
    )
    
    return {
        "status": "success",
        "xp_gained": xp_gained,
        "message": f"Successfully completed quiz! Earned +{xp_gained} XP."
    }
