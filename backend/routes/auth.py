# backend/routes/auth.py
"""
Authentication Routes for THEKEY AI
Supports: Email/Password + Google OAuth + Email Verification
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import secrets
import jwt
import os
import httpx
import bcrypt

from models import get_db, User, Session as UserSession
from models.base import get_db_connection
from middleware.security import limiter, logger, sanitize_string

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Config
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS = 7
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# JWT Secret - MUST be set in production
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET or JWT_SECRET == "thekey-dev-secret-12345" or "thay_doi" in JWT_SECRET:
    if os.getenv("ENV") == "production":
        raise ValueError("❌ CRITICAL: JWT_SECRET must be set to a secure value in production!")
    JWT_SECRET = "thekey-dev-secret-12345"
    logger.warning("jwt_secret_insecure", message="Using default JWT_SECRET. Set a secure value in production.")

# ============================================
# Pydantic Models
# ============================================

class SignupRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    email_verified: bool
    is_pro: bool
    created_at: datetime
    protection_level: Optional[str] = "SURVIVAL"
    cooldown_minutes: Optional[int] = 30
    consecutive_loss_limit: Optional[int] = 2
    account_balance: Optional[float] = 1000.0
    max_position_size_usd: Optional[float] = 500.0
    risk_per_trade_pct: Optional[float] = 2.0
    daily_trade_limit: Optional[int] = 5
    xp: Optional[int] = 0
    level: Optional[str] = 'NOVICE'
    archetype: Optional[str] = 'UNDEFINED'

class SettingsUpdateRequest(BaseModel):
    protection_level: Optional[str] = None
    cooldown_minutes: Optional[int] = None
    consecutive_loss_limit: Optional[int] = None
    max_position_size_pct: Optional[float] = None
    daily_trade_limit: Optional[int] = None
    account_balance: Optional[float] = None
    max_position_size_usd: Optional[float] = None
    risk_per_trade_pct: Optional[float] = None
    xp: Optional[int] = None
    level: Optional[str] = None
    archetype: Optional[str] = None

# ============================================
# Helper Functions
# ============================================

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    """Create JWT access token"""
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token() -> str:
    """Create random refresh token"""
    return secrets.token_urlsafe(64)

def verify_token(token: str) -> Optional[dict]:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def generate_verification_token() -> str:
    """Generate email verification token"""
    return secrets.token_urlsafe(32)

# ============================================
# Routes (Rate Limited)
# ============================================

@router.post("/signup", response_model=AuthResponse)
@limiter.limit("5/minute")  # Prevent registration spam
async def signup(request: Request, data: SignupRequest, db: Session = Depends(get_db)):
    """User signup with email and password"""
    logger.info("signup_attempt", email=data.email[:3] + "***")
    
    # Validate password strength
    from utils.validators import validate_password
    password_result = validate_password(data.password)
    if not password_result.is_valid:
        raise HTTPException(
            status_code=400, 
            detail={
                "message": "Mật khẩu không đủ mạnh",
                "errors": password_result.errors,
                "suggestions": password_result.suggestions,
                "strength": password_result.strength
            }
        )
    
    # Check if user exists
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    new_user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        email_verification_token=secrets.token_urlsafe(32),
        email_verification_expires=datetime.utcnow() + timedelta(hours=24)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create tokens
    access_token = create_access_token(new_user.id, new_user.email)
    refresh_token = create_refresh_token()

    # Save session
    session = UserSession(
        user_id=new_user.id,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(session)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(new_user.id),
            "email": new_user.email,
            "email_verified": new_user.email_verified,
            "is_pro": new_user.is_pro,
            "created_at": new_user.created_at.isoformat()
        }
    }

@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")  # Prevent brute force attacks
async def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    """User login with email and password"""
    logger.info("login_attempt", email=data.email[:3] + "***")
    
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        logger.warning("login_failed", email=data.email[:3] + "***")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Update last login
    user.last_login = datetime.utcnow()
    
    # Create tokens
    access_token = create_access_token(user.id, user.email)
    refresh_token = create_refresh_token()

    # Save session
    session = UserSession(
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(session)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "email_verified": user.email_verified,
            "is_pro": user.is_pro,
            "created_at": user.created_at.isoformat()
        }
    }

@router.get("/google")
async def google_login():
    """Redirect to Google OAuth"""
    if not GOOGLE_CLIENT_ID:
        print("❌ Google OAuth Error: GOOGLE_CLIENT_ID is missing in .env")
        raise HTTPException(status_code=400, detail="Google Login chưa được cấu hình (Thiếu GOOGLE_CLIENT_ID).")
    
    redirect_uri = f"{FRONTEND_URL.rstrip('/')}/auth/google/callback"
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code"
        f"&scope=email%20profile"
        f"&access_type=offline"
        f"&prompt=select_account"
    )
    return {"auth_url": google_auth_url}


@router.post("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    redirect_uri = f"{FRONTEND_URL.rstrip('/')}/auth/google/callback"
    
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        exchange_data = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri
        }
        
        logger.info("google_token_exchange_attempt", 
                    client_id=GOOGLE_CLIENT_ID[:10] + "...",
                    redirect_uri=redirect_uri)
                    
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data=exchange_data
        )
        
        if token_response.status_code != 200:
            logger.error("google_auth_failed", 
                         status=token_response.status_code, 
                         response=token_response.text,
                         redirect_uri=redirect_uri)
            raise HTTPException(status_code=400, detail=f"Failed to exchange code: {token_response.text}")
        
        tokens = token_response.json()
        
        # Get user info
        userinfo_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        
        if userinfo_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        google_user = userinfo_response.json()
    
    # Find or create user
    email = google_user.get("email")
    google_id = google_user.get("id")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            google_id=google_id,
            email_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.google_id:
        user.google_id = google_id
        db.commit()

    # Create tokens
    access_token = create_access_token(user.id, user.email)
    refresh_token = create_refresh_token()

    # Save session
    session = UserSession(
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(session)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "email_verified": user.email_verified,
            "is_pro": user.is_pro,
            "created_at": user.created_at.isoformat()
        }
    }

@router.post("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify email with token"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, email FROM users 
            WHERE email_verification_token = %s 
            AND email_verification_expires > NOW()
        """, (token,))
        
        user_row = cursor.fetchone()
        
        if not user_row:
            raise HTTPException(status_code=400, detail="Invalid or expired verification token")
        
        cursor.execute("""
            UPDATE users SET 
                email_verified = TRUE, 
                email_verification_token = NULL, 
                email_verification_expires = NULL
            WHERE id = %s
        """, (user_row[0],))
        
        conn.commit()
        
        return {"message": "Email verified successfully", "email": user_row[1]}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.get("/me", response_model=UserResponse)
async def get_me(request: Request, db: Session = Depends(get_db)):
    """Get current user info from JWT token"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = auth_header.split(" ")[1]
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": str(user.id),
        "email": user.email,
        "email_verified": user.email_verified,
        "is_pro": user.is_pro,
        "created_at": user.created_at,
        "protection_level": user.protection_level,
        "cooldown_minutes": user.cooldown_minutes,
        "consecutive_loss_limit": user.consecutive_loss_limit,
        "account_balance": user.account_balance,
        "max_position_size_usd": user.max_position_size_usd,
        "risk_per_trade_pct": user.risk_per_trade_pct,
        "daily_trade_limit": user.daily_trade_limit,
        "xp": user.xp,
        "level": user.level,
        "archetype": user.archetype
    }

@router.put("/settings")
async def update_settings(request: Request, db: Session = Depends(get_db)):
    """Update user protection settings"""
    try:
        body = await request.json()
        logger.info("update_settings_raw_body", body=body)
        data = SettingsUpdateRequest(**body)
    except Exception as e:
        logger.error("update_settings_validation_error", error=str(e), body=await request.json())
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    
    from services.auth.dependencies import get_current_user
    user = await get_current_user(request, db)
    
    if data.protection_level is not None:
        user.protection_level = data.protection_level
    if data.cooldown_minutes is not None:
        user.cooldown_minutes = data.cooldown_minutes
    if data.consecutive_loss_limit is not None:
        user.consecutive_loss_limit = data.consecutive_loss_limit
    if data.max_position_size_pct is not None:
        user.max_position_size_pct = data.max_position_size_pct
    if data.daily_trade_limit is not None:
        user.daily_trade_limit = data.daily_trade_limit
    if data.account_balance is not None:
        user.account_balance = data.account_balance
    if data.max_position_size_usd is not None:
        user.max_position_size_usd = data.max_position_size_usd
    if data.risk_per_trade_pct is not None:
        user.risk_per_trade_pct = data.risk_per_trade_pct
    if data.xp is not None:
        user.xp = data.xp
    if data.level is not None:
        user.level = data.level
    if data.archetype is not None:
        user.archetype = data.archetype
        
    db.commit()
    db.refresh(user)
    
    return {"message": "Settings updated successfully", "settings": {
        "protection_level": user.protection_level,
        "cooldown_minutes": user.cooldown_minutes,
        "consecutive_loss_limit": user.consecutive_loss_limit,
        "account_balance": user.account_balance,
        "max_position_size_usd": user.max_position_size_usd,
        "risk_per_trade_pct": user.risk_per_trade_pct,
        "daily_trade_limit": user.daily_trade_limit,
        "xp": user.xp,
        "level": user.level,
        "archetype": user.archetype
    }}

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """Refresh access token"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT s.user_id, u.email FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.refresh_token = %s AND s.expires_at > NOW()
        """, (refresh_token,))
        
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        user_id = str(row[0])
        email = row[1]
        
        # Create new access token
        new_access_token = create_access_token(user_id, email)
        
        return {"access_token": new_access_token, "token_type": "bearer"}
    finally:
        cursor.close()
        conn.close()


@router.post("/logout")
async def logout(request: Request):
    """Logout and invalidate refresh token."""
    auth_header = request.headers.get("Authorization")
    
    if not auth_header:
        return {"message": "Logged out"}
    
    token = auth_header.split(" ")[1] if " " in auth_header else auth_header
    payload = verify_token(token)
    
    if payload:
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM sessions WHERE user_id = %s", (payload["sub"],))
            conn.commit()
        finally:
            cursor.close()
            conn.close()
    
    return {"message": "Logged out successfully"}
