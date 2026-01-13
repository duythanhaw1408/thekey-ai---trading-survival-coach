from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import get_db, Trade, User
from services.auth.dependencies import get_current_user
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/trades", tags=["trades"])

class TradeBase(BaseModel):
    symbol: str
    side: str
    entry_price: float
    quantity: float
    entry_time: datetime
    status: Optional[str] = "OPEN"

class TradeCreate(TradeBase):
    ai_decision: Optional[str] = None
    ai_reason: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

class TradeResponse(BaseModel):
    id: Any
    symbol: str
    side: str
    entry_price: float
    exit_price: Optional[float] = None
    quantity: float
    pnl: Optional[float] = None
    pnl_pct: Optional[float] = None
    entry_time: datetime
    exit_time: Optional[datetime] = None
    status: Optional[str] = None
    ai_decision: Optional[str] = None
    ai_reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    # Process Dojo fields
    user_process_evaluation: Optional[dict] = None
    process_evaluation: Optional[dict] = None
    process_score: Optional[float] = None
    
    class Config:
        from_attributes = True

@router.post("/")
async def create_trade(trade: TradeCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Extract tags and notes specifically
    trade_data = trade.dict()
    db_trade = Trade(user_id=user.id, **trade_data)
    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)
    return db_trade

@router.get("/", response_model=List[TradeResponse])
async def get_user_trades(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    print(f"[DEBUG] /api/trades/ called for user_id: {user.id}, email: {user.email}")
    trades = db.query(Trade).filter(Trade.user_id == user.id).order_by(Trade.entry_time.desc()).all()
    print(f"[DEBUG] Found {len(trades)} trades for user {user.email}")
    if trades:
        print(f"[DEBUG] First trade ID: {trades[0].id}, Entry: {trades[0].entry_time}")
    return trades

@router.put("/{trade_id}/close")
async def close_trade(trade_id: str, pnl: float, exit_price: float, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == user.id).first()
    if not db_trade:
        raise HTTPException(status_code=404, detail="Trade not found or unauthorized")
    
    db_trade.pnl = pnl
    db_trade.exit_price = exit_price
    db_trade.exit_time = datetime.utcnow()
    db_trade.status = "CLOSED"
    db.commit()
    return db_trade


class TradeEvaluationUpdate(BaseModel):
    user_process_evaluation: Optional[dict] = None
    process_evaluation: Optional[dict] = None
    process_score: Optional[float] = None


@router.put("/{trade_id}/evaluation")
async def update_trade_evaluation(trade_id: str, data: TradeEvaluationUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update a trade with process evaluation data from Dojo"""
    db_trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == user.id).first()
    if not db_trade:
        raise HTTPException(status_code=404, detail="Trade not found or unauthorized")
    
    if data.user_process_evaluation:
        db_trade.user_process_evaluation = data.user_process_evaluation
    if data.process_evaluation:
        db_trade.process_evaluation = data.process_evaluation
    if data.process_score is not None:
        db_trade.process_score = data.process_score
    
    db.commit()
    db.refresh(db_trade)
    return db_trade


# ============================================
# POST-TRADE EVALUATE WITH ASYNC AI ANALYSIS
# ============================================
from fastapi import BackgroundTasks
import json

# Note: routes.stream imports are done inside functions to avoid circular import


class PostTradeEvaluateRequest(BaseModel):
    """Request body for post-trade evaluation with Dojo 7 steps"""
    user_process_evaluation: dict  # 7 Dojo steps from user
    run_async: bool = True  # Whether to run AI analysis async


@router.post("/{trade_id}/evaluate", status_code=202)
async def evaluate_post_trade(
    trade_id: str,
    body: PostTradeEvaluateRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit Dojo 7-step evaluation and trigger async AI analysis.
    
    Flow:
    1. Save user's 7-step Dojo evaluation to DB
    2. Create job for SSE tracking
    3. Enqueue background task for AI analysis
    4. Return job_id for SSE subscription
    
    Frontend should:
    1. POST this endpoint with Dojo data
    2. Connect to SSE: GET /api/stream/jobs/{job_id}
    3. Receive progress updates until complete
    """
    # Step 1: Verify trade exists and belongs to user
    db_trade = db.query(Trade).filter(
        Trade.id == trade_id, 
        Trade.user_id == user.id
    ).first()
    
    if not db_trade:
        raise HTTPException(status_code=404, detail="Trade not found or unauthorized")
    
    # Step 2: Save user's Dojo evaluation immediately
    db_trade.user_process_evaluation = body.user_process_evaluation
    db.commit()
    
    # Step 3: Create job for SSE tracking (local import to avoid circular import)
    from routes.stream import create_job
    job_id = create_job(
        user_id=str(user.id),
        job_type="post_trade_analysis",
        metadata={"trade_id": str(trade_id)}
    )

    
    # Step 4: Enqueue background task for AI analysis
    if body.run_async:
        background_tasks.add_task(
            run_post_trade_ai_analysis,
            job_id=job_id,
            trade_id=str(trade_id),
            user_id=str(user.id),
            user_eval=body.user_process_evaluation,
            trade_data={
                "symbol": db_trade.symbol,
                "side": db_trade.side,
                "entry_price": float(db_trade.entry_price) if db_trade.entry_price else 0,
                "exit_price": float(db_trade.exit_price) if db_trade.exit_price else 0,
                "pnl": float(db_trade.pnl) if db_trade.pnl else 0,
                "quantity": float(db_trade.quantity) if db_trade.quantity else 0,
            }
        )
    
    return {
        "accepted": True,
        "job_id": job_id,
        "sse_url": f"/api/stream/jobs/{job_id}",
        "message": "AI analysis started. Subscribe to SSE for progress."
    }


async def run_post_trade_ai_analysis(
    job_id: str,
    trade_id: str,
    user_id: str,
    user_eval: dict,
    trade_data: dict
):
    """
    Background task to run post-trade AI analysis.
    Updates job progress via SSE.
    """
    # Local imports to avoid circular import
    from routes.stream import update_job
    from services.ai.gemini_client import gemini_client
    
    try:
        # Progress: 10% - Started
        update_job(job_id, progress=10, status="running",
                  message="Đang phân tích dữ liệu giao dịch...")
        
        # Progress: 30% - Preparing context
        update_job(job_id, progress=30,
                  message="Đang chuẩn bị ngữ cảnh cho AI...")
        
        # Prepare prompt for Gemini
        system_prompt = """Bạn là THEKEY Post-Trade Analyst. Phân tích đánh giá 7 bước Dojo của trader.
        
Trả về JSON với cấu trúc:
{
  "summary": "Tóm tắt ngắn về lệnh này",
  "root_cause": "Nguyên nhân gốc rễ của kết quả (tốt hoặc xấu)",
  "rule_violations": ["Danh sách các quy tắc đã vi phạm nếu có"],
  "lessons": ["2-4 bài học rút ra"],
  "next_time_checklist": ["3 điều cần làm lần sau"],
  "micro_habit": "Một thói quen nhỏ để cải thiện",
  "process_score": 0-100
}

KHÔNG đưa ra tín hiệu giao dịch. Chỉ tập trung vào quy trình và tâm lý."""
        
        context = {
            "trade": trade_data,
            "user_evaluation": user_eval
        }
        
        # Progress: 50% - Calling AI
        update_job(job_id, progress=50,
                  message="Đang gọi AI phân tích...")
        
        try:
            # Call Gemini for analysis
            analysis = await gemini_client.generate_json_response(
                prompt=f"Phân tích lệnh sau:\n{json.dumps(context, ensure_ascii=False)}",
                system_prompt=system_prompt
            )
        except Exception as ai_error:
            print(f"[PostTradeAI] Gemini error: {ai_error}")
            # Fallback analysis
            analysis = {
                "summary": "Không thể phân tích chi tiết do lỗi AI",
                "root_cause": "Cần xem lại sau",
                "rule_violations": [],
                "lessons": [
                    "Luôn tuân thủ stop-loss",
                    "Ghi chép lại quy trình"
                ],
                "next_time_checklist": [
                    "Kiểm tra R:R trước khi vào",
                    "Không dời SL",
                    "Đợi nến đóng"
                ],
                "micro_habit": "Journaling 3 câu sau mỗi lệnh",
                "process_score": 50
            }
        
        # Progress: 80% - Saving to DB
        update_job(job_id, progress=80,
                  message="Đang lưu kết quả...")
        
        # Save analysis to DB
        from models import get_db
        db = next(get_db())
        try:
            db_trade = db.query(Trade).filter(Trade.id == trade_id).first()
            if db_trade:
                db_trade.process_evaluation = analysis
                db_trade.process_score = analysis.get("process_score", 50)
                db.commit()
        finally:
            db.close()
        
        # Progress: 100% - Complete
        update_job(job_id, progress=100, status="completed",
                  message="Hoàn thành!", result=analysis)
        
    except Exception as e:
        print(f"[PostTradeAI] Error: {e}")
        update_job(job_id, error=f"Lỗi: {str(e)}")
