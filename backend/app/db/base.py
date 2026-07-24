# Import all the models, so that Base has them before being imported by Alembic
from app.db.base_class import Base  # noqa
from app.db.models.user import User  # noqa
from app.db.models.user_stats import UserStats  # noqa
from app.db.models.user_activity import UserActivity  # noqa
from app.db.models.chat import Conversation, Message  # noqa
