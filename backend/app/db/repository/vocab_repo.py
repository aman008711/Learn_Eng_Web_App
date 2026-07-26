from typing import List, Optional, Union
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.models.vocab import SavedWord

class VocabularyRepository:
    def save_word(
        self,
        db: Session,
        *,
        user_id: Union[uuid.UUID, str],
        word: str,
        meaning: str,
        pronunciation: Optional[str] = None,
        synonyms: str,
        antonyms: str,
        examples: str
    ) -> SavedWord:
        db_obj = SavedWord(
            user_id=str(user_id),
            word=word.strip(),
            meaning=meaning.strip(),
            pronunciation=pronunciation.strip() if pronunciation else None,
            synonyms=synonyms.strip(),
            antonyms=antonyms.strip(),
            examples=examples.strip()
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_saved_words(self, db: Session, user_id: Union[uuid.UUID, str]) -> List[SavedWord]:
        """
        Retrieves all bookmarked words for a user, sorted by date (latest first).
        """
        return db.query(SavedWord)\
                 .filter(SavedWord.user_id == str(user_id))\
                 .order_by(desc(SavedWord.created_at))\
                 .all()

    def get_saved_word(self, db: Session, record_id: str, user_id: Union[uuid.UUID, str]) -> Optional[SavedWord]:
        """
        Retrieve a specific bookmark, verifying ownership.
        """
        return db.query(SavedWord)\
                 .filter(SavedWord.id == record_id, SavedWord.user_id == str(user_id))\
                 .first()

    def get_saved_word_by_name(self, db: Session, word: str, user_id: Union[uuid.UUID, str]) -> Optional[SavedWord]:
        """
        Checks if a word is already bookmarked by the user.
        """
        return db.query(SavedWord)\
                 .filter(SavedWord.word.ilike(word.strip()), SavedWord.user_id == str(user_id))\
                 .first()

    def delete_saved_word(self, db: Session, *, record_id: str, user_id: Union[uuid.UUID, str]) -> bool:
        """
        Deletes a bookmarked word, returns True if deleted, False otherwise.
        """
        db_obj = self.get_saved_word(db, record_id=record_id, user_id=user_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True

vocab_repo = VocabularyRepository()
