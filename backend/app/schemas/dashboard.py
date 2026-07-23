from typing import List, Optional
import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class UserActivityOut(BaseModel):
    id: uuid.UUID
    activity_type: str
    description: str
    xp_gained: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DashboardOverview(BaseModel):
    user_email: str
    streak: int
    xp: int
    level: int
    daily_goal_minutes: int
    daily_minutes_completed: int
    progress_percentage: float  # Percentage of today's target completed
    recent_activities: List[UserActivityOut]

    model_config = ConfigDict(from_attributes=True)
