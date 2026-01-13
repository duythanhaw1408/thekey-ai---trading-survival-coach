import os
import json
import re
import asyncio
from typing import Dict, List, Any, Optional
from google import genai
from pydantic import BaseModel

class GeminiClient:
    """
    Backend client for Google Gemini API.
    Handles central AI logic for THEKEY.
    """
    # List of models - prioritize 1.5-flash for FREE TIER (highest quota)
    # gemini-1.5-flash: 15 RPM, 1M TPM, 1500 RPD (FREE)
    # gemini-1.5-flash-8b: 15 RPM, 4M TPM, 1500 RPD (FREE, lightweight)
    MODELS = [
        'gemini-1.5-flash',         # Primary: Best free tier quota
        'gemini-1.5-flash-8b',      # Fallback: Lightweight, fast
        'gemini-1.5-pro',           # Fallback: Smarter but lower quota
    ]

    
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        self.client = genai.Client(api_key=api_key)
        # Simple memory cache for repeated expensive calls
        self._market_cache = None
        self._market_cache_time = 0
        self._checkin_cache = {} # Keyed by user context
        self._checkin_cache_time = 0
        self._lock = asyncio.Lock()
        self._semaphore = asyncio.Semaphore(2) # Allow max 2 concurrent AI calls
    
    async def _generate(self, prompt: str) -> str:
        """Helper to generate content with multiple model fallback and concurrency control."""
        async with self._semaphore:
            max_retries_per_model = 2
            last_exception = None
            
            for model_id in self.MODELS:
                delay = 1
                for i in range(max_retries_per_model):
                    try:
                        response = await self.client.aio.models.generate_content(
                            model=model_id,
                            contents=prompt
                        )
                        if not response or not response.text:
                            raise ValueError(f"Empty response from Gemini {model_id}")
                        return response.text
                    except Exception as e:
                        last_exception = e
                        error_msg = str(e).lower()
                        
                        # If its a quota error (429) or not found (404), maybe try next model
                        if "429" in error_msg:
                            if "limit: 0" in error_msg:
                                print(f"⚠️ Model {model_id} has 0 limit. Trying next model...")
                                break # Move to next model
                            
                            print(f"ℹ️ Quota hit for {model_id}. Retry {i+1}/{max_retries_per_model}...")
                            await asyncio.sleep(delay)
                            delay *= 2
                        elif "404" in error_msg or "not found" in error_msg:
                            print(f"⚠️ Model {model_id} not found. Trying next model...")
                            break # Move to next model
                        else:
                            print(f"❌ Gemini Error ({model_id}): {e}")
                            # For other errors, wait a bit then try one more retry or next model
                            await asyncio.sleep(0.5)
            
            if last_exception:
                raise last_exception
            return ""

    def _clean_and_parse_json(self, text: str) -> Dict:
        """Parse JSON from Gemini response, cleaning markdown if present."""
        if not text or not text.strip():
            raise ValueError("Empty response received from Gemini")
            
        # Clean markdown formatting
        text = re.sub(r'```json\n?', '', text)
        text = re.sub(r'```\n?', '', text)
        text = text.strip()
        
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            # Attempt to extract JSON if it's embedded in other text
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except:
                    pass
            raise ValueError(f"Failed to parse JSON response: {text[:100]}...") from e

    async def generate_checkin_questions(self, context: Dict) -> List[Dict]:
        """Generate personalized check-in questions with caching."""
        import time
        now = time.time()
        
        # Cache key based on recent trades count
        cache_key = f"q_{context.get('recent_trades_count', 0)}"
        if cache_key in self._checkin_cache and (now - self._checkin_cache_time < 3600):
            return self._checkin_cache[cache_key]

        prompt = f"""You are THEKEY's Reflection Coach. Generate 3 personalized multiple-choice questions in Vietnamese for a crypto trader.
        
        Context:
        - Recent Trades: {context.get('recent_trades_count', 0)}
        - Recent PnL: {context.get('recent_pnl', 0)}
        - Emotional Tilt: {context.get('tilt_detected', False)}
        
        Provide exactly 3 questions.
        Rules:
        1. Exact structure for EVERY question: {{"id": "q1", "text": "...", "type": "multiple-choice", "multiple_choice": {{"options": ["Option A", "Option B", "Option C"]}} }}
        2. First question: About emotional state (calm, frustrated, excited).
        3. Second question: About behavioral traps (FOMO, revenge trading, overconfidence) relevant to the recent trades count ({context.get('recent_trades_count', 0)} trades).
        4. Third question: About the tactical plan or focus area for the NEXT trading session.
        5. LANGUAGE: Vietnamese.
        
        Return JSON structure exactly: {{"questions": [...]}}
        Return ONLY valid JSON."""
        
        try:
            response_text = await self._generate(prompt)
            result = self._clean_and_parse_json(response_text)
            questions = result.get("questions", [])
            
            # Ensure type consistency if AI misses
            for q in questions:
                q['type'] = 'multiple-choice'

            if questions:
                self._checkin_cache = {cache_key: questions} # Clear old, set new
                self._checkin_cache_time = now
            return questions
        except Exception as e:
            print(f"❌ Gemini Error (generate_checkin_questions): {e}")
            # Fallback questions (all multiple-choice)
            return [
                {
                    "id": "q1", 
                    "text": "Bạn cảm thấy thế nào về tâm lý giao dịch hiện tại?", 
                    "type": "multiple-choice",
                    "multiple_choice": {"options": ["Rất bình tĩnh & kỷ luật", "Hơi nóng vội", "Đang khá ức chế", "Rất mệt mỏi"]}
                },
                {
                    "id": "q2", 
                    "text": "Cạm bẫy nào bạn cần đề phòng nhất lúc này?", 
                    "type": "multiple-choice",
                    "multiple_choice": {"options": ["Giao dịch quá mức (Overtrading)", "Trả thù thị trường (Revenge)", "Gồng lỗ vô điều kiện", "Fomo theo đám đông"]}
                },
                {
                    "id": "q3", 
                    "text": "Ưu tiên số 1 của bạn cho phiên giao dịch tới là gì?", 
                    "type": "multiple-choice",
                    "multiple_choice": {"options": ["Bảo vệ vốn tuyệt đối", "Chỉ vào lệnh đúng setup", "Dừng lại nếu lỗ thêm", "Tăng dần volume"]}
                }
            ]

    async def get_trade_evaluation(self, context: Dict) -> Dict:
        """Evaluate a proposed trade for risk and protection rule violations."""
        # Extract trade data for clarity
        trade = context.get('trade', {})
        position_size_usd = trade.get('positionSize', 0)  # This is ALWAYS in USD
        entry_price = trade.get('entryPrice', 0)
        stop_loss = trade.get('stopLoss', 0)
        account_balance = context.get('account_balance', 1000)
        
        # Pre-calculate risk for AI context
        potential_loss = 0
        if entry_price > 0 and stop_loss > 0:
            price_diff_pct = abs(entry_price - stop_loss) / entry_price
            potential_loss = position_size_usd * price_diff_pct
        
        prompt = f"""
        You are THEKEY's Protection Guardian. Evaluate this trade request.
        
        Context:
        - Account Balance: ${account_balance:,.2f}
        - User Stats: {json.dumps(context.get('stats', {}))}
        - Recent Patterns: {context.get('active_pattern', 'None')}
        - Market Danger: {context.get('market_danger', 'Unknown')}
        - Settings: {json.dumps(context.get('settings', {}))}
        
        Trade Details:
        - Position Size: ${position_size_usd:,.2f} USD (This is the TOTAL VOLUME in USD, NOT coin quantity)
        - Entry Price: ${entry_price:,.2f}
        - Stop Loss: ${stop_loss:,.2f}
        - Potential Loss: ${potential_loss:,.2f} (pre-calculated)
        - Direction: {trade.get('direction', 'BUY')}
        - Reasoning: {trade.get('reasoning', 'None')}
        
        IMPORTANT RULES:
        1. Decision: ALLOW, WARN, or BLOCK.
        2. Position Size is ALREADY in USD (e.g., $900 means trader wants to open a $900 position, NOT 900 coins)
        3. DO NOT multiply positionSize by entryPrice - it's already the total USD value!
        4. Compare Position Size (${position_size_usd:,.2f}) directly against Account Balance (${account_balance:,.2f}):
           - If Position Size > 20% of Balance → WARN
           - If Position Size > 50% of Balance → BLOCK (excessive risk)
        5. Check Potential Loss (${potential_loss:,.2f}) against Risk Per Trade limit:
           - If Potential Loss > {context.get('settings', {}).get('riskPerTradePct', 2)}% of Balance → WARN/BLOCK
        6. Provide clear 'reason' in Vietnamese.
        
        Return JSON structure exactly:
        {{
            "decision": "ALLOW" | "WARN" | "BLOCK",
            "reason": "Giải thích chi tiết bằng tiếng Việt",
            "cooldown": number (seconds),
            "recommended_size": number (USD)
        }}
        
        LANGUAGE: Vietnamese.
        Return ONLY valid JSON.
        """
        try:
            response_text = await self._generate(prompt)
            return self._clean_and_parse_json(response_text)
        except Exception as e:
            print(f"❌ Gemini Error (get_trade_evaluation): {e}")
            return {
                "decision": "WARN",
                "reason": "AI services đang bảo trì nhẹ. Hãy tự kiểm tra kỷ luật trước khi vào lệnh.",
                "cooldown": 0,
                "recommended_size": position_size_usd
            }

    async def analyze_trade(self, trade_data: Dict, user_stats: Dict) -> Dict:
        """Analyze a trade for behavioral patterns and process quality."""
        prompt = f"""
        You are THEKEY's Learning Journal Analyst. Analyze this crypto trade. 
        Focus STRICTLY on PROCESS quality, not the PnL outcome.
        
        Trade Data: {json.dumps(trade_data)}
        User Stats: {json.dumps(user_stats)}
        
        Rules for Classification:
        - GOOD_PROCESS: Followed plan, respected risk, no FOMO.
        - BAD_PROCESS: Impulsive, broke rules, no setup.
        - LUCKY: Bad process but profit.
        - UNLUCKY: Good process but loss.

        Provide a JSON object exactly matching this structure:
        {{
          "trade_classification": "GOOD_PROCESS" | "BAD_PROCESS" | "LUCKY" | "UNLUCKY",
          "classification_reason": "Short explanation (Vietnamese)",
          "pattern_match": {{
            "pattern_detected": "Name of behavioral pattern (e.g., Revenge Trade)",
            "confidence": 0-100,
            "evidence": "Why we detected this"
          }},
          "lessons": [
            {{"lesson_id": "L1", "category": "RISK|MINDSET|PROCESS", "lesson": "Vietnamese", "why_it_matters": "Vietnamese", "next_time_action": "Vietnamese", "guardrail_suggestion": "Vietnamese"}}
          ],
          "if_you_could_redo": "One sentence advice (Vietnamese)",
          "positive_takeaways": ["List of good things done"],
          "journal_entry_suggestion": "A concise journal summary in first person (Vietnamese)"
        }}

        LANGUAGE: Vietnamese. Return ONLY valid JSON. No conversational filler.
        """
        try:
            response_text = await self._generate(prompt)
            print(f"DEBUG: Raw AI Response: {response_text}")
            return self._clean_and_parse_json(response_text)
        except Exception as e:
            print(f"❌ Gemini Error (analyze_trade): {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "trade_classification": "GOOD_PROCESS",
                "classification_reason": "Hệ thống phân tích đang gặp sự cố nhỏ, nhưng hãy luôn duy trì kỷ luật nhé!",
                "pattern_match": {"pattern_detected": None, "confidence": 0, "evidence": ""},
                "lessons": [{
                    "lesson_id": "F1",
                    "category": "RISK",
                    "lesson": "Luôn ưu tiên bảo vệ vốn.",
                    "why_it_matters": "Bảo vệ vốn là cách duy nhất để tồn tại.",
                    "next_time_action": "Đặt Stop Loss ngay khi vào lệnh.",
                    "guardrail_suggestion": "Không bao giờ bỏ qua Stop Loss."
                }],
                "if_you_could_redo": "Duy trì sự tập trung và tuân thủ kế hoạch.",
                "positive_takeaways": ["Bạn đã thực hiện giao dịch này."],
                "journal_entry_suggestion": "Tôi sẽ tiếp tục rèn luyện kỷ luật."
            }

    async def get_trader_archetype(self, trade_history: List[Dict], checkin_history: List[Dict]) -> Dict:
        """Analyze user history to determine their trader archetype."""
        prompt = f"""
        You are THEKEY's Archetype Discovery module. Analyze this trader's data.
        
        Recent Trades: {json.dumps(trade_history[-30:])}
        Recent Check-ins: {json.dumps(checkin_history[-5:])}
        
        Possible Archetypes:
        - THE_SNIPER: Patient, disciplined, wait for setups.
        - THE_GAMBLER: Impulsive, overtrades, high emotions.
        - THE_ZOMBIE: Follows others, no personal plan.
        - THE_AVENGER: Revenge trader, doubles down after loss.
        - THE_CHASER: FOMO, buys the top, sells the bottom.
        
        Provide:
        1. archetype (string).
        2. rationale (Vietnamese, explaining why with evidence from data).
        
        Return JSON structure exactly:
        {{
            "archetype": "THE_SNIPER" | "THE_GAMBLER" | "THE_ZOMBIE" | "THE_AVENGER" | "THE_CHASER" | "UNDEFINED",
            "rationale": "Giải thích chi tiết bằng tiếng Việt dựa trên dữ liệu."
        }}
        
        LANGUAGE: Vietnamese.
        Return ONLY valid JSON.
        """
        try:
            response_text = await self._generate(prompt)
            return self._clean_and_parse_json(response_text)
        except Exception as e:
            print(f"❌ Gemini Error (get_trader_archetype): {e}")
            return {
                "archetype": "UNDEFINED",
                "rationale": "Không đủ dữ liệu hoặc AI gặp sự cố để phân tích archetype lúc này."
            }

    async def generate_market_analysis(self) -> Dict:
        """Analyze market danger level with 10-minute caching."""
        import time
        now = time.time()
        
        # Return cache if less than 10 minutes old (600 seconds)
        if self._market_cache and (now - self._market_cache_time < 600):
            return self._market_cache

        prompt = f"""
        You are THEKEY's Market Context Analyzer. Analyze current crypto market conditions for risk.
        Task: Decide if the current market is 'SAFE', 'CAUTION', or 'DANGER'.
        Consider overall volatility, leverage, and macro sentiment.
        
        Provide exactly this JSON:
        {{
          "danger_level": "SAFE" | "CAUTION" | "DANGER",
          "danger_score": 0-100,
          "color_code": "🟢" | "🟡" | "🔴",
          "headline": "One short Vietnamese warning headline",
          "risk_factors": [{{"factor": "...", "severity": "...", "description": "..."}}],
          "factors": {{"volatility": 0-100, "liquidity": 0-100, "leverage": 0-100, "sentiment": 0-100, "events": 0-100}},
          "recommendation": {{"action": "Wait/Trade/Reduce", "position_adjustment": "...", "stop_adjustment": "...", "rationale": "..."}}
        }}

        LANGUAGE: Vietnamese. Return ONLY valid JSON.
        """
        try:
            response_text = await self._generate(prompt)
            result = self._clean_and_parse_json(response_text)
            
            # Update cache on success
            self._market_cache = result
            self._market_cache_time = now
            return result
        except Exception as e:
            print(f"❌ Gemini Error (generate_market_analysis): {e}")
            
            # If AI fails, still return previous cache if available, even if old
            if self._market_cache:
                return self._market_cache
                
            return {
                "danger_level": "CAUTION",
                "danger_score": 45,
                "color_code": "🟡",
                "headline": "Kết nối dữ liệu thị trường bị gián đoạn.",
                "risk_factors": [{"factor": "Lỗi kết nối", "severity": "MEDIUM", "description": "Hệ thống không thể lấy dữ liệu thời gian thực."}],
                "factors": {"volatility": 50, "liquidity": 50, "leverage": 50, "sentiment": 50, "events": 50},
                "recommendation": {
                    "action": "REDUCE_SIZE",
                    "position_adjustment": "Giảm 50% khối lượng.",
                    "stop_adjustment": "Nới lỏng stop loss hoặc đứng ngoài.",
                    "rationale": "Khi dữ liệu không ổn định, ưu tiên bảo toàn vốn."
                }
            }

    async def generate_chat_response(self, message: str, history: List[Dict], mode: str = "COACH") -> Dict:
        """Generate a response for the AI Coach/Protector chat."""
        system_prompt = "You are THEKEY's AI Survival Coach." if mode == "COACH" else "You are THEKEY's AI Protection Guardian. Be firm and direct."
        prompt = f"""
        {system_prompt}
        User Message: {message}
        Chat History: {json.dumps(history[-10:])}
        
        Provide:
        1. display_text (Vietnamese).
        2. internal_reasoning (English).
        
        Return ONLY valid JSON.
        """
        try:
            response_text = await self._generate(prompt)
            return self._clean_and_parse_json(response_text)
        except Exception as e:
            print(f"❌ Gemini Error (generate_chat_response): {e}")
            return {"display_text": "Xin lỗi, tôi đang gặp sự cố kỹ thuật.", "internal_reasoning": str(e)}

    async def detect_emotional_tilt(self, stats: Dict, history: List[Dict]) -> Dict:
        """Detect if the trader is on 'tilt' and needs intervention."""
    async def detect_emotional_tilt(self, stats: Dict, history: List[Dict]) -> Dict:
        """Detect if the trader is on 'tilt' and needs intervention."""
        prompt = f"""
        Analyze these trading stats and history for signs of emotional tilt (revenge trading, frustration, despair).
        Stats: {json.dumps(stats)}
        History: {json.dumps(history[-5:])}
        
        Provide:
        1. tilt_detected (boolean).
        2. severity (LOW, MEDIUM, HIGH).
        3. intervention_message (Vietnamese).
        4. suggested_action (Vietnamese).
        
        Return ONLY valid JSON.
        """
        try:
            response_text = await self._generate(prompt)
            data = self._clean_and_parse_json(response_text)
            if not data.get("tilt_detected", False):
                return {"tilt_detected": False}
            
            # Ensure it has the structure expected by CrisisInterventionModal (mostly)
            # or at least the fields used in CrisisInterventionModal
            full_data = {
                "tilt_detected": True,
                "level": f"LEVEL_{2 if data.get('severity') == 'MEDIUM' else (3 if data.get('severity') == 'HIGH' else 1)}",
                "reasons": [data.get("intervention_message", "Cảm xúc đang không ổn định")],
                "userMetrics": {
                    "winRateAfterLoss": 20,
                    "normalWinRate": 45,
                    "revengeTradeLoss": 150,
                    "emotionalLevel": 8
                },
                "recommendedActions": [
                    {
                        "id": "1",
                        "title": "Nghỉ ngơi",
                        "description": data.get("suggested_action", "Hãy dừng giao dịch ngay."),
                        "duration": "15 minutes",
                        "icon": "🧘",
                        "actionType": "BREATHING"
                    }
                ],
                "estimatedRisk": 85,
                "cooldownMinutes": 15
            }
            return full_data
        except Exception as e:
            print(f"❌ Gemini Error (detect_emotional_tilt): {e}")
            return {"tilt_detected": False}

    async def generate_weekly_goals(self, history: List[Dict], stats: Dict, checkin_history: List[Dict]) -> Dict:
        """Generate 2 personalized goals for the upcoming week."""
        prompt = f"""
        Generate 2 trading discipline goals for the next week.
        Stats: {json.dumps(stats)}
        History: {json.dumps(history[-20:])}
        
        Return a JSON with 'primary_goal', 'secondary_goal' objects including title, description, metric, target.
        LANGUAGE: Vietnamese.
        """
        try:
            response_text = await self._generate(prompt)
            return self._clean_and_parse_json(response_text)
        except Exception as e:
            print(f"❌ Gemini Error (generate_weekly_goals): {e}")
            return {"primary_goal": {"title": "Kỷ luật thép", "description": "Tuân thủ tuyệt đối Stop Loss."}, "secondary_goal": {"title": "Nhật ký đầy đủ", "description": "Ghi chép lại tất cả các lệnh."}}

    async def generate_weekly_report(self, history: List[Dict]) -> Dict:
        """Generate a weekly summary report."""
        prompt = f"""
        Summarize the past week for this trader.
        History: {json.dumps(history)}
        
        Provide:
        1. survival_score (0-100).
        2. key_achievements (List, Vietnamese).
        3. areas_to_improve (List, Vietnamese).
        
        Return ONLY valid JSON.
        """
        try:
            response_text = await self._generate(prompt)
            return self._clean_and_parse_json(response_text)
        except Exception as e:
            print(f"❌ Gemini Error (generate_weekly_report): {e}")
            return {"survival_score": 85, "key_achievements": ["Duy trì kỷ luật."], "areas_to_improve": ["Kiểm soát tâm lý."]}

    async def analyze_trader_archetype(self, history: List[Dict], checkin_history: List[Dict]) -> Dict:
        """Analyze the trader's behavioral archetype."""
        prompt = f"""
        Analyze the trader's style based on data and determine their archetype.
        History: {json.dumps(history)}
        Checkins: {json.dumps(checkin_history)}
        
        Provide:
        1. archetype (STUBBORN, GAMBLER, GUARDIAN, etc.)
        2. description (Vietnamese)
        3. primary_strength (Vietnamese)
        4. primary_weakness (Vietnamese)
        
        Return ONLY valid JSON.
        """
        try:
            response_text = await self._generate(prompt)
            return self._clean_and_parse_json(response_text)
        except Exception as e:
            print(f"❌ Gemini Error (analyze_trader_archetype): {e}")
            return {"archetype": "GUARDIAN", "description": "Người bảo vệ kỷ luật.", "primary_strength": "Kiên nhẫn.", "primary_weakness": "Cẩn thận quá mức."}

gemini_client = GeminiClient()
