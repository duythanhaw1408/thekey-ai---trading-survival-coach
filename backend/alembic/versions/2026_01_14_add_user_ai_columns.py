"""Add AI usage and shadow_score columns to users table

Revision ID: 2026_01_14_add_user_ai_columns
Revises: 2026_01_12_upgrade
Create Date: 2026-01-14

Migration to add missing columns to users table:
- daily_ai_calls: Track daily AI call count
- last_ai_reset: Track when AI call count was last reset
- monthly_ai_budget_usd: User's monthly AI budget
- shadow_score: Behavioral trust metrics (JSON)
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '2026_01_14_add_user_ai_columns'
down_revision = '2026_01_12_upgrade'
branch_labels = None
depends_on = None


def upgrade():
    # Add AI usage tracking columns
    op.add_column('users', 
        sa.Column('daily_ai_calls', sa.Integer, server_default='0', nullable=True)
    )
    op.add_column('users',
        sa.Column('last_ai_reset', sa.DateTime, server_default=sa.func.now(), nullable=True)
    )
    op.add_column('users',
        sa.Column('monthly_ai_budget_usd', sa.Numeric, server_default='5.0', nullable=True)
    )
    
    # Add shadow_score for behavioral trust metrics
    op.add_column('users',
        sa.Column('shadow_score', postgresql.JSON, nullable=True)
    )
    
    print("✅ Added daily_ai_calls, last_ai_reset, monthly_ai_budget_usd, and shadow_score to users table")


def downgrade():
    op.drop_column('users', 'shadow_score')
    op.drop_column('users', 'monthly_ai_budget_usd')
    op.drop_column('users', 'last_ai_reset')
    op.drop_column('users', 'daily_ai_calls')
    
    print("❌ Removed AI usage columns from users table")
