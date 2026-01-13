from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models import get_db, Trade, User
from sqlalchemy import func
import uuid
from services.ai.gemini_client import gemini_client
from services.ai.ai_tracking import AITracker
from services.auth.dependencies import get_current_user
from typing import Dict
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/progress", tags=["progress"])

@router.get("/summary")
async def get_progress_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get dynamic survival score and trade statistics."""
    # 1. Trade Discipline Score (Base: 50)
    # Penalize for taking trades with ai_decision == "BLOCK"
    total_trades = db.query(Trade).filter(Trade.user_id == user.id).count()
    blocked_trades_taken = db.query(Trade).filter(
        Trade.user_id == user.id, 
        Trade.ai_decision == "BLOCK"
    ).count()
    
    discipline_score = max(0, 100 - (blocked_trades_taken * 15)) if total_trades > 0 else 100
    
    # 2. Consistency Score (Check-ins in last 7 days)
    checkin_count = db.query(Checkin).filter(
        Checkin.user_id == user.id,
        Checkin.created_at >= datetime.utcnow() - timedelta(days=7)
    ).count()
    consistency_score = (checkin_count / 7) * 100
    
    # 3. Behavioral Integrity (Shadow Score)
    # Get trust score from JSON field (default to 100)
    shadow_data = user.shadow_score if isinstance(user.shadow_score, dict) else {}
    trust_score = shadow_data.get("trust_score", 100)
    
    # 4. Overall Survival Score (Weighted average with Shadow Score Influence)
    # Shadow Score acts as both a component and a multiplier dampener
    base_score = (discipline_score * 0.55) + (consistency_score * 0.25) + (trust_score * 0.20)
    
    # Dampening factor: If trust is low, it heavily penalizes the final result
    # trust_factor ranges from 0.5 (very suspicious) to 1.0 (fully trusted)
    trust_factor = 0.5 + (trust_score / 200) 
    survival_score = int(base_score * trust_factor)
    
    # Update user's survival score in DB
    user.survival_score = survival_score
    db.commit()
    
    winning_trades = db.query(Trade).filter(Trade.user_id == user.id, Trade.pnl > 0).count()
    win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
    
    return {
        "survival_score": survival_score,
        "total_trades": total_trades,
        "win_rate": round(win_rate, 2),
        "status": "SURVIVAL" if survival_score < 40 else ("DISCIPLINE" if survival_score < 80 else "MASTER"),
        "discipline_score": discipline_score,
        "consistency_score": int(consistency_score),
        "trust_score": trust_score
    }

@router.post("/weekly-goals")
async def get_weekly_goals(data: Dict, user: User = Depends(get_current_user)):
    history = data.get("history", [])
    stats = data.get("stats", {})
    checkin_history = data.get("checkinHistory", [])
    result = await gemini_client.generate_weekly_goals(history, stats, checkin_history)
    return result

@router.post("/weekly-report")
async def get_weekly_report(data: Dict, user: User = Depends(get_current_user)):
    history = data.get("history", [])
    result = await gemini_client.generate_weekly_report(history)
    return result

@router.post("/archetype")
async def get_archetype(data: Dict, user: User = Depends(get_current_user)):
    history = data.get("history", [])
    checkin_history = data.get("checkinHistory", [])
    result = await gemini_client.analyze_trader_archetype(history, checkin_history)
    return result

@router.get("/ai-accuracy")
async def get_ai_accuracy(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get AI decision accuracy statistics.
    
    Returns:
        - overall_accuracy: float (0.0 - 1.0)
        - by_decision: Dict with BLOCK/WARN/ALLOW accuracy
        - override_analysis: Stats on user overrides
        - insights: List of auto-generated insight messages
    """
    tracker = AITracker(db)
    stats = tracker.get_accuracy_stats(user.id)
    return stats
