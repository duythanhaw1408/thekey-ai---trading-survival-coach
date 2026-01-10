from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
import json

from models import get_db, User, get_db_connection
from services.auth.dependencies import get_current_user
from services.ai.gemini_client import gemini_client

router = APIRouter(prefix="/api/learning", tags=["Learning Engine"])

# ============================================
# Pydantic Models
# ============================================

class TradeOutcomeCorrelation(BaseModel):
    process_score_bucket: int  # 0-10, 10-20, etc.
    profitability: str  # 'WIN', 'LOSS', 'BREAKEVEN'
    emotion_at_entry: Optional[str] = "NEUTRAL"
    pattern_type: Optional[str] = None
    pnl: float = 0

class ShadowScorePattern(BaseModel):
    trust_level: str  # 'HIGH', 'MEDIUM', 'LOW'
    honesty_score: float
    outcome: str  # 'WIN', 'LOSS', 'BREAKEVEN'

class CrisisRecoveryData(BaseModel):
    action_taken: str
    recovery_time_hours: float
    was_successful: bool

class CrowdMetricsSnapshot(BaseModel):
    total_active_users: int
    users_in_crisis_mode: int
    average_shadow_score: float
    average_discipline_score: float
    average_process_score: float
    top_active_patterns: List[str]
    fear_greed_index: Optional[int] = None
    btc_price: Optional[float] = None
    market_sentiment: Optional[str] = None

class LearningInsight(BaseModel):
    insight_type: str  # 'CORRELATION', 'PATTERN', 'ANOMALY', 'TREND'
    confidence: float
    description: str
    is_actionable: bool = False
    recommendation: Optional[str] = None
    sample_size: int = 0

# ============================================
# Routes
# ============================================

@router.post("/correlations/record")
async def record_correlation(data: TradeOutcomeCorrelation, user: User = Depends(get_current_user)):
    """Record a trade outcome correlation for learning"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Determine bucket (e.g. 75 -> 70 bucket)
        bucket = (data.process_score_bucket // 10) * 10
        
        cursor.execute("""
            INSERT INTO trade_outcome_correlations 
                (process_score_bucket, profitability, emotion_at_entry, pattern_type, trade_count, total_pnl, avg_pnl)
            VALUES (%s, %s, %s, %s, 1, %s, %s)
            ON CONFLICT (process_score_bucket, profitability, emotion_at_entry, COALESCE(pattern_type, '')) 
            DO UPDATE SET 
                trade_count = trade_outcome_correlations.trade_count + 1,
                total_pnl = trade_outcome_correlations.total_pnl + EXCLUDED.total_pnl,
                avg_pnl = (trade_outcome_correlations.total_pnl + EXCLUDED.total_pnl) / (trade_outcome_correlations.trade_count + 1),
                last_updated = NOW()
        """, (bucket, data.profitability, data.emotion_at_entry, data.pattern_type or '', data.pnl, data.pnl))
        
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "recorded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/archetype")
async def get_archetype(data: Dict, user: User = Depends(get_current_user)):
    """Analyze and discover the user's trader archetype using AI."""
    trade_history = data.get("trade_history", [])
    checkin_history = data.get("checkin_history", [])
    
    analysis = await gemini_client.get_trader_archetype(trade_history, checkin_history)
    return analysis

@router.post("/shadow-patterns/record")
async def record_shadow_pattern(data: ShadowScorePattern, user: User = Depends(get_current_user)):
    """Record a shadow score pattern for learning"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Upsert logic for shadow patterns
        cursor.execute("""
            INSERT INTO shadow_score_patterns 
                (trust_level, average_honesty_score, outcome_correlation, sample_size)
            VALUES (%s, %s, %s, 1)
            ON CONFLICT (trust_level) 
            DO UPDATE SET 
                average_honesty_score = (shadow_score_patterns.average_honesty_score * shadow_score_patterns.sample_size + EXCLUDED.average_honesty_score) / (shadow_score_patterns.sample_size + 1),
                outcome_correlation = (shadow_score_patterns.outcome_correlation * shadow_score_patterns.sample_size + 
                    (CASE WHEN EXCLUDED.trust_level = 'WIN' THEN 1 WHEN EXCLUDED.trust_level = 'LOSS' THEN -1 ELSE 0 END)) / (shadow_score_patterns.sample_size + 1),
                sample_size = shadow_score_patterns.sample_size + 1,
                updated_at = NOW()
        """, (data.trust_level, data.honesty_score, data.outcome))
        
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "recorded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/crisis-recovery/record")
async def record_crisis_recovery(data: CrisisRecoveryData, user: User = Depends(get_current_user)):
    """Record a crisis recovery event for learning"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO crisis_recovery_data 
                (user_id, action_taken, recovery_time_hours, was_successful, crisis_triggered_at)
            VALUES (%s, %s, %s, %s, NOW())
        """, (user.id, data.action_taken, data.recovery_time_hours, data.was_successful))
        
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "recorded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crowd-metrics/snapshot")
async def record_crowd_snapshot(data: CrowdMetricsSnapshot):
    """Record a snapshot of community metrics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        percent_crisis = (data.users_in_crisis_mode / data.total_active_users * 100) if data.total_active_users > 0 else 0
        
        cursor.execute("""
            INSERT INTO crowd_metrics 
                (total_active_users, users_in_crisis_mode, percent_in_crisis, 
                 average_shadow_score, average_discipline_score, average_process_score,
                 top_active_patterns, fear_greed_index, btc_price, market_sentiment)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            data.total_active_users,
            data.users_in_crisis_mode,
            percent_crisis,
            data.average_shadow_score,
            data.average_discipline_score,
            data.average_process_score,
            json.dumps(data.top_active_patterns),
            data.fear_greed_index,
            data.btc_price,
            data.market_sentiment
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"status": "recorded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/correlations")
async def get_correlations():
    """Get all trade outcome correlations"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT process_score_bucket, profitability, emotion_at_entry, pattern_type, 
                   trade_count, avg_pnl
            FROM trade_outcome_correlations
            ORDER BY trade_count DESC
            LIMIT 50
        """)
        
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return [
            {
                "process_score_bucket": row[0],
                "profitability": row[1],
                "emotion_at_entry": row[2],
                "pattern_type": row[3],
                "trade_count": row[4],
                "avg_pnl": float(row[5]) if row[5] else 0
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights")
async def get_active_insights():
    """Get all active learning insights"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, insight_type, confidence, description, is_actionable, recommendation
            FROM learning_insights
            WHERE is_active = TRUE
            ORDER BY confidence DESC, created_at DESC
            LIMIT 10
        """)
        
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return [
            {
                "id": str(row[0]),
                "insight_type": row[1],
                "confidence": float(row[2]),
                "description": row[3],
                "is_actionable": row[4],
                "recommendation": row[5]
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/insights")
async def save_insight(data: LearningInsight):
    """Save a new learning insight"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO learning_insights 
                (insight_type, confidence, description, is_actionable, recommendation, sample_size)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            data.insight_type,
            data.confidence,
            data.description,
            data.is_actionable,
            data.recommendation,
            data.sample_size
        ))
        
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"id": str(result[0]), "status": "created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_learning_stats():
    """Get overall learning engine statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        stats = {}
        
        # Get correlation count
        cursor.execute("SELECT COUNT(*), SUM(trade_count) FROM trade_outcome_correlations")
        row = cursor.fetchone()
        stats["correlation_buckets"] = row[0]
        stats["total_trades_learned"] = row[1] or 0
        
        # Get shadow pattern count
        cursor.execute("SELECT COUNT(*), SUM(sample_size) FROM shadow_score_patterns")
        row = cursor.fetchone()
        stats["shadow_patterns"] = row[0]
        stats["shadow_samples"] = row[1] or 0
        
        # Get crisis recovery count
        cursor.execute("SELECT COUNT(*), AVG(recovery_time_hours) FROM crisis_recovery_data WHERE was_successful = TRUE")
        row = cursor.fetchone()
        stats["successful_recoveries"] = row[0]
        stats["avg_recovery_hours"] = float(row[1]) if row[1] else 0
        
        # Get active insights count
        cursor.execute("SELECT COUNT(*) FROM learning_insights WHERE is_active = TRUE")
        stats["active_insights"] = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
