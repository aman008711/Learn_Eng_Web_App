import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.db.models.user import User
from app.db.repository.grammar_repo import grammar_repo
from app.schemas.grammar import GrammarCheckRequest, GrammarCheckResponse
from app.core.services.ai import check_grammar

router = APIRouter()

@router.post("/check", response_model=GrammarCheckResponse)
async def check_english_grammar(
    payload: GrammarCheckRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Analyze grammar of a submitted sentence, save results, and return analysis payload.
    """
    cleaned_input = payload.text.strip()
    if not cleaned_input:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide English text to analyze."
        )

    # Trigger Groq JSON grammar checking
    ai_result = await check_grammar(cleaned_input)

    # Format list output for alternatives
    alternatives_list = ai_result.get("alternatives", [])
    if isinstance(alternatives_list, str):
        alternatives_list = [alternatives_list]
        
    # Serialize alternatives array to JSON string for database
    serialized_alts = json.dumps(alternatives_list)

    # Save to history log
    db_obj = grammar_repo.create_grammar_check(
        db,
        user_id=current_user.id,
        original_text=cleaned_input,
        corrected_text=ai_result.get("corrected_text", cleaned_input),
        explanation=ai_result.get("explanation", ""),
        alternatives=serialized_alts,
        mistakes_highlighted=ai_result.get("mistakes_highlighted", cleaned_input)
    )

    return GrammarCheckResponse(
        id=db_obj.id,
        original_text=db_obj.original_text,
        corrected_text=db_obj.corrected_text,
        explanation=db_obj.explanation,
        alternatives=alternatives_list,
        mistakes_highlighted=db_obj.mistakes_highlighted,
        created_at=db_obj.created_at
    )

@router.get("/history", response_model=List[GrammarCheckResponse])
def get_check_history(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get all historical grammar checks for the active logged-in user.
    """
    checks = grammar_repo.get_grammar_checks(db, user_id=current_user.id)
    
    response_items = []
    for c in checks:
        try:
            alt_list = json.loads(c.alternatives)
        except Exception:
            alt_list = [c.alternatives]
            
        response_items.append(
            GrammarCheckResponse(
                id=c.id,
                original_text=c.original_text,
                corrected_text=c.corrected_text,
                explanation=c.explanation,
                alternatives=alt_list,
                mistakes_highlighted=c.mistakes_highlighted,
                created_at=c.created_at
            )
        )
    return response_items

@router.delete("/{check_id}", response_model=dict)
def delete_history_item(
    check_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Delete a specific grammar check card from history log.
    """
    success = grammar_repo.delete_grammar_check(db, check_id=check_id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Grammar check record not found or unauthorized."
        )
    return {"status": "success", "message": "History item deleted."}
