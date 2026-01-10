# backend/models/trade.py
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from .base import Base
import uuid
from datetime import datetime

class Trade(Base):
    __tablename__ = "trades"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)
    entry_price = Column(Numeric, nullable=False)
    exit_price = Column(Numeric)
    quantity = Column(Numeric, nullable=False)
    pnl = Column(Numeric)
    pnl_pct = Column(Numeric)
    entry_time = Column(DateTime, nullable=False)
    exit_time = Column(DateTime)
    status = Column(String, default="OPEN")
    ai_decision = Column(String)
    ai_reason = Column(String)
    tags = Column(ARRAY(String))
    notes = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Process Dojo evaluation data
    user_process_evaluation = Column(JSON)  # User's 7-step self-evaluation
    process_evaluation = Column(JSON)  # AI-generated process evaluation
    process_score = Column(Numeric)  # Total process score (0-100)
