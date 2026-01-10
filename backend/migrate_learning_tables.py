#!/usr/bin/env python3
"""
Migration script to create learning engine tables in the database.
This adds tables for AI self-learning, crowd wisdom, and AI predictions tracking.
"""

import os
import asyncio
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment
DATABASE_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ Error: SUPABASE_DB_URL or DATABASE_URL not found in environment")
    exit(1)

async def run_migration():
    from sqlalchemy.ext.asyncio import create_async_engine
    
    # Convert to async URL if needed
    if DATABASE_URL.startswith("postgresql://"):
        async_url = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    elif DATABASE_URL.startswith("postgres://"):
        async_url = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://")
    else:
        async_url = DATABASE_URL
    
    engine = create_async_engine(async_url, echo=False)
    
    migration_sql = """
    -- AI Predictions tracking for accuracy validation
    CREATE TABLE IF NOT EXISTS ai_predictions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
        decision TEXT NOT NULL,
        confidence DECIMAL,
        reason TEXT,
        rule TEXT,
        trade_intent JSONB,
        user_action TEXT,
        outcome TEXT,
        outcome_pnl DECIMAL,
        was_correct BOOLEAN,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        outcome_updated_at TIMESTAMP WITH TIME ZONE
    );

    CREATE INDEX IF NOT EXISTS idx_ai_predictions_user ON ai_predictions(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_predictions_decision ON ai_predictions(decision);
    CREATE INDEX IF NOT EXISTS idx_ai_predictions_outcome ON ai_predictions(was_correct);

    -- Trade outcome correlations
    CREATE TABLE IF NOT EXISTS trade_outcome_correlations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        process_score_bucket INTEGER NOT NULL,
        profitability TEXT NOT NULL,
        emotion_at_entry TEXT,
        pattern_type TEXT,
        trade_count INTEGER DEFAULT 1,
        total_pnl DECIMAL DEFAULT 0,
        avg_pnl DECIMAL DEFAULT 0,
        first_recorded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(process_score_bucket, profitability, emotion_at_entry, pattern_type)
    );

    -- Shadow score patterns
    CREATE TABLE IF NOT EXISTS shadow_score_patterns (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        trust_level TEXT NOT NULL,
        average_honesty_score DECIMAL DEFAULT 0,
        outcome_correlation DECIMAL DEFAULT 0,
        sample_size INTEGER DEFAULT 0,
        total_wins INTEGER DEFAULT 0,
        total_losses INTEGER DEFAULT 0,
        total_breakeven INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(trust_level)
    );

    -- Crisis recovery data
    CREATE TABLE IF NOT EXISTS crisis_recovery_data (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        crisis_triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
        recovery_completed_at TIMESTAMP WITH TIME ZONE,
        recovery_time_hours DECIMAL,
        action_taken TEXT NOT NULL,
        action_completed BOOLEAN DEFAULT FALSE,
        was_successful BOOLEAN,
        trades_after_recovery INTEGER DEFAULT 0,
        pnl_after_recovery DECIMAL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_crisis_recovery_user ON crisis_recovery_data(user_id, crisis_triggered_at DESC);
    CREATE INDEX IF NOT EXISTS idx_crisis_recovery_action ON crisis_recovery_data(action_taken, was_successful);

    -- Crowd/community metrics
    CREATE TABLE IF NOT EXISTS crowd_metrics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        snapshot_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        total_active_users INTEGER DEFAULT 0,
        users_in_crisis_mode INTEGER DEFAULT 0,
        percent_in_crisis DECIMAL DEFAULT 0,
        average_shadow_score DECIMAL DEFAULT 0,
        average_discipline_score DECIMAL DEFAULT 0,
        average_process_score DECIMAL DEFAULT 0,
        top_active_patterns JSONB DEFAULT '[]',
        fear_greed_index INTEGER,
        btc_price DECIMAL,
        market_sentiment TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_crowd_metrics_time ON crowd_metrics(snapshot_time DESC);

    -- AI-generated learning insights
    CREATE TABLE IF NOT EXISTS learning_insights (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        insight_type TEXT NOT NULL,
        confidence DECIMAL NOT NULL,
        description TEXT NOT NULL,
        is_actionable BOOLEAN DEFAULT FALSE,
        recommendation TEXT,
        sample_size INTEGER,
        data_range_start TIMESTAMP WITH TIME ZONE,
        data_range_end TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE,
        dismissed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_learning_insights_active ON learning_insights(is_active, created_at DESC);

    -- User learning preferences
    CREATE TABLE IF NOT EXISTS user_learning_preferences (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        contribute_to_crowd_wisdom BOOLEAN DEFAULT TRUE,
        receive_ai_insights BOOLEAN DEFAULT TRUE,
        min_process_score_to_trade INTEGER DEFAULT 60,
        auto_block_on_crisis BOOLEAN DEFAULT TRUE,
        focus_areas TEXT[] DEFAULT ARRAY['EMOTION', 'RISK'],
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """

    async with engine.begin() as conn:
        print("🚀 Starting migration for learning engine tables...")
        
        # Split and execute each statement
        statements = [s.strip() for s in migration_sql.split(';') if s.strip()]
        
        for i, stmt in enumerate(statements):
            try:
                await conn.execute(text(stmt))
                # Extract table/index name for logging
                if 'CREATE TABLE' in stmt:
                    table_name = stmt.split('CREATE TABLE IF NOT EXISTS ')[1].split('(')[0].strip()
                    print(f"  ✅ Created/verified table: {table_name}")
                elif 'CREATE INDEX' in stmt:
                    idx_name = stmt.split('CREATE INDEX IF NOT EXISTS ')[1].split(' ON ')[0].strip()
                    print(f"  ✅ Created/verified index: {idx_name}")
            except Exception as e:
                print(f"  ⚠️ Statement {i+1}: {str(e)[:80]}")
        
        print("\n✅ Migration completed successfully!")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())
