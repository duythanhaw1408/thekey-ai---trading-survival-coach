"""Add kb_documents and ai_call_logs tables

Revision ID: 2026_01_12_upgrade
Revises: 
Create Date: 2026-01-12

Migration for THEKEY Roadmap Phases 3 & 4:
- kb_documents: Knowledge Base for RAG
- ai_call_logs: AI cost tracking
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '2026_01_12_upgrade'
down_revision = None  # Set to previous migration if exists
branch_labels = None
depends_on = None


def upgrade():
    # ================================================
    # KB Documents Table (Phase 3: RAG)
    # ================================================
    op.create_table(
        'kb_documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, 
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('summary', sa.Text),
        sa.Column('category', sa.String(50), nullable=False, server_default='policy'),
        sa.Column('tags', postgresql.ARRAY(sa.String)),
        sa.Column('applies_to', postgresql.ARRAY(sa.String)),
        sa.Column('severity', sa.String(20), server_default='MEDIUM'),
        sa.Column('embedding', postgresql.JSONB),  # For vector search fallback
        sa.Column('version', sa.String(20), server_default='1.0'),
        sa.Column('source', sa.String(100)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Indexes for KB
    op.create_index('idx_kb_category', 'kb_documents', ['category'])
    op.create_index('idx_kb_tags', 'kb_documents', ['tags'], postgresql_using='gin')
    op.create_index('idx_kb_applies_to', 'kb_documents', ['applies_to'], postgresql_using='gin')
    
    # ================================================
    # AI Call Logs Table (Phase 4: Observability)
    # ================================================
    op.create_table(
        'ai_call_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('call_type', sa.String(50), nullable=False),
        sa.Column('model', sa.String(50), nullable=False),
        sa.Column('input_tokens', sa.Integer, server_default='0'),
        sa.Column('output_tokens', sa.Integer, server_default='0'),
        sa.Column('total_tokens', sa.Integer, server_default='0'),
        sa.Column('cost_usd', sa.Float, server_default='0.0'),
        sa.Column('latency_ms', sa.Integer, server_default='0'),
        sa.Column('success', sa.String(10), server_default='true'),
        sa.Column('error_message', sa.Text),
        sa.Column('endpoint', sa.String(100)),
        sa.Column('request_summary', sa.Text),
        sa.Column('response_type', sa.String(50)),
        sa.Column('metadata', postgresql.JSONB, server_default='{}'),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )
    
    # Indexes for AI Logs
    op.create_index('idx_ai_logs_user', 'ai_call_logs', ['user_id'])
    op.create_index('idx_ai_logs_type', 'ai_call_logs', ['call_type'])
    op.create_index('idx_ai_logs_created', 'ai_call_logs', ['created_at'])
    op.create_index('idx_ai_logs_model', 'ai_call_logs', ['model'])
    
    print("✅ Created kb_documents and ai_call_logs tables")


def downgrade():
    # Drop indexes
    op.drop_index('idx_ai_logs_model')
    op.drop_index('idx_ai_logs_created')
    op.drop_index('idx_ai_logs_type')
    op.drop_index('idx_ai_logs_user')
    
    op.drop_index('idx_kb_applies_to')
    op.drop_index('idx_kb_tags')
    op.drop_index('idx_kb_category')
    
    # Drop tables
    op.drop_table('ai_call_logs')
    op.drop_table('kb_documents')
    
    print("❌ Dropped kb_documents and ai_call_logs tables")
