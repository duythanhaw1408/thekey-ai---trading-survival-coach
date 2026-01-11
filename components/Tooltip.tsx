
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    delay = 200
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        const id = setTimeout(() => setIsVisible(true), delay);
        setTimeoutId(id);
    };

    const handleMouseLeave = () => {
        if (timeoutId) clearTimeout(timeoutId);
        setIsVisible(false);
    };

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
        left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
        right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800',
    };

    return (
        <div
            className="relative inline-flex"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute z-50 ${positionClasses[position]} pointer-events-none`}
                    >
                        <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-white/10 max-w-xs whitespace-normal">
                            {content}
                            <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Feature-specific tooltips with explanations
export const FeatureTooltips = {
    survivalDays: "Số ngày liên tiếp bạn duy trì kỷ luật trading mà không vi phạm quy tắc bảo vệ",
    disciplineScore: "Điểm kỷ luật dựa trên việc tuân thủ kế hoạch, SL/TP và kiểm soát cảm xúc",
    processScore: "Điểm trung bình từ Process Dojo - đánh giá chất lượng quy trình giao dịch",
    processTrend: "Xu hướng cải thiện hoặc suy giảm quy trình dựa trên các trades gần đây",
    shadowScore: "Điểm tín nhiệm đo lường độ trung thực trong tự đánh giá so với AI",
    marketContext: "Phân tích thị trường realtime giúp bạn hiểu điều kiện trading hiện tại",
    behavioralFingerprint: "Bản đồ hành vi cá nhân - trigger cảm xúc và mẫu lặp lại của bạn",
    weeklyGoals: "Mục tiêu tuần được AI cá nhân hóa dựa trên lịch sử và điểm yếu của bạn",
    weeklyReport: "Báo cáo hiệu suất chi tiết với insights và đề xuất cải thiện",
    dojo: "7 bước đánh giá quy trình sau mỗi lệnh - giúp bạn học hỏi từ mỗi trade",
    checkin: "3 câu hỏi tâm lý hàng ngày giúp AI hiểu trạng thái tinh thần của bạn",
    // Behavioral Fingerprint panels
    emotionalTrigger: "Cảm xúc chủ đạo thường ảnh hưởng đến quyết định trading của bạn",
    activePattern: "Mẫu hành vi lặp lại mà AI phát hiện từ lịch sử giao dịch",
    strategicFocus: "Điểm cần tập trung cải thiện trong tuần tới dựa trên phân tích AI",
    survivalProtocol: "Hành động cụ thể AI khuyến nghị để bảo vệ tài khoản của bạn",
};

// Helper component for info icon with tooltip
export const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
    <Tooltip content={text} position="top">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-[10px] text-gray-400 cursor-help hover:bg-white/20 transition-colors">
            ?
        </span>
    </Tooltip>
);
