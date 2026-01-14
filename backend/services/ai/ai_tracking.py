# backend/services/ai/ai_tracking.py
"""
AI Decision Tracking Service.
Logs all AI decisions and updates outcomes for accuracy measurement.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from uuid import UUID
import json

from models import AIPrediction


class AITracker:
    """
    Tracks AI decisions for validation and accuracy measurement.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def log_decision(
        self,
        user_id: UUID,
        decision: str,
        reason: str,
        rule: str,
        trade_intent: Dict[str, Any],
        confidence: float = None,
        trade_id: UUID = None
    ) -> AIPrediction:
        """
        Log an AI decision.
        
        Args:
            user_id: User UUID
            decision: 'ALLOW', 'WARN', or 'BLOCK'
            reason: Explanation for the decision
            rule: Which rule triggered ('FAST_CHECK', 'REVENGE_TRADE', 'AI_EVAL')
            trade_intent: The trade parameters that were evaluated
            confidence: AI confidence score (0.0-1.0)
            trade_id: Trade UUID if trade was created
        
        Returns:
            Created AIPrediction record
        """
        prediction = AIPrediction(
            user_id=user_id,
            trade_id=trade_id,
            decision=decision,
            confidence=confidence,
            reason=reason,
            rule=rule,
            trade_intent=trade_intent,
            outcome='PENDING'
        )
        
        self.db.add(prediction)
        self.db.commit()
        self.db.refresh(prediction)
        
        return prediction
    
    def update_user_action(self, prediction_id: UUID, action: str):
        """
        Update what the user did after seeing the AI decision.
        
        Args:
            prediction_id: AIPrediction UUID
            action: 'FOLLOWED', 'OVERRODE', or 'CANCELLED'
        """
        prediction = self.db.query(AIPrediction).filter(AIPrediction.id == prediction_id).first()
        if prediction:
            prediction.user_action = action
            self.db.commit()
    
    def update_outcome(self, trade_id: UUID, pnl: float):
        """
        Update the outcome when a trade is closed.
        Called when a trade is closed to calculate if AI was correct.
        
        Args:
            trade_id: Trade UUID
            pnl: Profit/loss of the trade
        """
        prediction = self.db.query(AIPrediction).filter(AIPrediction.trade_id == trade_id).first()
        if not prediction:
            return
        
        # Determine outcome
        if pnl > 0:
            outcome = 'WIN'
        elif pnl < 0:
            outcome = 'LOSS'
        else:
            outcome = 'BREAKEVEN'
        
        # Determine if AI was correct
        # ALLOW + WIN = correct
        # ALLOW + LOSS = incorrect
        # BLOCK + (user overrode) + LOSS = correct (AI was right to block)
        # BLOCK + (user overrode) + WIN = incorrect (AI was wrong to block)
        # WARN + WIN/LOSS = neutral (warning was informational)
        
        was_correct = None
        if prediction.decision == 'ALLOW':
            was_correct = (outcome == 'WIN')
        elif prediction.decision == 'BLOCK':
            if prediction.user_action == 'OVERRODE':
                was_correct = (outcome == 'LOSS')  # AI was right to block
        elif prediction.decision == 'WARN':
            # Warnings are harder to judge - only wrong if user ignored and lost big
            was_correct = not (outcome == 'LOSS' and pnl < -100)  # Arbitrary threshold
        
        prediction.outcome = outcome
        prediction.outcome_pnl = pnl
        prediction.was_correct = was_correct
        prediction.outcome_updated_at = datetime.now(timezone.utc)
        
        self.db.commit()
    
    def get_accuracy_stats(self, user_id: UUID) -> Dict[str, Any]:
        """
        Calculate AI accuracy statistics for a user.
        
        Returns:
            Dict with overall_accuracy, by_decision, and override_analysis
        """
        predictions = self.db.query(AIPrediction).filter(
            AIPrediction.user_id == user_id,
            AIPrediction.was_correct.isnot(None)
        ).all()
        
        if not predictions:
            return {
                "overall_accuracy": 0,
                "total_evaluated": 0,
                "by_decision": {
                    "BLOCK": {"accuracy": 0, "count": 0},
                    "WARN": {"accuracy": 0, "count": 0},
                    "ALLOW": {"accuracy": 0, "count": 0}
                },
                "override_analysis": {
                    "total_overrides": 0,
                    "successful_overrides": 0,
                    "failed_overrides": 0
                },
                "insights": []
            }
        
        # Overall accuracy
        correct_count = sum(1 for p in predictions if p.was_correct)
        overall_accuracy = correct_count / len(predictions)
        
        # By decision type
        by_decision = {}
        for decision_type in ['BLOCK', 'WARN', 'ALLOW']:
            decision_preds = [p for p in predictions if p.decision == decision_type]
            if decision_preds:
                correct = sum(1 for p in decision_preds if p.was_correct)
                by_decision[decision_type] = {
                    "accuracy": correct / len(decision_preds),
                    "count": len(decision_preds)
                }
            else:
                by_decision[decision_type] = {"accuracy": 0, "count": 0}
        
        # Override analysis
        overrides = [p for p in predictions if p.user_action == 'OVERRODE']
        successful_overrides = sum(1 for p in overrides if p.outcome == 'WIN')
        failed_overrides = sum(1 for p in overrides if p.outcome == 'LOSS')
        
        override_analysis = {
            "total_overrides": len(overrides),
            "successful_overrides": successful_overrides,
            "failed_overrides": failed_overrides
        }
        
        # Generate insights
        insights = self._generate_insights(by_decision, override_analysis)
        
        return {
            "overall_accuracy": round(overall_accuracy, 3),
            "total_evaluated": len(predictions),
            "by_decision": by_decision,
            "override_analysis": override_analysis,
            "insights": insights
        }
    
    def _generate_insights(self, by_decision: Dict, override_analysis: Dict) -> list:
        """Generate human-readable insights from accuracy data."""
        insights = []
        
        # Block accuracy insight
        if by_decision['BLOCK']['count'] >= 3 and by_decision['BLOCK']['accuracy'] > 0.7:
            insights.append(
                f"🛡️ Khi AI chặn lệnh, AI đúng {by_decision['BLOCK']['accuracy']*100:.0f}% số lần. Hãy tin tưởng các quyết định BLOCK!"
            )
        
        # Allow accuracy insight
        if by_decision['ALLOW']['count'] >= 5 and by_decision['ALLOW']['accuracy'] > 0.6:
            insights.append(
                f"✅ Các lệnh được AI cho phép có tỷ lệ thắng {by_decision['ALLOW']['accuracy']*100:.0f}%."
            )
        
        # Override warning
        if override_analysis['total_overrides'] >= 3:
            override_fail_rate = override_analysis['failed_overrides'] / override_analysis['total_overrides']
            if override_fail_rate > 0.6:
                insights.append(
                    f"⚠️ Khi bạn bỏ qua cảnh báo AI, bạn thua {override_fail_rate*100:.0f}% số lần. Hãy cân nhắc kỹ trước khi override."
                )
        
        return insights
