from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

db_url = settings.DATABASE_URL
if "[PROJECT-REF]" in db_url or not db_url:
    db_url = "sqlite:///./jarvis_dev.db"

# SQLite requires special connect arguments to allow multi-threaded access
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
