# backend/services/auth/dependencies.py
from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
import jwt
from typing import Optional
import os

from models import get_db, User

# CRITICAL: This logic MUST match auth.py to prevent sign/verify mismatch
_jwt_secret_env = os.getenv("JWT_SECRET", "")
# Detect placeholder/insecure values (same logic as auth.py)
if not _jwt_secret_env or _jwt_secret_env == "thekey-dev-secret-12345" or "thay_doi" in _jwt_secret_env:
    JWT_SECRET = "thekey-dev-secret-12345"  # Use dev default
else:
    JWT_SECRET = _jwt_secret_env

JWT_ALGORITHM = "HS256"

async def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Standard dependency to get the current authenticated user."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
            
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_pro_user(user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure the user has a Pro subscription."""
    if not user.is_pro:
        raise HTTPException(status_code=403, detail="Pro subscription required")
    return user
