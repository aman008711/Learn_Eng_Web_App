from typing import List, Optional, Union
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.models.user_stats import UserStats
from app.db.models.user_activity import UserActivity

class DashboardRepository:
    def get_or_create_stats(self, db: Session, user_id: Union[uuid.UUID, str]) -> UserStats:
        """
        Retrieves user stats. If the record does not exist yet,
        automatically initializes and returns default stats.
        """
        stats = db.query(UserStats).filter(UserStats.user_id == str(user_id)).first()
        if not stats:
            stats = UserStats(
                user_id=str(user_id),
                streak=0,
                xp=0,
                level=1,
                daily_goal_minutes=15,
                daily_minutes_completed=0
            )
            db.add(stats)
            db.commit()
            db.refresh(stats)
        return stats

    def get_recent_activities(self, db: Session, user_id: Union[uuid.UUID, str], limit: int = 10) -> List[UserActivity]:
        """
        Fetches chronological user activities, newest first.
        """
        return db.query(UserActivity)\
                 .filter(UserActivity.user_id == str(user_id))\
                 .order_by(desc(UserActivity.created_at))\
                 .limit(limit)\
                 .all()

    def add_xp_and_log_activity(
        self,
        db: Session,
        user_id: Union[uuid.UUID, str],
        activity_type: str,
        description: str,
        xp_gained: int
    ) -> UserActivity:
        """
        Adds XP to user stats, performs level calculation, and logs the activity.
        If a level boundary is crossed (each 1000 XP increases level), it triggers a milestone.
        """
        # 1. Log the main activity
        activity = UserActivity(
            user_id=str(user_id),
            activity_type=activity_type,
            description=description,
            xp_gained=xp_gained
        )
        db.add(activity)

        # 2. Fetch stats and accumulate XP
        stats = self.get_or_create_stats(db, user_id=str(user_id))
        old_level = stats.level
        stats.xp += xp_gained

        # Gamification: Level up threshold is every 1000 XP
        new_level = 1 + (stats.xp // 1000)
        if new_level > old_level:
            stats.level = new_level
            
            # Log a milestone reward activity
            milestone_activity = UserActivity(
                user_id=str(user_id),
                activity_type="milestone",
                description=f"Leveled up! Reached Level {new_level}.",
                xp_gained=100  # Bonus level-up XP
            )
            db.add(milestone_activity)
            stats.xp += 100  # Give level-up bonus

        db.commit()
        db.refresh(activity)
        return activity

dashboard_repo = DashboardRepository()
