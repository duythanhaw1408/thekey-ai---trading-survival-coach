# backend/main.py
"""
THEKEY AI - Production Backend
Version: 2.0.0 (Mainnet Ready)
"""

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from datetime import datetime
import os

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

# Import middleware
from middleware.security import limiter, logger, log_request_middleware

# Import models and routes
from models import get_db, Base
from routes import protection, reflection, trades, progress, learning, auth, users, stream, kb, analytics

# ============================================
# App Configuration
# ============================================

ENV = os.getenv("ENV", "development")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app = FastAPI(
    title="THEKEY AI Backend",
    version="2.0.0",
    description="Trading Survival Coach - Mainnet Ready",
    docs_url="/docs" if ENV != "production" else None,  # Disable Swagger in production
    redoc_url="/redoc" if ENV != "production" else None,
)

# Attach rate limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ============================================
# Middleware Stack
# ============================================

# 1. Request Logging Middleware
app.add_middleware(BaseHTTPMiddleware, dispatch=log_request_middleware)

# 2. CORS Configuration
allowed_origins = [FRONTEND_URL]
if ENV == "development":
    allowed_origins.extend(["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"])
else:
    # Production: Allow vercel preview URLs and www subdomain
    allowed_origins.extend([
        "https://thekey-ai-trading-survival-coach.vercel.app",
        "https://www.thekey-ai-trading-survival-coach.vercel.app",
        "https://thekey-ai.vercel.app",
    ])

# Allow all origins matching *.vercel.app for preview deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel preview URLs
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)

# ============================================
# Startup Event: Auto-create tables & Seed KB
# ============================================
@app.on_event("startup")
async def startup_event():
    """Auto-create tables and seed KB on startup (for Render Free tier without Shell)"""
    try:
        from models.base import Base, engine
        from sqlalchemy import text, inspect
        
        # Step 1: Create all new tables that don't exist
        Base.metadata.create_all(bind=engine)
        print("✅ [Startup] Database tables verified/created")
        
        # Step 2: Add missing columns to existing tables (ALTER TABLE)
        # This is needed because create_all() doesn't add new columns to existing tables
        with engine.connect() as conn:
            inspector = inspect(engine)
            
            # Check and add missing columns to 'users' table
            if 'users' in inspector.get_table_names():
                existing_columns = [col['name'] for col in inspector.get_columns('users')]
                
                # Add archetype column if missing
                if 'archetype' not in existing_columns:
                    print("📝 [Startup] Adding 'archetype' column to users table...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN archetype VARCHAR(50) DEFAULT 'UNDEFINED'"))
                    conn.commit()
                    print("✅ [Startup] Added 'archetype' column")
                
                # Add other potentially missing columns
                columns_to_add = [
                    ("shadow_score", "FLOAT DEFAULT 50.0"),
                    ("survival_score", "INTEGER DEFAULT 0"),
                    ("current_streak", "INTEGER DEFAULT 0"),
                    ("total_trades", "INTEGER DEFAULT 0"),
                    ("xp", "INTEGER DEFAULT 0"),
                    ("level", "INTEGER DEFAULT 1"),
                ]
                
                for col_name, col_def in columns_to_add:
                    if col_name not in existing_columns:
                        print(f"📝 [Startup] Adding '{col_name}' column to users table...")
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}"))
                        conn.commit()
                        print(f"✅ [Startup] Added '{col_name}' column")
            
            # Check and add missing columns to 'checkins' table
            if 'checkins' in inspector.get_table_names():
                existing_columns = [col['name'] for col in inspector.get_columns('checkins')]
                
                # ALL columns that should exist in checkins table
                checkin_columns_to_add = [
                    ("user_id", "VARCHAR(100)"),
                    ("answers", "JSONB"),
                    ("insights", "TEXT"),
                    ("action_items", "JSONB"),
                    ("encouragement", "TEXT"),
                    ("emotional_state", "VARCHAR(50)"),
                    ("risk_level", "VARCHAR(50)"),
                    ("created_at", "TIMESTAMP WITH TIME ZONE DEFAULT NOW()"),
                    ("date", "VARCHAR(20)"),
                ]
                
                for col_name, col_def in checkin_columns_to_add:
                    if col_name not in existing_columns:
                        print(f"📝 [Startup] Adding '{col_name}' column to checkins table...")
                        try:
                            conn.execute(text(f"ALTER TABLE checkins ADD COLUMN {col_name} {col_def}"))
                            conn.commit()
                            print(f"✅ [Startup] Added '{col_name}' column to checkins")
                        except Exception as col_e:
                            print(f"⚠️ [Startup] Could not add '{col_name}': {col_e}")

        
        print("✅ [Startup] Database schema migration complete")

        
        # Step 3: Check if KB needs seeding
        from models import get_db, KBDocument
        db = next(get_db())
        try:
            kb_count = db.query(KBDocument).count()
            if kb_count == 0:
                print("📚 [Startup] KB empty, seeding...")
                from scripts.seed_kb import seed_kb as seed_kb_func
                seed_kb_func(db)
                print(f"✅ [Startup] KB seeded successfully")
            else:
                print(f"✅ [Startup] KB already has {kb_count} documents")
        finally:
            db.close()
    except Exception as e:
        print(f"⚠️ [Startup] Auto-setup error (non-fatal): {e}")
        import traceback
        traceback.print_exc()


# ============================================
# Health & Status Endpoints
# ============================================

@app.get("/", tags=["Status"])
async def root():
    return {
        "name": "THEKEY AI",
        "version": "2.0.0",
        "status": "operational",
        "environment": ENV
    }

@app.get("/health", tags=["Status"])
async def health_check(db: Session = Depends(get_db)):
    """Production-ready health check with component status"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "components": {}
    }
    
    # Check database connection
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        health_status["components"]["database"] = "healthy"
    except Exception as e:
        health_status["components"]["database"] = "unhealthy"
        health_status["status"] = "degraded"
        logger.error("health_check_db_failed", error=str(e))
    
    # Check Gemini API key presence
    if os.getenv("GEMINI_API_KEY"):
        health_status["components"]["ai_service"] = "configured"
    else:
        health_status["components"]["ai_service"] = "missing_key"
        health_status["status"] = "degraded"
    
    return health_status

@app.get("/ready", tags=["Status"])
async def readiness_check():
    """Kubernetes/Railway readiness probe"""
    return {"ready": True}

# ============================================
# API Routers (Versioned)
# ============================================

# Auth routes at root level (standard practice)
app.include_router(auth.router)

# API v1 - All functional endpoints
from fastapi import APIRouter

api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(protection.router)
api_v1.include_router(reflection.router)
api_v1.include_router(trades.router)
api_v1.include_router(progress.router)
api_v1.include_router(learning.router)
api_v1.include_router(users.router)
api_v1.include_router(stream.router)
api_v1.include_router(kb.router)
api_v1.include_router(analytics.router)

app.include_router(api_v1)

# Legacy routes (deprecated, will be removed in v3.0)
# Kept for backward compatibility during migration
app.include_router(protection.router)
app.include_router(reflection.router)
app.include_router(trades.router)
app.include_router(progress.router)
app.include_router(learning.router)
app.include_router(users.router)

# ============================================
# Startup & Shutdown Events
# ============================================

@app.on_event("startup")
async def startup_event():
    logger.info(
        "app_started",
        version="2.0.0",
        environment=ENV,
        frontend_url=FRONTEND_URL
    )

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("app_shutdown")

# ============================================
# Main Entry Point
# ============================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    
    logger.info("starting_server", port=port, env=ENV)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info" if ENV == "development" else "warning"
    )
