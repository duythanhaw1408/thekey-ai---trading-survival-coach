# backend/services/rule_engine.py
"""
THEKEY Fast-path Rule Engine v1.0
Handles 90% of trade decisions without calling Gemini API.
Reduces latency from 1-2s to <100ms.

Author: THEKEY AI Team
"""

from typing import Dict, Any, List, Optional, Literal
from dataclasses import dataclass
from datetime import datetime, timedelta

Decision = Literal["BLOCK", "WARN", "ALLOW", "GRAY_ZONE"]
Severity = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]


@dataclass
class RuleResult:
    """Result from a single rule evaluation."""
    rule_id: str
    decision: Decision
    severity: Severity
    message: str
    cooldown_seconds: int = 0


@dataclass
class EngineResult:
    """Final result from the rule engine."""
    decision: Decision
    reason: str
    triggered_rules: List[str]
    cooldown: int
    recommended_size: Optional[float]
    needs_ai: bool  # True if should fallback to Gemini


class RuleEngine:
    """
    Fast-path Rule Engine for THEKEY.
    
    Evaluates trades against deterministic rules without AI calls.
    Only returns GRAY_ZONE when human judgment or AI explanation is needed.
    """
    
    DEFAULT_CONFIG = {
        "max_consecutive_losses_block": 2,
        "max_consecutive_losses_warn": 1,
        "max_position_size_pct": 5.0,  # % of account balance
        "max_position_size_usd": 500,
        "max_daily_trades": 5,
        "cooldown_after_loss_minutes": 30,
        "min_stop_loss_required": True,
        "max_risk_per_trade_pct": 2.0,
        "require_take_profit": False,
        "min_rr_ratio": 1.0,  # Risk/Reward ratio
    }
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = {**self.DEFAULT_CONFIG, **(config or {})}
        self.rules = [
            self._rule_consecutive_losses,
            self._rule_position_size,
            self._rule_daily_trade_limit,
            self._rule_cooldown_period,
            self._rule_stop_loss_required,
            self._rule_risk_per_trade,
            self._rule_take_profit,
            self._rule_risk_reward_ratio,
            self._rule_overconfidence,
            self._rule_market_hours,
        ]
    
    def evaluate(
        self,
        trade: Dict[str, Any],
        stats: Dict[str, Any],
        trade_history: List[Dict[str, Any]],
        user_settings: Dict[str, Any]
    ) -> EngineResult:
        """
        Evaluate a trade against all rules.
        
        Args:
            trade: The proposed trade (asset, direction, size, sl, tp, etc.)
            stats: Current trader stats (consecutiveLosses, consecutiveWins, etc.)
            trade_history: Recent trade history
            user_settings: User's protection settings
        
        Returns:
            EngineResult with decision and reasoning
        """
        # Merge user settings with defaults
        cfg = {**self.config, **user_settings}
        
        results: List[RuleResult] = []
        
        for rule_fn in self.rules:
            try:
                result = rule_fn(trade, stats, trade_history, cfg)
                if result:
                    results.append(result)
            except Exception as e:
                # Log but don't crash on individual rule failures
                print(f"[RuleEngine] Rule {rule_fn.__name__} failed: {e}")
        
        return self._aggregate_results(results)
    
    def _aggregate_results(self, results: List[RuleResult]) -> EngineResult:
        """Aggregate all rule results into a final decision."""
        if not results:
            return EngineResult(
                decision="ALLOW",
                reason="Không có vi phạm quy tắc nào được phát hiện.",
                triggered_rules=[],
                cooldown=0,
                recommended_size=None,
                needs_ai=False
            )
        
        # Find the most severe result
        blocks = [r for r in results if r.decision == "BLOCK"]
        warns = [r for r in results if r.decision == "WARN"]
        gray_zones = [r for r in results if r.decision == "GRAY_ZONE"]
        
        if blocks:
            # BLOCK takes precedence
            most_severe = max(blocks, key=lambda r: {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}[r.severity])
            all_reasons = [r.message for r in blocks]
            return EngineResult(
                decision="BLOCK",
                reason=" ".join(all_reasons),
                triggered_rules=[r.rule_id for r in blocks],
                cooldown=max(r.cooldown_seconds for r in blocks),
                recommended_size=None,
                needs_ai=False  # Clear BLOCK, no AI needed
            )
        
        if warns:
            all_reasons = [r.message for r in warns]
            return EngineResult(
                decision="WARN",
                reason=" ".join(all_reasons),
                triggered_rules=[r.rule_id for r in warns],
                cooldown=max((r.cooldown_seconds for r in warns), default=0),
                recommended_size=None,
                needs_ai=len(gray_zones) > 0  # If there are gray zones, also call AI
            )
        
        if gray_zones:
            return EngineResult(
                decision="GRAY_ZONE",
                reason="Cần phân tích thêm từ AI.",
                triggered_rules=[r.rule_id for r in gray_zones],
                cooldown=0,
                recommended_size=None,
                needs_ai=True  # Definitely need AI
            )
        
        return EngineResult(
            decision="ALLOW",
            reason="Không có vi phạm quy tắc nào được phát hiện.",
            triggered_rules=[],
            cooldown=0,
            recommended_size=None,
            needs_ai=False
        )
    
    # ==================== RULES ====================
    
    def _rule_consecutive_losses(
        self, trade: Dict, stats: Dict, history: List, cfg: Dict
    ) -> Optional[RuleResult]:
        """R01: Block after consecutive losses."""
        consecutive_losses = stats.get("consecutiveLosses", 0)
        
        if consecutive_losses >= cfg["max_consecutive_losses_block"]:
            return RuleResult(
                rule_id="R01_CONSECUTIVE_LOSSES",
                decision="BLOCK",
                severity="CRITICAL",
                message=f"🛑 Bạn đã thua {consecutive_losses} lệnh liên tiếp. Hãy nghỉ ngơi {cfg['cooldown_after_loss_minutes']} phút để tránh revenge trading.",
                cooldown_seconds=cfg["cooldown_after_loss_minutes"] * 60
            )
        elif consecutive_losses >= cfg["max_consecutive_losses_warn"]:
            return RuleResult(
                rule_id="R01_CONSECUTIVE_LOSSES",
                decision="WARN",
                severity="HIGH",
                message=f"⚠️ Bạn đã thua {consecutive_losses} lệnh. Hãy cẩn thận để không rơi vào chuỗi thua.",
                cooldown_seconds=0
            )
        return None
    
    def _rule_position_size(
        self, trade: Dict, stats: Dict, history: List, cfg: Dict
    ) -> Optional[RuleResult]:
        """R02: Check position size against limits."""
        position_size = trade.get("positionSize", 0)
        account_balance = cfg.get("account_balance", 1000)
        max_pct = cfg["max_position_size_pct"]
        max_usd = cfg.get("max_position_size_usd", 500)
        
        max_allowed = min(account_balance * max_pct / 100, max_usd)
        
        if position_size > max_allowed * 1.5:  # 150% of limit = BLOCK
            return RuleResult(
                rule_id="R02_POSITION_SIZE",
                decision="BLOCK",
                severity="HIGH",
                message=f"🛑 Khối lượng ${position_size} vượt quá giới hạn ${max_allowed:.0f}. Giảm xuống để tiếp tục.",
                cooldown_seconds=0
            )
        elif position_size > max_allowed:  # Above limit = WARN
            return RuleResult(
                rule_id="R02_POSITION_SIZE",
                decision="WARN",
                severity="MEDIUM",
                message=f"⚠️ Khối lượng ${position_size} cao hơn giới hạn khuyến nghị ${max_allowed:.0f}.",
                cooldown_seconds=0
            )
        return None
    
    def _rule_daily_trade_limit(
        self, trade: Dict, stats: Dict, history: List, cfg: Dict
    ) -> Optional[RuleResult]:
        """R03: Check daily trade count."""
        today = datetime.now().date()
        today_trades = [t for t in history if self._is_today(t.get("timestamp"))]
        
        if len(today_trades) >= cfg["max_daily_trades"]:
            return RuleResult(
                rule_id="R03_DAILY_LIMIT",
                decision="BLOCK",
                severity="HIGH",
                message=f"🛑 Bạn đã đạt giới hạn {cfg['max_daily_trades']} lệnh/ngày. Hãy nghỉ ngơi và quay lại ngày mai.",
                cooldown_seconds=300  # 5 minutes cooldown message
            )
        elif len(today_trades) >= cfg["max_daily_trades"] - 1:
            return RuleResult(
                rule_id="R03_DAILY_LIMIT",
                decision="WARN",
                severity="LOW",
                message=f"⚠️ Đây là lệnh cuối cùng trong giới hạn {cfg['max_daily_trades']} lệnh/ngày.",
                cooldown_seconds=0
            )
        return None
    
    def _rule_cooldown_period(
        self, trade: Dict, stats: Dict, history: List, cfg: Dict
    ) -> Optional[RuleResult]:
        """R04: Enforce cooldown after losses."""
        if not history:
            return None
        
        # Check last trade
        last_trade = history[0] if history else None
        if not last_trade:
            return None
        
        last_pnl = last_trade.get("pnl", 0)
        last_time = last_trade.get("timestamp")
        
        if last_pnl and last_pnl < 0 and last_time:
            try:
                if isinstance(last_time, str):
                    last_dt = datetime.fromisoformat(last_time.replace("Z", "+00:00"))
                else:
                    last_dt = last_time
                
                cooldown_end = last_dt + timedelta(minutes=cfg["cooldown_after_loss_minutes"])
                now = datetime.now(last_dt.tzinfo) if last_dt.tzinfo else datetime.now()
                
                if now < cooldown_end:
                    remaining = (cooldown_end - now).seconds // 60
                    return RuleResult(
                        rule_id="R04_COOLDOWN",
                        decision="WARN",
                        severity="MEDIUM",
                        message=f"⚠️ Bạn vừa thua lệnh trước đó. Còn {remaining} phút trong thời gian nghỉ ngơi.",
                        cooldown_seconds=remaining * 60
                    )
            except Exception:
                pass  # Can't parse timestamp, skip this rule
        
        return None
    
    def _rule_stop_loss_required(
        self, trade: Dict, stats: Dict, history: List, cfg: Dict
    ) -> Optional[RuleResult]:
        """R05: Require stop-loss."""
        if not cfg.get("min_stop_loss_required", True):
            return None
        
        stop_loss = trade.get("stopLoss") or trade.get("stop_loss")
        
        if not stop_loss or stop_loss == 0:
            return RuleResult(
                rule_id="R05_STOP_LOSS",
                decision="WARN",
                severity="HIGH",
                message="⚠️ Bạn chưa đặt Stop-Loss! Giao dịch không có SL là một trong những cách nhanh nhất để cháy tài khoản.",
                cooldown_seconds=0
            )
        return None
    
    def _rule_risk_per_trade(
        self, trade: Dict, stats: Dict, history: List, cfg: Dict
    ) -> Optional[RuleResult]:
        """R06: Check risk percentage per trade."""
        position_size = trade.get("positionSize", 0)
        stop_loss = trade.get("stopLoss") or trade.get("stop_loss")
        entry_price = trade.get("entryPrice") or trade.get("entry_price", 0)
        account_balance = cfg.get("account_balance", 1000)
        
        if not stop_loss or not entry_price or entry_price == 0:
            return None  # Can't calculate, handled by R05
        
        # Calculate potential loss
        sl_distance_pct = abs(entry_price - stop_loss) / entry_price * 100
        potential_loss = position_size * sl_distance_pct / 100
        risk_pct = potential_loss / account_balance * 100
        
        if risk_pct > cfg["max_risk_per_trade_pct"] * 2:
            return RuleResult(
                rule_id="R06_RISK_PCT",
                decision="BLOCK",
                severity="CRITICAL",
                message=f"🛑 Rủi ro {risk_pct:.1f}% vượt quá giới hạn {cfg['max_risk_per_trade_pct']}% rất nhiều!",
                cooldown_seconds=0
            )
        elif risk_pct > cfg["max_risk_per_trade_pct"]:
            return RuleResult(
                rule_id="R06_RISK_PCT",
                decision="WARN",
                severity="HIGH",
                message=f"⚠️ Rủi ro {risk_pct:.1f}% cao hơn giới hạn {cfg['max_risk_per_trade_pct']}%.",
                cooldown_seconds=0
            )
        return None
    
    def _rule_take_profit(
        self, trade: Dict, stats: Dict, history: List, cfg: Dict
    ) -> Optional[RuleResult]:
        """R07: Recommend take-profit."""
        if not cfg.get("require_take_profit", False):
            return None
        
        take_profit = trade.get("takeProfit") or trade.get("take_profit")
        
        if not take_profit or take_profit == 0:
            return RuleResult(
                rule_id="R07_TAKE_PROFIT",
                decision="WARN",
                severity="LOW",
                message="💡 Bạn chưa đặt Take-Profit. Hãy cân nhắc đặt TP để bảo vệ lợi nhuận.",
                cooldown_seconds=0
            )
        return None
    
    def _rule_risk_reward_ratio(
        self, trade: Dict, stats: Dict, history: List, cfg: Dict
    ) -> Optional[RuleResult]:
        """R08: Check Risk/Reward ratio."""
        stop_loss = trade.get("stopLoss") or trade.get("stop_loss")
        take_profit = trade.get("takeProfit") or trade.get("take_profit")
        entry_price = trade.get("entryPrice") or trade.get("entry_price", 0)
        direction = trade.get("direction", "BUY")
        
        if not stop_loss or not take_profit or not entry_price:
            return None  # Can't calculate
        
        if direction == "BUY":
            risk = entry_price - stop_loss
            reward = take_profit - entry_price
        else:  # SELL
            risk = stop_loss - entry_price
            reward = entry_price - take_profit
        
        if risk <= 0:
            return None  # Invalid SL
        
        rr_ratio = reward / risk
        min_rr = cfg.get("min_rr_ratio", 1.0)
        
        if rr_ratio < min_rr:
            return RuleResult(
                rule_id="R08_RR_RATIO",
                decision="WARN",
                severity="MEDIUM",
                message=f"⚠️ Tỷ lệ R:R ({rr_ratio:.1f}) thấp hơn khuyến nghị ({min_rr}). Hãy cân nhắc điều chỉnh TP/SL.",
                cooldown_seconds=0
            )
        return None
    
    def _rule_overconfidence(
        self, trade: Dict, stats: Dict, history: List, cfg: Dict
    ) -> Optional[RuleResult]:
        """R09: Warn about overconfidence after winning streak."""
        consecutive_wins = stats.get("consecutiveWins", 0)
        position_size = trade.get("positionSize", 0)
        
        if consecutive_wins >= 3 and position_size > 100:  # Winning streak + large position
            return RuleResult(
                rule_id="R09_OVERCONFIDENCE",
                decision="WARN",
                severity="MEDIUM",
                message=f"⚠️ Bạn đang thắng {consecutive_wins} lệnh liên tiếp. Hãy cẩn thận với tâm lý quá tự tin!",
                cooldown_seconds=0
            )
        return None
    
    def _rule_market_hours(
        self, trade: Dict, stats: Dict, history: List, cfg: Dict
    ) -> Optional[RuleResult]:
        """R10: Warn about trading during unusual hours."""
        now = datetime.now()
        hour = now.hour
        
        # Crypto markets are 24/7, but user might have set quiet hours
        sleep_start = cfg.get("sleep_schedule_start", "23:00")
        sleep_end = cfg.get("sleep_schedule_end", "07:00")
        
        try:
            sleep_start_hour = int(sleep_start.split(":")[0])
            sleep_end_hour = int(sleep_end.split(":")[0])
            
            is_sleep_time = False
            if sleep_start_hour > sleep_end_hour:  # Overnight (e.g., 23:00 - 07:00)
                is_sleep_time = hour >= sleep_start_hour or hour < sleep_end_hour
            else:
                is_sleep_time = sleep_start_hour <= hour < sleep_end_hour
            
            if is_sleep_time:
                return RuleResult(
                    rule_id="R10_MARKET_HOURS",
                    decision="GRAY_ZONE",  # Not blocking, but needs AI to explain
                    severity="LOW",
                    message="💤 Hiện đang trong giờ nghỉ ngơi của bạn. Hãy cân nhắc kỹ trước khi vào lệnh.",
                    cooldown_seconds=0
                )
        except Exception:
            pass  # Can't parse sleep schedule
        
        return None
    
    # ==================== HELPERS ====================
    
    def _is_today(self, timestamp) -> bool:
        """Check if timestamp is today."""
        if not timestamp:
            return False
        try:
            if isinstance(timestamp, str):
                dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            else:
                dt = timestamp
            return dt.date() == datetime.now().date()
        except Exception:
            return False


# Singleton instance
rule_engine = RuleEngine()
