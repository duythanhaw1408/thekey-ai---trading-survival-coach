from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime, timezone, timedelta
from services.protection.revenge_blocker import RevengeTradePrevention
from services.protection.size_guardian import PositionSizeGuardian
from services.protection.fast_check import FastTradeCheck
from services.ai.gemini_client import gemini_client
from services.auth.dependencies import get_current_user
from models import get_db, User, Trade

router = APIRouter(prefix="/api/protection", tags=["protection"])

class TradeIntent(BaseModel):
    symbol: str
    side: str
    size: float
    entry_price: float
    account_balance: float

@router.post("/check-trade")
async def check_trade(data: Dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Check if a proposed trade violates any protection rules.
    
    Flow:
    1. Fast-path rules (< 100ms) - Deterministic, no AI
    2. Revenge blocker - Check consecutive losses
    3. AI evaluation - Deep analysis (2-5s)
    
    If step 1 or 2 BLOCKs, we skip step 3 for better performance.
    """
    # Extract data (matching frontend format)
    trade = data.get("trade", {})
    stats = data.get("stats", {})
    trade_history = data.get("tradeHistory", [])
    settings = data.get("settings", {})
    active_pattern = data.get("activePattern")
    market_analysis = data.get("marketAnalysis")

    # =============================================
    # PHASE 1: Fast-path Rules (< 100ms)
    # =============================================
    user_settings = {
        "account_balance": float(user.account_balance or 1000),
        "max_position_size_usd": float(user.max_position_size_usd or 500),
        "risk_per_trade_pct": float(user.risk_per_trade_pct or 2),
        "daily_trade_limit": int(user.daily_trade_limit or 5),
        "protection_level": user.protection_level or "SURVIVAL"
    }
    
    # Count today's trades
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_trade_count = db.query(func.count(Trade.id)).filter(
        Trade.user_id == user.id,
        Trade.entry_time >= today_start
    ).scalar() or 0
    
    fast_checker = FastTradeCheck(user_settings)
    fast_result = fast_checker.check(trade, today_trade_count)
    
    if fast_result:
        # Fast-check found an issue - return immediately
        return fast_result

    # =============================================
    # PHASE 2: Revenge Trade Blocker
    # =============================================
    recent_trades = db.query(Trade).filter(Trade.user_id == user.id).order_by(Trade.entry_time.desc()).limit(10).all()
    
    cooldown = user.cooldown_minutes or 30
    loss_limit = user.consecutive_loss_limit or 2
    
    revenge_blocker = RevengeTradePrevention(str(user.id), cooldown_minutes=cooldown, consecutive_loss_limit=loss_limit)
    revenge_result = await revenge_blocker.check_can_trade(recent_trades)
    
    if not revenge_result.get("allowed", True):
        return {
            "decision": "BLOCK",
            "reason": revenge_result.get("message"),
            "cooldown": revenge_result.get("cooldown_seconds", 1800),
            "recommended_size": 0,
            "rule": "REVENGE_TRADE"
        }

    # =============================================
    # PHASE 3: AI Evaluation (2-5s)
    # =============================================
    ai_context = {
        "account_balance": float(user.account_balance or 1000),
        "trade": trade,
        "stats": stats,
        "trade_history": trade_history,
        "settings": settings,
        "active_pattern": active_pattern,
        "market_danger": market_analysis.get("danger_level") if market_analysis else "Unknown"
    }
    
    ai_feedback = await gemini_client.get_trade_evaluation(ai_context)
    
    return ai_feedback


@router.get("/market-context")
async def get_market_context(user: User = Depends(get_current_user)):
    """Get AI-generated market danger analysis."""
    analysis = await gemini_client.generate_market_analysis()
    return analysis

@router.post("/analyze-trade")
async def analyze_trade(trade_data: Dict, user: User = Depends(get_current_user)):
    """Analyze a specific trade."""
    user_stats = {
        "survival_days": user.survival_score, # Using survival_score as proxy
        "discipline_score": user.survival_score # Placeholder
    }
    analysis = await gemini_client.analyze_trade(trade_data, user_stats)
    return analysis

@router.post("/emotional-tilt")
async def emotional_tilt(data: Dict, user: User = Depends(get_current_user)):
    """Detect emotional tilt and intervention message."""
    stats = data.get("stats", {})
    history = data.get("history", [])
    result = await gemini_client.detect_emotional_tilt(stats, history)
    return result
