# backend/models/kb_document.py
"""
THEKEY Knowledge Base Document Model
Stores trading policies, playbooks, and FAQs for RAG retrieval.
"""

from sqlalchemy import Column, String, Text, ARRAY, DateTime, Float, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from models.base import Base


class KBDocument(Base):
    """
    Knowledge Base Document for RAG retrieval.
    
    Categories:
    - policy: Trading rules and protection guidelines
    - playbook: Step-by-step guides for specific situations
    - faq: Frequently asked questions
    - psychology: Mental models and emotional management
    """
    __tablename__ = "kb_documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Content
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(Text)  # Short summary for quick retrieval
    
    # Categorization
    category = Column(String(50), nullable=False, default="policy")
    # Categories: policy, playbook, faq, psychology
    
    tags = Column(ARRAY(String), default=[])
    # Tags for filtering: risk, emotion, position_size, stop_loss, etc.
    
    # Applicability
    applies_to = Column(ARRAY(String), default=["all"])
    # Contexts: pre_trade, post_trade, crisis, daily_checkin, all
    
    severity = Column(String(20), default="MEDIUM")
    # Severity: LOW, MEDIUM, HIGH, CRITICAL
    
    # Embedding for vector search (768 dimensions for Gemini embeddings)
    # Note: pgvector extension must be enabled: CREATE EXTENSION IF NOT EXISTS vector;
    # Then: ALTER TABLE kb_documents ADD COLUMN embedding vector(768);
    # For now, we store as JSONB and convert when needed
    embedding = Column(JSONB)  # List of 768 floats
    
    # Metadata
    version = Column(String(20), default="1.0")
    source = Column(String(100))  # Where this knowledge came from
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes for efficient retrieval
    __table_args__ = (
        Index('idx_kb_category', 'category'),
        Index('idx_kb_tags', 'tags', postgresql_using='gin'),
        Index('idx_kb_applies_to', 'applies_to', postgresql_using='gin'),
    )
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "title": self.title,
            "content": self.content,
            "summary": self.summary,
            "category": self.category,
            "tags": self.tags or [],
            "applies_to": self.applies_to or [],
            "severity": self.severity,
            "version": self.version,
            "source": self.source,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f"<KBDocument(id={self.id}, title='{self.title}', category='{self.category}')>"
