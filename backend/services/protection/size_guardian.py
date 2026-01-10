# backend/services/protection/size_guardian.py

from typing import Dict

class PositionSizeGuardian:
    """
    Monitors and enforces position sizing rules.
    """
    
    def __init__(self, user_id: str, base_max_pct: float = 0.05):
        self.user_id = user_id
        self.base_max_pct = base_max_pct

    async def check_position_size(self, intended_size: float, account_balance: float, user_stats: Dict) -> Dict:
        """
        Evaluate if the intended position size is safe.
        """
        # Dynamic limit: Reduce limit if user is on a losing streak
        dynamic_limit_pct = self.base_max_pct
        if user_stats.get('consecutive_losses', 0) >= 2:
            dynamic_limit_pct = 0.02 # Reduce to 2% if tilted
            
        max_size = account_balance * dynamic_limit_pct
        
        if intended_size > max_size:
            severity = "blocked" if intended_size > max_size * 1.5 else "warning"
            return {
                "allowed": severity != "blocked",
                "reason": "excessive_size",
                "severity": severity,
                "max_allowed": max_size,
                "recommended_size": max_size * 0.8,
                "message": f"Kích thước vị thế này (${intended_size}) quá lớn so với giới hạn an toàn (${max_size:.2f}) dựa trên kỷ luật hiện tại của bạn."
            }
            
        return {
            "allowed": True,
            "severity": "safe",
            "message": "Kích thước vị thế nằm trong vùng an toàn."
        }
