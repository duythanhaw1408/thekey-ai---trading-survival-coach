from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime, timezone, timedelta
from services.rule_engine import rule_engine, EngineResult
from services.protection.revenge_blocker import RevengeTradePrevention
from services.protection.size_guardian import PositionSizeGuardian
from services.protection.fast_check import FastTradeCheck
from services.ai.gemini_client import gemini_client
from services.ai.ai_tracking import AITracker
from services.auth.dependencies import get_current_user
from models import get_db, User, Trade
import time

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
    
    Flow (Optimized for latency):
    1. Rule Engine (<100ms) - Deterministic, no AI cost
    2. If GRAY_ZONE, fall back to AI evaluation (500-800ms)
    
    This reduces AI calls by ~90% and latency from 1-2s to <100ms for most cases.
    """
    start_time = time.time()
    
    # Extract data (matching frontend format)
    trade = data.get("trade", {})
    stats = data.get("stats", {})
    trade_history = data.get("tradeHistory", [])
    settings = data.get("settings", {})
    active_pattern = data.get("activePattern")
    market_analysis = data.get("marketAnalysis")

    # Build user settings from DB + request
    user_settings = {
        "account_balance": float(user.account_balance or 1000),
        "max_position_size_usd": float(user.max_position_size_usd or 500),
        "max_position_size_pct": 5.0,
        "risk_per_trade_pct": float(user.risk_per_trade_pct or 2),
        "max_daily_trades": int(user.daily_trade_limit or 5),
        "protection_level": user.protection_level or "SURVIVAL",
        "cooldown_after_loss_minutes": int(user.cooldown_minutes or 30),
        "max_consecutive_losses_block": int(user.consecutive_loss_limit or 2),
        "max_consecutive_losses_warn": 1,
    }

    # =============================================
    # PHASE 1: Rule Engine (<100ms, no AI cost)
    # =============================================
    engine_result: EngineResult = rule_engine.evaluate(
        trade=trade,
        stats=stats,
        trade_history=trade_history,
        user_settings=user_settings
    )
    
    rule_latency = (time.time() - start_time) * 1000
    print(f"[Protection] Rule Engine completed in {rule_latency:.0f}ms - Decision: {engine_result.decision}")
    
    # If Rule Engine gives a clear decision (not GRAY_ZONE), return immediately
    if engine_result.decision in ["BLOCK", "WARN", "ALLOW"] and not engine_result.needs_ai:
        # Track for AI accuracy dashboard (rule-based decision)
        tracker = AITracker(db)
        tracker.log_decision(
            user_id=user.id,
            decision=engine_result.decision if engine_result.decision != "ALLOW" else "ALLOW",
            reason=engine_result.reason,
            rule="RULE_ENGINE",
            trade_intent=trade,
            confidence=1.0  # Deterministic rules have high confidence
        )
        
        return {
            "decision": engine_result.decision,
            "reason": engine_result.reason,
            "cooldown": engine_result.cooldown,
            "recommended_size": engine_result.recommended_size,
            "rule": "FAST_PATH",
            "latency_ms": rule_latency,
            "triggered_rules": engine_result.triggered_rules
        }

    # =============================================
    # PHASE 2: AI Evaluation (only for GRAY_ZONE cases)
    # =============================================
    print(f"[Protection] Falling back to AI for gray zone case...")
    
    ai_context = {
        "account_balance": float(user.account_balance or 1000),
        "trade": trade,
        "stats": stats,
        "trade_history": trade_history,
        "settings": settings,
        "active_pattern": active_pattern,
        "market_danger": market_analysis.get("danger_level") if market_analysis else "Unknown",
        "rule_engine_hints": engine_result.triggered_rules  # Help AI focus
    }
    
    ai_feedback = await gemini_client.get_trade_evaluation(ai_context)
    
    total_latency = (time.time() - start_time) * 1000
    print(f"[Protection] AI evaluation completed in {total_latency:.0f}ms total")
    
    # Track AI decision
    tracker = AITracker(db)
    tracker.log_decision(
        user_id=user.id,
        decision=ai_feedback.get("decision", "ALLOW"),
        reason=ai_feedback.get("reason", ""),
        rule="AI_EVALUATION",
        trade_intent=trade,
        confidence=0.8
    )
    
    ai_feedback["latency_ms"] = total_latency
    ai_feedback["rule"] = "AI_EVALUATION"
    
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
