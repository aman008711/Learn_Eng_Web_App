from sqlalchemy import Column, String, Integer, Date, ForeignKey
from sqlalchemy.orm import relationship, backref
from app.db.base_class import Base

class UserStats(Base):
    __tablename__ = "user_stats"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True)
    streak = Column(Integer, default=0, nullable=False)
    xp = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    daily_goal_minutes = Column(Integer, default=15, nullable=False)
    daily_minutes_completed = Column(Integer, default=0, nullable=False)
    last_active_date = Column(Date, nullable=True)

    # Establish one-to-one relationship with the core User model
    user = relationship("User", backref=backref("stats", uselist=False, cascade="all, delete-orphan"))
