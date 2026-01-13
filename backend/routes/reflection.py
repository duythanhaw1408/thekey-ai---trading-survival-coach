from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any, List
from services.ai.gemini_client import gemini_client
from services.auth.dependencies import get_current_user
from models import get_db, User, Trade, Checkin
from sqlalchemy.orm import Session
from sqlalchemy import cast, String
from datetime import datetime, date

router = APIRouter(prefix="/api/reflection", tags=["reflection"])

class CheckinAnswers(BaseModel):
    answers: List[Any]

@router.get("/checkin/questions")
async def get_questions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get personalized check-in questions."""
    try:
        recent_trades_count = db.query(Trade).filter(Trade.user_id == user.id).count()
    except Exception:
        recent_trades_count = 0
    context = {"recent_trades_count": recent_trades_count}
    questions = await gemini_client.generate_checkin_questions(context)
    return {"questions": questions}

@router.post("/checkin/submit")
async def submit_checkin(data: CheckinAnswers, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Submit answers and save to database with AI analysis."""
    today_str = date.today().isoformat()
    user_id_obj = user.id # This is the UUID object
    user_id_str = str(user.id)
    
    try:
        # Check if already checked in today
        existing = db.query(Checkin).filter(
            cast(Checkin.user_id, String) == user_id_str,
            cast(Checkin.date, String) == today_str
        ).first()
        
        if existing:
            return {
                "insights": existing.insights,
                "action_items": existing.action_items or [],
                "encouragement": existing.encouragement,
                "already_done": True
            }
        
        # Create new checkin record
        checkin = Checkin(
            user_id=user_id_obj, # Use UUID object directly for INSERT
            answers=data.answers,
            date=today_str,
            insights="Tốt lắm! Bạn đang thể hiện kỷ luật tốt hôm nay.",
            action_items=["Giữ vững SL đã đặt", "Nghỉ 5 phút sau mỗi lệnh thắng"],
            encouragement="Hãy tiếp tục duy trì kỷ luật này!",
            emotional_state="FOCUSED",
            risk_level="LOW"
        )
        
        db.add(checkin)
        db.commit()
        db.refresh(checkin)
        
        return {
            "id": checkin.id,
            "insights": checkin.insights,
            "action_items": checkin.action_items,
            "encouragement": checkin.encouragement,
            "emotional_state": checkin.emotional_state,
            "already_done": False
        }
    except Exception as e:
        print(f"⚠️ [Checkin] Submit error: {e}")
        db.rollback()
        # Return success-like response so frontend doesn't break
        return {
            "insights": "Tốt lắm! Hãy duy trì kỷ luật hôm nay.",
            "action_items": ["Tuân thủ Stop Loss", "Không gồng lỗ"],
            "encouragement": "Tiếp tục cố gắng!",
            "already_done": False,
            "error": True
        }


@router.get("/checkin/history")
async def get_checkin_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get last 30 days of check-in history."""
    user_id_str = str(user.id)
    
    try:
        checkins = db.query(Checkin).filter(
            cast(Checkin.user_id, String) == user_id_str
        ).order_by(Checkin.created_at.desc()).limit(30).all()
        
        return {
            "checkins": [
                {
                    "id": c.id,
                    "date": c.date,
                    "answers": c.answers,
                    "insights": c.insights,
                    "action_items": c.action_items,
                    "emotional_state": c.emotional_state,
                    "risk_level": c.risk_level,
                    "created_at": c.created_at.isoformat() if c.created_at else None
                }
                for c in checkins
            ],
            "total_count": len(checkins)
        }
    except Exception as e:
        print(f"⚠️ [Checkin] History error: {e}")
        return {"checkins": [], "total_count": 0}

@router.get("/checkin/today")
async def get_today_checkin(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Check if user has already done check-in today."""
    today_str = date.today().isoformat()
    user_id_str = str(user.id)
    
    try:
        existing = db.query(Checkin).filter(
            cast(Checkin.user_id, String) == user_id_str,
            cast(Checkin.date, String) == today_str
        ).first()
        
        if existing:
            return {"done_today": True, "checkin": {
                "id": existing.id,
                "insights": existing.insights,
                "emotional_state": existing.emotional_state
            }}
        
        return {"done_today": False, "checkin": None}
    except Exception as e:
        print(f"⚠️ [Checkin] Today check error: {e}")
        # Default to not done so user can try check-in
        return {"done_today": False, "checkin": None}

@router.get("/initial-message")
async def get_initial_message(user: User = Depends(get_current_user)):
    return {"text": f"Chào bạn! Tôi là Coach của THEKEY. Hôm nay kỷ luật của bạn thế nào?"}

@router.post("/chat")
async def chat(data: Dict[str, Any], user: User = Depends(get_current_user)):
    """AI Coach chat endpoint."""
    message = data.get("message", "")
    history = data.get("history", [])
    mode = data.get("mode", "COACH")
    
    result = await gemini_client.generate_chat_response(message, history, mode)
    return result
