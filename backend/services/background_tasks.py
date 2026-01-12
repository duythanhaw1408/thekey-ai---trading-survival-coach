# backend/services/background_tasks.py
"""
THEKEY Background Tasks Service
Handles async operations with progress tracking via SSE.
Uses FastAPI BackgroundTasks (no Redis required for MVP).
"""

import asyncio
from typing import Callable, Any, Dict
from datetime import datetime
import traceback

# Import job management functions
from routes.stream import create_job, update_job, get_job


class AsyncTaskRunner:
    """
    Runs async tasks with progress tracking.
    Designed to work with FastAPI BackgroundTasks.
    """
    
    @staticmethod
    async def run_post_trade_analysis(
        job_id: str,
        trade_id: str,
        user_id: str,
        user_process_evaluation: dict,
        gemini_client,
        db_session
    ) -> dict:
        """
        Run post-trade analysis asynchronously with progress updates.
        
        Phases:
        1. Load trade data (0-20%)
        2. Prepare context (20-40%)
        3. Call Gemini AI (40-80%)
        4. Save results (80-100%)
        """
        try:
            # Phase 1: Load trade data
            update_job(job_id, progress=5, status="running", 
                      message="Đang tải dữ liệu giao dịch...")
            
            from models import Trade
            trade = db_session.query(Trade).filter(
                Trade.id == trade_id,
                Trade.user_id == user_id
            ).first()
            
            if not trade:
                update_job(job_id, error="Không tìm thấy giao dịch")
                return {"error": "Trade not found"}
            
            update_job(job_id, progress=20, 
                      message="Đã tải dữ liệu giao dịch")
            
            # Phase 2: Prepare context
            update_job(job_id, progress=30, 
                      message="Đang chuẩn bị ngữ cảnh phân tích...")
            
            # Get recent trades for context
            recent_trades = db_session.query(Trade).filter(
                Trade.user_id == user_id,
                Trade.status == "CLOSED"
            ).order_by(Trade.exit_time.desc()).limit(5).all()
            
            context = {
                "trade": {
                    "symbol": trade.symbol,
                    "side": trade.side,
                    "entry_price": float(trade.entry_price) if trade.entry_price else 0,
                    "exit_price": float(trade.exit_price) if trade.exit_price else 0,
                    "pnl": float(trade.pnl) if trade.pnl else 0,
                    "pnl_pct": float(trade.pnl_pct) if trade.pnl_pct else 0,
                },
                "user_process_evaluation": user_process_evaluation,
                "recent_trades": [
                    {
                        "symbol": t.symbol,
                        "pnl": float(t.pnl) if t.pnl else 0,
                        "pnl_pct": float(t.pnl_pct) if t.pnl_pct else 0,
                    }
                    for t in recent_trades[:3]
                ]
            }
            
            update_job(job_id, progress=40, 
                      message="Đang gọi AI phân tích...")
            
            # Phase 3: Call Gemini AI
            try:
                analysis = await gemini_client.analyze_post_trade(context)
                update_job(job_id, progress=80, 
                          message="AI đã hoàn thành phân tích")
            except Exception as ai_error:
                print(f"[BackgroundTask] AI error: {ai_error}")
                # Fallback analysis
                analysis = {
                    "summary": "Không thể phân tích chi tiết do lỗi AI.",
                    "scores": user_process_evaluation,
                    "recommendations": ["Tiếp tục theo dõi quy trình giao dịch"],
                    "weakest_area": "UNKNOWN"
                }
                update_job(job_id, progress=80, 
                          message="Sử dụng phân tích cơ bản (AI không khả dụng)")
            
            # Phase 4: Save results
            update_job(job_id, progress=90, 
                      message="Đang lưu kết quả...")
            
            import json
            trade.process_evaluation = json.dumps(analysis, ensure_ascii=False)
            trade.user_process_evaluation = json.dumps(user_process_evaluation, ensure_ascii=False)
            db_session.commit()
            
            # Complete
            update_job(job_id, progress=100, status="completed",
                      message="Hoàn thành!", result=analysis)
            
            return analysis
            
        except Exception as e:
            error_msg = f"Lỗi: {str(e)}"
            print(f"[BackgroundTask] Error: {traceback.format_exc()}")
            update_job(job_id, error=error_msg)
            return {"error": error_msg}
    
    @staticmethod
    async def run_mindset_analysis(
        job_id: str,
        user_id: str,
        trade_history: list,
        checkin_history: list,
        gemini_client
    ) -> dict:
        """
        Run mindset/archetype analysis asynchronously.
        
        Phases:
        1. Prepare behavioral data (0-30%)
        2. Call Gemini AI (30-80%)
        3. Process results (80-100%)
        """
        try:
            update_job(job_id, progress=10, status="running",
                      message="Đang quét dữ liệu hành vi...")
            
            await asyncio.sleep(0.5)  # Simulate processing
            
            update_job(job_id, progress=30,
                      message="Đang phân tích mẫu hành vi...")
            
            # Call AI
            try:
                analysis = await gemini_client.get_trader_archetype(
                    trade_history, checkin_history
                )
                update_job(job_id, progress=80,
                          message="Đã xác định hình mẫu trader")
            except Exception as ai_error:
                print(f"[BackgroundTask] AI error: {ai_error}")
                analysis = {
                    "archetype": "UNDEFINED",
                    "confidence": 0.5,
                    "description": "Chưa đủ dữ liệu để xác định hình mẫu",
                    "traits": []
                }
            
            update_job(job_id, progress=100, status="completed",
                      message="Hoàn thành!", result=analysis)
            
            return analysis
            
        except Exception as e:
            error_msg = f"Lỗi: {str(e)}"
            update_job(job_id, error=error_msg)
            return {"error": error_msg}


# Convenience functions
def start_post_trade_job(user_id: str, trade_id: str) -> str:
    """Create a job for post-trade analysis."""
    return create_job(user_id, "post_trade_analysis", {"trade_id": trade_id})


def start_mindset_job(user_id: str) -> str:
    """Create a job for mindset analysis."""
    return create_job(user_id, "mindset_analysis")


# Export
async_task_runner = AsyncTaskRunner()
