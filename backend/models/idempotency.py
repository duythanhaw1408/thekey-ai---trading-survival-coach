# backend/models/idempotency.py
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from .base import Base
import uuid

class IdempotencyKey(Base):
    """Model to track processed request IDs to prevent duplicate operations."""
    __tablename__ = "idempotency_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    request_key = Column(String, nullable=False, index=True) # The X-Idempotency-Key
    
    # Optional: Store the response to return the same thing on retry
    response_body = Column(String, nullable=True) 
    status_code = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
