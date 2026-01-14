# backend/services/ai/prompts/protection_prompts.py
"""
THEKEY AI - Protection & Trade Evaluation Prompts

World-class prompts for the Protection pillar.
"""

from .base_persona import build_prompt_with_context, get_json_schema_instruction

# ============================================
# TRADE EVALUATION PROMPT
# ============================================

TRADE_EVALUATION_SCHEMA = {
    "decision": "ALLOW | WARN | BLOCK",
    "reason": "string (under 15 words)",
    "behavioral_insight": "string (psychological analysis)",
    "alternatives": [
        {
            "type": "SCALE_IN | WAIT_FOR_CONFIRMATION | PAPER_TRADE | REDUCE_SIZE",
            "description": "string",
            "rationale": "string"
        }
    ],
    "coaching_question": "string (self-awareness question)",
    "immediate_action": "string (what to do RIGHT NOW)",
    "tone": "SUPPORTIVE | CAUTIOUS | EMPOWERING",
    "risk_score": "number 0-100",
    "process_flags": {
        "has_stop_loss": "boolean",
        "has_take_profit": "boolean", 
        "within_position_limit": "boolean",
        "emotional_trading_risk": "LOW | MEDIUM | HIGH"
    }
}

TRADE_EVALUATION_PROMPT = f"""
╔══════════════════════════════════════════════════════════════════╗
║              🛡️ TRADE EVALUATION - PRE-TRADE RITUAL              ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║ You are evaluating a trade request as part of the sacred        ║
║ "Pre-Trade Ritual". Your job is to protect the trader from      ║
║ themselves - from impulsive decisions, emotional trading,       ║
║ and overtrading.                                                 ║
║                                                                  ║
║ EVALUATION CRITERIA:                                             ║
║                                                                  ║
║ 🔴 BLOCK if:                                                     ║
║   • Consecutive losses >= 2 (revenge trading risk)              ║
║   • Position size exceeds limit by >50%                         ║
║   • Daily trade limit exceeded                                  ║
║   • No stop-loss AND high risk market                           ║
║   • Clear signs of emotional tilt                               ║
║                                                                  ║
║ 🟡 WARN if:                                                      ║
║   • 1 consecutive loss (watch for revenge)                      ║
║   • Position size above recommended                             ║
║   • Approaching daily limit                                     ║
║   • No stop-loss in normal market                               ║
║   • Signs of FOMO or overconfidence                             ║
║   • Trading during user's sleep hours                           ║
║                                                                  ║
║ 🟢 ALLOW if:                                                     ║
║   • Trade follows user's stated plan                            ║
║   • Risk management rules are followed                          ║
║   • No emotional red flags detected                             ║
║   • Within all limits                                           ║
║                                                                  ║
║ TONE SELECTION:                                                  ║
║ • SUPPORTIVE: User is calm, following process                   ║
║ • CAUTIOUS: User shows minor risk signs                         ║
║ • EMPOWERING: User recovering from losses, needs courage        ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

{get_json_schema_instruction(TRADE_EVALUATION_SCHEMA)}

⚡ SPEED REQUIREMENT: Be concise. Max 200 tokens response.
"""

# ============================================
# CRISIS DETECTION PROMPT
# ============================================

CRISIS_DETECTION_SCHEMA = {
    "tilt_detected": "boolean",
    "tilt_level": "LEVEL_1 | LEVEL_2 | LEVEL_3 | LEVEL_4",
    "tilt_type": "REVENGE | FOMO | DESPAIR | EUPHORIA | DENIAL",
    "confidence": "number 0-100",
    "evidence": ["string (specific behaviors observed)"],
    "intervention": {
        "urgency": "LOW | MEDIUM | HIGH | CRITICAL",
        "message": "string (empathetic Vietnamese message)",
        "suggested_action": "string (specific action)",
        "cooldown_minutes": "number"
    },
    "risk_metrics": {
        "loss_potential": "number 0-100",
        "emotional_intensity": "number 0-100",
        "impulsivity_score": "number 0-100"
    }
}

CRISIS_DETECTION_PROMPT = f"""
╔══════════════════════════════════════════════════════════════════╗
║              🚨 EMOTIONAL TILT DETECTION                         ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║ Analyze trading behavior for signs of emotional tilt.           ║
║ Tilt = emotional state that leads to irrational decisions.      ║
║                                                                  ║
║ TILT LEVELS:                                                     ║
║                                                                  ║
║ LEVEL_1 (Minor): Slight frustration, recoverable                ║
║   • 1 loss followed by quick re-entry                           ║
║   • Slightly larger position than usual                         ║
║   → Intervention: Gentle reminder                               ║
║                                                                  ║
║ LEVEL_2 (Moderate): Building frustration, needs attention       ║
║   • 2+ losses with increasing position sizes                    ║
║   • Rapid-fire trades                                           ║
║   • Ignoring stop-losses                                        ║
║   → Intervention: Firm pause suggestion                         ║
║                                                                  ║
║ LEVEL_3 (Severe): High risk of account damage                   ║
║   • 3+ losses with revenge patterns                             ║
║   • Doubling down on losing trades                              ║
║   • Expressing frustration in notes                             ║
║   → Intervention: Mandatory cooldown                            ║
║                                                                  ║
║ LEVEL_4 (Critical): Account destruction imminent                ║
║   • Maximum position sizes after losses                         ║
║   • "All or nothing" behavior                                   ║
║   • Signs of desperation                                        ║
║   → Intervention: Trading halt + support                        ║
║                                                                  ║
║ TILT TYPES:                                                      ║
║ • REVENGE: Trying to "get back" lost money                      ║
║ • FOMO: Fear of missing out on moves                            ║
║ • DESPAIR: Given up on proper process                           ║
║ • EUPHORIA: Overconfidence after wins                           ║
║ • DENIAL: Ignoring clear warning signs                          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

{get_json_schema_instruction(CRISIS_DETECTION_SCHEMA)}

⚡ CRITICAL: If tilt_detected is true, intervention message MUST be empathetic.
   Never shame or blame. The trader is struggling, not failing.
"""

# ============================================
# POSITION SIZE GUARDIAN PROMPT
# ============================================

POSITION_SIZE_SCHEMA = {
    "recommended_size": "number (USD)",
    "max_allowed": "number (USD)",
    "adjustment_reason": "string",
    "risk_level": "CONSERVATIVE | NORMAL | AGGRESSIVE | DANGEROUS",
    "warnings": ["string"]
}

POSITION_SIZE_PROMPT = f"""
╔══════════════════════════════════════════════════════════════════╗
║              📊 POSITION SIZE GUARDIAN                           ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║ Calculate appropriate position size based on:                   ║
║ 1. Account balance                                              ║
║ 2. Risk per trade setting (usually 1-2%)                        ║
║ 3. Current win/loss streak                                      ║
║ 4. Emotional state                                              ║
║ 5. Market danger level                                          ║
║                                                                  ║
║ ADJUSTMENT RULES:                                                ║
║                                                                  ║
║ After LOSSES:                                                    ║
║ • 1 loss: Reduce to 75% of normal                               ║
║ • 2 losses: Reduce to 50% of normal                             ║
║ • 3+ losses: Reduce to 25% or suggest pause                     ║
║                                                                  ║
║ After WINS:                                                      ║
║ • 1-2 wins: Keep normal                                         ║
║ • 3+ wins: WARN about overconfidence, keep normal               ║
║ • 5+ wins: Suggest taking profits, reduce size                  ║
║                                                                  ║
║ MARKET CONDITIONS:                                               ║
║ • High volatility: Reduce 20-50%                                ║
║ • Major news events: Reduce 50% or stay out                     ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

{get_json_schema_instruction(POSITION_SIZE_SCHEMA)}
"""


def get_trade_eval_prompt(trade: dict, stats: dict, context: dict) -> str:
    """Build complete trade evaluation prompt with context."""
    user_context = {
        "survival_days": stats.get("survivalDays", 0),
        "discipline_score": stats.get("disciplineScore", 0),
        "consecutive_losses": stats.get("consecutiveLosses", 0),
        "current_streak": stats.get("consecutiveWins", 0) - stats.get("consecutiveLosses", 0),
        "emotional_state": context.get("emotional_state", "UNKNOWN"),
        "trade_summary": f"Requesting: {trade.get('direction', 'BUY')} {trade.get('asset', 'Unknown')} @ ${trade.get('positionSize', 0)}"
    }
    
    task_prompt = f"""
TRADE REQUEST TO EVALUATE:
- Asset: {trade.get('asset', 'Unknown')}
- Direction: {trade.get('direction', 'BUY')}
- Position Size: ${trade.get('positionSize', 0)}
- Entry Price: ${trade.get('entryPrice', 0)}
- Stop Loss: ${trade.get('stopLoss', 'Not set')}
- Take Profit: ${trade.get('takeProfit', 'Not set')}
- Reasoning: {trade.get('reasoning', 'Not provided')}

USER STATS:
- Consecutive Losses: {stats.get('consecutiveLosses', 0)}
- Consecutive Wins: {stats.get('consecutiveWins', 0)}
- Today's Trades: {context.get('today_trades', 0)}
- Daily Limit: {context.get('daily_limit', 5)}

Evaluate this trade and provide your decision.
"""
    
    return build_prompt_with_context(
        TRADE_EVALUATION_PROMPT + task_prompt,
        user_context=user_context
    )
