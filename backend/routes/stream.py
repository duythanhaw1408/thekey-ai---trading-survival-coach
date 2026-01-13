# backend/routes/stream.py
"""
THEKEY SSE Streaming Endpoints
Provides real-time progress updates for async operations.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import Dict, AsyncGenerator
import asyncio
import json
import uuid
from datetime import datetime, timedelta
from services.auth.dependencies import get_current_user
from models import User

router = APIRouter(prefix="/api/stream", tags=["stream"])

# In-memory job storage (for MVP - consider Redis for production scaling)
_jobs: Dict[str, dict] = {}


def create_job(user_id: str, job_type: str, metadata: dict = None) -> str:
    """
    Create a new job and return its ID.
    Includes simple deduplication: if an active job of same type/metadata exists, 
    returns that instead of creating a new one.
    """
    # 1. Deduplication Check
    if metadata and "trade_id" in metadata:
        trade_id = metadata["trade_id"]
        for existing_id, existing_job in _jobs.items():
            if (existing_job["user_id"] == user_id and 
                existing_job["type"] == job_type and 
                existing_job["metadata"].get("trade_id") == trade_id and
                existing_job["status"] in ["pending", "running"]):
                print(f"ℹ️ Returning existing job {existing_id} for trade {trade_id}")
                return existing_id

    # 2. Create New Job
    job_id = str(uuid.uuid4())
    now = datetime.utcnow()
    _jobs[job_id] = {
        "id": job_id,
        "user_id": user_id,
        "type": job_type,
        "status": "pending",
        "progress": 0,
        "message": "Đang khởi tạo...",
        "result": None,
        "error": None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "timeout_at": (now + timedelta(seconds=120)).isoformat(), # 2 min max
        "metadata": metadata or {}
    }
    return job_id


def update_job(job_id: str, progress: int = None, status: str = None, 
               message: str = None, result: dict = None, error: str = None):
    """Update job progress."""
    if job_id not in _jobs:
        return
    
    job = _jobs[job_id]
    if progress is not None:
        job["progress"] = min(max(progress, 0), 100)
    if status is not None:
        job["status"] = status
    if message is not None:
        job["message"] = message
    if result is not None:
        job["result"] = result
    if error is not None:
        job["error"] = error
        job["status"] = "failed"
    
    job["updated_at"] = datetime.utcnow().isoformat()


def get_job(job_id: str) -> dict:
    """Get job by ID."""
    return _jobs.get(job_id)


def cleanup_old_jobs(max_age_seconds: int = 3600):
    """Remove jobs older than max_age_seconds."""
    now = datetime.utcnow()
    to_remove = []
    for job_id, job in _jobs.items():
        created = datetime.fromisoformat(job["created_at"])
        if (now - created).total_seconds() > max_age_seconds:
            to_remove.append(job_id)
    for job_id in to_remove:
        del _jobs[job_id]


def _format_sse(data: dict, event: str = None) -> str:
    """Format data as SSE message."""
    lines = []
    if event:
        lines.append(f"event: {event}")
    lines.append(f"data: {json.dumps(data, ensure_ascii=False)}")
    lines.append("")  # Empty line to end message
    return "\n".join(lines) + "\n"


@router.get("/jobs/{job_id}")
async def stream_job_progress(job_id: str, user: User = Depends(get_current_user)):
    """
    Stream job progress via Server-Sent Events (SSE).
    
    The client should connect with:
    ```javascript
    const eventSource = new EventSource('/api/stream/jobs/{job_id}');
    eventSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log('Progress:', data.progress, 'Status:', data.status);
        if (data.status === 'completed' || data.status === 'failed') {
            eventSource.close();
        }
    };
    ```
    """
    job = get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Security: verify job belongs to user
    if job["user_id"] != str(user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    async def event_generator() -> AsyncGenerator[str, None]:
        """Generate SSE events for job progress."""
        max_wait = 60  # Maximum 60 seconds streaming
        elapsed = 0
        interval = 0.5  # Check every 500ms
        
        # Send initial state
        current_job = get_job(job_id)
        if current_job:
            yield _format_sse({
                "progress": current_job["progress"],
                "status": current_job["status"],
                "message": current_job["message"]
            }, event="progress")
        
        while elapsed < max_wait:
            await asyncio.sleep(interval)
            elapsed += interval
            
            current_job = get_job(job_id)
            if not current_job:
                yield _format_sse({"error": "Job not found"}, event="error")
                break
            
            # Check for timeout in DB (not just loop time)
            if current_job.get("timeout_at"):
                timeout_at = datetime.fromisoformat(current_job["timeout_at"])
                if datetime.utcnow() > timeout_at:
                    yield _format_sse({
                        "status": "timeout",
                        "message": "Phân tích quá lâu. Vui lòng kiểm tra lại sau."
                    }, event="timeout")
                    break
            
            # Send progress update
            yield _format_sse({
                "progress": current_job["progress"],
                "status": current_job["status"],
                "message": current_job["message"]
            }, event="progress")
            
            # Check if job is complete
            if current_job["status"] in ["completed", "failed"]:
                # Send final result
                if current_job["status"] == "completed":
                    yield _format_sse({
                        "progress": 100,
                        "status": "completed",
                        "message": "Hoàn thành!",
                        "result": current_job["result"]
                    }, event="complete")
                else:
                    yield _format_sse({
                        "progress": current_job["progress"],
                        "status": "failed",
                        "message": current_job["message"],
                        "error": current_job["error"]
                    }, event="error")
                break
        
        # Timeout - send final state
        if elapsed >= max_wait:
            yield _format_sse({
                "status": "timeout",
                "message": "Connection timeout. Please refresh."
            }, event="timeout")
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str, user: User = Depends(get_current_user)):
    """Get current job status (non-streaming, for polling fallback)."""
    job = get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["user_id"] != str(user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "id": job["id"],
        "type": job["type"],
        "status": job["status"],
        "progress": job["progress"],
        "message": job["message"],
        "result": job["result"] if job["status"] == "completed" else None,
        "error": job["error"] if job["status"] == "failed" else None
    }


# Export for use in other modules
__all__ = ["router", "create_job", "update_job", "get_job", "cleanup_old_jobs"]
