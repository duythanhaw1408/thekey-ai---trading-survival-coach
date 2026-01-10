# backend/models/ai_prediction.py
"""
SQLAlchemy model for AI Prediction tracking.
Used for validation loop and accuracy measurement.
"""

from sqlalchemy import Column, String, DECIMAL, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from .base import Base


class AIPrediction(Base):
    """
    Tracks every AI decision for accuracy validation.
    """
    __tablename__ = 'ai_predictions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Trade reference (null if trade was blocked and not created)
    trade_id = Column(UUID(as_uuid=True), ForeignKey('trades.id', ondelete='SET NULL'), nullable=True)
    
    # AI Decision
    decision = Column(String, nullable=False)  # 'ALLOW', 'WARN', 'BLOCK'
    confidence = Column(DECIMAL)  # 0.0 to 1.0
    reason = Column(String)
    rule = Column(String)  # 'FAST_CHECK', 'REVENGE_TRADE', 'AI_EVAL'
    
    # Trade intent (stored for blocked trades)
    trade_intent = Column(JSON)
    
    # User Response
    user_action = Column(String)  # 'FOLLOWED', 'OVERRODE', 'CANCELLED'
    
    # Outcome (updated when trade closes)
    outcome = Column(String)  # 'WIN', 'LOSS', 'BREAKEVEN', 'PENDING'
    outcome_pnl = Column(DECIMAL)
    was_correct = Column(Boolean)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    outcome_updated_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", backref="ai_predictions")
    trade = relationship("Trade", backref="ai_prediction")
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "trade_id": str(self.trade_id) if self.trade_id else None,
            "decision": self.decision,
            "confidence": float(self.confidence) if self.confidence else None,
            "reason": self.reason,
            "rule": self.rule,
            "user_action": self.user_action,
            "outcome": self.outcome,
            "outcome_pnl": float(self.outcome_pnl) if self.outcome_pnl else None,
            "was_correct": self.was_correct,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
