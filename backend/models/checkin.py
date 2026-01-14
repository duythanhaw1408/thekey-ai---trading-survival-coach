# backend/models/checkin.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Date
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base
import uuid

class Checkin(Base):
    """Model for daily check-in records (Kaito Persona)."""
    __tablename__ = "checkins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Answers and Questions
    questions = Column(JSONB) # Structured question list
    answers = Column(JSONB, nullable=False) # Structured answers
    
    # AI-generated insights/analysis
    insights = Column(JSONB, nullable=True) # List of insight objects
    daily_prescription = Column(JSONB) # {mindset_shift, behavioral_rule, success_metric}
    progress_marker = Column(JSONB) # {milestone, visual_metaphor}
    encouragement = Column(String, nullable=True)
    
    # Emotional/behavioral analysis
    emotional_state = Column(String, nullable=True) 
    risk_level = Column(String, nullable=True)
    
    # Legacy/Optional
    action_items = Column(ARRAY(String), nullable=True) 
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime)
    date = Column(Date, nullable=False, index=True)
    
    # Relationship
    user = relationship("User", back_populates="checkins")
