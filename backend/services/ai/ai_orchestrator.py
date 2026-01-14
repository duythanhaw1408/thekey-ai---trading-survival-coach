# backend/services/ai/ai_orchestrator.py
"""
THEKEY AI Orchestrator v2.0 - World-Class AI Agent Core

This orchestrator implements patterns from top AI companies:
- Intelligent routing (complexity-based model selection)
- Circuit breaker pattern (prevent cascade failures)
- Semantic caching (reduce redundant API calls)
- Context compression (optimize token usage)
- Graceful degradation (never leave user hanging)

Author: THEKEY AI Team
"""

import asyncio
import hashlib
import json
import time
from typing import Dict, Any, List, Optional, Literal, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
from functools import wraps


# ============================================
# Type Definitions
# ============================================

class TaskComplexity(Enum):
    """Task complexity levels for intelligent routing."""
    TRIVIAL = 1      # Rule engine only
    SIMPLE = 2       # Fast model (2.0-flash-lite)
    MODERATE = 3     # Standard model (2.0-flash)
    COMPLEX = 4      # Full model (2.5-flash)
    CRITICAL = 5     # Full model + verification


class CircuitState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject calls
    HALF_OPEN = "half_open"  # Testing recovery


@dataclass
class RequestContext:
    """Context for an AI request."""
    user_id: str
    request_type: str  # 'trade_eval', 'checkin', 'chat', 'analysis'
    complexity: TaskComplexity = TaskComplexity.SIMPLE
    trade_history_summary: Optional[str] = None
    emotional_state: Optional[str] = None
    recent_patterns: List[str] = field(default_factory=list)
    urgency: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = "MEDIUM"
    max_tokens: int = 1000
    temperature: float = 0.7


@dataclass
class OrchestratorResponse:
    """Unified response from orchestrator."""
    success: bool
    data: Dict[str, Any]
    source: str  # 'cache', 'gemini', 'rule_engine', 'fallback'
    latency_ms: int
    tokens_used: int = 0
    cached: bool = False
    error: Optional[str] = None


# ============================================
# Circuit Breaker Implementation
# ============================================

class CircuitBreaker:
    """
    Circuit breaker pattern to prevent cascade failures.
    
    States:
    - CLOSED: Normal operation, requests go through
    - OPEN: Too many failures, requests are rejected immediately
    - HALF_OPEN: Testing if service recovered
    """
    
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        half_open_max_calls: int = 3
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls
        
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[float] = None
        self.half_open_calls = 0
        self._lock = asyncio.Lock()
    
    async def can_execute(self) -> bool:
        """Check if request can proceed."""
        async with self._lock:
            if self.state == CircuitState.CLOSED:
                return True
            
            if self.state == CircuitState.OPEN:
                # Check if recovery timeout has passed
                if self.last_failure_time and \
                   time.time() - self.last_failure_time >= self.recovery_timeout:
                    self.state = CircuitState.HALF_OPEN
                    self.half_open_calls = 0
                    print("🔄 [CircuitBreaker] Transitioning to HALF_OPEN")
                    return True
                return False
            
            if self.state == CircuitState.HALF_OPEN:
                if self.half_open_calls < self.half_open_max_calls:
                    self.half_open_calls += 1
                    return True
                return False
            
            return False
    
    async def record_success(self):
        """Record a successful call."""
        async with self._lock:
            self.failure_count = 0
            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.half_open_max_calls:
                    self.state = CircuitState.CLOSED
                    self.success_count = 0
                    print("✅ [CircuitBreaker] Circuit CLOSED - Service recovered")
    
    async def record_failure(self):
        """Record a failed call."""
        async with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.OPEN
                print("🔴 [CircuitBreaker] Circuit OPEN - Recovery failed")
            elif self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
                print(f"🔴 [CircuitBreaker] Circuit OPEN - {self.failure_count} failures")


# ============================================
# Semantic Cache Implementation
# ============================================

class SemanticCache:
    """
    Semantic caching for AI responses.
    Uses content hashing to identify similar requests.
    """
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 3600):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.hits = 0
        self.misses = 0
        self._lock = asyncio.Lock()
    
    def _generate_key(self, request_type: str, context: Dict[str, Any]) -> str:
        """Generate cache key from request context."""
        # Normalize context for consistent hashing
        normalized = {
            "type": request_type,
            "user_context": context.get("emotional_state", ""),
            "trade_summary": context.get("trade_summary", "")[:200],  # Truncate for key
        }
        content = json.dumps(normalized, sort_keys=True)
        return hashlib.md5(content.encode()).hexdigest()
    
    async def get(self, request_type: str, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Get cached response if available and not expired."""
        key = self._generate_key(request_type, context)
        
        async with self._lock:
            if key in self.cache:
                entry = self.cache[key]
                if time.time() - entry["timestamp"] < self.ttl_seconds:
                    self.hits += 1
                    print(f"✨ [Cache] HIT for {request_type} (hit rate: {self.hit_rate:.1%})")
                    return entry["data"]
                else:
                    del self.cache[key]  # Expired
            
            self.misses += 1
            return None
    
    async def set(self, request_type: str, context: Dict[str, Any], data: Dict[str, Any]):
        """Cache a response."""
        key = self._generate_key(request_type, context)
        
        async with self._lock:
            # Evict oldest entries if at capacity
            if len(self.cache) >= self.max_size:
                oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k]["timestamp"])
                del self.cache[oldest_key]
            
            self.cache[key] = {
                "data": data,
                "timestamp": time.time()
            }
    
    @property
    def hit_rate(self) -> float:
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0
    
    def get_stats(self) -> Dict[str, Any]:
        return {
            "size": len(self.cache),
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": self.hit_rate
        }


# ============================================
# Context Compressor
# ============================================

class ContextCompressor:
    """
    Compress context to fit within token limits.
    Implements intelligent summarization strategies.
    """
    
    MAX_TRADE_HISTORY = 10  # Keep only recent trades
    MAX_CHECKIN_HISTORY = 5
    
    @staticmethod
    def compress_trade_history(trades: List[Dict[str, Any]]) -> str:
        """Compress trade history into a concise summary."""
        if not trades:
            return "No trading history yet."
        
        recent = trades[:ContextCompressor.MAX_TRADE_HISTORY]
        
        # Calculate stats
        total = len(recent)
        wins = sum(1 for t in recent if t.get("pnl", 0) > 0)
        losses = sum(1 for t in recent if t.get("pnl", 0) < 0)
        
        # Identify patterns
        consecutive_losses = 0
        for t in recent:
            if t.get("pnl", 0) < 0:
                consecutive_losses += 1
            else:
                break
        
        # Get common emotions
        emotions = [t.get("userProcessEvaluation", {}).get("dominantEmotion", "NEUTRAL") 
                   for t in recent if t.get("userProcessEvaluation")]
        emotion_counts = {}
        for e in emotions:
            emotion_counts[e] = emotion_counts.get(e, 0) + 1
        dominant_emotion = max(emotion_counts, key=emotion_counts.get) if emotion_counts else "NEUTRAL"
        
        summary = f"""Recent {total} trades: {wins}W/{losses}L. 
Consecutive losses: {consecutive_losses}. 
Dominant emotion: {dominant_emotion}.
Last trade: {recent[0].get('asset', 'N/A')} {recent[0].get('direction', 'N/A')} with PnL ${recent[0].get('pnl', 0):.2f}."""
        
        return summary
    
    @staticmethod
    def compress_checkin_history(checkins: List[Dict[str, Any]]) -> str:
        """Compress check-in history."""
        if not checkins:
            return "No check-in history."
        
        recent = checkins[:ContextCompressor.MAX_CHECKIN_HISTORY]
        states = [c.get("emotional_state", "UNKNOWN") for c in recent]
        
        return f"Recent emotional states: {', '.join(states)}."
    
    @staticmethod
    def build_optimized_context(
        trade_history: List[Dict],
        checkin_history: List[Dict],
        user_stats: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build an optimized context object for AI prompts."""
        return {
            "trade_summary": ContextCompressor.compress_trade_history(trade_history),
            "checkin_summary": ContextCompressor.compress_checkin_history(checkin_history),
            "stats": {
                "survival_days": user_stats.get("survivalDays", 0),
                "discipline_score": user_stats.get("disciplineScore", 0),
                "consecutive_losses": user_stats.get("consecutiveLosses", 0),
                "current_streak": user_stats.get("consecutiveWins", 0) - user_stats.get("consecutiveLosses", 0)
            }
        }


# ============================================
# Request Deduplicator
# ============================================

class RequestDeduplicator:
    """
    Prevent duplicate concurrent requests.
    Returns existing pending request instead of making new one.
    """
    
    def __init__(self):
        self.pending: Dict[str, asyncio.Future] = {}
        self._lock = asyncio.Lock()
    
    def _generate_key(self, request_type: str, user_id: str, params_hash: str) -> str:
        return f"{request_type}:{user_id}:{params_hash}"
    
    async def get_or_create(
        self,
        request_type: str,
        user_id: str,
        params: Dict[str, Any],
        factory: Callable
    ) -> Any:
        """Get pending request or create new one."""
        params_hash = hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()[:8]
        key = self._generate_key(request_type, user_id, params_hash)
        
        async with self._lock:
            if key in self.pending:
                print(f"🔄 [Dedup] Reusing pending request: {request_type}")
                return await self.pending[key]
            
            future = asyncio.ensure_future(factory())
            self.pending[key] = future
        
        try:
            result = await future
            return result
        finally:
            async with self._lock:
                self.pending.pop(key, None)


# ============================================
# AI Orchestrator - Main Class
# ============================================

class AIOrchestrator:
    """
    Central AI Orchestrator for THEKEY.
    
    Responsibilities:
    1. Route requests to appropriate handler (Rule Engine vs AI)
    2. Manage caching and deduplication
    3. Handle failures gracefully with fallbacks
    4. Collect metrics and telemetry
    """
    
    def __init__(self):
        self.circuit_breaker = CircuitBreaker()
        self.cache = SemanticCache(max_size=500, ttl_seconds=1800)  # 30 min cache
        self.deduplicator = RequestDeduplicator()
        self.compressor = ContextCompressor()
        
        # Metrics
        self.request_count = 0
        self.error_count = 0
        self.total_latency_ms = 0
        self.tokens_used = 0
        
        # Lazy imports to avoid circular dependencies
        self._gemini_client = None
        self._rule_engine = None
    
    @property
    def gemini_client(self):
        if self._gemini_client is None:
            from .gemini_client import gemini_client
            self._gemini_client = gemini_client
        return self._gemini_client
    
    @property
    def rule_engine(self):
        if self._rule_engine is None:
            from ..rule_engine import rule_engine
            self._rule_engine = rule_engine
        return self._rule_engine
    
    def _classify_complexity(self, request_type: str, context: Dict[str, Any]) -> TaskComplexity:
        """Determine task complexity for routing."""
        # Simple rule-based classification
        if request_type == "trade_eval":
            consecutive_losses = context.get("stats", {}).get("consecutiveLosses", 0)
            if consecutive_losses >= 2:
                return TaskComplexity.CRITICAL  # High stakes, use full model
            return TaskComplexity.SIMPLE
        
        if request_type == "chat":
            return TaskComplexity.MODERATE
        
        if request_type in ["analysis", "weekly_report"]:
            return TaskComplexity.COMPLEX
        
        return TaskComplexity.SIMPLE
    
    async def process_request(
        self,
        request_type: str,
        user_id: str,
        params: Dict[str, Any],
        context: Optional[RequestContext] = None
    ) -> OrchestratorResponse:
        """
        Main entry point for all AI requests.
        Handles routing, caching, and fallback.
        """
        start_time = time.time()
        self.request_count += 1
        
        try:
            # Step 1: Check cache
            cached = await self.cache.get(request_type, params)
            if cached:
                return OrchestratorResponse(
                    success=True,
                    data=cached,
                    source="cache",
                    latency_ms=int((time.time() - start_time) * 1000),
                    cached=True
                )
            
            # Step 2: Determine complexity
            complexity = self._classify_complexity(request_type, params)
            
            # Step 3: Try rule engine first for simple cases
            if complexity == TaskComplexity.TRIVIAL:
                result = await self._handle_with_rules(request_type, params)
                if result:
                    return OrchestratorResponse(
                        success=True,
                        data=result,
                        source="rule_engine",
                        latency_ms=int((time.time() - start_time) * 1000)
                    )
            
            # Step 4: Check circuit breaker
            if not await self.circuit_breaker.can_execute():
                print("⚡ [Orchestrator] Circuit OPEN - Using fallback")
                return await self._get_fallback_response(request_type, params, start_time)
            
            # Step 5: Deduplicate and execute AI call
            try:
                result = await self.deduplicator.get_or_create(
                    request_type,
                    user_id,
                    params,
                    lambda: self._execute_ai_call(request_type, params, complexity)
                )
                
                await self.circuit_breaker.record_success()
                
                # Cache successful result
                await self.cache.set(request_type, params, result)
                
                latency = int((time.time() - start_time) * 1000)
                self.total_latency_ms += latency
                
                return OrchestratorResponse(
                    success=True,
                    data=result,
                    source="gemini",
                    latency_ms=latency
                )
                
            except Exception as e:
                await self.circuit_breaker.record_failure()
                self.error_count += 1
                print(f"❌ [Orchestrator] AI call failed: {e}")
                return await self._get_fallback_response(request_type, params, start_time, str(e))
        
        except Exception as e:
            self.error_count += 1
            return OrchestratorResponse(
                success=False,
                data={},
                source="error",
                latency_ms=int((time.time() - start_time) * 1000),
                error=str(e)
            )
    
    async def _handle_with_rules(self, request_type: str, params: Dict[str, Any]) -> Optional[Dict]:
        """Handle request with rule engine if applicable."""
        if request_type == "trade_eval":
            result = self.rule_engine.evaluate(
                trade=params.get("trade", {}),
                stats=params.get("stats", {}),
                trade_history=params.get("trade_history", []),
                user_settings=params.get("settings", {})
            )
            
            if result.decision != "GRAY_ZONE":
                return {
                    "decision": result.decision,
                    "reason": result.reason,
                    "cooldown": result.cooldown,
                    "triggered_rules": result.triggered_rules,
                    "source": "rule_engine"
                }
        
        return None
    
    async def _execute_ai_call(
        self,
        request_type: str,
        params: Dict[str, Any],
        complexity: TaskComplexity
    ) -> Dict[str, Any]:
        """Execute the actual AI call based on request type."""
        
        # Route to appropriate Gemini method
        if request_type == "trade_eval":
            return await self.gemini_client.get_trade_evaluation(params)
        
        elif request_type == "checkin_questions":
            return await self.gemini_client.generate_checkin_questions(params)
        
        elif request_type == "checkin_analysis":
            return await self.gemini_client.analyze_checkin(
                params.get("answers", []),
                params.get("context", {})
            )
        
        elif request_type == "trade_analysis":
            return await self.gemini_client.analyze_trade(
                params.get("trade_data", {}),
                params.get("user_stats", {})
            )
        
        elif request_type == "chat":
            return await self.gemini_client.generate_chat_response(
                params.get("message", ""),
                params.get("history", []),
                params.get("mode", "COACH")
            )
        
        elif request_type == "market_analysis":
            return await self.gemini_client.generate_market_analysis()
        
        elif request_type == "weekly_goals":
            return await self.gemini_client.generate_weekly_goals(
                params.get("history", []),
                params.get("stats", {}),
                params.get("checkin_history", [])
            )
        
        elif request_type == "weekly_report":
            return await self.gemini_client.generate_weekly_report(params.get("history", []))
        
        elif request_type == "archetype":
            return await self.gemini_client.analyze_trader_archetype(
                params.get("history", []),
                params.get("checkin_history", [])
            )
        
        elif request_type == "tilt_detection":
            return await self.gemini_client.detect_emotional_tilt(
                params.get("stats", {}),
                params.get("history", [])
            )
        
        else:
            raise ValueError(f"Unknown request type: {request_type}")
    
    async def _get_fallback_response(
        self,
        request_type: str,
        params: Dict[str, Any],
        start_time: float,
        error: Optional[str] = None
    ) -> OrchestratorResponse:
        """Get fallback response when AI is unavailable."""
        
        # Define fallback responses for each request type
        fallbacks = {
            "trade_eval": {
                "decision": "WARN",
                "reason": "🔄 Hệ thống AI đang bảo trì. Hãy cẩn thận và tuân thủ quy tắc của bạn.",
                "behavioral_insight": "Khi hệ thống không ổn định, đó là lúc kỷ luật cá nhân quan trọng nhất.",
                "alternatives": [],
                "coaching_question": "Bạn có thực sự cần vào lệnh này ngay bây giờ không?",
                "immediate_action": "Hãy kiểm tra lại kế hoạch giao dịch của bạn.",
                "tone": "CAUTIOUS"
            },
            "checkin_analysis": {
                "emotional_state": "CALM",
                "state_intensity": 3,
                "insights": [{"type": "OPPORTUNITY", "title": "Tiếp tục hành trình", "description": "Mỗi ngày là một cơ hội mới."}],
                "encouragement": "Hãy duy trì sự có mặt và kỷ luật hôm nay!",
                "daily_prescription": {
                    "mindset_shift": "Tập trung vào quy trình",
                    "behavioral_rule": "Tuân thủ stop-loss 100%",
                    "success_metric": "Số lệnh đúng quy trình"
                }
            },
            "chat": {
                "display_text": "🔄 Tôi đang gặp chút khó khăn kết nối. Nhưng hãy nhớ: kỷ luật là chìa khóa. Bạn có thể chia sẻ thêm không?",
                "internal_reasoning": "Fallback response during service unavailability"
            },
            "market_analysis": {
                "danger_level": "CAUTION",
                "danger_score": 50,
                "color_code": "🟡",
                "headline": "Dữ liệu thị trường đang được cập nhật.",
                "recommendation": {
                    "action": "REDUCE_SIZE",
                    "position_adjustment": "Giảm 50% khối lượng thông thường.",
                    "rationale": "Khi không chắc chắn, ưu tiên bảo toàn vốn."
                }
            }
        }
        
        fallback_data = fallbacks.get(request_type, {"message": "Hệ thống đang bảo trì."})
        
        return OrchestratorResponse(
            success=True,  # Fallback is still a valid response
            data=fallback_data,
            source="fallback",
            latency_ms=int((time.time() - start_time) * 1000),
            error=error
        )
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get orchestrator metrics."""
        avg_latency = self.total_latency_ms / self.request_count if self.request_count > 0 else 0
        error_rate = self.error_count / self.request_count if self.request_count > 0 else 0
        
        return {
            "requests_total": self.request_count,
            "errors_total": self.error_count,
            "error_rate": error_rate,
            "avg_latency_ms": avg_latency,
            "tokens_used": self.tokens_used,
            "cache_stats": self.cache.get_stats(),
            "circuit_state": self.circuit_breaker.state.value
        }


# ============================================
# Singleton Instance
# ============================================

ai_orchestrator = AIOrchestrator()
