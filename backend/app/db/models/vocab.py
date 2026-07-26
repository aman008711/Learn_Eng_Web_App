import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from app.db.base_class import Base

class SavedWord(Base):
    __tablename__ = 'saved_words'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    word = Column(String(255), nullable=False)
    meaning = Column(Text, nullable=False)
    pronunciation = Column(String(255), nullable=True)
    synonyms = Column(Text, nullable=False)  # JSON-serialized list of synonyms
    antonyms = Column(Text, nullable=False)  # JSON-serialized list of antonyms
    examples = Column(Text, nullable=False)  # JSON-serialized list of example sentences
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship to user
    user = relationship('User', backref=backref('saved_words', cascade='all, delete-orphan', lazy='dynamic'))
