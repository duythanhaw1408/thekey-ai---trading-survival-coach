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

    # Build user settings from DB + request (prioritize request settings for per-trade intent)
    balance = float(settings.get("account_balance") or user.account_balance or 1000)
    user_settings = {
        "account_balance": balance,
        "max_position_size_usd": float(settings.get("max_position_size_usd") or user.max_position_size_usd or (balance * 0.1)),
        "max_position_size_pct": 10.0, # Increased default cap
        "risk_per_trade_pct": float(settings.get("risk_per_trade_pct") or user.risk_per_trade_pct or 2),
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
    # PHASE 2: AI Evaluation (Conditional on Budget)
    # =============================================
    
    # 1. Check AI Budget and Reset if new day
    now = datetime.now(timezone.utc)
    user_reset = user.last_ai_reset
    if user_reset.tzinfo is None:
        user_reset = user_reset.replace(tzinfo=timezone.utc)
        
    if (now - user_reset).days >= 1:
        user.daily_ai_calls = 0
        user.last_ai_reset = now
        db.commit()
    
    # 2. Strict Rate Limiting / Budget Fallback
    # Free tier users get max 20 AI evaluations per day
    MAX_DAILY_AI = 20 if not user.is_pro else 100
    
    if user.daily_ai_calls >= MAX_DAILY_AI:
        print(f"[Protection] AI Budget EXCEEDED ({user.daily_ai_calls}/{MAX_DAILY_AI}). Forcing Rule Engine fallback.")
        return {
            "decision": engine_result.decision if engine_result.decision != "GRAY_ZONE" else "WARN",
            "reason": f"{engine_result.reason} (AI budget exceeded, using safety fallback)",
            "cooldown": engine_result.cooldown,
            "recommended_size": engine_result.recommended_size,
            "rule": "BUDGET_FALLBACK",
            "latency_ms": rule_latency,
            "triggered_rules": engine_result.triggered_rules
        }

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
    
    # 3. Track AI Usage and increment count
    user.daily_ai_calls += 1
    tracker = AITracker(db)
    tracker.log_decision(
        user_id=user.id,
        decision=ai_feedback.get("decision", "ALLOW"),
        reason=ai_feedback.get("reason", ""),
        rule="AI_EVALUATION",
        trade_intent=trade,
        confidence=0.8
    )
    db.commit()
    
    total_latency = (time.time() - start_time) * 1000
    ai_feedback["latency_ms"] = total_latency
    ai_feedback["rule"] = "AI_EVALUATION"
    ai_feedback["usage"] = f"{user.daily_ai_calls}/{MAX_DAILY_AI}"
    
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
