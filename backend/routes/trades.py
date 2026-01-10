from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import get_db, Trade, User
from services.auth.dependencies import get_current_user
from pydantic import BaseModel
from typing import List, Optional
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
    pass

@router.post("/")
async def create_trade(trade: TradeCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_trade = Trade(user_id=user.id, **trade.dict())
    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)
    return db_trade

@router.get("/")
async def get_user_trades(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trades = db.query(Trade).filter(Trade.user_id == user.id).order_by(Trade.entry_time.desc()).all()
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
