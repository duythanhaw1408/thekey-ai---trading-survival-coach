# backend/models/user.py
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Numeric, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base
import uuid
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    username = Column(String(50), unique=True, nullable=True)  # Anonymous display name
    password_hash = Column(String)
    google_id = Column(String, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Email verification
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String)
    email_verification_expires = Column(DateTime)
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_pro = Column(Boolean, default=False)
    last_login = Column(DateTime)
    
    # User preferences
    cooldown_minutes = Column(Integer, default=30)
    max_position_size_pct = Column(Numeric, default=0.05)
    daily_trade_limit = Column(Integer, default=5)
    
    # Flexible Protection Settings
    protection_level = Column(String, default="SURVIVAL") # SURVIVAL, DISCIPLINE, FLEXIBLE
    consecutive_loss_limit = Column(Integer, default=2)
    account_balance = Column(Numeric, default=1000.0)
    max_position_size_usd = Column(Numeric, default=500.0)
    risk_per_trade_pct = Column(Numeric, default=2.0)
    
    # Gamification & Mastery
    xp = Column(Integer, default=0)
    level = Column(String, default="NOVICE")
    archetype = Column(String, default="UNDEFINED")
    trading_persona = Column(String, default="THE_OBSERVER") # 'The Gambler', 'The Zen Trader', etc.
    transformation_stage = Column(String, default="AWARENESS") # 'AWARENESS' | 'PRACTICE' | 'MASTERY'
    current_kata = Column(JSON) # {name: '', principles: [], practice: ''}
    growth_garden = Column(JSON) # {tree_height: 1.0, blooms: [], last_watered: date}
    
    # Stats cache
    survival_score = Column(Integer, default=50)
    current_streak = Column(Integer, default=0)
    total_trades = Column(Integer, default=0)
    timezone = Column(String(50), default="UTC") # User's local timezone
    
    # AI Cost & Usage Control
    daily_ai_calls = Column(Integer, default=0)
    last_ai_reset = Column(DateTime, default=datetime.utcnow)
    monthly_ai_budget_usd = Column(Numeric, default=5.0) # $5 free tier budget
    
    # Shadow Score (JSON field for behavioral trust metrics)
    shadow_score = Column(JSON)  # Behavioral trust metrics
    
    # Relationships
    checkins = relationship("Checkin", back_populates="user", lazy="dynamic")

