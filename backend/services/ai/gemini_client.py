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
    # Available models for this API key (verified via list_models)
    # Note: gemini-1.5-flash is NOT available for this API key
    # Using 2.0-flash-lite for best free tier performance
    MODELS = [
        'models/gemini-2.0-flash',       # Primary: Fast, latest 2.0 version
        'models/gemini-2.0-flash-lite',  # Lite: Efficient
        'models/gemini-1.5-flash',       # Stable Fallback
        'models/gemini-1.5-pro',         # High Capability Fallback
    ]

    # =========================================
    # AI SAFETY RAILS - MANDATORY FOR ALL PROMPTS
    # =========================================
    SAFETY_RAILS = """
=== CRITICAL AI SAFETY RESTRICTIONS ===
You are THEKEY Trading Survival Coach. You MUST follow these rules:

❌ NEVER DO:
1. Predict price direction (up/down/sideways/moon/crash)
2. Suggest specific entry or exit price points
3. Recommend BUY or SELL decisions
4. Provide market forecasts or timing advice
5. Mention specific price targets or levels
6. Give opinions on whether a trade will be profitable

✅ ALWAYS DO:
1. Focus on trading PSYCHOLOGY and DISCIPLINE
2. Analyze the trader's PROCESS, not the outcome
3. Discuss risk management PRINCIPLES
4. Provide emotional support and self-awareness
5. Encourage journaling and reflection

If asked for trading signals, ALWAYS respond:
"Tôi là Coach về kỷ luật và tâm lý, không phải cố vấn về điểm vào lệnh. 
Hãy tập trung vào quy trình của bạn thay vì dự đoán giá."

=== END SAFETY RESTRICTIONS ===

"""

    
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
            
            # Prepend safety rails to every prompt
            safe_prompt = self.SAFETY_RAILS + prompt
            
            for model_id in self.MODELS:
                delay = 1
                for i in range(max_retries_per_model):
                    try:
                        response = await self.client.aio.models.generate_content(
                            model=model_id,
                            contents=safe_prompt
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
    async def generate_json_response(self, prompt: str, system_prompt: str) -> Dict[str, Any]:
        """Generic helper to get JSON from Gemini."""
        full_prompt = f"{system_prompt}\n\nInput Context:\n{prompt}\n\nReturn ONLY valid JSON."
        try:
            response_text = await self._generate(full_prompt)
            return self._clean_and_parse_json(response_text)
        except Exception as e:
            print(f"❌ Gemini JSON Error: {e}")
            raise e

    async def analyze_checkin(self, answers: List[Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Phân tích check-in và tạo 'Daily Growth Insight' với phong cách Kaito."""
        system_prompt = """Bạn là Kaito. Phân tích câu trả lời check-in và tạo "Daily Growth Insight":
        
        Trả về JSON:
        {
          "emotional_state": "FOCUSED" | "ANXIOUS" | "CALM" | "TILTED" | "CONFIDENT",
          "state_intensity": 1-5,
          "insights": [
            {
              "type": "PATTERN_RECOGNITION" | "OPPORTUNITY" | "WARNING",
              "title": "Tiêu đề",
              "description": "Mô tả chi tiết",
              "evidence": "Dẫn chứng từ lịch sử hành vi"
            }
          ],
          "daily_prescription": {
            "mindset_shift": "1 tư duy cần tập trung hôm nay",
            "behavioral_rule": "1 quy tắc hành vi cụ thể",
            "success_metric": "Cách đo lường thành công hôm nay"
          },
          "encouragement": "1 câu động viên cá nhân hoá",
          "progress_marker": {
            "milestone": "Mốc tiến bộ hôm nay (nếu có)",
            "visual_metaphor": "Ẩn dụ trực quan, ví dụ: 'Cây kỷ luật ra lá mới'"
          }
        }
        
        NGUYÊN TẮC: Luôn tìm kiếm TIẾN BỘ, dùng ngôn ngữ tích cực, hướng về tương lai."""
        
        try:
            return await self.generate_json_response(json.dumps({"answers": answers, "context": context}, ensure_ascii=False), system_prompt)
        except Exception:
            return {
                "emotional_state": "CALM",
                "state_intensity": 1,
                "insights": [{"type": "OPPORTUNITY", "title": "Sự khởi đầu kỷ luật", "description": "Bạn đang bắt đầu ngày mới với sự hiện diện tuyệt vời.", "evidence": "Hoàn thành check-in"}],
                "daily_prescription": {"mindset_shift": "Hãy kiên nhẫn", "behavioral_rule": "Chỉ giao dịch khi có setup", "success_metric": "Sự bình an khi đóng máy"},
                "encouragement": "Chúc bạn một ngày giao dịch tỉnh táo!",
                "progress_marker": {"milestone": "Duy trì kỷ luật", "visual_metaphor": "Hạt mầm kỷ luật đang nảy mầm"}
            }
    async def generate_checkin_questions(self, context: Dict) -> List[Dict]:
        """Generate personalized check-in questions with 'Mind Scan' themes."""
        import time
        now = time.time()
        
        # Cache key based on recent trades count
        cache_key = f"q_{context.get('recent_trades_count', 0)}"
        if cache_key in self._checkin_cache and (now - self._checkin_cache_time < 3600):
            return self._checkin_cache[cache_key]

        system_prompt = """
        Bạn là Kaito - Huấn luyện viên kỷ luật trading. 
        Sinh 3 câu hỏi trắc nghiệm cho check-in sáng nay (Mind Scan), TUÂN THỦ:
        1. CÂU HỎI 1: Đánh giá năng lượng & tâm trạng (ENERGY)
        2. CÂU HỎI 2: Nhận thức về rủi ro & thị trường (RISK_AWARENESS)
        3. CÂU HỎI 3: Mục tiêu & kế hoạch hành vi hôm nay (BEHAVIORAL_INTENT)
        
        Xoay vòng qua các chủ đề, không lặp lại tẻ nhạt. 
        Sử dụng tiếng Việt thân thiện, đôi khi dùng emoji.
        
        Format JSON:
        {
          "questions": [
            {
              "id": 1,
              "text": "...",
              "options": [
                {"value": 0, "text": "Option A"},
                {"value": 1, "text": "Option B"},
                {"value": 2, "text": "Option C"}
              ],
              "theme": "ENERGY" | "RISK_AWARENESS" | "BEHAVIORAL_INTENT"
            }
          ],
          "daily_theme": "Nhận diện cảm xúc"
        }
        """
        
        prompt = f"Context: {json.dumps(context, ensure_ascii=False)}"
        
        try:
            result = await self.generate_json_response(prompt, system_prompt)
            questions = result.get("questions", [])
            for q in questions:
                # Ensure structure for frontend
                q['type'] = 'multiple-choice'
                q['multiple_choice'] = {"options": [opt['text'] for opt in q.get('options', [])]}
            
            if questions:
                self._checkin_cache = {cache_key: questions}
                self._checkin_cache_time = now
            return questions
        except Exception as e:
            print(f"❌ Gemini Error (generate_checkin_questions): {e}")
            return [
                {"id": 1, "text": "Năng lượng sáng nay của bạn thế nào?", "type": "multiple-choice", "multiple_choice": {"options": ["Rất tốt", "Hơi mệt", "Đang ức chế"]}},
                {"id": 2, "text": "Bạn có thấy thị trường đang dụ dỗ mình không?", "type": "multiple-choice", "multiple_choice": {"options": ["Không, tôi có kế hoạch", "Hơi FOMO", "Đang rất muốn vào lệnh"]}},
                {"id": 3, "text": "Mục tiêu quan trọng nhất hôm nay?", "type": "multiple-choice", "multiple_choice": {"options": ["Tuân thủ stoploss", "Chỉ vào đúng setup", "Dừng sớm nếu lỗ"]}}
            ]

    async def get_trade_evaluation(self, context: Dict) -> Dict:
        """Đánh giá lệnh yêu cầu như một 'Nghi thức trước giao dịch' (Kaito)."""
        system_prompt = """Bạn là Kaito - Coach kỷ luật. Đánh giá lệnh này như một "Nghi thức trước giao dịch".
        
        Trả về JSON:
        {
          "decision": "ALLOW" | "WARN" | "BLOCK",
          "reason": "Giải thích ngắn gọn (dưới 10 từ)",
          "behavioral_insight": "Phân tích tâm lý đằng sau lệnh này",
          "alternatives": [
            {
              "type": "SCALE_IN" | "WAIT_FOR_CONFIRMATION" | "PAPER_TRADE" | "REDUCE_SIZE",
              "description": "Mô tả chi tiết",
              "rationale": "Tại sao phương án này tốt hơn?"
            }
          ],
          "coaching_question": "Câu hỏi giúp user tự nhận thức",
          "immediate_action": "Hành động cụ thể user nên làm NGAY",
          "tone": "SUPPORTIVE" | "CAUTIOUS" | "EMPOWERING"
        }
        
        GIỌNG ĐIỆU: Đồng cảm nhưng kiên định. Nếu user đang hưng phấn, hãy nhắc về risk. Nếu tilted, hãy đồng cảm và khuyên dừng."""
        
        try:
            return await self.generate_json_response(json.dumps(context, ensure_ascii=False), system_prompt)
        except Exception:
            return {
                "decision": "WARN",
                "reason": "Hãy chậm lại và kiểm tra quy trình.",
                "behavioral_insight": "Bạn đang trong trạng thái cần sự tỉnh táo.",
                "alternatives": [{"type": "REDUCE_SIZE", "description": "Giảm 50% khối lượng", "rationale": "Giảm áp lực tâm lý"}],
                "coaching_question": "Lệnh này có thực sự nằm trong kế hoạch ban đầu?",
                "immediate_action": "Uống một ngụm nước và hít thở sâu 3 lần.",
                "tone": "CAUTIOUS"
            }

    async def analyze_trade(self, trade_data: Dict, user_stats: Dict) -> Dict:
        """Tạo 'Behavioral Insight Card' cho lệnh vừa đóng (Kaito)."""
        system_prompt = """Bạn là Kaito. Tạo "Behavioral Insight Card" cho lệnh vừa đóng:
        
        Trả về JSON:
        {
          "trade_summary": "1 câu mô tả ngắn",
          "behavioral_pattern": {
            "identified": true/false,
            "pattern_name": "Tên pattern",
            "description": "Mô tả pattern",
            "frequency": "Đã xảy ra bao nhiêu lần?"
          },
          "growth_observation": {
            "improvement": "Điểm tiến bộ so với trước",
            "area_to_work": "Điểm cần cải thiện",
            "suggestion": "Đề xuất cụ thể cho lần sau"
          },
          "coaching_question": "1 câu hỏi giúp reflection sâu hơn",
          "wisdom_nugget": "1 bài học ngắn từ lệnh này"
        }
        
        NGUYÊN TẮC: Luôn tìm kiếm ĐIỂM SÁNG (ví dụ: TUÂN THỦ STOPLOSS là thành công lớn)."""
        
        try:
            return await self.generate_json_response(json.dumps({"trade": trade_data, "stats": user_stats}, ensure_ascii=False), system_prompt)
        except Exception:
            return {
                "trade_summary": "Lệnh giao dịch đã hoàn tất.",
                "behavioral_pattern": {"identified": False, "pattern_name": None, "description": None, "frequency": None},
                "growth_observation": {"improvement": "Sự hiện diện", "area_to_work": "Kỷ luật", "suggestion": "Hãy duy trì quy trình"},
                "coaching_question": "Bạn học được gì từ lệnh này?",
                "wisdom_nugget": "Mỗi lệnh là một bài học."
            }

        """Đánh giá quy trình trading dưới dạng 'Kata Assessment' (Kaito)."""
        system_prompt = """Bạn là Kaito. Đánh giá quy trình trading dưới dạng "Kata Assessment":
        
        Trả về JSON:
        {
          "kata_score": 0-100,
          "strength_zones": [
            {
              "zone": "SETUP" | "EXECUTION" | "RISK_MANAGEMENT" | "PSYCHOLOGY",
              "score": 0-100,
              "feedback": "Đánh giá chi tiết"
            }
          ],
          "personalized_kata": {
            "name": "Tên Kata cá nhân hoá",
            "core_principles": ["Nguyên tắc 1", "Nguyên tắc 2"],
            "daily_practice": "Bài tập thực hành 5 phút mỗi ngày"
          },
          "transformation_story": {
            "before": "Bạn tuần trước ở điểm này",
            "after": "Bạn hiện tại đã tiến bộ thế nào",
            "next_step": "Bước tiếp theo để master kata này"
          }
        }
        
        TIÊU CHÍ: Tập trung vào TIẾN BỘ, tạo cảm giác "đang trên hành trình master kỹ năng"."""
        
        try:
            return await self.generate_json_response(json.dumps({"trades": trade_history, "checkins": checkin_history}, ensure_ascii=False), system_prompt)
        except Exception:
            return {
                "kata_score": 70,
                "strength_zones": [{"zone": "PSYCHOLOGY", "score": 75, "feedback": "Duy trì sự bình tĩnh tốt"}],
                "personalized_kata": {"name": "The Calm Warrior", "core_principles": ["Hít thở", "Chờ đợi"], "daily_practice": "Thiền 5 phút"},
                "transformation_story": {"before": "Dễ bị lôi cuốn", "after": "Đã biết quan sát", "next_step": "Tối ưu hóa Entry"}
            }

    async def generate_market_analysis(self) -> Dict:
        """Analyze market danger level with real-time web search, 8s timeout, and 10-minute caching."""
        import time
        import asyncio
        import random
        now = time.time()
        
        # Random trading tips for engaging fallback
        TRADING_TIPS = [
            {"headline": "Kỷ luật là vũ khí mạnh nhất của trader.", "tip": "Đặt stop loss trước khi vào lệnh."},
            {"headline": "Không có phân tích thị trường? Không vào lệnh.", "tip": "Chờ dữ liệu ổn định trước khi giao dịch."},
            {"headline": "Một ngày không trade cũng là chiến thắng.", "tip": "Đứng ngoài khi không chắc chắn."},
            {"headline": "Bảo vệ vốn quan trọng hơn lợi nhuận.", "tip": "Giảm 50% khối lượng khi thị trường mờ mịt."},
            {"headline": "Trader giỏi biết khi nào KHÔNG vào lệnh.", "tip": "Kiên nhẫn chờ cơ hội rõ ràng."},
            {"headline": "Revenge trade = Tự hủy tài khoản.", "tip": "Nghỉ 30 phút sau mỗi lệnh thua."},
            {"headline": "Trend is your friend, cho đến khi nó kết thúc.", "tip": "Luôn xác định xu hướng trước khi trade."},
            {"headline": "Volume nhỏ, rủi ro nhỏ, sống lâu hơn.", "tip": "Max 2% rủi ro mỗi lệnh."},
        ]
        
        def get_random_fallback():
            tip = random.choice(TRADING_TIPS)
            return {
                "danger_level": "CAUTION",
                "danger_score": 50,
                "color_code": "🟡",
                "headline": tip["headline"],
                "risk_factors": [{"factor": "Chờ dữ liệu", "severity": "MEDIUM", "description": tip["tip"]}],
                "factors": {"volatility": 50, "liquidity": 50, "leverage": 50, "sentiment": 50, "events": 50},
                "recommendation": {
                    "action": "WAIT",
                    "position_adjustment": "Giảm 50% hoặc đứng ngoài.",
                    "stop_adjustment": "Nới rộng stop loss nếu đã có lệnh.",
                    "rationale": tip["tip"]
                }
            }
        
        # Return cache if less than 10 minutes old (600 seconds)
        if self._market_cache and (now - self._market_cache_time < 600):
            return self._market_cache

        prompt = f"""
        Analyze the CURRENT crypto market conditions (BTC, ETH, and overall sentiment).
        Directly search for 'crypto market sentiment', 'BTC price action today', and 'crypto liquidations'.
        
        Task: Decide if the current market is 'SAFE', 'CAUTION', or 'DANGER'.
        Provide exactly this JSON:
        {{
          "danger_level": "SAFE" | "CAUTION" | "DANGER",
          "danger_score": 0-100,
          "color_code": "🟢" | "🟡" | "🔴",
          "headline": "One short Vietnamese warning headline",
          "risk_factors": [{{"factor": "...", "severity": "HIGH/MEDIUM/LOW", "description": "..."}}],
          "factors": {{"volatility": 0-100, "liquidity": 0-100, "leverage": 0-100, "sentiment": 0-100, "events": 0-100}},
          "recommendation": {{"action": "Wait/Trade/Reduce", "position_adjustment": "...", "stop_adjustment": "...", "rationale": "..."}}
        }}

        LANGUAGE: Vietnamese. Return ONLY valid JSON.
        """
        try:
            # Use 8 second timeout to avoid UI stuck
            async with asyncio.timeout(8):
                async with self._semaphore:
                    safe_prompt = self.SAFETY_RAILS + prompt
                    response = await self.client.aio.models.generate_content(
                        model='models/gemini-2.0-flash',
                        contents=safe_prompt,
                        config={
                            'tools': [{'google_search': {}}]
                        }
                    )
                    
                    if not response or not response.text:
                        # Fallback to normal generation if search fails or model unavailable
                        response_text = await self._generate(prompt)
                    else:
                        response_text = response.text

            result = self._clean_and_parse_json(response_text)
            
            # Update cache on success
            self._market_cache = result
            self._market_cache_time = now
            return result
        except asyncio.TimeoutError:
            print("⏱️ Market analysis timeout (8s) - returning cached or fallback")
            if self._market_cache:
                return self._market_cache
            return get_random_fallback()
        except Exception as e:
            print(f"❌ Gemini Error (generate_market_analysis): {e}")
            
            # If AI fails, still return previous cache if available, even if old
            if self._market_cache:
                return self._market_cache
            
            return get_random_fallback()

    async def generate_chat_response(self, message: str, history: List[Dict], mode: str = "COACH") -> Dict:
        """Generate a response for the AI Coach/Protector chat using Kaito persona."""
        system_prompt = """
        Bạn là Kaito - Huấn luyện viên trading chuyên về tâm lý và kỷ luật.
        
        VAI TRÒ:
        1. Người đồng hành thấu hiểu, không phán xét.
        2. Người đặt câu hỏi giúp tự nhận thức.
        3. Người gợi ý bài tập thực hành nhỏ.
        
        GIỌNG ĐIỆU:
        - Khi user thắng: Khám phá lý do thành công để lặp lại.
        - Khi user thua: Tập trung vào bài học, không phải P&L.
        - Khi user tilted: Đồng cảm, khuyên dừng lại hít thở.
        - Khi user hỏi tín hiệu: Từ chối khéo léo, tập trung vào quy trình.
        
        TRÁNH: Lời khuyên tài chính, dự đoán thị trường, phán xét.
        """
        
        prompt = f"""
        User Message: {message}
        Chat History: {json.dumps(history[-10:])}
        
        Return JSON ONLY:
        {{
           "display_text": "Phản hồi bằng tiếng Việt",
           "internal_reasoning": "English reasoning"
        }}
        """
        try:
            return await self.generate_json_response(prompt, system_prompt)
        except Exception as e:
            print(f"❌ Gemini Error (generate_chat_response): {e}")
            return {"display_text": "Tôi luôn ở đây để lắng nghe bạn. Hãy cùng hít thở sâu một chút nhé.", "internal_reasoning": str(e)}

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
