# backend/services/ai/prompts/__init__.py
"""
THEKEY AI Prompt Templates v2.0

Modular, versioned prompt templates for world-class AI responses.
Implements best practices from OpenAI and Anthropic prompt engineering.
"""

from .base_persona import KAITO_PERSONA, SAFETY_RAILS
from .protection_prompts import TRADE_EVALUATION_PROMPT, CRISIS_DETECTION_PROMPT
from .reflection_prompts import CHECKIN_ANALYSIS_PROMPT, CHECKIN_QUESTIONS_PROMPT
from .coaching_prompts import CHAT_RESPONSE_PROMPT, BEHAVIORAL_INSIGHT_PROMPT

__all__ = [
    "KAITO_PERSONA",
    "SAFETY_RAILS", 
    "TRADE_EVALUATION_PROMPT",
    "CRISIS_DETECTION_PROMPT",
    "CHECKIN_ANALYSIS_PROMPT",
    "CHECKIN_QUESTIONS_PROMPT",
    "CHAT_RESPONSE_PROMPT",
    "BEHAVIORAL_INSIGHT_PROMPT"
]
