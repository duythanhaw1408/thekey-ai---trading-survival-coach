# backend/routes/analytics.py
"""
THEKEY Analytics Routes
Admin endpoints for AI cost tracking and system metrics.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta

from models import get_db, AICallLog, User
from services.auth.dependencies import get_current_user
from services.ai.ai_tracking import AITracker

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/ai/user-stats")
async def get_user_ai_stats(
    days: int = Query(7, ge=1, le=90),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get AI usage statistics for the current user.
    
    Returns token usage, costs, and breakdown by call type.
    """
    tracker = AITracker(db)
    stats = tracker.get_accuracy_stats(user.id)
    
    # Add cost stats from AICallLog
    since = datetime.utcnow() - timedelta(days=days)
    
    logs = db.query(AICallLog).filter(
        AICallLog.user_id == user.id,
        AICallLog.created_at >= since
    ).all()
    
    total_tokens = sum(l.total_tokens or 0 for l in logs)
    total_cost = sum(l.cost_usd or 0 for l in logs)
    
    # By call type
    by_type = {}
    for log in logs:
        if log.call_type not in by_type:
            by_type[log.call_type] = {"count": 0, "tokens": 0, "cost": 0}
        by_type[log.call_type]["count"] += 1
        by_type[log.call_type]["tokens"] += log.total_tokens or 0
        by_type[log.call_type]["cost"] += log.cost_usd or 0
    
    return {
        "period_days": days,
        "ai_accuracy": stats,
        "token_usage": {
            "total_calls": len(logs),
            "total_tokens": total_tokens,
            "total_cost_usd": round(total_cost, 4),
            "by_type": by_type
        }
    }


@router.get("/ai/global-stats")
async def get_global_ai_stats(
    days: int = Query(7, ge=1, le=90),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get global AI usage statistics (admin only in future).
    
    For now, any authenticated user can access.
    Returns system-wide token usage, costs, and performance metrics.
    """
    since = datetime.utcnow() - timedelta(days=days)
    
    # Aggregate queries
    result = db.query(
        func.count(AICallLog.id).label("total_calls"),
        func.sum(AICallLog.total_tokens).label("total_tokens"),
        func.sum(AICallLog.cost_usd).label("total_cost"),
        func.avg(AICallLog.latency_ms).label("avg_latency")
    ).filter(AICallLog.created_at >= since).first()
    
    # By model
    by_model = db.query(
        AICallLog.model,
        func.count(AICallLog.id).label("count"),
        func.sum(AICallLog.total_tokens).label("tokens"),
        func.sum(AICallLog.cost_usd).label("cost")
    ).filter(
        AICallLog.created_at >= since
    ).group_by(AICallLog.model).all()
    
    # By call type
    by_type = db.query(
        AICallLog.call_type,
        func.count(AICallLog.id).label("count"),
        func.sum(AICallLog.cost_usd).label("cost")
    ).filter(
        AICallLog.created_at >= since
    ).group_by(AICallLog.call_type).all()
    
    # By day (for chart)
    daily_stats = db.query(
        func.date(AICallLog.created_at).label("date"),
        func.count(AICallLog.id).label("calls"),
        func.sum(AICallLog.cost_usd).label("cost")
    ).filter(
        AICallLog.created_at >= since
    ).group_by(func.date(AICallLog.created_at)).order_by("date").all()
    
    # Success rate
    total = result.total_calls or 0
    success_count = db.query(func.count(AICallLog.id)).filter(
        AICallLog.created_at >= since,
        AICallLog.success == "true"
    ).scalar() or 0
    
    return {
        "period_days": days,
        "summary": {
            "total_calls": total,
            "total_tokens": int(result.total_tokens or 0),
            "total_cost_usd": round(float(result.total_cost or 0), 4),
            "avg_latency_ms": round(float(result.avg_latency or 0), 0),
            "success_rate": round(success_count / max(total, 1) * 100, 1)
        },
        "by_model": [
            {
                "model": m or "unknown",
                "count": c,
                "tokens": int(t or 0),
                "cost": round(float(cost or 0), 4)
            }
            for m, c, t, cost in by_model
        ],
        "by_type": [
            {
                "type": t or "unknown",
                "count": c,
                "cost": round(float(cost or 0), 4)
            }
            for t, c, cost in by_type
        ],
        "daily": [
            {
                "date": str(d),
                "calls": c,
                "cost": round(float(cost or 0), 4)
            }
            for d, c, cost in daily_stats
        ]
    }


@router.get("/ai/recent-calls")
async def get_recent_ai_calls(
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent AI calls for the current user."""
    logs = db.query(AICallLog).filter(
        AICallLog.user_id == user.id
    ).order_by(AICallLog.created_at.desc()).limit(limit).all()
    
    return {
        "count": len(logs),
        "calls": [log.to_dict() for log in logs]
    }


@router.get("/guardian/decisions")
async def get_guardian_decisions(
    days: int = Query(7, ge=1, le=90),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get Guardian decision statistics for the user."""
    since = datetime.utcnow() - timedelta(days=days)
    
    logs = db.query(AICallLog).filter(
        AICallLog.user_id == user.id,
        AICallLog.call_type == "guardian_decision",
        AICallLog.created_at >= since
    ).all()
    
    # Count by decision type
    decision_counts = {"ALLOW": 0, "WARN": 0, "BLOCK": 0}
    rule_counts = {}
    
    for log in logs:
        decision = log.response_type
        if decision in decision_counts:
            decision_counts[decision] += 1
        
        rule = log.extra_data.get("rule", "UNKNOWN") if log.extra_data else "UNKNOWN"
        rule_counts[rule] = rule_counts.get(rule, 0) + 1
    
    return {
        "period_days": days,
        "total_evaluations": len(logs),
        "by_decision": decision_counts,
        "by_rule": rule_counts,
        "block_rate": round(decision_counts["BLOCK"] / max(len(logs), 1) * 100, 1),
        "rule_engine_pct": round(
            rule_counts.get("RULE_ENGINE", 0) / max(len(logs), 1) * 100, 1
        )
    }
