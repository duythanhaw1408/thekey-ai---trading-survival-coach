# backend/models/ai_call_log.py
"""
THEKEY AI Call Logging Model
Tracks all AI API calls for cost analysis and optimization.
"""

from sqlalchemy import Column, String, Text, Float, Integer, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from models.base import Base


class AICallLog(Base):
    """
    Logs every AI API call for cost tracking and optimization.
    
    Enables:
    - Cost analysis per user/feature
    - Token usage optimization
    - AI accuracy tracking
    - Rate limiting insights
    """
    __tablename__ = "ai_call_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # User association
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Call details
    call_type = Column(String(50), nullable=False)
    # Types: pre_trade, post_trade, coach, archetype, weekly_report, market_analysis
    
    model = Column(String(50), nullable=False)
    # Models: gemini-1.5-pro-latest, gemini-1.5-flash-latest
    
    # Token usage
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    
    # Cost calculation (in USD)
    # Gemini pricing: ~$0.00025/1K input tokens, ~$0.0005/1K output tokens (Flash)
    # Pro: ~$0.0025/1K input, ~$0.005/1K output
    cost_usd = Column(Float, default=0.0)
    
    # Performance
    latency_ms = Column(Integer, default=0)
    success = Column(String(10), default="true")  # true, false, timeout
    error_message = Column(Text, nullable=True)
    
    # Context
    endpoint = Column(String(100))  # Which API endpoint triggered this
    request_summary = Column(Text)  # Brief summary of request (no PII)
    response_type = Column(String(50))  # BLOCK, WARN, ALLOW, JSON, etc.
    
    # Extra data (renamed from 'metadata' which is reserved in SQLAlchemy)
    extra_data = Column(JSONB, default={})
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Indexes for efficient querying
    __table_args__ = (
        Index('idx_ai_logs_user', 'user_id'),
        Index('idx_ai_logs_type', 'call_type'),
        Index('idx_ai_logs_created', 'created_at'),
        Index('idx_ai_logs_model', 'model'),
    )
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "call_type": self.call_type,
            "model": self.model,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "total_tokens": self.total_tokens,
            "cost_usd": self.cost_usd,
            "latency_ms": self.latency_ms,
            "success": self.success,
            "endpoint": self.endpoint,
            "response_type": self.response_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
    
    @staticmethod
    def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
        """Calculate cost in USD based on model and tokens."""
        # Pricing as of Jan 2026 - Gemini 2.5 Flash is FREE tier
        pricing = {
            "gemini-2.5-flash-preview-05-20": {"input": 0, "output": 0},  # FREE tier
            "gemini-2.0-flash": {"input": 0, "output": 0},  # FREE tier
            "gemini-2.0-flash-lite": {"input": 0, "output": 0},  # FREE tier
            # Legacy pricing for old models (for historical records)
            "gemini-1.5-flash-latest": {"input": 0.00025, "output": 0.0005},
            "gemini-1.5-pro-latest": {"input": 0.0025, "output": 0.005},
        }
        
        model_pricing = pricing.get(model, {"input": 0, "output": 0})  # Default to free
        
        input_cost = (input_tokens / 1000) * model_pricing["input"]
        output_cost = (output_tokens / 1000) * model_pricing["output"]
        
        return round(input_cost + output_cost, 6)
