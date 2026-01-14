# backend/utils/idempotency.py
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import IdempotencyKey
from fastapi import Request, HTTPException

async def get_idempotency_key(request: Request) -> str:
    return request.headers.get("X-Idempotency-Key")

def check_idempotency(db: Session, user_id: str, key: str):
    if not key:
        return None
    
    existing = db.query(IdempotencyKey).filter(
        IdempotencyKey.user_id == user_id,
        IdempotencyKey.request_key == key
    ).first()
    
    if existing:
        if existing.response_body:
            return json.loads(existing.response_body), existing.status_code
        return {"error": "Request still processing"}, 409
    
    # Record the attempt
    new_entry = IdempotencyKey(
        user_id=user_id,
        request_key=key,
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(new_entry)
    db.commit()
    return None

def save_idempotency_response(db: Session, user_id: str, key: str, response_data: dict, status_code: int = 200):
    if not key:
        return
    
    entry = db.query(IdempotencyKey).filter(
        IdempotencyKey.user_id == user_id,
        IdempotencyKey.request_key == key
    ).first()
    
    if entry:
        entry.response_body = json.dumps(response_data)
        entry.status_code = str(status_code)
        db.commit()
