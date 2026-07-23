from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.db.models.user import User
from app.db.repository.dashboard_repo import dashboard_repo
from app.schemas.dashboard import DashboardOverview, UserActivityOut

router = APIRouter()

@router.get("", response_model=DashboardOverview)
def get_dashboard(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Get user dashboard stats and recent activities timeline.
    """
    stats = dashboard_repo.get_or_create_stats(db, current_user.id)
    activities = dashboard_repo.get_recent_activities(db, current_user.id, limit=10)
    
    # Calculate progress percentage capped at 100%
    progress = 0.0
    if stats.daily_goal_minutes > 0:
        progress = round(min(100.0, (stats.daily_minutes_completed / stats.daily_goal_minutes) * 100.0), 1)

    return DashboardOverview(
        user_email=current_user.email,
        streak=stats.streak,
        xp=stats.xp,
        level=stats.level,
        daily_goal_minutes=stats.daily_goal_minutes,
        daily_minutes_completed=stats.daily_minutes_completed,
        progress_percentage=progress,
        recent_activities=activities
    )

@router.post("/mock-activity", response_model=UserActivityOut)
def add_mock_activity(
    activity_type: str,
    description: str,
    xp_gained: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Developer helper endpoint to record a test activity, accumulate XP, and simulate daily minutes progress.
    """
    # Simulate study time progress for speaking activities
    if activity_type == "speaking":
        stats = dashboard_repo.get_or_create_stats(db, current_user.id)
        stats.daily_minutes_completed = min(stats.daily_goal_minutes, stats.daily_minutes_completed + 5)
        # Advance streak for demo activity
        if stats.streak == 0:
            stats.streak = 1
        db.add(stats)
        db.commit()

    return dashboard_repo.add_xp_and_log_activity(
        db,
        user_id=current_user.id,
        activity_type=activity_type,
        description=description,
        xp_gained=xp_gained
    )
