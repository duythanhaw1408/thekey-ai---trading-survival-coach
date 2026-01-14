# backend/middleware/security.py
"""
Security Middleware for THEKEY AI
Implements: Rate Limiting, Request Logging, Error Tracking
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse
import structlog
import sentry_sdk
import os

# ============================================
# Structured Logging Configuration
# ============================================

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer() if os.getenv("ENV") == "production" else structlog.dev.ConsoleRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger("thekey")

# ============================================
# Sentry Error Tracking (Production Only)
# ============================================

SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=0.1,  # 10% of requests for performance monitoring
        profiles_sample_rate=0.1,
        environment=os.getenv("ENV", "development"),
    )
    logger.info("sentry_initialized", dsn=SENTRY_DSN[:20] + "...")

# ============================================
# Rate Limiter Configuration
# ============================================

def get_user_identifier(request: Request) -> str:
    """Get user identifier for rate limiting (IP or user ID if authenticated)"""
    # Try to get user ID from token (if authenticated)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        # Return a hash of the token for privacy
        import hashlib
        token_hash = hashlib.sha256(auth_header.encode()).hexdigest()[:16]
        return f"user:{token_hash}"
    
    # Fall back to IP address
    return get_remote_address(request)

# Create limiter instance
limiter = Limiter(key_func=get_user_identifier)

# Rate limit configurations per endpoint type
RATE_LIMITS = {
    "auth": "5/minute",      # Login/signup attempts
    "ai": "30/minute",       # AI calls (costly)
    "standard": "100/minute", # Normal API calls
    "public": "200/minute",  # Public endpoints
}

def get_rate_limit(endpoint_type: str) -> str:
    return RATE_LIMITS.get(endpoint_type, RATE_LIMITS["standard"])

# ============================================
# Rate Limit Exceeded Handler
# ============================================

async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded errors"""
    logger.warning(
        "rate_limit_exceeded",
        path=request.url.path,
        client=get_user_identifier(request),
        limit=str(exc.detail)
    )
    
    return JSONResponse(
        status_code=429,
        content={
            "error": "Too Many Requests",
            "message": "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.",
            "retry_after": 60
        },
        headers={"Retry-After": "60"}
    )

# ============================================
# Request Logging Middleware
# ============================================

async def log_request_middleware(request: Request, call_next):
    """Log all incoming requests with timing"""
    import time
    start_time = time.time()
    
    # Generate request ID for tracing
    import uuid
    request_id = str(uuid.uuid4())[:8]
    
    # Log request start
    logger.info(
        "request_started",
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        client=get_remote_address(request)
    )
    
    try:
        response = await call_next(request)
        
        # Log request completion with slow detection
        duration_ms = (time.time() - start_time) * 1000
        is_slow = duration_ms > 500
        
        log_method = logger.warning if is_slow else logger.info
        log_method(
            "request_completed",
            request_id=request_id,
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
            slow_alert=is_slow
        )
        
        # Add request ID and timing to response headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-Ms"] = str(round(duration_ms, 2))
        
        return response
    except Exception as e:
        # Log error
        duration_ms = (time.time() - start_time) * 1000
        logger.error(
            "request_failed",
            request_id=request_id,
            error=str(e),
            duration_ms=round(duration_ms, 2)
        )
        
        # Report to Sentry if configured
        if SENTRY_DSN:
            sentry_sdk.capture_exception(e)
        
        raise

# ============================================
# Input Sanitization Helpers
# ============================================

import re
import html

def sanitize_string(value: str, max_length: int = 1000) -> str:
    """Sanitize user input string"""
    if not value:
        return ""
    
    # Truncate to max length
    value = value[:max_length]
    
    # Remove potentially dangerous characters
    value = html.escape(value)
    
    # Remove control characters
    value = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', value)
    
    return value.strip()

def sanitize_trade_input(symbol: str, reasoning: str) -> tuple[str, str]:
    """Sanitize trade-related inputs"""
    # Symbol should only contain alphanumeric and common trading symbols
    clean_symbol = re.sub(r'[^A-Za-z0-9/\-_.]', '', symbol)[:20]
    
    # Reasoning needs full sanitization
    clean_reasoning = sanitize_string(reasoning, max_length=500)
    
    return clean_symbol, clean_reasoning

# ============================================
# Export
# ============================================

__all__ = [
    "limiter",
    "logger",
    "rate_limit_exceeded_handler",
    "log_request_middleware",
    "get_rate_limit",
    "sanitize_string",
    "sanitize_trade_input",
    "RATE_LIMITS"
]
