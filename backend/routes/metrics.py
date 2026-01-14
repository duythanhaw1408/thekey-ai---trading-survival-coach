# backend/routes/metrics.py
"""
THEKEY AI Metrics & Observability Routes

Exposes metrics, health checks, and system status.
"""

from fastapi import APIRouter, Depends
from typing import Dict, Any
import os

router = APIRouter(prefix="/metrics", tags=["Observability"])


@router.get("/")
async def get_metrics() -> Dict[str, Any]:
    """Get current system metrics."""
    from services.observability import metrics, ai_metrics
    from services.ai import ai_orchestrator
    
    return {
        "system": metrics.get_snapshot(),
        "ai_orchestrator": ai_orchestrator.get_metrics(),
        "cache_stats": ai_orchestrator.cache.get_stats(),
        "circuit_breaker": {
            "state": ai_orchestrator.circuit_breaker.state.value,
            "failure_count": ai_orchestrator.circuit_breaker.failure_count,
        }
    }


@router.get("/health/detailed")
async def get_detailed_health() -> Dict[str, Any]:
    """Get detailed health status of all components."""
    from services.observability import health_checker
    
    return await health_checker.check_all()


@router.get("/ai/stats")
async def get_ai_stats() -> Dict[str, Any]:
    """Get AI-specific statistics."""
    from services.ai import ai_orchestrator
    
    orchestrator_metrics = ai_orchestrator.get_metrics()
    cache_stats = ai_orchestrator.cache.get_stats()
    
    return {
        "total_requests": orchestrator_metrics["requests_total"],
        "total_errors": orchestrator_metrics["errors_total"],
        "error_rate": orchestrator_metrics["error_rate"],
        "avg_latency_ms": orchestrator_metrics["avg_latency_ms"],
        "cache": {
            "size": cache_stats["size"],
            "hit_rate": cache_stats["hit_rate"],
            "hits": cache_stats["hits"],
            "misses": cache_stats["misses"],
        },
        "circuit_breaker": {
            "state": orchestrator_metrics["circuit_state"],
        }
    }


@router.post("/ai/cache/invalidate")
async def invalidate_cache(pattern: str = None) -> Dict[str, str]:
    """Invalidate AI cache (admin only in production)."""
    # In production, add admin auth check here
    from services.ai import ai_orchestrator
    
    # Clear in-memory caches
    ai_orchestrator.cache.cache.clear()
    
    return {"status": "ok", "message": "Cache invalidated"}


@router.get("/config")
async def get_config() -> Dict[str, Any]:
    """Get non-sensitive configuration (useful for debugging)."""
    return {
        "environment": os.getenv("ENV", "development"),
        "version": "2.0.0",
        "features": {
            "ai_orchestrator": True,
            "rule_engine": True,
            "circuit_breaker": True,
            "semantic_cache": True,
            "observability": True,
        },
        "models": {
            "primary": "gemini-2.0-flash-lite",
            "fallback": "gemini-2.0-flash",
        }
    }
