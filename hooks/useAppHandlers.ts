// hooks/useAppHandlers.ts
/**
 * Centralized handler functions for the App component
 * Extracted to reduce App.tsx complexity and improve testability
 * 
 * @module useAppHandlers
 * @description Contains all event handlers and async operations for the main app
 */

import { useCallback } from 'react';
import type {
    Trade,
    TradeDecision,
    ChatMessage,
    UserProfile,
    CheckinQuestion,
    TraderArchetypeAnalysis,
    UserProcessEvaluation,
    DojoInteractionData,
    ProcessStats,
    WeeklyGoals,
    WeeklyReport
} from '../types';
import type { AppState } from './useAppState';
import { api } from '../services/api';
import * as geminiService from '../services/geminiService';
import { learningEngine } from '../services/learningEngine';
import { processEvaluationEngine } from '../services/processEvaluationService';
import { shadowScoreEngine } from '../services/shadowMetricsService';
import { behavioralGraphEngine } from '../services/behavioralGraphService';
import { masteryEngine } from '../services/masteryService';

/**
 * Trade submission data structure
 */
export interface TradeSubmission {
    asset: string;
    positionSize: number;
    reasoning: string;
    direction: 'BUY' | 'SELL';
    entryPrice: number;
    takeProfit?: number;
    stopLoss?: number;
}

/**
 * App handlers return type
 */
export interface AppHandlers {
    /** Request browser notification permission */
    handleRequestNotificationPermission: () => Promise<void>;
    /** Save user profile to backend */
    handleSaveProfile: (newProfile: UserProfile) => Promise<void>;
    /** Discover trader archetype via AI */
    handleDiscoverArchetype: () => Promise<TraderArchetypeAnalysis>;
    /** Submit a new trade for AI evaluation */
    handleTradeSubmit: (trade: TradeSubmission) => Promise<void>;
    /** Mark a trade for closing */
    handleCloseTrade: (trade: Trade) => void;
    /** Save PnL and trigger evaluation */
    handleSavePnlAndEvaluate: (pnl: number) => void;
    /** Save user's process evaluation */
    handleSaveUserEvaluation: (userEvaluation: UserProcessEvaluation, interactionData: DojoInteractionData) => void;
    /** Send a new chat message */
    handleNewMessage: (newMessage: ChatMessage) => Promise<void>;
    /** Send message in anonymous pod */
    handleSendPodMessage: (text: string) => void;
    /** Update user profile partially */
    handleUpdateProfile: (updates: Partial<UserProfile>) => void;
    /** Save profile settings to backend */
    handleSaveProfileSettings: () => Promise<void>;
    /** Generate mindset/behavioral report */
    handleGenerateMindsetReport: () => void;
    /** Logout current user */
    handleLogout: () => Promise<void>;
    /** Fetch weekly goals from AI */
    handleGetWeeklyGoals: () => Promise<void>;
    /** Fetch weekly report from AI */
    handleGetWeeklyReport: () => Promise<void>;
    /** Submit daily check-in answers */
    handleCheckinSubmit: (answers: Record<string, string>) => Promise<void>;
    /** Complete a crisis intervention action */
    handleCrisisActionComplete: (actionId: string) => void;
}

/**
 * Creates all app handlers with access to state
 * 
 * @param state - The current app state from useAppState
 * @param auth - Authentication context (user, logout)
 * @returns Object containing all handler functions
 * 
 * @example
 * ```tsx
 * const state = useAppState();
 * const handlers = useAppHandlers(state, { user, logout });
 * 
 * // Use handlers
 * await handlers.handleTradeSubmit(tradeData);
 * ```
 */
export function useAppHandlers(
    state: AppState,
    auth: { user: any; logout: () => Promise<void> }
): AppHandlers {
    const { user, logout } = auth;

    /**
     * Request browser notification permission
     */
    const handleRequestNotificationPermission = useCallback(async () => {
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            state.setNotificationPermission(permission);
        }
    }, [state.setNotificationPermission]);

    /**
     * Save user profile to localStorage and sync to backend
     */
    const handleSaveProfile = useCallback(async (newProfile: UserProfile) => {
        state.setUserProfile(newProfile);
        localStorage.setItem('thekey-ai-user-profile', JSON.stringify(newProfile));

        try {
            await api.updateSettings({
                protection_level: newProfile.protectionLevel,
                cooldown_minutes: newProfile.cooldownMinutes,
                consecutive_loss_limit: newProfile.consecutiveLossLimit,
                account_balance: newProfile.accountBalance,
                max_position_size_usd: newProfile.tradingRules.maxPositionSizeUSD,
                risk_per_trade_pct: newProfile.tradingRules.riskPerTradePct,
                daily_trade_limit: newProfile.tradingRules.dailyTradeLimit
            });
            console.log('[Profile] Sync successful');
        } catch (err) {
            console.error('[Profile] Sync failed:', err);
        }
    }, [state.setUserProfile]);

    /**
     * Discover trader archetype using AI analysis
     */
    const handleDiscoverArchetype = useCallback(async (): Promise<TraderArchetypeAnalysis> => {
        const analysis = await api.getTraderArchetype({
            trade_history: state.tradeHistory,
            checkin_history: state.checkinHistory
        });

        state.setUserProfile(prev => {
            const newProfile = { ...prev, archetype: analysis.archetype };
            localStorage.setItem('thekey-ai-user-profile', JSON.stringify(newProfile));
            return newProfile;
        });

        return analysis;
    }, [state.tradeHistory, state.checkinHistory, state.setUserProfile]);

    /**
     * Submit trade for AI evaluation and protection check
     */
    const handleTradeSubmit = useCallback(async (trade: TradeSubmission) => {
        state.setIsLoading(true);
        state.setDecision(null);

        try {
            const feedback = await api.checkTrade({
                trade,
                stats: state.stats,
                tradeHistory: state.tradeHistory,
                settings: state.userProfile.tradingRules,
                activePattern: state.activePattern,
                processStats: state.processStats,
                marketAnalysis: state.marketAnalysis
            });

            state.setDecision(feedback);

            const newTrade: Trade = {
                ...trade,
                id: Date.now(),
                timestamp: new Date(),
                status: 'OPEN',
                decision: feedback.decision,
                decisionReason: feedback.reason,
                mode: state.simulationMode ? 'SIMULATION' : 'LIVE',
                statsAtEntry: {
                    consecutiveLosses: state.stats.consecutiveLosses,
                    consecutiveWins: state.stats.consecutiveWins
                }
            };

            if (feedback.decision === 'BLOCK') {
                newTrade.status = 'CLOSED';
            } else {
                await api.recordTrade({
                    ...trade,
                    user_id: state.userProfile.id,
                    symbol: trade.asset,
                    side: trade.direction,
                    entry_price: trade.entryPrice,
                    quantity: trade.positionSize / trade.entryPrice,
                    entry_time: new Date().toISOString(),
                    status: 'OPEN'
                });
            }

            state.setTradeHistory(prev => [newTrade, ...prev]);

            const messageText = feedback.decision === 'BLOCK'
                ? `BLOCKING TRADE: ${feedback.reason}`
                : feedback.reason;

            state.setMessages(prev => [...prev, {
                id: Date.now() + Math.random(),
                sender: 'ai',
                type: 'text',
                text: messageText || "Đã kiểm tra xong."
            }]);
        } catch (error) {
            console.error("Error getting trade feedback:", error);
            state.setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'ai',
                type: 'text',
                text: "Đã có lỗi xảy ra. Vui lòng thử lại."
            }]);
        } finally {
            state.setIsLoading(false);
        }
    }, [state]);

    /**
     * Mark a trade for closing
     */
    const handleCloseTrade = useCallback((trade: Trade) => {
        state.setTradeToClose(trade);
    }, [state.setTradeToClose]);

    /**
     * Save PnL for closed trade and trigger evaluation modal
     */
    const handleSavePnlAndEvaluate = useCallback((pnl: number) => {
        if (!state.tradeToClose) return;

        const closedTrade: Trade = { ...state.tradeToClose, status: 'CLOSED', pnl };

        state.setTradeHistory(prev => {
            const newHistory = prev.map(t => t.id === state.tradeToClose!.id ? closedTrade : t);
            state.setStats(s => ({
                ...s,
                consecutiveLosses: pnl < 0 ? s.consecutiveLosses + 1 : 0,
                consecutiveWins: pnl > 0 ? s.consecutiveWins + 1 : 0
            }));
            return newHistory;
        });

        state.setTradeToClose(null);
        state.setTradeToEvaluate(closedTrade);
    }, [state.tradeToClose, state.setTradeHistory, state.setStats, state.setTradeToClose, state.setTradeToEvaluate]);

    /**
     * Send a new chat message and get AI response
     */
    const handleNewMessage = useCallback(async (newMessage: ChatMessage) => {
        if (newMessage.type !== 'text') return;

        const updatedMessages = [...state.messages, newMessage];
        state.setMessages(updatedMessages);

        const aiResponseId = Date.now() + Math.random();
        state.setMessages(prev => [...prev, { id: aiResponseId, sender: 'ai', type: 'text', text: '...' }]);

        try {
            state.setIsChatting(true);
            const mode = state.crisisIntervention ? 'PROTECTOR' : 'COACH';
            const response = await api.getChatResponse(newMessage.text, updatedMessages, mode);
            const displayText = response.display_text || response.text || "Tôi không hiểu ý bạn lắm.";

            state.setMessages(prev => prev.map(m =>
                m.id === aiResponseId ? { id: aiResponseId, sender: 'ai', type: 'text', text: displayText } : m
            ));
        } catch (error) {
            console.error("Error getting chat response:", error);
            state.setMessages(prev => prev.map(m =>
                m.id === aiResponseId && m.type === 'text' ? { ...m, text: "Xin lỗi, tôi đang gặp sự cố." } : m
            ));
        } finally {
            state.setIsChatting(false);
        }
    }, [state.messages, state.crisisIntervention, state.setMessages, state.setIsChatting]);

    /**
     * Send message in anonymous pod and simulate peer reply
     */
    const handleSendPodMessage = useCallback((text: string) => {
        if (!state.pod) return;

        const updatedPod = masteryEngine.sendPodMessage(state.pod, text);
        state.setPod(updatedPod);

        setTimeout(() => {
            const podWithReply = masteryEngine.simulatePeerReply(updatedPod);
            state.setPod(podWithReply);
        }, 2000 + Math.random() * 1500);
    }, [state.pod, state.setPod]);

    /**
     * Partially update user profile
     */
    const handleUpdateProfile = useCallback((updates: Partial<UserProfile>) => {
        state.setUserProfile(prev => ({ ...prev, ...updates }));
    }, [state.setUserProfile]);

    /**
     * Save current profile settings to backend
     */
    const handleSaveProfileSettings = useCallback(async () => {
        try {
            state.setIsLoading(true);
            await api.updateSettings({
                protection_level: state.userProfile.protectionLevel || 'SURVIVAL',
                cooldown_minutes: Number(state.userProfile.cooldownMinutes) || 30,
                consecutive_loss_limit: Number(state.userProfile.consecutiveLossLimit) || 2,
                account_balance: Number(state.userProfile.accountBalance) || 1000,
                max_position_size_usd: Number(state.userProfile.tradingRules.maxPositionSizeUSD) || 500,
                risk_per_trade_pct: Number(state.userProfile.tradingRules.riskPerTradePct) || 2,
                daily_trade_limit: Number(state.userProfile.tradingRules.dailyTradeLimit) || 5
            });
            console.log("[Profile] Settings saved successfully");
        } catch (e) {
            console.error("[Profile] Failed to save settings:", e);
        } finally {
            state.setIsLoading(false);
        }
    }, [state.userProfile, state.setIsLoading]);

    /**
     * Generate behavioral/mindset report
     */
    const handleGenerateMindsetReport = useCallback(() => {
        const report = behavioralGraphEngine.generatePersonalBehaviorReport();
        state.setBehavioralReport(report);
    }, [state.setBehavioralReport]);

    /**
     * Logout current user
     */
    const handleLogout = useCallback(async () => {
        try {
            await logout();
        } catch (err) {
            console.error('Logout failed:', err);
        }
    }, [logout]);

    /**
     * Fetch weekly goals from AI
     */
    const handleGetWeeklyGoals = useCallback(async () => {
        state.setIsLoadingGoals(true);
        state.setWeeklyGoals(null);

        try {
            const goals = await api.getWeeklyGoals(state.tradeHistory, state.stats, state.checkinHistory);
            state.setWeeklyGoals(goals);
        } catch (error) {
            console.error("Failed to get weekly goals:", error);
        } finally {
            state.setIsLoadingGoals(false);
        }
    }, [state.tradeHistory, state.stats, state.checkinHistory, state.setIsLoadingGoals, state.setWeeklyGoals]);

    /**
     * Fetch weekly report from AI
     */
    const handleGetWeeklyReport = useCallback(async () => {
        state.setIsLoadingReport(true);
        state.setWeeklyReport(null);

        try {
            const report = await geminiService.getWeeklyReport(state.tradeHistory);
            state.setWeeklyReport(report);
        } catch (error) {
            console.error("Failed to get weekly report:", error);
        } finally {
            state.setIsLoadingReport(false);
        }
    }, [state.tradeHistory, state.setIsLoadingReport, state.setWeeklyReport]);

    /**
     * Submit daily check-in answers
     */
    const handleCheckinSubmit = useCallback(async (answers: Record<string, string>) => {
        state.setShowCheckin(false);
        localStorage.setItem('lastCheckinDate', new Date().toISOString().split('T')[0]);

        if (!state.dailyQuestions) return;

        state.setActiveTab('EXECUTION');
        const tempId = Date.now();
        state.setMessages(prev => [...prev, { id: tempId, sender: 'ai', type: 'text', text: 'Analyzing your check-in...' }]);

        try {
            const answerValues = state.dailyQuestions.map(q => answers[q.id]);
            const analysis = await api.submitCheckin(answerValues);

            const analysisMessage: ChatMessage = { id: tempId, sender: 'ai', type: 'analysis', analysis };
            state.setCheckinHistory(prev => [analysis, ...prev]);
            state.setMessages(prev => prev.map(msg => msg.id === tempId ? analysisMessage : msg));
        } catch (error) {
            console.error("Failed to get check-in analysis:", error);
            state.setMessages(prev => prev.map(msg =>
                msg.id === tempId ? { id: tempId, sender: 'ai', type: 'text', text: 'Sorry, I had trouble analyzing your responses.' } : msg
            ));
        }
    }, [state.dailyQuestions, state.setShowCheckin, state.setActiveTab, state.setMessages, state.setCheckinHistory]);

    /**
     * Complete a crisis intervention action
     */
    const handleCrisisActionComplete = useCallback((actionId: string) => {
        if (!state.crisisIntervention) return;

        const action = state.crisisIntervention.recommendedActions.find(a => a.id === actionId);
        if (!action) return;

        const durationMinutes = parseInt(action.duration.split(' ')[0], 10);
        if (isNaN(durationMinutes)) return;

        state.setCrisisIntervention(prevData => {
            if (!prevData) return null;
            const newCooldown = Math.max(0, prevData.cooldownMinutes - durationMinutes);
            return { ...prevData, cooldownMinutes: newCooldown };
        });
    }, [state.crisisIntervention, state.setCrisisIntervention]);

    /**
     * Save user evaluation for a trade (extracted handler)
     */
    const handleSaveUserEvaluation = useCallback((
        userEvaluation: UserProcessEvaluation,
        interactionData: DojoInteractionData
    ) => {
        if (!state.tradeToEvaluate) return;

        const aiEvaluation = processEvaluationEngine.evaluateTradeProcess(state.tradeToEvaluate, userEvaluation);
        const newShadowScore = shadowScoreEngine.calculateShadowScore(
            { ...state.tradeToEvaluate, userProcessEvaluation: userEvaluation, processEvaluation: aiEvaluation },
            userEvaluation,
            interactionData
        );

        state.setShadowScore(newShadowScore);
        const evaluatedTrade: Trade = {
            ...state.tradeToEvaluate,
            userProcessEvaluation: userEvaluation,
            processEvaluation: aiEvaluation
        };

        behavioralGraphEngine.addTradeToGraph(evaluatedTrade);

        state.setTradeHistory(prev => {
            const newHistory = prev.map(t => t.id === state.tradeToEvaluate!.id ? evaluatedTrade : t);
            const recentEvals = newHistory
                .filter(t => t.processEvaluation && (state.simulationMode ? t.mode === 'SIMULATION' : t.mode === 'LIVE'))
                .slice(0, 10);

            if (recentEvals.length > 0) {
                const totalScores = recentEvals.reduce((acc, trade) => {
                    acc.total += trade.processEvaluation!.totalProcessScore;
                    acc.setup += trade.processEvaluation!.scores.setup;
                    acc.risk += trade.processEvaluation!.scores.risk;
                    acc.emotion += trade.processEvaluation!.scores.emotion;
                    acc.execution += trade.processEvaluation!.scores.execution;
                    return acc;
                }, { total: 0, setup: 0, risk: 0, emotion: 0, execution: 0 });

                const newAvg = totalScores.total / recentEvals.length;
                const areaCounts = recentEvals.reduce((acc, curr) => {
                    acc[curr.processEvaluation!.weakestArea] = (acc[curr.processEvaluation!.weakestArea] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const weakestArea = Object.keys(areaCounts).reduce((a, b) =>
                    areaCounts[a] > areaCounts[b] ? a : b
                ) as ProcessStats['weakestArea'];

                state.setProcessStats({
                    averageScore: Math.round(newAvg),
                    trend: newAvg > (state.processStats?.averageScore ?? 0) + 2
                        ? 'IMPROVING'
                        : newAvg < (state.processStats?.averageScore ?? 0) - 2
                            ? 'DECLINING'
                            : 'STABLE',
                    weakestArea,
                    detailedScores: {
                        averageSetup: parseFloat((totalScores.setup / recentEvals.length).toFixed(1)),
                        averageRisk: parseFloat((totalScores.risk / recentEvals.length).toFixed(1)),
                        averageEmotion: parseFloat((totalScores.emotion / recentEvals.length).toFixed(1)),
                        averageExecution: parseFloat((totalScores.execution / recentEvals.length).toFixed(1)),
                    }
                });
            }
            return newHistory;
        });

        learningEngine.learnFromTrade(evaluatedTrade, aiEvaluation, newShadowScore);
        console.log('[Learning] Trade outcome recorded for AI learning');

        state.setTradeToEvaluate(null);
        state.setSelectedTradeForAnalysis(evaluatedTrade);
    }, [state]);

    return {
        handleRequestNotificationPermission,
        handleSaveProfile,
        handleDiscoverArchetype,
        handleTradeSubmit,
        handleCloseTrade,
        handleSavePnlAndEvaluate,
        handleSaveUserEvaluation,
        handleNewMessage,
        handleSendPodMessage,
        handleUpdateProfile,
        handleSaveProfileSettings,
        handleGenerateMindsetReport,
        handleLogout,
        handleGetWeeklyGoals,
        handleGetWeeklyReport,
        handleCheckinSubmit,
        handleCrisisActionComplete,
    };
}
