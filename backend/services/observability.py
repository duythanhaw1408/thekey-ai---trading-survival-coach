# backend/services/observability.py
"""
THEKEY AI Observability Layer v2.0

World-class monitoring, logging, and metrics collection.
Implements patterns from Google SRE and OpenAI observability practices.

Author: THEKEY AI Team
"""

import time
import json
import asyncio
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from functools import wraps
import hashlib


# ============================================
# Structured Logging
# ============================================

class LogLevel(Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


@dataclass
class LogEntry:
    """Structured log entry."""
    timestamp: str
    level: str
    service: str
    event: str
    user_id: Optional[str] = None
    request_id: Optional[str] = None
    duration_ms: Optional[int] = None
    data: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    
    def to_json(self) -> str:
        return json.dumps(asdict(self), ensure_ascii=False, default=str)


class StructuredLogger:
    """
    Structured logger with context propagation.
    Outputs JSON logs for easy parsing by log aggregators.
    """
    
    def __init__(self, service: str):
        self.service = service
        self._context: Dict[str, Any] = {}
    
    def with_context(self, **kwargs) -> 'StructuredLogger':
        """Create a new logger with additional context."""
        new_logger = StructuredLogger(self.service)
        new_logger._context = {**self._context, **kwargs}
        return new_logger
    
    def _log(self, level: LogLevel, event: str, **kwargs):
        entry = LogEntry(
            timestamp=datetime.utcnow().isoformat() + "Z",
            level=level.value,
            service=self.service,
            event=event,
            **{**self._context, **kwargs}
        )
        print(entry.to_json())
    
    def debug(self, event: str, **kwargs):
        self._log(LogLevel.DEBUG, event, **kwargs)
    
    def info(self, event: str, **kwargs):
        self._log(LogLevel.INFO, event, **kwargs)
    
    def warn(self, event: str, **kwargs):
        self._log(LogLevel.WARN, event, **kwargs)
    
    def error(self, event: str, **kwargs):
        self._log(LogLevel.ERROR, event, **kwargs)
    
    def critical(self, event: str, **kwargs):
        self._log(LogLevel.CRITICAL, event, **kwargs)


# ============================================
# Metrics Collection
# ============================================

@dataclass
class MetricPoint:
    """Single metric data point."""
    name: str
    value: float
    timestamp: float
    tags: Dict[str, str] = field(default_factory=dict)


class MetricsCollector:
    """
    In-memory metrics collector with aggregation.
    Designed for export to Prometheus, DataDog, or custom dashboards.
    """
    
    def __init__(self, max_points: int = 10000):
        self.max_points = max_points
        self._counters: Dict[str, float] = {}
        self._gauges: Dict[str, float] = {}
        self._histograms: Dict[str, List[float]] = {}
        self._timeseries: List[MetricPoint] = []
        self._lock = asyncio.Lock()
    
    async def increment(self, name: str, value: float = 1, tags: Dict[str, str] = None):
        """Increment a counter metric."""
        async with self._lock:
            key = self._make_key(name, tags)
            self._counters[key] = self._counters.get(key, 0) + value
            self._record_point(name, self._counters[key], tags)
    
    async def gauge(self, name: str, value: float, tags: Dict[str, str] = None):
        """Set a gauge metric."""
        async with self._lock:
            key = self._make_key(name, tags)
            self._gauges[key] = value
            self._record_point(name, value, tags)
    
    async def histogram(self, name: str, value: float, tags: Dict[str, str] = None):
        """Record a histogram value."""
        async with self._lock:
            key = self._make_key(name, tags)
            if key not in self._histograms:
                self._histograms[key] = []
            self._histograms[key].append(value)
            
            # Keep only last 1000 values per histogram
            if len(self._histograms[key]) > 1000:
                self._histograms[key] = self._histograms[key][-1000:]
    
    def _make_key(self, name: str, tags: Dict[str, str] = None) -> str:
        tag_str = ",".join(f"{k}={v}" for k, v in sorted((tags or {}).items()))
        return f"{name}[{tag_str}]"
    
    def _record_point(self, name: str, value: float, tags: Dict[str, str] = None):
        point = MetricPoint(
            name=name,
            value=value,
            timestamp=time.time(),
            tags=tags or {}
        )
        self._timeseries.append(point)
        
        # Evict old points
        if len(self._timeseries) > self.max_points:
            self._timeseries = self._timeseries[-self.max_points:]
    
    def get_percentiles(self, name: str, percentiles: List[int] = [50, 90, 95, 99]) -> Dict[str, float]:
        """Get percentiles for a histogram metric."""
        key = self._make_key(name, None)
        values = self._histograms.get(key, [])
        
        if not values:
            return {f"p{p}": 0 for p in percentiles}
        
        sorted_values = sorted(values)
        result = {}
        for p in percentiles:
            idx = int(len(sorted_values) * p / 100)
            result[f"p{p}"] = sorted_values[min(idx, len(sorted_values) - 1)]
        
        return result
    
    def get_snapshot(self) -> Dict[str, Any]:
        """Get current metrics snapshot."""
        return {
            "counters": dict(self._counters),
            "gauges": dict(self._gauges),
            "histograms": {
                name: self.get_percentiles(name.split("[")[0])
                for name in self._histograms.keys()
            },
            "timestamp": datetime.utcnow().isoformat()
        }


# ============================================
# Request Tracing
# ============================================

@dataclass
class Span:
    """Trace span for distributed tracing."""
    span_id: str
    trace_id: str
    parent_id: Optional[str]
    operation: str
    start_time: float
    end_time: Optional[float] = None
    status: str = "OK"
    tags: Dict[str, str] = field(default_factory=dict)
    events: List[Dict[str, Any]] = field(default_factory=list)
    
    @property
    def duration_ms(self) -> Optional[int]:
        if self.end_time:
            return int((self.end_time - self.start_time) * 1000)
        return None


class Tracer:
    """
    Simple distributed tracer for request flows.
    """
    
    def __init__(self):
        self._active_spans: Dict[str, Span] = {}
        self._completed_spans: List[Span] = []
        self._max_completed = 1000
    
    def start_span(
        self,
        operation: str,
        trace_id: Optional[str] = None,
        parent_id: Optional[str] = None,
        tags: Dict[str, str] = None
    ) -> Span:
        """Start a new span."""
        span_id = hashlib.md5(f"{time.time()}{operation}".encode()).hexdigest()[:16]
        trace_id = trace_id or span_id
        
        span = Span(
            span_id=span_id,
            trace_id=trace_id,
            parent_id=parent_id,
            operation=operation,
            start_time=time.time(),
            tags=tags or {}
        )
        
        self._active_spans[span_id] = span
        return span
    
    def end_span(self, span: Span, status: str = "OK", error: str = None):
        """End a span."""
        span.end_time = time.time()
        span.status = status
        if error:
            span.events.append({"type": "error", "message": error})
        
        self._active_spans.pop(span.span_id, None)
        self._completed_spans.append(span)
        
        # Evict old spans
        if len(self._completed_spans) > self._max_completed:
            self._completed_spans = self._completed_spans[-self._max_completed:]
    
    def add_event(self, span: Span, name: str, attributes: Dict[str, Any] = None):
        """Add an event to a span."""
        span.events.append({
            "name": name,
            "timestamp": time.time(),
            "attributes": attributes or {}
        })


# ============================================
# AI-Specific Metrics
# ============================================

class AIMetrics:
    """
    Specialized metrics for AI operations.
    """
    
    def __init__(self, metrics: MetricsCollector, logger: StructuredLogger):
        self.metrics = metrics
        self.logger = logger
    
    async def record_ai_call(
        self,
        call_type: str,
        model: str,
        latency_ms: int,
        tokens_input: int,
        tokens_output: int,
        success: bool,
        cached: bool = False,
        user_id: str = None
    ):
        """Record an AI API call."""
        tags = {"type": call_type, "model": model, "cached": str(cached).lower()}
        
        await self.metrics.increment("ai_calls_total", tags=tags)
        await self.metrics.histogram("ai_latency_ms", latency_ms, tags=tags)
        await self.metrics.increment("ai_tokens_input", tokens_input, tags=tags)
        await self.metrics.increment("ai_tokens_output", tokens_output, tags=tags)
        
        if not success:
            await self.metrics.increment("ai_errors_total", tags=tags)
        
        if cached:
            await self.metrics.increment("ai_cache_hits", tags=tags)
        
        self.logger.info(
            "ai_call_completed",
            call_type=call_type,
            model=model,
            latency_ms=latency_ms,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            success=success,
            cached=cached,
            user_id=user_id
        )
    
    async def record_decision(
        self,
        decision_type: str,
        decision: str,  # ALLOW, WARN, BLOCK
        source: str,  # rule_engine, ai, cache, fallback
        user_id: str = None
    ):
        """Record a trading decision."""
        tags = {"type": decision_type, "decision": decision, "source": source}
        
        await self.metrics.increment("decisions_total", tags=tags)
        
        self.logger.info(
            "decision_made",
            decision_type=decision_type,
            decision=decision,
            source=source,
            user_id=user_id
        )
    
    async def record_user_action(
        self,
        action: str,  # checkin, trade_request, chat, etc.
        user_id: str,
        metadata: Dict[str, Any] = None
    ):
        """Record a user action."""
        await self.metrics.increment("user_actions_total", tags={"action": action})
        
        self.logger.info(
            "user_action",
            action=action,
            user_id=user_id,
            data=metadata
        )


# ============================================
# Performance Decorators
# ============================================

def timed(metrics: MetricsCollector, name: str):
    """Decorator to time async function execution."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start = time.time()
            try:
                result = await func(*args, **kwargs)
                success = True
                return result
            except Exception as e:
                success = False
                raise
            finally:
                duration = (time.time() - start) * 1000
                await metrics.histogram(f"{name}_duration_ms", duration)
                await metrics.increment(
                    f"{name}_total",
                    tags={"success": str(success).lower()}
                )
        return wrapper
    return decorator


def traced(tracer: Tracer, operation: str):
    """Decorator to trace async function execution."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            span = tracer.start_span(operation)
            try:
                result = await func(*args, **kwargs)
                tracer.end_span(span, status="OK")
                return result
            except Exception as e:
                tracer.end_span(span, status="ERROR", error=str(e))
                raise
        return wrapper
    return decorator


# ============================================
# Health Checks
# ============================================

@dataclass
class HealthStatus:
    """Component health status."""
    name: str
    status: str  # healthy, degraded, unhealthy
    latency_ms: Optional[int] = None
    message: Optional[str] = None
    last_check: Optional[str] = None


class HealthChecker:
    """
    Health checker for all system components.
    """
    
    def __init__(self):
        self._checks: Dict[str, Callable] = {}
    
    def register(self, name: str, check_fn: Callable):
        """Register a health check function."""
        self._checks[name] = check_fn
    
    async def check_all(self) -> Dict[str, Any]:
        """Run all health checks."""
        results = {}
        overall_status = "healthy"
        
        for name, check_fn in self._checks.items():
            try:
                start = time.time()
                status = await check_fn()
                latency = int((time.time() - start) * 1000)
                
                results[name] = HealthStatus(
                    name=name,
                    status=status.get("status", "healthy"),
                    latency_ms=latency,
                    message=status.get("message"),
                    last_check=datetime.utcnow().isoformat()
                )
                
                if status.get("status") == "unhealthy":
                    overall_status = "unhealthy"
                elif status.get("status") == "degraded" and overall_status != "unhealthy":
                    overall_status = "degraded"
                    
            except Exception as e:
                results[name] = HealthStatus(
                    name=name,
                    status="unhealthy",
                    message=str(e),
                    last_check=datetime.utcnow().isoformat()
                )
                overall_status = "unhealthy"
        
        return {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "components": {k: asdict(v) for k, v in results.items()}
        }


# ============================================
# Global Instances
# ============================================

logger = StructuredLogger("thekey-ai")
metrics = MetricsCollector()
tracer = Tracer()
ai_metrics = AIMetrics(metrics, logger)
health_checker = HealthChecker()


# ============================================
# Health Check Registrations
# ============================================

async def check_database():
    """Database health check."""
    try:
        from models.base import engine
        from sqlalchemy import text
        
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy"}
    except Exception as e:
        return {"status": "unhealthy", "message": str(e)}


async def check_gemini():
    """Gemini API health check."""
    import os
    if os.getenv("GEMINI_API_KEY"):
        return {"status": "healthy"}
    return {"status": "degraded", "message": "API key not set"}


# Register checks
health_checker.register("database", check_database)
health_checker.register("gemini", check_gemini)
