// hooks/useAppState.ts
/**
 * Centralized state management hook for the App component
 * Extracts all useState declarations to reduce App.tsx complexity
 */

import { useState, useMemo } from 'react';
import type {
    TraderStats,
    Trade,
    TradeDecision,
    ChatMessage,
    UserProfile,
    CheckinQuestion,
    TradeAnalysis,
    CrisisData,
    DetectedPattern,
    CheckinAnalysisResult,
    MarketAnalysis,
    Notification as NotificationType,
    MasteryData,
    Pod,
    ProcessStats,
    ShadowScore,
    BehavioralReport,
    WeeklyGoals,
    WeeklyReport
} from '../types';
import type { AppTab } from '../components/Layout/Sidebar';
import { SmartNotificationEngine } from '../services/notificationService';

// Default user profile configuration
const DEFAULT_USER_PROFILE: UserProfile = {
    id: '',
    accountBalance: 1000,
    archetype: 'UNDEFINED',
    tradingRules: {
        dailyTradeLimit: 5,
        positionSizeWarningThreshold: 120,
        maxPositionSizeUSD: 500,
        riskPerTradePct: 2
    },
    protectionLevel: 'SURVIVAL',
    cooldownMinutes: 30,
    consecutiveLossLimit: 2,
    notificationPreferences: {
        pushEnabled: true,
        emailEnabled: false,
        smsEnabled: false,
        quietHours: { start: '22:00', end: '08:00' },
    },
    sleepSchedule: { start: '23:00', end: '07:00' },
};

// Default trader stats
const DEFAULT_STATS: TraderStats = {
    survivalDays: 7,
    drawdownControl: 85,
    disciplineScore: 92,
    consecutiveLosses: 0,
    consecutiveWins: 0,
};

export interface AppState {
    // Core Trading State
    stats: TraderStats;
    setStats: React.Dispatch<React.SetStateAction<TraderStats>>;
    tradeHistory: Trade[];
    setTradeHistory: React.Dispatch<React.SetStateAction<Trade[]>>;
    decision: TradeDecision | null;
    setDecision: React.Dispatch<React.SetStateAction<TradeDecision | null>>;

    // UI State
    showCheckin: boolean;
    setShowCheckin: React.Dispatch<React.SetStateAction<boolean>>;
    dailyQuestions: CheckinQuestion[] | null;
    setDailyQuestions: React.Dispatch<React.SetStateAction<CheckinQuestion[] | null>>;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    isChatting: boolean;
    setIsChatting: React.Dispatch<React.SetStateAction<boolean>>;
    activeTab: AppTab;
    setActiveTab: React.Dispatch<React.SetStateAction<AppTab>>;

    // Chat & Messages
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;

    // Profile & Settings
    showProfile: boolean;
    setShowProfile: React.Dispatch<React.SetStateAction<boolean>>;
    userProfile: UserProfile;
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
    notificationPermission: NotificationPermission;
    setNotificationPermission: React.Dispatch<React.SetStateAction<NotificationPermission>>;

    // Trade Analysis
    selectedTradeForAnalysis: Trade | null;
    setSelectedTradeForAnalysis: React.Dispatch<React.SetStateAction<Trade | null>>;
    tradeAnalysis: TradeAnalysis | null;
    setTradeAnalysis: React.Dispatch<React.SetStateAction<TradeAnalysis | null>>;
    isAnalyzingTrade: boolean;
    setIsAnalyzingTrade: React.Dispatch<React.SetStateAction<boolean>>;
    tradeToClose: Trade | null;
    setTradeToClose: React.Dispatch<React.SetStateAction<Trade | null>>;
    tradeToEvaluate: Trade | null;
    setTradeToEvaluate: React.Dispatch<React.SetStateAction<Trade | null>>;

    // Crisis & Patterns
    crisisIntervention: CrisisData | null;
    setCrisisIntervention: React.Dispatch<React.SetStateAction<CrisisData | null>>;
    activePattern: DetectedPattern | null;
    setActivePattern: React.Dispatch<React.SetStateAction<DetectedPattern | null>>;

    // Check-in & Notifications
    checkinHistory: CheckinAnalysisResult[];
    setCheckinHistory: React.Dispatch<React.SetStateAction<CheckinAnalysisResult[]>>;
    inAppNotification: NotificationType | null;
    setInAppNotification: React.Dispatch<React.SetStateAction<NotificationType | null>>;

    // Simulation & Mastery
    simulationMode: boolean;
    setSimulationMode: React.Dispatch<React.SetStateAction<boolean>>;
    masteryData: MasteryData | null;
    setMasteryData: React.Dispatch<React.SetStateAction<MasteryData | null>>;
    pod: Pod | null;
    setPod: React.Dispatch<React.SetStateAction<Pod | null>>;

    // Process & Shadow Metrics
    processStats: ProcessStats | null;
    setProcessStats: React.Dispatch<React.SetStateAction<ProcessStats | null>>;
    shadowScore: ShadowScore | null;
    setShadowScore: React.Dispatch<React.SetStateAction<ShadowScore | null>>;

    // Reports & Goals
    behavioralReport: BehavioralReport | null;
    setBehavioralReport: React.Dispatch<React.SetStateAction<BehavioralReport | null>>;
    weeklyGoals: WeeklyGoals | null;
    setWeeklyGoals: React.Dispatch<React.SetStateAction<WeeklyGoals | null>>;
    isLoadingGoals: boolean;
    setIsLoadingGoals: React.Dispatch<React.SetStateAction<boolean>>;
    weeklyReport: WeeklyReport | null;
    setWeeklyReport: React.Dispatch<React.SetStateAction<WeeklyReport | null>>;
    isLoadingReport: boolean;
    setIsLoadingReport: React.Dispatch<React.SetStateAction<boolean>>;
    marketAnalysis: MarketAnalysis | null;
    setMarketAnalysis: React.Dispatch<React.SetStateAction<MarketAnalysis | null>>;

    // Engagement & Streaks
    streak: number;
    setStreak: React.Dispatch<React.SetStateAction<number>>;
    lastActiveDate: string | null;
    setLastActiveDate: React.Dispatch<React.SetStateAction<string | null>>;
    xpGainTrigger: number;
    setXpGainTrigger: React.Dispatch<React.SetStateAction<number>>;
    lastXpGain: number;
    setLastXpGain: React.Dispatch<React.SetStateAction<number>>;
    showLevelUp: boolean;
    setShowLevelUp: React.Dispatch<React.SetStateAction<boolean>>;
    newLevelTitle: string;
    setNewLevelTitle: React.Dispatch<React.SetStateAction<string>>;
    showWelcomeBack: boolean;
    setShowWelcomeBack: React.Dispatch<React.SetStateAction<boolean>>;
    daysAway: number;
    setDaysAway: React.Dispatch<React.SetStateAction<number>>;
    previousLevel: string | null;
    setPreviousLevel: React.Dispatch<React.SetStateAction<string | null>>;

    // Utilities
    notificationEngine: SmartNotificationEngine;
}

/**
 * Central state hook for App component
 * Provides all state and setters in a single organized return
 */
export function useAppState(): AppState {
    // Core Trading State
    const [stats, setStats] = useState<TraderStats>(DEFAULT_STATS);
    const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
    const [decision, setDecision] = useState<TradeDecision | null>(null);

    // UI State
    const [showCheckin, setShowCheckin] = useState(false);
    const [dailyQuestions, setDailyQuestions] = useState<CheckinQuestion[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isChatting, setIsChatting] = useState(false);
    const [activeTab, setActiveTab] = useState<AppTab>('SURVIVAL');

    // Chat & Messages
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // Profile & Settings
    const [showProfile, setShowProfile] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );

    // Trade Analysis
    const [selectedTradeForAnalysis, setSelectedTradeForAnalysis] = useState<Trade | null>(null);
    const [tradeAnalysis, setTradeAnalysis] = useState<TradeAnalysis | null>(null);
    const [isAnalyzingTrade, setIsAnalyzingTrade] = useState(false);
    const [tradeToClose, setTradeToClose] = useState<Trade | null>(null);
    const [tradeToEvaluate, setTradeToEvaluate] = useState<Trade | null>(null);

    // Crisis & Patterns
    const [crisisIntervention, setCrisisIntervention] = useState<CrisisData | null>(null);
    const [activePattern, setActivePattern] = useState<DetectedPattern | null>(null);

    // Check-in & Notifications
    const [checkinHistory, setCheckinHistory] = useState<CheckinAnalysisResult[]>([]);
    const [inAppNotification, setInAppNotification] = useState<NotificationType | null>(null);

    // Simulation & Mastery
    const [simulationMode, setSimulationMode] = useState(true);
    const [masteryData, setMasteryData] = useState<MasteryData | null>(null);
    const [pod, setPod] = useState<Pod | null>(null);

    // Process & Shadow Metrics  
    const [processStats, setProcessStats] = useState<ProcessStats | null>(null);
    const [shadowScore, setShadowScore] = useState<ShadowScore | null>(null);

    // Reports & Goals
    const [behavioralReport, setBehavioralReport] = useState<BehavioralReport | null>(null);
    const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoals | null>(null);
    const [isLoadingGoals, setIsLoadingGoals] = useState(false);
    const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);

    // Engagement & Streaks
    const [streak, setStreak] = useState(0);
    const [lastActiveDate, setLastActiveDate] = useState<string | null>(null);
    const [xpGainTrigger, setXpGainTrigger] = useState(0);
    const [lastXpGain, setLastXpGain] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [newLevelTitle, setNewLevelTitle] = useState('');
    const [showWelcomeBack, setShowWelcomeBack] = useState(false);
    const [daysAway, setDaysAway] = useState(0);
    const [previousLevel, setPreviousLevel] = useState<string | null>(null);

    // Utilities (memoized)
    const notificationEngine = useMemo(() => new SmartNotificationEngine(), []);

    return {
        // Core Trading State
        stats, setStats,
        tradeHistory, setTradeHistory,
        decision, setDecision,

        // UI State
        showCheckin, setShowCheckin,
        dailyQuestions, setDailyQuestions,
        isLoading, setIsLoading,
        isChatting, setIsChatting,
        activeTab, setActiveTab,

        // Chat & Messages
        messages, setMessages,

        // Profile & Settings
        showProfile, setShowProfile,
        userProfile, setUserProfile,
        notificationPermission, setNotificationPermission,

        // Trade Analysis
        selectedTradeForAnalysis, setSelectedTradeForAnalysis,
        tradeAnalysis, setTradeAnalysis,
        isAnalyzingTrade, setIsAnalyzingTrade,
        tradeToClose, setTradeToClose,
        tradeToEvaluate, setTradeToEvaluate,

        // Crisis & Patterns
        crisisIntervention, setCrisisIntervention,
        activePattern, setActivePattern,

        // Check-in & Notifications
        checkinHistory, setCheckinHistory,
        inAppNotification, setInAppNotification,

        // Simulation & Mastery
        simulationMode, setSimulationMode,
        masteryData, setMasteryData,
        pod, setPod,

        // Process & Shadow Metrics
        processStats, setProcessStats,
        shadowScore, setShadowScore,

        // Reports & Goals
        behavioralReport, setBehavioralReport,
        weeklyGoals, setWeeklyGoals,
        isLoadingGoals, setIsLoadingGoals,
        weeklyReport, setWeeklyReport,
        isLoadingReport, setIsLoadingReport,
        marketAnalysis, setMarketAnalysis,

        // Engagement & Streaks
        streak, setStreak,
        lastActiveDate, setLastActiveDate,
        xpGainTrigger, setXpGainTrigger,
        lastXpGain, setLastXpGain,
        showLevelUp, setShowLevelUp,
        newLevelTitle, setNewLevelTitle,
        showWelcomeBack, setShowWelcomeBack,
        daysAway, setDaysAway,
        previousLevel, setPreviousLevel,

        // Utilities
        notificationEngine,
    };
}

export { DEFAULT_USER_PROFILE, DEFAULT_STATS };
