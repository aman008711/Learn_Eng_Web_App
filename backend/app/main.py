from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.db.base import Base
from app.db.session import engine
import logging

# Self-healing: auto-create all tables in Supabase PostgreSQL if they don't exist
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logging.error(f"Database table creation failed (check your DATABASE_URL in .env): {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Middleware configurations
# Restrict in production environment, but enable allowance for local developers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(dashboard_router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": f"{settings.API_V1_STR}/docs"
    }
