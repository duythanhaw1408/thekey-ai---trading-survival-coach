# backend/services/protection/fast_check.py
"""
Fast-path Trade Check Service
Provides sub-100ms deterministic rule checks before AI evaluation.
"""

from typing import Dict, Optional, Any
from decimal import Decimal


class FastTradeCheck:
    """
    Performs fast, deterministic rule checks on trade intents.
    If a rule is violated, returns immediately without calling AI.
    """
    
    def __init__(self, user_settings: Dict[str, Any]):
        """
        Initialize with user-specific settings.
        
        Args:
            user_settings: Dict containing:
                - account_balance: float
                - max_position_size_usd: float
                - risk_per_trade_pct: float
                - daily_trade_limit: int
                - protection_level: str ('SURVIVAL', 'DISCIPLINE', 'FLEXIBLE')
        """
        self.account_balance = float(user_settings.get('account_balance', 1000))
        self.max_position_size_usd = float(user_settings.get('max_position_size_usd', 500))
        self.risk_per_trade_pct = float(user_settings.get('risk_per_trade_pct', 2))
        self.daily_trade_limit = int(user_settings.get('daily_trade_limit', 5))
        self.protection_level = user_settings.get('protection_level', 'SURVIVAL')
    
    def check(self, trade: Dict[str, Any], today_trade_count: int = 0) -> Optional[Dict[str, Any]]:
        """
        Perform fast rule checks on a trade intent.
        
        Args:
            trade: Dict containing:
                - positionSize: float (USD volume)
                - entryPrice: float
                - stopLoss: float (optional)
                - takeProfit: float (optional)
                - reasoning: str (optional)
            today_trade_count: Number of trades user has made today
        
        Returns:
            None if all checks pass (proceed to AI).
            Dict with decision/reason if rule violated.
        """
        
        # Rule 1: Stop Loss Required (SURVIVAL and DISCIPLINE levels)
        if self.protection_level in ['SURVIVAL', 'DISCIPLINE']:
            stop_loss = trade.get('stopLoss')
            if not stop_loss or stop_loss == 0:
                return {
                    "decision": "BLOCK",
                    "reason": "⛔ Stop Loss là bắt buộc. Hãy đặt mức cắt lỗ trước khi vào lệnh để bảo vệ vốn.",
                    "rule": "STOP_LOSS_REQUIRED",
                    "fast_check": True
                }
        
        # Rule 2: Max Position Size
        position_size = float(trade.get('positionSize', 0))
        if position_size > self.max_position_size_usd:
            return {
                "decision": "BLOCK",
                "reason": f"⛔ Kích thước lệnh ${position_size:,.0f} vượt quá giới hạn cho phép ${self.max_position_size_usd:,.0f}. Hãy giảm khối lượng.",
                "rule": "MAX_POSITION_SIZE",
                "recommended_size": self.max_position_size_usd,
                "fast_check": True
            }
        
        # Rule 3: Risk per Trade (only if SL provided)
        entry_price = float(trade.get('entryPrice', 0))
        stop_loss = trade.get('stopLoss')
        
        if stop_loss and entry_price > 0:
            stop_loss = float(stop_loss)
            # Calculate potential loss
            price_diff = abs(entry_price - stop_loss)
            potential_loss = (price_diff / entry_price) * position_size
            
            max_allowed_risk = self.account_balance * (self.risk_per_trade_pct / 100)
            
            if potential_loss > max_allowed_risk:
                return {
                    "decision": "WARN",
                    "reason": f"⚠️ Rủi ro tiềm năng ${potential_loss:,.2f} vượt quá ngưỡng cho phép ${max_allowed_risk:,.2f} ({self.risk_per_trade_pct}% vốn). Cân nhắc thu hẹp Stop Loss hoặc giảm khối lượng.",
                    "rule": "RISK_PER_TRADE",
                    "potential_loss": potential_loss,
                    "max_allowed_risk": max_allowed_risk,
                    "fast_check": True
                }
        
        # Rule 4: Daily Trade Limit
        if today_trade_count >= self.daily_trade_limit:
            return {
                "decision": "WARN",
                "reason": f"⚠️ Bạn đã thực hiện {today_trade_count}/{self.daily_trade_limit} lệnh hôm nay. Đây là giới hạn bạn tự đặt để tránh overtrade.",
                "rule": "DAILY_TRADE_LIMIT",
                "fast_check": True
            }
        
        # Rule 5: Reasoning Quality (SURVIVAL level)
        if self.protection_level == 'SURVIVAL':
            reasoning = trade.get('reasoning', '').strip()
            if len(reasoning) < 10:
                return {
                    "decision": "WARN",
                    "reason": "⚠️ Lý do vào lệnh quá ngắn. Hãy mô tả chi tiết hơn để xác nhận bạn đã suy nghĩ kỹ.",
                    "rule": "REASONING_QUALITY",
                    "fast_check": True
                }
        
        # All fast checks passed - proceed to AI evaluation
        return None
    
    def get_stats(self) -> Dict[str, Any]:
        """Return current settings for debugging."""
        return {
            "account_balance": self.account_balance,
            "max_position_size_usd": self.max_position_size_usd,
            "risk_per_trade_pct": self.risk_per_trade_pct,
            "daily_trade_limit": self.daily_trade_limit,
            "protection_level": self.protection_level
        }
