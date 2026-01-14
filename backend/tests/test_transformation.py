import asyncio
import json
import os
import sys
from typing import Dict, Any

# Mocking parts of the system if needed, or using real API key if available
# For this test, we'll assume the environment has GEMINI_API_KEY

project_root = "/Users/nguyenduythanh/Downloads/thekey-ai---trading-survival-coach"
sys.path.append(project_root)

from backend.services.ai.gemini_client import GeminiClient

async def test_kaito_transformation():
    client = GeminiClient()
    print("🚀 Starting Kaito Transformation Verification...")

    # 1. Test Analyze Checkin
    print("\n--- Testing Analyze Checkin (Daily Growth Insight) ---")
    answers = [
        {"id": "1", "text": "Cảm thấy thế nào?", "answer": "Hơi lo lắng vì thị trường biến động mạnh"},
        {"id": "2", "text": "Kế hoạch hôm nay?", "answer": "Chỉ vào lệnh khi có tín hiệu rõ ràng từ RSI"}
    ]
    checkin_result = await client.analyze_checkin(answers, {"recent_trades_count": 5})
    print(f"Result: {json.dumps(checkin_result, indent=2, ensure_ascii=False)}")
    assert "daily_prescription" in checkin_result
    assert "emotional_state" in checkin_result

    # 2. Test Trade Evaluation
    print("\n--- Testing Pre-Trade Ritual (Trade Evaluation) ---")
    trade_context = {
        "asset": "BTC/USDT",
        "reasoning": "FOMO vì thấy nến xanh dài",
        "direction": "BUY",
        "position_size": 1000,
        "risk_stats": {"consecutive_losses": 2}
    }
    eval_result = await client.get_trade_evaluation(trade_context)
    print(f"Result: {json.dumps(eval_result, indent=2, ensure_ascii=False)}")
    assert "behavioral_insight" in eval_result
    assert "alternatives" in eval_result

    # 3. Test Analyze Trade
    print("\n--- Testing Behavioral Insight Card (Analyze Trade) ---")
    trade_data = {
        "asset": "ETH/USDT",
        "pnl": -50,
        "entry_reason": "Đánh out of range",
        "exit_reason": "Stoploss hit"
    }
    analysis_result = await client.analyze_trade(trade_data, {"survival_days": 10})
    print(f"Result: {json.dumps(analysis_result, indent=2, ensure_ascii=False)}")
    assert "wisdom_nugget" in analysis_result
    assert "growth_observation" in analysis_result

    print("\n✅ Kaito Transformation Verification Complete!")

if __name__ == "__main__":
    asyncio.run(test_kaito_transformation())
