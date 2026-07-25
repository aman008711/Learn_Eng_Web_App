from typing import List, Optional, Union
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.models.grammar import GrammarCheck

class GrammarRepository:
    def create_grammar_check(
        self, 
        db: Session, 
        *, 
        user_id: Union[uuid.UUID, str], 
        original_text: str, 
        corrected_text: str, 
        explanation: str, 
        alternatives: str, 
        mistakes_highlighted: str
    ) -> GrammarCheck:
        db_obj = GrammarCheck(
            user_id=str(user_id),
            original_text=original_text,
            corrected_text=corrected_text,
            explanation=explanation,
            alternatives=alternatives,
            mistakes_highlighted=mistakes_highlighted
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_grammar_checks(self, db: Session, user_id: Union[uuid.UUID, str]) -> List[GrammarCheck]:
        """
        Retrieve all grammar check history items for a user, sorted by date (latest first).
        """
        return db.query(GrammarCheck)\
                 .filter(GrammarCheck.user_id == str(user_id))\
                 .order_by(desc(GrammarCheck.created_at))\
                 .all()

    def get_grammar_check(self, db: Session, check_id: str, user_id: Union[uuid.UUID, str]) -> Optional[GrammarCheck]:
        """
        Retrieve a specific check, verifying ownership.
        """
        return db.query(GrammarCheck)\
                 .filter(GrammarCheck.id == check_id, GrammarCheck.user_id == str(user_id))\
                 .first()

    def delete_grammar_check(self, db: Session, *, check_id: str, user_id: Union[uuid.UUID, str]) -> bool:
        """
        Delete a grammar check record, returns True if deleted, False otherwise.
        """
        db_obj = self.get_grammar_check(db, check_id=check_id, user_id=user_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True

grammar_repo = GrammarRepository()
