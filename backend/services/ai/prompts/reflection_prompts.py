# backend/services/ai/prompts/reflection_prompts.py
"""
THEKEY AI - Reflection Prompts

World-class prompts for the Reflection pillar (Check-ins & Analysis).
"""

from .base_persona import build_prompt_with_context, get_json_schema_instruction

# ============================================
# CHECK-IN QUESTIONS PROMPT
# ============================================

CHECKIN_QUESTIONS_SCHEMA = {
    "questions": [
        {
            "id": "number",
            "text": "string (Vietnamese question)",
            "type": "scale | multiple-choice | text",
            "theme": "ENERGY | RISK_AWARENESS | BEHAVIORAL_INTENT | EMOTIONAL_STATE",
            "options": [{"value": "number", "text": "string"}]
        }
    ],
    "daily_theme": "string (theme of today's mind scan)",
    "opening_message": "string (warm greeting)"
}

CHECKIN_QUESTIONS_PROMPT = f"""
╔══════════════════════════════════════════════════════════════════╗
║              🧘 DAILY MIND SCAN - CHECK-IN QUESTIONS              ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║ Generate 3 personalized check-in questions for the trader.      ║
║ The goal is to raise self-awareness BEFORE trading.             ║
║                                                                  ║
║ QUESTION STRUCTURE (exactly 3 questions):                        ║
║                                                                  ║
║ Q1: ENERGY CHECK (theme: ENERGY)                                ║
║   • How is your mental/physical energy today?                   ║
║   • Type: scale (1-10) or multiple-choice                       ║
║   • Examples:                                                   ║
║     - "Năng lượng của bạn sáng nay ở mức nào?"                  ║
║     - "Bạn đã ngủ đủ giấc đêm qua chưa?"                        ║
║     - "Mức độ tập trung của bạn hôm nay?"                       ║
║                                                                  ║
║ Q2: RISK AWARENESS (theme: RISK_AWARENESS)                       ║
║   • Are you seeing the market clearly?                          ║
║   • Type: multiple-choice                                       ║
║   • Examples:                                                   ║
║     - "Bạn có thấy thị trường đang dụ dỗ mình không?"           ║
║     - "Bạn đang cảm nhận FOMO hay bình tĩnh?"                   ║
║     - "Rủi ro bạn sẵn sàng chấp nhận hôm nay?"                  ║
║                                                                  ║
║ Q3: BEHAVIORAL INTENT (theme: BEHAVIORAL_INTENT)                 ║
║   • What is your plan/intention today?                          ║
║   • Type: multiple-choice or text                               ║
║   • Examples:                                                   ║
║     - "Mục tiêu quan trọng nhất hôm nay của bạn?"               ║
║     - "Bạn sẽ làm gì nếu gặp 2 lệnh thua liên tiếp?"            ║
║     - "Điều gì có thể khiến bạn phá vỡ kỷ luật hôm nay?"        ║
║                                                                  ║
║ PERSONALIZATION:                                                 ║
║ • If recent losses: Focus on emotional recovery                 ║
║ • If winning streak: Focus on overconfidence awareness          ║
║ • If new trader: Focus on basic discipline                      ║
║ • Rotate questions to avoid repetition                          ║
║                                                                  ║
║ LANGUAGE: Vietnamese, friendly, with occasional emoji           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

{get_json_schema_instruction(CHECKIN_QUESTIONS_SCHEMA)}
"""

# ============================================
# CHECK-IN ANALYSIS PROMPT  
# ============================================

CHECKIN_ANALYSIS_SCHEMA = {
    "emotional_state": "FOCUSED | ANXIOUS | CALM | TILTED | CONFIDENT | EXHAUSTED",
    "state_intensity": "number 1-5",
    "readiness_score": "number 0-100 (how ready to trade)",
    "insights": [
        {
            "type": "PATTERN_RECOGNITION | OPPORTUNITY | WARNING | STRENGTH",
            "title": "string",
            "description": "string",
            "evidence": "string (from user's answers)"
        }
    ],
    "daily_prescription": {
        "mindset_shift": "string (1 key mindset for today)",
        "behavioral_rule": "string (1 specific rule to follow)",
        "success_metric": "string (how to measure success today)",
        "danger_zone": "string (what to avoid)"
    },
    "encouragement": "string (personalized motivation)",
    "progress_marker": {
        "milestone": "string (progress noticed)",
        "visual_metaphor": "string (e.g., 'Cây kỷ luật ra lá mới')"
    },
    "trading_recommendation": "PROCEED | PROCEED_WITH_CAUTION | REDUCE_SIZE | CONSIDER_SKIPPING"
}

CHECKIN_ANALYSIS_PROMPT = f"""
╔══════════════════════════════════════════════════════════════════╗
║              🌟 DAILY GROWTH INSIGHT                             ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║ Analyze the trader's check-in answers and generate a            ║
║ "Daily Growth Insight" - a personalized guidance for today.     ║
║                                                                  ║
║ ANALYSIS FRAMEWORK:                                              ║
║                                                                  ║
║ 1. EMOTIONAL STATE DETECTION                                    ║
║    • Identify primary emotion from answers                      ║
║    • Rate intensity (1-5)                                       ║
║    • Consider: energy level, risk perception, intentions        ║
║                                                                  ║
║ 2. READINESS ASSESSMENT                                         ║
║    • Is this person ready to trade today?                       ║
║    • 0-100 score based on:                                      ║
║      - Energy level (30%)                                       ║
║      - Emotional stability (40%)                                ║
║      - Clear intentions (30%)                                   ║
║                                                                  ║
║ 3. INSIGHT GENERATION                                           ║
║    • Find 1-3 meaningful insights from answers                  ║
║    • Connect to their trading patterns                          ║
║    • Always find something POSITIVE                             ║
║                                                                  ║
║ 4. PRESCRIPTION                                                  ║
║    • Give ONE specific mindset to focus on                      ║
║    • Give ONE behavioral rule to follow                         ║
║    • Define what "success" looks like today                     ║
║    • Warn about danger zone to avoid                            ║
║                                                                  ║
║ 5. TRADING RECOMMENDATION                                        ║
║    • PROCEED: Ready, stable, clear plan                         ║
║    • PROCEED_WITH_CAUTION: Minor concerns, watch emotions       ║
║    • REDUCE_SIZE: Elevated risk, trade smaller                  ║
║    • CONSIDER_SKIPPING: High risk, suggest rest day             ║
║                                                                  ║
║ CORE PRINCIPLE:                                                  ║
║ Always look for PROGRESS, not perfection.                       ║
║ Use positive, forward-looking language.                         ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

{get_json_schema_instruction(CHECKIN_ANALYSIS_SCHEMA)}

LANGUAGE: Vietnamese. Max 300 tokens.
"""

# ============================================
# POST-TRADE REFLECTION PROMPT
# ============================================

POST_TRADE_SCHEMA = {
    "trade_summary": "string (1 sentence)",
    "classification": "GOOD_PROCESS | BAD_PROCESS | LUCKY_WIN | UNLUCKY_LOSS",
    "classification_reason": "string",
    "behavioral_pattern": {
        "identified": "boolean",
        "pattern_name": "string",
        "description": "string",
        "frequency": "string (how often this happens)"
    },
    "growth_observation": {
        "improvement": "string (what got better)",
        "area_to_work": "string (what to improve)",
        "suggestion": "string (specific next step)"
    },
    "process_score": {
        "overall": "number 0-100",
        "setup": "number 0-100",
        "execution": "number 0-100",
        "risk_management": "number 0-100",
        "emotional_control": "number 0-100"
    },
    "wisdom_nugget": "string (1 key lesson)",
    "coaching_question": "string (reflection question)",
    "celebration": "string | null (if process was good)"
}

POST_TRADE_PROMPT = f"""
╔══════════════════════════════════════════════════════════════════╗
║              📝 BEHAVIORAL INSIGHT CARD                          ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║ Generate a "Behavioral Insight Card" for a completed trade.     ║
║ Focus on PROCESS, not P&L.                                      ║
║                                                                  ║
║ TRADE CLASSIFICATION:                                            ║
║                                                                  ║
║ • GOOD_PROCESS: Followed plan, managed risk, controlled emotion ║
║   (This is a WIN regardless of P&L!)                            ║
║                                                                  ║
║ • BAD_PROCESS: Broke rules, impulse trade, ignored stops        ║
║   (This is concerning even if profitable)                       ║
║                                                                  ║
║ • LUCKY_WIN: Bad process but made money                         ║
║   (Warning: This breeds bad habits!)                            ║
║                                                                  ║
║ • UNLUCKY_LOSS: Good process but lost money                     ║
║   (This is actually SUCCESS! Celebrate the process!)            ║
║                                                                  ║
║ PROCESS SCORING (0-100 each):                                    ║
║ • Setup: Was there a clear, pre-planned entry?                  ║
║ • Execution: Did you follow the plan?                           ║
║ • Risk Management: Proper SL/TP, position size?                 ║
║ • Emotional Control: Stayed calm, no FOMO/revenge?              ║
║                                                                  ║
║ PATTERN RECOGNITION:                                             ║
║ • Look for recurring behaviors from user's history              ║
║ • Examples: "Moves SL when price approaches"                    ║
║             "FOMO enters after missing move"                    ║
║             "Increases size after wins"                         ║
║                                                                  ║
║ KEY PRINCIPLE:                                                   ║
║ An UNLUCKY_LOSS is BETTER than a LUCKY_WIN.                     ║
║ Always celebrate following the process!                         ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

{get_json_schema_instruction(POST_TRADE_SCHEMA)}

LANGUAGE: Vietnamese. Find the positive angle always.
"""


def get_checkin_analysis_prompt(answers: list, questions: list, context: dict) -> str:
    """Build complete check-in analysis prompt."""
    user_context = {
        "survival_days": context.get("survival_days", 0),
        "discipline_score": context.get("discipline_score", 0),
        "consecutive_losses": context.get("consecutive_losses", 0),
        "current_streak": context.get("current_streak", 0),
        "emotional_state": "Pending analysis",
        "trade_summary": context.get("trade_summary", "No recent trades")
    }
    
    qa_pairs = []
    for i, (q, a) in enumerate(zip(questions, answers)):
        qa_pairs.append(f"Q{i+1}: {q}\nA{i+1}: {a}")
    
    task_prompt = f"""
TODAY'S CHECK-IN RESPONSES:
{chr(10).join(qa_pairs)}

RECENT CONTEXT:
- Last trade result: {context.get('last_trade_result', 'Unknown')}
- Trading streak: {context.get('current_streak', 0)}
- Previous emotional states: {context.get('recent_emotions', 'Unknown')}

Analyze these responses and generate the Daily Growth Insight.
"""
    
    return build_prompt_with_context(
        CHECKIN_ANALYSIS_PROMPT + task_prompt,
        user_context=user_context
    )
