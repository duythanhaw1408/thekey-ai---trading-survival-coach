from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any, List
from services.ai.gemini_client import gemini_client
from services.auth.dependencies import get_current_user
from models import get_db, User, Trade
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/reflection", tags=["reflection"])

class CheckinAnswers(BaseModel):
    answers: List[Any]

@router.get("/checkin/questions")
async def get_questions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get personalized check-in questions."""
    recent_trades_count = db.query(Trade).filter(Trade.user_id == user.id).count()
    context = {"recent_trades_count": recent_trades_count}
    questions = await gemini_client.generate_checkin_questions(context)
    return {"questions": questions}

@router.post("/checkin/submit")
async def submit_checkin(data: CheckinAnswers, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Submit answers and get AI analysis."""
    # In a real app, save check-in to DB here
    return {
        "insights": "You are showing good discipline despite some volatility.",
        "action_items": ["Take a 5 min break after a win", "Stick to your stop loss"],
        "encouragement": "Keep going!"
    }

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

