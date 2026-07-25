import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from app.db.base_class import Base

class GrammarCheck(Base):
    __tablename__ = 'grammar_checks'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    original_text = Column(Text, nullable=False)
    corrected_text = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    alternatives = Column(Text, nullable=False)  # JSON-serialized list of alternative strings
    mistakes_highlighted = Column(Text, nullable=False)  # Markdown text containing highlighting diffs
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship to user using dynamic backref
    user = relationship('User', backref=backref('grammar_checks', cascade='all, delete-orphan', lazy='dynamic'))
