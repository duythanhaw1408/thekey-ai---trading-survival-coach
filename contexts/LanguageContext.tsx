import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'vi' | 'en';

interface Translations {
    [key: string]: {
        [key: string]: string;
    };
}

const translations: Record<Language, Translations> = {
    vi: {
        // Common
        common: {
            save: 'Lưu',
            cancel: 'Hủy',
            loading: 'Đang tải...',
            error: 'Lỗi',
            success: 'Thành công',
            close: 'Đóng',
            next: 'Tiếp',
            back: 'Quay lại',
            submit: 'Gửi',
            notEnoughData: 'Chưa đủ dữ liệu',
        },

        // Dashboard
        dashboard: {
            survivalDays: 'Ngày Sống Sót',
            disciplineScore: 'Điểm Kỷ Luật',
            avgProcessScore: 'Điểm TB Quy Trình',
            processTrend: 'Xu Hướng Quy Trình',
            selectTradeHint: 'Chọn lệnh để xem phân tích',
            selectTradeDesc: 'Click vào lệnh có 🧠 (đã hoàn thành Dojo) trong tab EXECUTION để xem chi tiết đánh giá quy trình.',
            tipLabel: 'Tip:',
            tipBadge: 'Lệnh có badge xanh = đã có Dojo evaluation',
        },

        // Mindset View
        mindset: {
            behavioralFingerprint: 'Behavioral Fingerprint',
            aiDeepAnalysis: 'AI Deep Analysis',
            emotionalTrigger: 'Cảm Xúc Chủ Đạo',
            activePattern: 'Mẫu Hành Vi Hiện Tại',
            strategicFocus: 'Tập Trung Chiến Lược',
            survivalProtocol: 'Giao Thức Sinh Tồn',
            analysisBehaviorAI: 'Phân tích Hành vi AI',
            analysisBehaviorDesc: 'AI sẽ phân tích sâu mẫu hành vi, trigger cảm xúc và đưa ra chiến lược phù hợp cho bạn.',
            unlockProgress: 'Tiến độ mở khóa',
            needMoreTrades: 'Cần thêm {count} trade với Dojo',
            generateReport: '🧠 Tạo Báo Cáo Hành Vi',
            tipGoToDojo: 'Vào EXECUTION → Nhập lệnh → Đóng lệnh → Hoàn thành Dojo',
            noSignificantPattern: 'CHƯA PHÁT HIỆN MẪU RÕ RÀNG',
            behaviorConsistent: 'Hành vi của bạn có vẻ ổn định, chưa có mẫu lặp lại mạnh.',
            maintainDiscipline: 'Duy trì kỷ luật quy trình hiện tại.',
            continueCheckins: 'Tiếp tục làm check-in hàng ngày để xây dựng hồ sơ dữ liệu mạnh mẽ hơn.',
            shadowScore: 'Shadow Score',
            shadowScoreDesc: 'Điểm tín nhiệm dựa trên độ trung thực tự đánh giá so với AI.',
            requirement: 'Yêu cầu:',
            completeOneDojo: 'Hoàn thành ít nhất 1 trade với Dojo',
            closeAndDojo: 'Đóng lệnh → Hoàn thành 7 bước Dojo để bắt đầu tích lũy Shadow Score',
        },

        // Progress View
        progress: {
            weeklyGoals: 'Mục tiêu Tuần',
            weeklyGoalsDesc: 'AI sẽ tạo mục tiêu cá nhân hóa dựa trên dữ liệu trading của bạn.',
            unlockRequirement: 'Yêu cầu mở khóa:',
            completeTradesWithDojo: 'Hoàn thành {count} trades với Dojo',
            stillNeed: 'Còn cần {count} trade nữa',
            performanceReport: 'Báo cáo Hiệu suất',
            performanceReportDesc: 'AI phân tích chi tiết hiệu suất trading trong tuần và đề xuất cải thiện.',
        },

        // Trade History
        tradeHistory: {
            noHistory: 'Chưa có lịch sử giao dịch',
            noHistoryDesc: 'Ghi lại lệnh đầu tiên để bắt đầu theo dõi và phân tích hành vi trading.',
            howToAdd: 'Cách thêm lệnh:',
            step1: 'Nhập thông tin lệnh ở form bên trên',
            step2: 'Bấm Gửi để AI đánh giá',
            step3: 'Khi đóng lệnh, hoàn thành Dojo',
        },

        // Onboarding
        onboarding: {
            startWithKey: 'Bắt đầu với THEKEY',
            complete3Steps: 'Hoàn thành 3 bước để mở khóa toàn bộ tính năng AI',
            completed: 'hoàn thành',
            dailyCheckin: 'Daily Check-in',
            dailyCheckinDesc: 'Trả lời 3 câu hỏi tâm lý hàng ngày',
            dailyCheckinAction: 'Đăng nhập mỗi ngày',
            firstTrade: 'Ghi lại Lệnh Đầu Tiên',
            firstTradeDesc: 'Nhập thông tin trade vào Terminal',
            firstTradeAction: 'Vào EXECUTION → Terminal',
            firstDojo: 'Hoàn thành Process Dojo',
            firstDojoDesc: 'Đánh giá quy trình sau khi đóng lệnh',
            firstDojoAction: 'Đóng lệnh → Làm 7 bước Dojo',
            unlockTip: 'Càng nhiều data, AI càng hiểu rõ hành vi trading của bạn và đưa ra insight chính xác hơn!',
        },
    },

    en: {
        // Common
        common: {
            save: 'Save',
            cancel: 'Cancel',
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            close: 'Close',
            next: 'Next',
            back: 'Back',
            submit: 'Submit',
            notEnoughData: 'Not enough data',
        },

        // Dashboard
        dashboard: {
            survivalDays: 'Survival Days',
            disciplineScore: 'Discipline Score',
            avgProcessScore: 'Avg Process Score',
            processTrend: 'Process Trend',
            selectTradeHint: 'Select trade to view analysis',
            selectTradeDesc: 'Click on a trade with 🧠 (completed Dojo) in EXECUTION tab to view detailed process evaluation.',
            tipLabel: 'Tip:',
            tipBadge: 'Trade with green badge = has Dojo evaluation',
        },

        // Mindset View
        mindset: {
            behavioralFingerprint: 'Behavioral Fingerprint',
            aiDeepAnalysis: 'AI Deep Analysis',
            emotionalTrigger: 'Emotional Trigger',
            activePattern: 'Active Pattern',
            strategicFocus: 'Strategic Focus',
            survivalProtocol: 'Survival Protocol',
            analysisBehaviorAI: 'AI Behavior Analysis',
            analysisBehaviorDesc: 'AI will deeply analyze behavior patterns, emotional triggers and provide suitable strategies.',
            unlockProgress: 'Unlock Progress',
            needMoreTrades: 'Need {count} more trades with Dojo',
            generateReport: '🧠 Generate Behavior Report',
            tipGoToDojo: 'Go to EXECUTION → Enter trade → Close trade → Complete Dojo',
            noSignificantPattern: 'NO SIGNIFICANT PATTERN DETECTED',
            behaviorConsistent: 'Your behavior appears consistent without strong repeating patterns.',
            maintainDiscipline: 'Maintain current process discipline.',
            continueCheckins: 'Continue with daily check-ins to build a stronger data profile.',
            shadowScore: 'Shadow Score',
            shadowScoreDesc: 'Trust score based on self-assessment honesty compared to AI.',
            requirement: 'Requirement:',
            completeOneDojo: 'Complete at least 1 trade with Dojo',
            closeAndDojo: 'Close trade → Complete 7 Dojo steps to start building Shadow Score',
        },

        // Progress View
        progress: {
            weeklyGoals: 'Weekly Goals',
            weeklyGoalsDesc: 'AI will create personalized goals based on your trading data.',
            unlockRequirement: 'Unlock Requirement:',
            completeTradesWithDojo: 'Complete {count} trades with Dojo',
            stillNeed: 'Still need {count} more trades',
            performanceReport: 'Performance Report',
            performanceReportDesc: 'AI analyzes weekly trading performance in detail and suggests improvements.',
        },

        // Trade History
        tradeHistory: {
            noHistory: 'No Trade History',
            noHistoryDesc: 'Record your first trade to start tracking and analyzing trading behavior.',
            howToAdd: 'How to add trade:',
            step1: 'Enter trade info in form above',
            step2: 'Click Submit for AI evaluation',
            step3: 'When closing trade, complete Dojo',
        },

        // Onboarding
        onboarding: {
            startWithKey: 'Get Started with THEKEY',
            complete3Steps: 'Complete 3 steps to unlock all AI features',
            completed: 'completed',
            dailyCheckin: 'Daily Check-in',
            dailyCheckinDesc: 'Answer 3 psychological questions daily',
            dailyCheckinAction: 'Login every day',
            firstTrade: 'Record First Trade',
            firstTradeDesc: 'Enter trade information in Terminal',
            firstTradeAction: 'Go to EXECUTION → Terminal',
            firstDojo: 'Complete Process Dojo',
            firstDojoDesc: 'Evaluate process after closing trade',
            firstDojoAction: 'Close trade → Complete 7 Dojo steps',
            unlockTip: 'More data helps AI understand your trading behavior better and provide more accurate insights!',
        },
    },
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('thekey_language');
        return (saved as Language) || 'vi';
    });

    useEffect(() => {
        localStorage.setItem('thekey_language', language);
    }, [language]);

    const t = (key: string, params?: Record<string, string | number>): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            value = value?.[k];
        }

        if (typeof value !== 'string') {
            console.warn(`Translation key not found: ${key}`);
            return key;
        }

        // Replace {param} placeholders
        if (params) {
            return value.replace(/\{(\w+)\}/g, (_, paramKey) => String(params[paramKey] || ''));
        }

        return value;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};
