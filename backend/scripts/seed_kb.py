# backend/scripts/seed_kb.py
"""
THEKEY Knowledge Base Seeding Script
Seeds 30 core trading policies and playbooks.

Usage:
    python -m scripts.seed_kb
    
Or from project root:
    cd backend && python -m scripts.seed_kb
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from models import get_db, engine
from models.kb_document import KBDocument, Base

# Create tables if not exists
Base.metadata.create_all(bind=engine)


# 30 Core Trading Policies & Playbooks
KB_SEED_DATA = [
    # ==================== RISK MANAGEMENT (10) ====================
    {
        "title": "Quy tắc 2% - Giới hạn rủi ro mỗi lệnh",
        "content": """Không bao giờ rủi ro quá 2% tài khoản của bạn trong một lệnh giao dịch. Nếu tài khoản của bạn là $1000, mức rủi ro tối đa mỗi lệnh là $20. Quy tắc này giúp bạn sống sót qua 50 lệnh thua liên tiếp - điều gần như không thể xảy ra nếu bạn giao dịch có hệ thống.""",
        "summary": "Không rủi ro quá 2% tài khoản mỗi lệnh để bảo toàn vốn.",
        "category": "policy",
        "tags": ["risk", "position_size", "money_management"],
        "applies_to": ["pre_trade"],
        "severity": "CRITICAL"
    },
    {
        "title": "Stop-Loss Bắt Buộc - Không Ngoại Lệ",
        "content": """Mỗi lệnh PHẢI có stop-loss được xác định TRƯỚC KHI vào lệnh. Stop-loss không phải là tùy chọn. Nó là bảo hiểm nhân thọ cho tài khoản của bạn. Trader không đặt SL là trader đang đánh bạc với số tiền khó kiếm của mình.""",
        "summary": "Mọi lệnh phải có stop-loss xác định trước khi vào.",
        "category": "policy",
        "tags": ["stop_loss", "risk", "discipline"],
        "applies_to": ["pre_trade"],
        "severity": "CRITICAL"
    },
    {
        "title": "Tỷ lệ Risk:Reward Tối Thiểu 1:1.5",
        "content": """Chỉ vào những lệnh có tỷ lệ R:R tối thiểu 1:1.5, nghĩa là lợi nhuận tiềm năng ít nhất gấp 1.5 lần rủi ro. Nếu bạn rủi ro $100, bạn nên nhắm đến lợi nhuận ít nhất $150. Điều này đảm bảo bạn có lãi ngay cả khi chỉ thắng 40% lệnh.""",
        "summary": "Chỉ giao dịch khi R:R tối thiểu 1:1.5.",
        "category": "policy",
        "tags": ["risk_reward", "entry", "setup"],
        "applies_to": ["pre_trade"],
        "severity": "HIGH"
    },
    {
        "title": "Giới Hạn 5 Lệnh Mỗi Ngày",
        "content": """Đặt giới hạn tối đa 5 lệnh mỗi ngày. Nhiều hơn thế thường dẫn đến overtrading - giao dịch để giao dịch, không phải vì có setup tốt. Chất lượng quan trọng hơn số lượng. Một lệnh tốt đáng giá hơn 10 lệnh kém.""",
        "summary": "Tối đa 5 lệnh/ngày để tránh overtrading.",
        "category": "policy",
        "tags": ["overtrading", "discipline", "daily_limit"],
        "applies_to": ["pre_trade"],
        "severity": "HIGH"
    },
    {
        "title": "Không Giao Dịch Khi Thua 2 Lệnh Liên Tiếp",
        "content": """Sau khi thua 2 lệnh liên tiếp, DỪNG giao dịch ít nhất 30 phút. Đây không phải là hình phạt - đây là bảo vệ. Lệnh thua thứ 3 sau 2 lệnh thua thường là revenge trade - lệnh được đặt vì cảm xúc, không phải logic.""",
        "summary": "Dừng giao dịch 30 phút sau 2 lệnh thua liên tiếp.",
        "category": "policy",
        "tags": ["revenge", "consecutive_loss", "cooldown"],
        "applies_to": ["pre_trade", "crisis"],
        "severity": "CRITICAL"
    },
    {
        "title": "Không Tăng Size Sau Khi Thua",
        "content": """KHÔNG BAO GIỜ tăng kích thước lệnh để 'gỡ lại' sau khi thua. Đây là martingale - chiến thuật đã phá sản hàng triệu trader. Nếu bạn thua $100, lệnh tiếp theo KHÔNG nên lớn hơn lệnh trước.""",
        "summary": "Không tăng size lệnh để gỡ lỗ - đây là martingale.",
        "category": "policy",
        "tags": ["martingale", "revenge", "position_size"],
        "applies_to": ["pre_trade", "crisis"],
        "severity": "CRITICAL"
    },
    {
        "title": "Giới Hạn Drawdown Hàng Ngày 5%",
        "content": """Nếu bạn mất 5% tài khoản trong một ngày, DỪNG giao dịch cho ngày đó. Ví dụ: tài khoản $1000 -> thua $50 -> dừng. Ngày mai là một ngày mới với tinh thần mới.""",
        "summary": "Dừng giao dịch nếu thua 5% tài khoản trong ngày.",
        "category": "policy",
        "tags": ["drawdown", "daily_loss", "protection"],
        "applies_to": ["pre_trade"],
        "severity": "HIGH"
    },
    {
        "title": "Không Giao Dịch Khi Mệt Mỏi",
        "content": """Nếu bạn ngủ dưới 6 tiếng, bạn KHÔNG nên giao dịch. Thiếu ngủ làm giảm khả năng ra quyết định, tăng xung động, và giảm khả năng chịu đựng stress. Thị trường sẽ luôn ở đó ngày mai.""",
        "summary": "Không giao dịch nếu ngủ dưới 6 tiếng.",
        "category": "policy",
        "tags": ["sleep", "health", "decision_making"],
        "applies_to": ["daily_checkin"],
        "severity": "MEDIUM"
    },
    {
        "title": "Không Giao Dịch Trong Giờ Nghỉ Đã Đặt",
        "content": """Tôn trọng giờ ngủ và giờ nghỉ bạn đã tự đặt. Nếu bạn đặt quiet hours từ 23:00-07:00, đừng vào lệnh trong khung giờ này. Bạn sẽ không ở trạng thái tinh thần tốt nhất.""",
        "summary": "Tôn trọng giờ nghỉ ngơi đã đặt.",
        "category": "policy",
        "tags": ["schedule", "discipline", "rest"],
        "applies_to": ["pre_trade"],
        "severity": "MEDIUM"
    },
    {
        "title": "Diversification - Không Tập Trung Vào Một Cặp",
        "content": """Không nên có quá 50% exposure vào một cặp tiền hoặc tài sản. Nếu bạn có $1000, không nên có quá $500 position trong BTC/USDT. Diversify để giảm rủi ro tập trung.""",
        "summary": "Không quá 50% exposure vào một tài sản.",
        "category": "policy",
        "tags": ["diversification", "exposure", "risk"],
        "applies_to": ["pre_trade"],
        "severity": "MEDIUM"
    },
    
    # ==================== PSYCHOLOGY (10) ====================
    {
        "title": "Nhận Biết FOMO - Fear of Missing Out",
        "content": """FOMO xảy ra khi bạn thấy giá tăng nhanh và muốn 'nhảy vào'. Dấu hiệu: tim đập nhanh, cảm giác gấp gáp, không kiểm tra setup. Giải pháp: Dừng lại 5 phút. Thị trường sẽ luôn có cơ hội mới. Một lệnh bị lỡ tốt hơn một lệnh FOMO lỗ.""",
        "summary": "FOMO là cảm giác gấp gáp khi giá tăng - hãy dừng lại 5 phút.",
        "category": "psychology",
        "tags": ["fomo", "emotion", "impulse"],
        "applies_to": ["pre_trade", "crisis"],
        "severity": "HIGH"
    },
    {
        "title": "Revenge Trading - Kẻ Giết Tài Khoản",
        "content": """Revenge trading là khi bạn vào lệnh để 'gỡ lại' tiền thua. Nó thường xảy ra ngay sau lệnh thua và có đặc điểm: size lớn hơn bình thường, không tuân thủ setup, cảm giác tức giận. Đây là killer #1 của trader retail.""",
        "summary": "Revenge trading là vào lệnh để gỡ lỗ - killer #1 của trader.",
        "category": "psychology",
        "tags": ["revenge", "emotion", "loss"],
        "applies_to": ["crisis"],
        "severity": "CRITICAL"
    },
    {
        "title": "Overconfidence Sau Chuỗi Thắng",
        "content": """Thắng 3+ lệnh liên tiếp có thể tạo ra ảo tưởng rằng bạn 'hiểu' thị trường. Đây là lúc nguy hiểm nhất. Trader thường tăng size hoặc bỏ qua stop-loss sau winning streak. Nhớ rằng: thị trường không quan tâm bạn đã thắng bao nhiêu lệnh.""",
        "summary": "Cẩn thận sau 3+ lệnh thắng - đừng tăng size hoặc bỏ SL.",
        "category": "psychology",
        "tags": ["overconfidence", "winning_streak", "ego"],
        "applies_to": ["pre_trade"],
        "severity": "HIGH"
    },
    {
        "title": "Tilt State - Khi Cảm Xúc Chiếm Lấy",
        "content": """Tilt là trạng thái tinh thần khi cảm xúc (thường là tức giận) chiếm lấy khả năng ra quyết định logic. Dấu hiệu: bực bội, đổ lỗi cho thị trường/broker, muốn giao dịch ngay lập tức. Giải pháp duy nhất: DỪNG và đi làm việc khác.""",
        "summary": "Tilt là khi cảm xúc chiếm lấy logic - phải dừng giao dịch ngay.",
        "category": "psychology",
        "tags": ["tilt", "emotion", "anger"],
        "applies_to": ["crisis"],
        "severity": "CRITICAL"
    },
    {
        "title": "Confirmation Bias - Chỉ Thấy Điều Muốn Thấy",
        "content": """Khi bạn đã có xu hướng (bullish/bearish), bạn sẽ tự động tìm kiếm thông tin xác nhận và bỏ qua thông tin ngược lại. Giải pháp: Luôn tìm lý do để KHÔNG vào lệnh trước. Nếu vẫn muốn vào sau đó, lệnh có thể tốt.""",
        "summary": "Luôn tìm lý do để không vào lệnh trước để tránh bias.",
        "category": "psychology",
        "tags": ["bias", "analysis", "objectivity"],
        "applies_to": ["pre_trade"],
        "severity": "MEDIUM"
    },
    {
        "title": "Fear After Loss - Sợ Hãi Sau Khi Thua",
        "content": """Một lệnh thua lớn có thể khiến bạn sợ vào lệnh tiếp theo, ngay cả khi setup hoàn hảo. Đây là phản ứng tự nhiên nhưng cần vượt qua. Giải pháp: Quay lại trade size nhỏ hơn để rebuild confidence.""",
        "summary": "Nếu sợ trade sau khi thua lớn, hãy giảm size để rebuild.",
        "category": "psychology",
        "tags": ["fear", "loss", "confidence"],
        "applies_to": ["post_trade", "crisis"],
        "severity": "MEDIUM"
    },
    {
        "title": "Boredom Trading - Giao Dịch Vì Chán",
        "content": """Khi thị trường sideways và không có setup, bạn có thể cảm thấy 'cần' phải trade. Đây là bạn trade vì chán, không phải vì có edge. Một ngày không có lệnh là ngày thành công nếu không có setup tốt.""",
        "summary": "Không trade vì chán - ngày 0 lệnh cũng là ngày thành công.",
        "category": "psychology",
        "tags": ["boredom", "overtrading", "patience"],
        "applies_to": ["pre_trade"],
        "severity": "MEDIUM"
    },
    {
        "title": "Outcome Bias - Đánh Giá Lệnh Bằng Kết Quả",
        "content": """Lệnh thắng không có nghĩa là quyết định đúng. Lệnh thua không có nghĩa là quyết định sai. Đánh giá lệnh bằng PROCESS, không phải kết quả. Một lệnh tuân thủ quy trình nhưng thua vẫn là lệnh tốt.""",
        "summary": "Đánh giá lệnh bằng quy trình, không phải kết quả.",
        "category": "psychology",
        "tags": ["process", "evaluation", "mindset"],
        "applies_to": ["post_trade"],
        "severity": "HIGH"
    },
    {
        "title": "Sunk Cost Fallacy - Không Chịu Cắt Lỗ",
        "content": """'Tôi đã lỗ nhiều rồi, không thể cắt bây giờ' - đây là sunk cost fallacy. Số tiền đã mất không thể lấy lại bằng cách giữ lệnh thua. Thị trường không quan tâm bạn đã lỗ bao nhiêu. Cut your losses.""",
        "summary": "Tiền đã mất là sunk cost - hãy cut loss khi cần.",
        "category": "psychology",
        "tags": ["sunk_cost", "stop_loss", "exit"],
        "applies_to": ["pre_trade", "crisis"],
        "severity": "HIGH"
    },
    {
        "title": "Journaling - Ghi Chép Mỗi Lệnh",
        "content": """Viết nhật ký giao dịch cho mỗi lệnh: Tại sao vào? Cảm xúc lúc vào? Có tuân thủ quy trình không? Kết quả? Bài học? Đây là cách duy nhất để tìm ra pattern của chính bạn và cải thiện liên tục.""",
        "summary": "Ghi chép mỗi lệnh để nhận biết pattern và cải thiện.",
        "category": "psychology",
        "tags": ["journal", "reflection", "improvement"],
        "applies_to": ["post_trade"],
        "severity": "MEDIUM"
    },
    
    # ==================== PLAYBOOKS (10) ====================
    {
        "title": "Playbook: Trước Khi Vào Lệnh",
        "content": """Checklist bắt buộc trước mỗi lệnh:
1. ✅ Có setup rõ ràng theo chiến lược?
2. ✅ Đã xác định Entry, SL, TP?
3. ✅ R:R tối thiểu 1:1.5?
4. ✅ Size không quá 2% tài khoản?
5. ✅ Không trong trạng thái cảm xúc?
6. ✅ Không quá 5 lệnh hôm nay?
Nếu thiếu BẤT KỲ mục nào -> KHÔNG VÀO LỆNH.""",
        "summary": "6-point checklist bắt buộc trước mỗi lệnh.",
        "category": "playbook",
        "tags": ["checklist", "entry", "process"],
        "applies_to": ["pre_trade"],
        "severity": "HIGH"
    },
    {
        "title": "Playbook: Sau Khi Thua Lệnh",
        "content": """Quy trình sau khi thua:
1. DỪNG - Không vào lệnh tiếp theo trong 15 phút
2. GHI CHÉP - Viết ra tại sao thua (không đổ lỗi)
3. ĐÁNH GIÁ - Lệnh có tuân thủ quy trình không?
4. HỌC HỎI - Rút ra 1 bài học cụ thể
5. TIẾP TỤC - Nếu quy trình đúng, tiếp tục với mindset mới""",
        "summary": "Quy trình 5 bước sau khi thua lệnh.",
        "category": "playbook",
        "tags": ["loss", "reflection", "process"],
        "applies_to": ["post_trade"],
        "severity": "HIGH"
    },
    {
        "title": "Playbook: Khi Đang Tilt",
        "content": """Khi nhận ra mình đang tilt:
1. ĐÓNG tất cả chart và platform
2. ĐI RA ngoài phòng trading, uống nước
3. THỞ sâu 10 lần (4 giây hít, 4 giây thở)
4. KHÔNG giao dịch ít nhất 2 tiếng
5. CHỈ quay lại khi cảm thấy bình tĩnh hoàn toàn""",
        "summary": "5 bước xử lý khi đang tilt.",
        "category": "playbook",
        "tags": ["tilt", "emotion", "recovery"],
        "applies_to": ["crisis"],
        "severity": "CRITICAL"
    },
    {
        "title": "Playbook: Khi FOMO",
        "content": """Khi cảm thấy FOMO:
1. NHẬN BIẾT - 'Tôi đang FOMO'
2. DỪNG LAI - Không click gì trong 5 phút
3. HỎI - 'Nếu đây là tiền cuối cùng, tôi có vào không?'
4. KIỂM TRA - Lệnh này có trong trading plan không?
5. CHẤP NHẬN - Nếu lỡ, sẽ có cơ hội khác""",
        "summary": "5 bước xử lý khi FOMO.",
        "category": "playbook",
        "tags": ["fomo", "emotion", "impulse"],
        "applies_to": ["pre_trade", "crisis"],
        "severity": "HIGH"
    },
    {
        "title": "Playbook: Check-in Sáng",
        "content": """Routine buổi sáng trước khi trade:
1. Ngủ đủ giấc? (>=6 tiếng)
2. Tâm trạng hôm nay: 1-10?
3. Có event quan trọng hôm nay? (news, FOMC, etc.)
4. Mục tiêu hôm nay là gì? (không phải tiền)
5. Điều gì có thể khiến tôi tilt hôm nay?""",
        "summary": "5 câu hỏi check-in buổi sáng.",
        "category": "playbook",
        "tags": ["checkin", "morning", "routine"],
        "applies_to": ["daily_checkin"],
        "severity": "MEDIUM"
    },
    {
        "title": "Playbook: Khi Thắng Lớn",
        "content": """Sau khi thắng lệnh lớn:
1. KHÔNG tăng size lệnh tiếp theo
2. KHÔNG 'chơi với tiền nhà'
3. RÚT một phần lợi nhuận nếu có thể
4. GIỮ cùng quy trình như mọi khi
5. CẨN THẬN với overconfidence""",
        "summary": "5 điều cần làm sau khi thắng lớn.",
        "category": "playbook",
        "tags": ["winning", "discipline", "risk"],
        "applies_to": ["post_trade"],
        "severity": "MEDIUM"
    },
    {
        "title": "Playbook: Quản Lý Drawdown",
        "content": """Khi đang trong drawdown:
1. GIẢM size về 50% bình thường
2. FOCUS vào setup A+ only
3. MỤC TIÊU là recover quy trình, không phải tiền
4. KHÔNG FOMO vào các cơ hội 'gỡ lại'
5. XEM XÉT nghỉ 1-2 ngày nếu cần""",
        "summary": "5 bước quản lý khi đang drawdown.",
        "category": "playbook",
        "tags": ["drawdown", "recovery", "risk"],
        "applies_to": ["crisis"],
        "severity": "HIGH"
    },
    {
        "title": "Playbook: Review Cuối Tuần",
        "content": """Review cuối tuần (Chủ nhật):
1. Tổng kết P&L tuần (không quá focus vào con số)
2. Lệnh nào tốt nhất? Tại sao?
3. Lệnh nào tệ nhất? Tại sao?
4. Có vi phạm quy tắc nào không?
5. Mục tiêu quy trình tuần tới là gì?""",
        "summary": "5 câu hỏi review cuối tuần.",
        "category": "playbook",
        "tags": ["review", "weekly", "improvement"],
        "applies_to": ["all"],
        "severity": "MEDIUM"
    },
    {
        "title": "Playbook: Xử Lý News Events",
        "content": """Khi có news event lớn (FOMC, CPI, etc.):
1. KHÔNG GIỮ position qua event (hoặc reduce size 50%)
2. KHÔNG vào lệnh 15 phút trước event
3. CHỜ 15-30 phút SAU event để thị trường ổn định
4. ACCEPT rằng sẽ miss một số move
5. VOLATILITY không phải opportunity cho trader nhỏ""",
        "summary": "5 quy tắc xử lý khi có news event.",
        "category": "playbook",
        "tags": ["news", "event", "volatility"],
        "applies_to": ["pre_trade"],
        "severity": "HIGH"
    },
    {
        "title": "Playbook: Kết Thúc Ngày Giao Dịch",
        "content": """Routine cuối ngày:
1. ĐÓNG tất cả position (nếu là day trader)
2. GHI CHÉP các lệnh trong ngày
3. MỘT bài học chính hôm nay?
4. CÓ vi phạm quy tắc không?
5. ĐÁNH GIÁ: Ngày hôm nay 1-10 về kỷ luật
6. NGHỈ NGƠI - Đừng nghĩ về trading đến sáng mai""",
        "summary": "6 bước kết thúc ngày giao dịch.",
        "category": "playbook",
        "tags": ["routine", "evening", "review"],
        "applies_to": ["all"],
        "severity": "MEDIUM"
    },
]


def seed_kb(db: Session):
    """Seed the knowledge base with initial documents."""
    
    # Check if KB is already seeded
    existing_count = db.query(KBDocument).count()
    if existing_count >= 30:
        print(f"[KB Seed] Already have {existing_count} documents. Skipping seed.")
        return existing_count
    
    # Clear existing documents (optional - comment out if you want to keep them)
    if existing_count > 0:
        print(f"[KB Seed] Clearing {existing_count} existing documents...")
        db.query(KBDocument).delete()
        db.commit()
    
    # Insert new documents
    print(f"[KB Seed] Inserting {len(KB_SEED_DATA)} documents...")
    
    for doc_data in KB_SEED_DATA:
        doc = KBDocument(
            title=doc_data["title"],
            content=doc_data["content"],
            summary=doc_data["summary"],
            category=doc_data["category"],
            tags=doc_data["tags"],
            applies_to=doc_data["applies_to"],
            severity=doc_data["severity"],
            source="THEKEY Core KB",
            version="1.0"
        )
        db.add(doc)
    
    db.commit()
    
    final_count = db.query(KBDocument).count()
    print(f"[KB Seed] Complete! Total documents: {final_count}")
    
    return final_count


if __name__ == "__main__":
    print("=" * 50)
    print("THEKEY Knowledge Base Seeding Script")
    print("=" * 50)
    
    # Get database session
    db = next(get_db())
    
    try:
        count = seed_kb(db)
        print(f"\n✅ Successfully seeded {count} documents!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
