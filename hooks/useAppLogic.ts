import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { TraderStats, Trade, TradeDecision, ChatMessage, UserProfile, CheckinQuestion, TradeAnalysis, CrisisData, DetectedPattern, CheckinAnalysisResult, MarketAnalysis, Notification as NotificationType, MasteryData, Pod, ProcessStats, UserProcessEvaluation, ShadowScore, BehavioralReport, WeeklyGoals, WeeklyReport, TraderArchetypeAnalysis } from '../types';
import { masteryEngine } from '../services/masteryService';
import { behavioralGraphEngine } from '../services/behavioralGraphService';
import * as geminiService from '../services/geminiService';

export const useAppLogic = () => {
    const { user, logout } = useAuth();

    // States
    const [stats, setStats] = useState<TraderStats>({
        survivalDays: 7, drawdownControl: 85, disciplineScore: 92, consecutiveLosses: 0, consecutiveWins: 0,
    });
    const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isChatting, setIsChatting] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // UI states
    const [activeModals, setActiveModals] = useState({
        profile: false, checkin: false, pnl: false, crisis: false,
    });

    // Sync Profile
    useEffect(() => {
        if (user) {
            setUserProfile(prev => ({
                ...prev,
                id: user.id,
                email: user.email,
                isPro: user.is_pro,
                archetype: prev?.archetype || 'UNDEFINED',
                tradingRules: prev?.tradingRules || { dailyTradeLimit: 5, positionSizeWarningThreshold: 200 },
                notificationPreferences: prev?.notificationPreferences || { pushEnabled: true, emailEnabled: false, smsEnabled: false, quietHours: { start: '22:00', end: '08:00' } },
                sleepSchedule: prev?.sleepSchedule || { start: '23:00', end: '07:00' },
            }));
        }
    }, [user]);

    const handleLogout = useCallback(async () => {
        try { await logout(); } catch (err) { console.error('Logout failed:', err); }
    }, [logout]);

    const toggleModal = useCallback((name: keyof typeof activeModals, isOpen: boolean) => {
        setActiveModals(prev => ({ ...prev, [name]: isOpen }));
    }, []);

    return {
        user,
        userProfile,
        stats,
        tradeHistory,
        messages,
        isLoading,
        isChatting,
        activeModals,
        setTradeHistory,
        setMessages,
        handleLogout,
        toggleModal,
        // Add more handlers as needed during refactor
    };
};
