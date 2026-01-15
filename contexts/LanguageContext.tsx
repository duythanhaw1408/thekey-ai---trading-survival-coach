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
            tipLabel: 'Mẹo',
            statusElite: 'Elite',
            statusVeteran: 'Veteran',
            statusSurviving: 'Surviving',
            scanning: 'ĐANG QUÉT HỆ THỐNG...',
            prestige: 'Đẳng cấp',
        },

        // Navigation
        nav: {
            survival: 'TỔNG QUAN',
            execution: 'THỰC HIỆN',
            mindset: 'TƯ DUY',
            progress: 'TIẾN TRÌNH',
            settings: 'CÀI ĐẶT',
        },

        // Profile & Settings
        profile: {
            title: 'Hồ Sơ & Cài Đặt',
            username: 'Tên hiển thị',
            usernameLabel: 'Username (hiển thị công khai)',
            usernamePlaceholder: 'VD: trader_001, shadow_master...',
            usernameHint: '3-20 ký tự, chỉ chữ cái, số và underscore (_)',
            anonymousDisplayName: 'Tên Hiển Thị Ẩn Danh',
            traderArchetype: 'Trader Archetype',
            discoverArchetype: 'Khám phá Archetype của tôi',
            capitalManagement: 'Quản lý vốn',
            accountBalance: 'Vốn đầu tư ($)',
            maxSizeUSD: 'Max Size (USD)',
            riskPerTrade: 'Risk per Trade (%)',
            tradingRules: 'Trading Rules',
            dailyTradeLimit: 'Daily Trade Limit',
            sensitivityThreshold: 'Sensitivity Threshold (%)',
            sensitivityHint: 'Mức độ nhạy bén của cảnh báo dựa trên volume dự kiến.',
            saveProfile: 'Lưu Hồ Sơ',
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
            crisisTitle: 'BÌNH TĨNH. RỦI RO TRẢ THÙ ĐANG RẤT CAO.',
            crisisDesc: 'Hệ thống bảo vệ khuyến nghị bạn nên nghỉ ngơi.',
            biometricStatus: 'Trạng Thái Sinh Học',
            survivalStreak: 'Chuỗi Sinh Tồn',
            daysStanding: 'Ngày Đứng Vững',
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
            unlockProgress: 'Tiến độ mở khóa AI',
            needMoreTrades: 'Cần thêm {count} trade với Dojo',
            generateReport: '🧠 Giải Mã Bản Sắc AI',
            tipGoToDojo: 'Hãy hoàn thành Process Dojo sau mỗi lệnh đóng để AI thấu hiểu bạn.',
            noSignificantPattern: 'CHƯA PHÁT HIỆN MẪU RÕ RÀNG',
            behaviorConsistent: 'Hành vi của bạn có vẻ ổn định, chưa có mẫu lặp lại mạnh.',
            maintainDiscipline: 'Duy trì kỷ luật quy trình hiện tại.',
            continueCheckins: 'Tiếp tục làm check-in hàng ngày để xây dựng hồ sơ dữ liệu mạnh mẽ hơn.',
            shadowScore: 'Shadow Score',
            shadowScoreDesc: 'Điểm tín nhiệm dựa trên độ trung thực tự đánh giá so với AI.',
            requirement: 'Yêu cầu:',
            completeOneDojo: 'Hoàn thành ít nhất 1 trade với Dojo',
            closeAndDojo: 'Đóng lệnh → Hoàn thành 7 bước Dojo để bắt đầu tích lũy Shadow Score',
            archetypeTitle: 'Hình Mẫu Giao Dịch',
            prestigeTier: 'Hạng Mức Tín Nhiệm',
            eliteMirror: 'Elite Mirror',
            stoicSentinel: 'Hộ Vệ Khắc Kỷ',
            alphaStrategist: 'Chiến Lược Gia Alpha',
            systematicZen: 'Thiền Định Hệ Thống',
            chaosMaster: 'Bậc Thầy Hỗn Loạn',
            wisdomTitle: 'Trí Tuệ Hệ Thống',
            scanningBehavior: 'Đang giải mã bản sắc giao dịch của bạn...',
            protectionSettings: 'Thiết Lập Bảo Vệ',
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
            title: 'Tiến Trình & Phân Tích',
            selfAwarenessEngine: 'Self-Awareness Engine',
            trustLevel: 'Mức độ Tín nhiệm',
            analyzePatterns: 'Phân Tích Khuôn Mẫu',
            fingerprintReport: 'Báo Cáo Fingerprint',
            setObjectives: 'Thiết Lập Mục Tiêu',
            survivalReport: 'Báo Cáo Sinh Tồn',
            requirementNote: 'Cần ít nhất {count} trades đã đánh giá để sử dụng các tính năng phân tích nâng cao.',
            parsing: 'Đang xử lý...',
            calibrating: 'Đang hiệu chỉnh...',
            syncing: 'Đang đồng bộ...',
            analyzingPatterns: 'Đang phân tích các khuôn mẫu giao dịch của bạn...',
            generatingGoals: 'Đang tạo mục tiêu tuần cá nhân hóa...',
            compilingReport: 'Đang tổng hợp báo cáo hiệu suất hàng tuần...',
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
            done: 'Xong ✨',
        },

        // Terminal & Trade Input
        terminal: {
            buy: 'MUA',
            sell: 'BÁN',
            sizeLabel: 'Vốn ($)',
            riskLabel: 'Rủi ro (%)',
            assetPlaceholder: 'Tài sản (VD: BTC/USDT)',
            entry: 'Điểm vào',
            tp: 'Chốt lời (không bắt buộc)',
            sl: 'Dừng lỗ',
            positionSize: 'Khối lượng (USD)',
            estRisk: 'Rủi ro ước tính:',
            reasoningPlaceholder: 'Thiết lập & Niềm tin của bạn...',
            simulationActive: 'Chế độ Giả lập đang bật',
            warningTitle: 'Cảnh Báo',
            analyzing: 'ĐANG PHÂN TÍCH...',
            proceed: 'TIẾP TỤC',
            evaluate: 'ĐÁNH GIÁ',
        },

        // Process Dojo
        dojo: {
            title: 'Process Dojo',
            step: 'Bước',
            dominantEmotion: 'Cảm xúc chủ đạo',
            reasoning: 'Lý do vào lệnh',
            processScore: 'Điểm Quy Trình',
            shadowScore: 'Shadow Score',
            completeDojo: 'Hoàn thành Dojo',
        }
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
            tipLabel: 'Tip',
        },

        // Navigation
        nav: {
            survival: 'SURVIVAL',
            execution: 'EXECUTION',
            mindset: 'MINDSET',
            progress: 'PROGRESS',
            settings: 'SETTINGS',
        },

        // Profile & Settings
        profile: {
            title: 'User Profile & Settings',
            username: 'Display Name',
            usernameLabel: 'Username (public display)',
            usernamePlaceholder: 'e.g: trader_001, shadow_master...',
            usernameHint: '3-20 characters, letters, numbers and underscore (_) only',
            anonymousDisplayName: 'Anonymous Display Name',
            traderArchetype: 'Trader Archetype',
            discoverArchetype: 'Discover my Archetype',
            capitalManagement: 'Capital Management',
            accountBalance: 'Account Balance ($)',
            maxSizeUSD: 'Max Size (USD)',
            riskPerTrade: 'Risk per Trade (%)',
            tradingRules: 'Trading Rules',
            dailyTradeLimit: 'Daily Trade Limit',
            sensitivityThreshold: 'Sensitivity Threshold (%)',
            sensitivityHint: 'Alert sensitivity based on expected volume.',
            saveProfile: 'Save Profile',
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
            crisisTitle: 'STAY CALM. REVENGE TRADING RISK IS VERY HIGH.',
            crisisDesc: 'Protection system recommends you take a break.',
            biometricStatus: 'Biometric Status',
            survivalStreak: 'Survival Streak',
            daysStanding: 'Days Standing',
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
            protectionSettings: 'Protection Settings',
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
            title: 'Progress & Analytics',
            selfAwarenessEngine: 'Self-Awareness Engine',
            trustLevel: 'Trust Level',
            analyzePatterns: 'Analyze Patterns',
            fingerprintReport: 'Fingerprint Report',
            setObjectives: 'Set Objectives',
            survivalReport: 'Survival Report',
            requirementNote: 'Need at least {count} evaluated trades for advanced analysis.',
            parsing: 'Parsing...',
            calibrating: 'Calibrating...',
            syncing: 'Syncing...',
            analyzingPatterns: 'Analyzing your trading patterns...',
            generatingGoals: 'Generating personalized weekly goals...',
            compilingReport: 'Compiling your weekly performance report...',
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
            done: 'Done ✨',
        },

        // Terminal & Trade Input
        terminal: {
            buy: 'BUY',
            sell: 'SELL',
            sizeLabel: 'Size ($)',
            riskLabel: 'Risk (%)',
            assetPlaceholder: 'Asset (e.g. BTC/USDT)',
            entry: 'Entry',
            tp: 'TP (Opt)',
            sl: 'Stop Loss',
            positionSize: 'Position (USD)',
            estRisk: 'Est. Risk:',
            reasoningPlaceholder: 'Setup & Conviction...',
            simulationActive: 'Simulation Mode Active',
            warningTitle: 'Warning',
            analyzing: 'ANALYZING...',
            proceed: 'PROCEED',
            evaluate: 'EVALUATE',
        },

        // Process Dojo
        dojo: {
            title: 'Process Dojo',
            step: 'Step',
            dominantEmotion: 'Dominant Emotion',
            reasoning: 'Reasoning',
            processScore: 'Process Score',
            shadowScore: 'Shadow Score',
            completeDojo: 'Complete Dojo',
        }
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
