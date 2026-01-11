"""
User profile routes for THEKEY AI
Handles username and profile settings
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import get_db, User
from services.auth.dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional
import re

router = APIRouter(prefix="/api/users", tags=["users"])


class UsernameUpdate(BaseModel):
    username: str


class UserProfileResponse(BaseModel):
    id: str
    email: str
    username: Optional[str] = None
    shadow_score: Optional[str] = None  # JSON string
    is_pro: bool = False
    xp: int = 0
    level: str = "NOVICE"
    account_balance: float = 1000.0
    protection_level: str = "SURVIVAL"
    cooldown_minutes: int = 30
    consecutive_loss_limit: int = 2
    daily_trade_limit: int = 5
    max_position_size_usd: float = 500.0
    risk_per_trade_pct: float = 2.0

    class Config:
        from_attributes = True


@router.get("/me", response_model=UserProfileResponse)
async def get_profile(user: User = Depends(get_current_user)):
    """Get current user profile with all settings"""
    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        shadow_score=user.shadow_score,
        is_pro=user.is_pro or False,
        xp=user.xp or 0,
        level=user.level or "NOVICE",
        account_balance=float(user.account_balance or 1000),
        protection_level=user.protection_level or "SURVIVAL",
        cooldown_minutes=user.cooldown_minutes or 30,
        consecutive_loss_limit=user.consecutive_loss_limit or 2,
        daily_trade_limit=user.daily_trade_limit or 5,
        max_position_size_usd=float(user.max_position_size_usd or 500),
        risk_per_trade_pct=float(user.risk_per_trade_pct or 2),
    )


@router.put("/username")
async def update_username(
    data: UsernameUpdate, 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Update user's anonymous display username"""
    username = data.username.strip()
    
    # Validate username format
    if len(username) < 3 or len(username) > 20:
        raise HTTPException(status_code=400, detail="Username must be 3-20 characters")
    
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        raise HTTPException(status_code=400, detail="Username can only contain letters, numbers, and underscores")
    
    # Check if username is already taken
    existing = db.query(User).filter(User.username == username, User.id != user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Update username
    user.username = username
    db.commit()
    db.refresh(user)
    
    return {"success": True, "username": user.username}


class ShadowScoreUpdate(BaseModel):
    shadow_score: str  # JSON string


@router.put("/shadow-score")
async def update_shadow_score(
    data: ShadowScoreUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's shadow score (behavioral trust metrics)"""
    user.shadow_score = data.shadow_score
    db.commit()
    db.refresh(user)
    
    return {"success": True}
