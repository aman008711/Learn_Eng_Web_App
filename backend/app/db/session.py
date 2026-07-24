from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

db_url = settings.DATABASE_URL
if "[PROJECT-REF]" in db_url or not db_url:
    db_url = "sqlite:///./jarvis_dev.db"

connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = None
# Self-healing: Test if PostgreSQL connection works. Fallback to SQLite if it fails.
if not db_url.startswith("sqlite"):
    try:
        # Create a temp engine with a 3-second timeout to test connection
        test_engine = create_engine(
            db_url,
            connect_args={"connect_timeout": 3},
            pool_pre_ping=True
        )
        with test_engine.connect() as conn:
            pass
        engine = test_engine
    except Exception:
        # Fallback to local SQLite database
        db_url = "sqlite:///./jarvis_dev.db"
        connect_args = {"check_same_thread": False}

if engine is None:
    engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
