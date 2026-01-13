# backend/models/checkin.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class Checkin(Base):
    """Model for daily check-in records."""
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Answers to the 3 daily questions (stored as JSON array)
    answers = Column(JSON, nullable=False)
    
    # AI-generated insights/analysis
    insights = Column(String, nullable=True)
    action_items = Column(JSON, nullable=True)  # List of action suggestions
    encouragement = Column(String, nullable=True)
    
    # Emotional/behavioral analysis
    emotional_state = Column(String, nullable=True)  # e.g., "CALM", "ANXIOUS", "FRUSTRATED"
    risk_level = Column(String, nullable=True)  # e.g., "LOW", "MEDIUM", "HIGH"
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    date = Column(String, nullable=False, index=True)  # YYYY-MM-DD for uniqueness check
    
    # Relationship
    user = relationship("User", back_populates="checkins")
