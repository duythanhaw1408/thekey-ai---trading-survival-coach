from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models import get_db, Trade, User
from sqlalchemy import func
import uuid
from services.ai.gemini_client import gemini_client
from services.ai.ai_tracking import AITracker
from services.auth.dependencies import get_current_user
from typing import Dict

router = APIRouter(prefix="/api/progress", tags=["progress"])

@router.get("/summary")
async def get_progress_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get survival score and trade statistics for the current user."""
    total_trades = db.query(Trade).filter(Trade.user_id == user.id).count()
    winning_trades = db.query(Trade).filter(Trade.user_id == user.id, Trade.pnl > 0).count()
    
    win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
    
    return {
        "survival_score": user.survival_score,
        "total_trades": total_trades,
        "win_rate": round(win_rate, 2),
        "status": "STABILIZING" if user.survival_score < 70 else "PRO"
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
