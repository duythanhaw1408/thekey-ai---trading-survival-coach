-- database/schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- NULL for Google-only users
    google_id TEXT UNIQUE, -- For Google OAuth
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Email verification
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token TEXT,
    email_verification_expires TIMESTAMP WITH TIME ZONE,
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_pro BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- User preferences
    cooldown_minutes INTEGER DEFAULT 30,
    max_position_size_pct DECIMAL DEFAULT 0.05,
    daily_trade_limit INTEGER DEFAULT 5,
    
    -- Stats cache (denormalized for performance)
    survival_score INTEGER DEFAULT 50,
    current_streak INTEGER DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    
    -- Gamification & Mastery
    xp INTEGER DEFAULT 0,
    level TEXT DEFAULT 'NOVICE'
);

-- Sessions table for JWT refresh tokens
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    device_info TEXT,
    ip_address TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_token UNIQUE (user_id, refresh_token)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);


-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    symbol TEXT NOT NULL,
    side TEXT NOT NULL, -- 'BUY' or 'SELL'
    entry_price DECIMAL NOT NULL,
    exit_price DECIMAL,
    quantity DECIMAL NOT NULL,
    
    pnl DECIMAL,
    pnl_pct DECIMAL,
    
    -- Metadata
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'OPEN', -- 'OPEN', 'CLOSED'
    
    -- AI Decision info
    ai_decision TEXT, -- 'ALLOW', 'WARN', 'BLOCK'
    ai_reason TEXT,
    
    -- Tags for analysis
    tags TEXT[], -- ['revenge_trade', 'fomo', etc]
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_trades_user_time ON trades(user_id, entry_time DESC);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(user_id, status);

-- Protection logs
CREATE TABLE IF NOT EXISTS protection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    protection_type TEXT NOT NULL, -- 'revenge_block', 'size_warning', etc
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Context
    trigger_reason TEXT,
    trade_intent JSONB, -- Store intended trade details
    user_decision TEXT, -- 'accepted', 'overridden', 'cancelled'
    
    -- Outcome (filled later if user proceeded)
    outcome_pnl DECIMAL,
    outcome_notes TEXT
);

-- AI Predictions tracking for accuracy validation
CREATE TABLE IF NOT EXISTS ai_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Trade reference (null if trade was blocked and not created)
    trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
    
    -- AI Decision
    decision TEXT NOT NULL, -- 'ALLOW', 'WARN', 'BLOCK'
    confidence DECIMAL, -- 0.0 to 1.0
    reason TEXT,
    rule TEXT, -- Which rule triggered: 'FAST_CHECK', 'REVENGE_TRADE', 'AI_EVAL'
    
    -- Trade intent (stored for blocked trades that have no trade_id)
    trade_intent JSONB,
    
    -- User Response
    user_action TEXT, -- 'FOLLOWED', 'OVERRODE', 'CANCELLED'
    
    -- Outcome (updated when trade closes)
    outcome TEXT, -- 'WIN', 'LOSS', 'BREAKEVEN', 'PENDING'
    outcome_pnl DECIMAL,
    was_correct BOOLEAN, -- AI decision was correct
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    outcome_updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_ai_predictions_user ON ai_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_decision ON ai_predictions(decision);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_outcome ON ai_predictions(was_correct);


-- Daily check-ins
CREATE TABLE IF NOT EXISTS checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    
    -- Questions & Answers (flexible JSONB)
    questions JSONB NOT NULL,
    answers JSONB NOT NULL,
    
    -- AI analysis
    insights TEXT,
    action_items TEXT[],
    
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- Patterns detected
CREATE TABLE IF NOT EXISTS patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    pattern_type TEXT NOT NULL, -- 'revenge_trading', 'fomo', etc
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evidence
    sample_trades UUID[], -- Array of trade IDs
    frequency TEXT, -- 'high', 'medium', 'low'
    impact_description TEXT,
    
    -- Status
    status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'FIXING', 'FIXED'
    fixed_at TIMESTAMP WITH TIME ZONE
);

-- Weekly goals
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    
    -- Primary goal
    primary_goal_title TEXT NOT NULL,
    primary_goal_description TEXT,
    primary_goal_metric TEXT,
    primary_goal_target TEXT,
    
    -- Secondary goal
    secondary_goal_title TEXT,
    secondary_goal_description TEXT,
    secondary_goal_metric TEXT,
    secondary_goal_target TEXT,
    
    -- Progress tracking
    primary_progress DECIMAL DEFAULT 0,
    secondary_progress DECIMAL DEFAULT 0,
    
    -- Completion
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, week_start)
);

-- Milestones
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    milestone_id TEXT NOT NULL, -- 'survived_7_days', etc
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Celebration
    seen BOOLEAN DEFAULT FALSE,
    
    UNIQUE(user_id, milestone_id)
);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Protection settings
    revenge_blocker_enabled BOOLEAN DEFAULT TRUE,
    position_guardian_enabled BOOLEAN DEFAULT TRUE,
    trade_limiter_enabled BOOLEAN DEFAULT TRUE,
    
    -- Notification preferences
    daily_checkin_reminder BOOLEAN DEFAULT TRUE,
    milestone_notifications BOOLEAN DEFAULT TRUE,
    
    -- Display preferences
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'vi',
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LEARNING ENGINE TABLES (AI Self-Learning)
-- ============================================

-- Trade outcome correlations (Process Score vs Win/Loss)
CREATE TABLE IF NOT EXISTS trade_outcome_correlations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Correlation data
    process_score_bucket INTEGER NOT NULL, -- 0-10, 10-20, etc.
    profitability TEXT NOT NULL, -- 'WIN', 'LOSS', 'BREAKEVEN'
    emotion_at_entry TEXT, -- 'NEUTRAL', 'FOMO', 'FEAR', etc.
    pattern_type TEXT, -- 'REVENGE', 'OVERTRADING', etc.
    
    -- Aggregated counts
    trade_count INTEGER DEFAULT 1,
    total_pnl DECIMAL DEFAULT 0,
    avg_pnl DECIMAL DEFAULT 0,
    
    -- Timestamps
    first_recorded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(process_score_bucket, profitability, emotion_at_entry, pattern_type)
);

-- Shadow score patterns (Honesty vs Outcome correlation)
CREATE TABLE IF NOT EXISTS shadow_score_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    trust_level TEXT NOT NULL, -- 'HIGH', 'MEDIUM', 'LOW'
    
    -- Metrics
    average_honesty_score DECIMAL DEFAULT 0,
    outcome_correlation DECIMAL DEFAULT 0, -- -1 to 1
    sample_size INTEGER DEFAULT 0,
    
    -- Win/Loss breakdown
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    total_breakeven INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(trust_level)
);

-- Crisis recovery data
CREATE TABLE IF NOT EXISTS crisis_recovery_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Recovery details
    crisis_triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    recovery_completed_at TIMESTAMP WITH TIME ZONE,
    recovery_time_hours DECIMAL,
    
    -- Actions taken
    action_taken TEXT NOT NULL, -- 'breathing', 'journaling', 'break', etc.
    action_completed BOOLEAN DEFAULT FALSE,
    
    -- Outcome
    was_successful BOOLEAN,
    trades_after_recovery INTEGER DEFAULT 0,
    pnl_after_recovery DECIMAL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for crisis recovery analysis
CREATE INDEX IF NOT EXISTS idx_crisis_recovery_user ON crisis_recovery_data(user_id, crisis_triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_recovery_action ON crisis_recovery_data(action_taken, was_successful);

-- Crowd/community metrics (aggregated)
CREATE TABLE IF NOT EXISTS crowd_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Snapshot timestamp
    snapshot_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Community stats
    total_active_users INTEGER DEFAULT 0,
    users_in_crisis_mode INTEGER DEFAULT 0,
    percent_in_crisis DECIMAL DEFAULT 0,
    
    -- Aggregate scores
    average_shadow_score DECIMAL DEFAULT 0,
    average_discipline_score DECIMAL DEFAULT 0,
    average_process_score DECIMAL DEFAULT 0,
    
    -- Top patterns (as JSON array)
    top_active_patterns JSONB DEFAULT '[]',
    
    -- Market context at time of snapshot
    fear_greed_index INTEGER,
    btc_price DECIMAL,
    market_sentiment TEXT -- 'BULLISH', 'BEARISH', 'NEUTRAL', etc.
);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_crowd_metrics_time ON crowd_metrics(snapshot_time DESC);

-- AI-generated learning insights
CREATE TABLE IF NOT EXISTS learning_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Insight details
    insight_type TEXT NOT NULL, -- 'CORRELATION', 'PATTERN', 'ANOMALY', 'TREND'
    confidence DECIMAL NOT NULL, -- 0 to 1
    description TEXT NOT NULL,
    
    -- Actionability
    is_actionable BOOLEAN DEFAULT FALSE,
    recommendation TEXT,
    
    -- Source data
    sample_size INTEGER,
    data_range_start TIMESTAMP WITH TIME ZONE,
    data_range_end TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for active insights
CREATE INDEX IF NOT EXISTS idx_learning_insights_active ON learning_insights(is_active, created_at DESC);

-- User-specific learning preferences
CREATE TABLE IF NOT EXISTS user_learning_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Opt-in settings
    contribute_to_crowd_wisdom BOOLEAN DEFAULT TRUE,
    receive_ai_insights BOOLEAN DEFAULT TRUE,
    
    -- Personal thresholds
    min_process_score_to_trade INTEGER DEFAULT 60,
    auto_block_on_crisis BOOLEAN DEFAULT TRUE,
    
    -- Learning focus areas
    focus_areas TEXT[] DEFAULT ARRAY['EMOTION', 'RISK'],
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
