from typing import List, Optional, Union
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.db.models.chat import Conversation, Message

class ChatRepository:
    def create_conversation(self, db: Session, *, user_id: Union[uuid.UUID, str], title: str = "New Conversation") -> Conversation:
        db_obj = Conversation(
            user_id=str(user_id),
            title=title
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_conversations(self, db: Session, user_id: Union[uuid.UUID, str]) -> List[Conversation]:
        """
        Fetch all conversations of a user, sorted by update time (latest first).
        """
        return db.query(Conversation)\
                 .filter(Conversation.user_id == str(user_id))\
                 .order_by(desc(Conversation.updated_at))\
                 .all()

    def get_conversation_detail(self, db: Session, conversation_id: str, user_id: Union[uuid.UUID, str]) -> Optional[Conversation]:
        """
        Retrieve a specific conversation details checking ownership, including messages.
        """
        return db.query(Conversation)\
                 .filter(Conversation.id == conversation_id, Conversation.user_id == str(user_id))\
                 .first()

    def search_conversations(self, db: Session, user_id: Union[uuid.UUID, str], query: str) -> List[Conversation]:
        """
        Search conversations by matching query in title or in message contents.
        """
        query_str = f"%{query}%"
        # Find conversations belonging to user where title matches OR any child message content matches
        return db.query(Conversation)\
                 .outerjoin(Message)\
                 .filter(
                     Conversation.user_id == str(user_id),
                     or_(
                         Conversation.title.ilike(query_str),
                         Message.content.ilike(query_str)
                     )
                 )\
                 .distinct()\
                 .order_by(desc(Conversation.updated_at))\
                 .all()

    def add_message(self, db: Session, *, conversation_id: str, role: str, content: str) -> Message:
        db_obj = Message(
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        db.add(db_obj)
        
        # Touch parent conversation to update updated_at timestamp
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conversation:
            from sqlalchemy.sql import func
            conversation.updated_at = func.now()
            db.add(conversation)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete_conversation(self, db: Session, conversation_id: str, user_id: Union[uuid.UUID, str]) -> bool:
        db_obj = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == str(user_id)).first()
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True

    def update_conversation_title(self, db: Session, conversation_id: str, user_id: Union[uuid.UUID, str], title: str) -> Optional[Conversation]:
        db_obj = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == str(user_id)).first()
        if not db_obj:
            return None
        db_obj.title = title
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

chat_repo = ChatRepository()
