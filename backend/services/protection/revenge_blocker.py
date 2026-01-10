# backend/services/protection/revenge_blocker.py

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any

class RevengeTradePrevention:
    """
    Detects and prevents revenge trading behavior.
    """
    
    def __init__(self, user_id: str, cooldown_minutes: int = 30, consecutive_loss_limit: int = 2):
        self.user_id = user_id
        self.cooldown_minutes = cooldown_minutes
        self.consecutive_loss_limit = consecutive_loss_limit

    async def check_can_trade(self, recent_trades: List[Any]) -> Dict:
        """
        Check if the user is in a state prone to revenge trading.
        """
        if not recent_trades:
            return {"allowed": True}

        # Rule: 2 consecutive losses in the last hour
        consecutive_losses = 0
        now = datetime.now(timezone.utc)
        one_hour_ago = now - timedelta(hours=1)
        
        for trade in recent_trades:
            # Handle both dict and SQLAlchemy object
            if hasattr(trade, 'get'):
                trade_time = trade.get('exit_time') or trade.get('entry_time')
                pnl = trade.get('pnl')
            else:
                trade_time = getattr(trade, 'exit_time', None) or getattr(trade, 'entry_time', None)
                pnl = getattr(trade, 'pnl', None)

            if pnl is None: pnl = 0
            if not trade_time:
                continue

            # Convert to aware datetime if string
            if isinstance(trade_time, str):
                trade_time = datetime.fromisoformat(trade_time.replace('Z', '+00:00'))
            
            # Ensure trade_time is aware
            if trade_time.tzinfo is None:
                trade_time = trade_time.replace(tzinfo=timezone.utc)

            # Check if trade is within the last hour
            if trade_time < one_hour_ago:
                break
                
            if float(pnl) < 0:
                consecutive_losses += 1
            else:
                break # Streak broken

        if consecutive_losses >= self.consecutive_loss_limit:
            first_trade = recent_trades[0]
            if hasattr(first_trade, 'get'):
                last_loss_time = first_trade.get('exit_time') or first_trade.get('entry_time')
            else:
                last_loss_time = getattr(first_trade, 'exit_time', None) or getattr(first_trade, 'entry_time', None)

            if not last_loss_time:
                last_loss_time = now
            elif isinstance(last_loss_time, str):
                last_loss_time = datetime.fromisoformat(last_loss_time.replace('Z', '+00:00'))
            
            if last_loss_time.tzinfo is None:
                last_loss_time = last_loss_time.replace(tzinfo=timezone.utc)

            wait_until = last_loss_time + timedelta(minutes=self.cooldown_minutes)
            remaining_seconds = (wait_until - now).total_seconds()
            
            if remaining_seconds > 0:
                return {
                    "allowed": False,
                    "reason": "consecutive_losses",
                    "severity": "blocked",
                    "cooldown_seconds": int(remaining_seconds),
                    "message": f"Bạn vừa có {consecutive_losses} lệnh lỗ liên tiếp trong 1 giờ qua. Hãy nghỉ ngơi ít nhất {self.cooldown_minutes} phút để lấy lại bình tĩnh trước khi tiếp tục."
                }

        return {"allowed": True}
