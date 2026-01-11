

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlockedScreen } from './components/BlockedScreen';
import { DailyCheckinModal } from './components/DailyCheckinModal';
import { ProfileModal } from './components/ProfileModal';
import { CrisisInterventionModal } from './components/CrisisInterventionModal';
import { ProcessDojoModal } from './components/ProcessDojoModal';
import { InAppNotification } from './components/InAppNotification';
import { UpdatePnlModal } from './components/UpdatePnlModal';
import { TerminalView } from './components/views/TerminalView';
import { DashboardView } from './components/views/DashboardView';
import { CoachView } from './components/views/CoachView';
import { Sidebar, type AppTab } from './components/Layout/Sidebar';
import { ExecutionView } from './components/views/ExecutionView';
import { MindsetView } from './components/views/MindsetView';
import { ProgressView } from './components/views/ProgressView';
import type { TraderStats, Trade, TradeDecision, ChatMessage, UserProfile, CheckinQuestion, TradeAnalysis, CrisisData, DetectedPattern, CheckinAnalysisResult, MarketAnalysis, Notification as NotificationType, MasteryData, Pod, ProcessStats, UserProcessEvaluation, ShadowScore, BehavioralReport, WeeklyGoals, WeeklyReport, TraderArchetypeAnalysis, DojoInteractionData } from './types';
import { SmartNotificationEngine } from './services/notificationService';
import { virtualTradingEngine } from './services/simulationService';
import { masteryEngine } from './services/masteryService';
import { processEvaluationEngine } from './services/processEvaluationService';
import { shadowScoreEngine } from './services/shadowMetricsService';
import { behavioralGraphEngine } from './services/behavioralGraphService';
import { KeyIcon, SettingsIcon, BellIcon, TerminalIcon, AcademicCapIcon } from './components/icons';
import { MainHeader } from './components/Layout/MainHeader';
import { DashboardGrid } from './components/Layout/DashboardGrid';
import { PrinciplesWidget } from './components/PrinciplesWidget';
import { StreakIndicator } from './components/StreakIndicator';
import { XpPopup, LevelUpCelebration } from './components/XpPopup';
import { WelcomeBackBanner, OnlineIndicator } from './components/EngagementWidgets';
import { api } from './services/api';
import * as geminiService from './services/geminiService';
// AI Optimization Services
import { learningEngine } from './services/learningEngine';
import { marketDataService, type MarketDataContext } from './services/marketDataService';
import { cacheService } from './services/cacheService';
import { crowdWisdomService } from './services/crowdWisdomService';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const DEFAULT_USER_PROFILE: UserProfile = {
  id: '', // Will be set from auth context
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

// DEPRECATED: LeftPanelTab is replaced by AppTab in Sidebar
// export type LeftPanelTab = 'terminal' | 'coach';


const App: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<TraderStats>(() => ({
    survivalDays: 7,
    drawdownControl: 85,
    disciplineScore: 92,
    consecutiveLosses: 0,
    consecutiveWins: 0,
  }));
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [decision, setDecision] = useState<TradeDecision | null>(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [dailyQuestions, setDailyQuestions] = useState<CheckinQuestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [selectedTradeForAnalysis, setSelectedTradeForAnalysis] = useState<Trade | null>(null);
  const [tradeAnalysis, setTradeAnalysis] = useState<TradeAnalysis | null>(null);
  const [isAnalyzingTrade, setIsAnalyzingTrade] = useState(false);
  const [tradeToClose, setTradeToClose] = useState<Trade | null>(null);
  const [tradeToEvaluate, setTradeToEvaluate] = useState<Trade | null>(null);
  const [crisisIntervention, setCrisisIntervention] = useState<CrisisData | null>(null);
  const [activePattern, setActivePattern] = useState<DetectedPattern | null>(null);
  const [checkinHistory, setCheckinHistory] = useState<CheckinAnalysisResult[]>([]);
  const [inAppNotification, setInAppNotification] = useState<NotificationType | null>(null);
  const [simulationMode, setSimulationMode] = useState(true);
  const [masteryData, setMasteryData] = useState<MasteryData | null>(null);
  const [pod, setPod] = useState<Pod | null>(null);
  const [processStats, setProcessStats] = useState<ProcessStats | null>(null);
  const [shadowScore, setShadowScore] = useState<ShadowScore | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('SURVIVAL');
  const [behavioralReport, setBehavioralReport] = useState<BehavioralReport | null>(null);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoals | null>(null);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);

  // Engagement & Retention States
  const [streak, setStreak] = useState(0);
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(null);
  const [xpGainTrigger, setXpGainTrigger] = useState(0);
  const [lastXpGain, setLastXpGain] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevelTitle, setNewLevelTitle] = useState('');

  // Sync userProfile.id with authenticated user
  useEffect(() => {
    if (user?.id && userProfile.id !== user.id) {
      setUserProfile(prev => ({ ...prev, id: user.id }));
    }
  }, [user?.id, userProfile.id]);

  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [daysAway, setDaysAway] = useState(0);
  const [previousLevel, setPreviousLevel] = useState<string | null>(null);

  const notificationEngine = useMemo(() => new SmartNotificationEngine(), []);

  useEffect(() => {
    if (crisisIntervention) {
      notificationEngine.generateNotification(userProfile.id, { type: 'REVENGE_BLOCK', urgency: 'HIGH' })
        .then(notification => { if (notification.deliveryMethods.includes('IN_APP')) setInAppNotification(notification); });
    }
  }, [crisisIntervention, notificationEngine, userProfile.id]);

  useEffect(() => {
    if (stats.consecutiveLosses >= 2 && !crisisIntervention) {
      api.getEmotionalTiltIntervention(stats, tradeHistory).then(res => {
        if (res.tilt_detected) {
          setCrisisIntervention(res);
        }
      });
    }
  }, [stats, tradeHistory, crisisIntervention]);

  // Centralized Rehydration & Sync logic
  const rehydrateUser = React.useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setIsLoading(true);
    try {
      console.log('[App] Rehydrating data for user:', user.email);
      // Load Trade History
      const rawHistory = await api.getTradeHistory();
      console.log('[App] Loaded trade history from API:', rawHistory?.length || 0, 'trades');
      // Debug: Check if API returns process_evaluation
      if (rawHistory && rawHistory.length > 0) {
        console.log('[App] DEBUG First trade raw data:', JSON.stringify(rawHistory[0], null, 2));
        console.log('[App] DEBUG Has process_evaluation:', !!rawHistory[0].process_evaluation);
        console.log('[App] DEBUG Has user_process_evaluation:', !!rawHistory[0].user_process_evaluation);
      }

      // Transform API response to frontend Trade format
      const transformedHistory = (rawHistory || []).map((trade: any) => ({
        id: trade.id,
        timestamp: new Date(trade.entry_time || trade.created_at),
        asset: trade.symbol || trade.asset,
        direction: trade.side || trade.direction,
        entryPrice: trade.entry_price || trade.entryPrice,
        takeProfit: trade.take_profit || trade.takeProfit,
        stopLoss: trade.stop_loss || trade.stopLoss,
        positionSize: trade.quantity ? (trade.quantity * (trade.entry_price || 1)) : trade.positionSize,
        status: trade.status || 'OPEN',
        decision: trade.ai_decision || trade.decision || 'ALLOW',
        pnl: trade.pnl,
        reasoning: trade.notes || trade.reasoning,
        decisionReason: trade.ai_reason || trade.decisionReason,
        mode: simulationMode ? 'SIMULATION' : 'LIVE',
        // Process Dojo evaluation data
        userProcessEvaluation: trade.user_process_evaluation,
        processEvaluation: trade.process_evaluation
      }));
      console.log('[App] Transformed trades:', transformedHistory.length, 'trades');
      setTradeHistory(transformedHistory);

      // Load Progress Summary
      const summary = await api.getProgressSummary();
      setStats(prev => ({ ...prev, ...summary }));

      // Load Settings & Profile
      const me = await api.getCurrentUser();
      if (me) {
        setUserProfile(prev => ({
          ...prev,
          id: me.id,
          email: me.email,
          accountBalance: me.account_balance || 1000,
          xp: me.xp || 0,
          level: me.level || 1,
          protectionLevel: me.protection_level || 'SURVIVAL',
          cooldownMinutes: me.cooldown_minutes || 30,
          consecutiveLossLimit: me.consecutive_loss_limit || 2,
          tradingRules: {
            ...prev.tradingRules,
            dailyTradeLimit: me.daily_trade_limit || 5,
            maxPositionSizeUSD: me.max_position_size_usd || 500,
            riskPerTradePct: me.risk_per_trade_pct || 2
          }
        }));

        // Mastery hydration
        if (me.xp !== undefined || me.level !== undefined) {
          // We might need to manually set seed data for mastery engine or trust the backend
          console.log(`[App] Hydrated Gamification: LVL ${me.level}, XP ${me.xp}`);
        }
      }

      // Check for checkin - only show once per day
      const today = new Date().toDateString();
      const lastCheckinDate = localStorage.getItem('thekey_last_checkin_date');

      if (lastCheckinDate !== today) {
        const { questions } = await api.getCheckinQuestions();
        if (questions && questions.length > 0) {
          setDailyQuestions(questions);
          setShowCheckin(true);
        }
      }

      const initialMsg = await api.getInitialMessage();
      setMessages([{ id: Date.now() + Math.random(), sender: 'ai', type: 'text', text: initialMsg || "Chào bạn!" }]);

      behavioralGraphEngine.buildGraphFromHistory(transformedHistory);
      marketDataService.startAutoRefresh();

    } catch (error) {
      console.error("[App] Failed to rehydrate:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, userProfile.id]);

  // Run rehydration when authentication status changes to true
  useEffect(() => {
    if (isAuthenticated) {
      rehydrateUser();
    } else {
      // Clear sensitive states on logout
      setTradeHistory([]);
      setMessages([]);
      setStats({
        survivalDays: 0,
        drawdownControl: 0,
        disciplineScore: 0,
        consecutiveLosses: 0,
        consecutiveWins: 0,
      });
      marketDataService.stopAutoRefresh();
    }
  }, [isAuthenticated, rehydrateUser]);


  useEffect(() => {
    const relevantHistory = tradeHistory.filter(t => (simulationMode ? t.mode === 'SIMULATION' : t.mode === 'LIVE'));
    if (relevantHistory.length > 0) {
      const disciplinedTrades = relevantHistory.filter(t => t.decision !== 'BLOCK').length;
      const score = Math.round((disciplinedTrades / relevantHistory.length) * 100);
      if (!isNaN(score)) setStats(prev => ({ ...prev, disciplineScore: score }));
    } else { setStats(prev => ({ ...prev, disciplineScore: 92 })); }
  }, [tradeHistory, simulationMode]);

  useEffect(() => {
    // FIX: Corrected the malformed ternary operator which was causing a syntax error.
    // The filter now correctly selects trades based on the simulationMode.
    const relevantHistory = tradeHistory.filter(t => (simulationMode ? t.mode === 'SIMULATION' : t.mode === 'LIVE'));
    const newMasteryBase = masteryEngine.calculateMastery(stats, relevantHistory, shadowScore);
    const quests = masteryEngine.generateQuests({ ...newMasteryBase, quests: [] }, activePattern);

    // XP Change & Level-Up Detection
    if (masteryData && newMasteryBase.xp > masteryData.xp) {
      const xpGained = newMasteryBase.xp - masteryData.xp;
      setLastXpGain(xpGained);
      setXpGainTrigger(prev => prev + 1);
    }

    // Level-Up Detection
    if (previousLevel && newMasteryBase.levelTitle !== previousLevel) {
      setNewLevelTitle(newMasteryBase.levelTitle);
      setShowLevelUp(true);
    }
    setPreviousLevel(newMasteryBase.levelTitle);

    setMasteryData({ ...newMasteryBase, quests });
  }, [stats, tradeHistory, simulationMode, activePattern, shadowScore]);

  // Sync Mastery to Backend
  useEffect(() => {
    if (masteryData && isAuthenticated) {
      const needsSync = (masteryData.xp !== userProfile.xp) || (masteryData.level !== userProfile.level);
      if (needsSync) {
        api.updateSettings({
          xp: masteryData.xp,
          level: masteryData.level
        }).then(() => {
          setUserProfile(prev => ({ ...prev, xp: masteryData.xp, level: masteryData.level }));
          console.log(`[Mastery] Sync successful: LVL ${masteryData.level}, XP ${masteryData.xp}`);
        }).catch(err => console.error('[Mastery] Sync failed:', err));
      }
    }
  }, [masteryData, isAuthenticated]);

  // Streak & Welcome Back Logic
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storedLastActive = localStorage.getItem('thekey-lastActiveDate');
    const storedStreak = parseInt(localStorage.getItem('thekey-streak') || '0', 10);

    if (storedLastActive) {
      const lastDate = new Date(storedLastActive);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Same day - maintain streak
        setStreak(storedStreak);
      } else if (diffDays === 1) {
        // Consecutive day - increment streak
        const newStreak = storedStreak + 1;
        setStreak(newStreak);
        localStorage.setItem('thekey-streak', String(newStreak));
      } else {
        // Missed days - reset streak and show welcome back
        setDaysAway(diffDays);
        setShowWelcomeBack(true);
        setStreak(1);
        localStorage.setItem('thekey-streak', '1');
      }
    } else {
      // First time user
      setStreak(1);
      localStorage.setItem('thekey-streak', '1');
    }

    setLastActiveDate(today);
    localStorage.setItem('thekey-lastActiveDate', today);
  }, []);

  useEffect(() => {
    if (selectedTradeForAnalysis && !tradeAnalysis && selectedTradeForAnalysis.status === 'CLOSED') {
      setIsAnalyzingTrade(true);
      api.getPostTradeAnalysis(selectedTradeForAnalysis)
        .then(setTradeAnalysis)
        .catch(console.error)
        .finally(() => setIsAnalyzingTrade(false));
    }
  }, [selectedTradeForAnalysis, tradeAnalysis, tradeHistory]);

  const handleRequestNotificationPermission = async () => {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const handleSaveProfile = async (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem('thekey-ai-user-profile', JSON.stringify(newProfile));

    // Sync to backend
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
  };

  const handleDiscoverArchetype = async (): Promise<TraderArchetypeAnalysis> => {
    const analysis = await api.getTraderArchetype({
      trade_history: tradeHistory,
      checkin_history: checkinHistory
    });
    setUserProfile(prev => {
      const newProfile = { ...prev, archetype: analysis.archetype };
      localStorage.setItem('thekey-ai-user-profile', JSON.stringify(newProfile));
      return newProfile;
    });
    return analysis;
  };

  const handleTradeSubmit = async (trade: { asset: string; positionSize: number; reasoning: string; direction: 'BUY' | 'SELL'; entryPrice: number; takeProfit?: number; stopLoss?: number; }) => {
    setIsLoading(true); setDecision(null);
    try {
      // 1. Check with Protection Guardian (Backend AI)
      const feedback = await api.checkTrade({
        trade,
        stats,
        tradeHistory,
        settings: userProfile.tradingRules,
        activePattern,
        processStats,
        marketAnalysis
      });

      setDecision(feedback);

      const newTrade: Trade = {
        ...trade,
        id: Date.now(),
        timestamp: new Date(),
        status: 'OPEN',
        decision: feedback.decision,
        decisionReason: feedback.reason,
        mode: simulationMode ? 'SIMULATION' : 'LIVE',
        statsAtEntry: {
          consecutiveLosses: stats.consecutiveLosses,
          consecutiveWins: stats.consecutiveWins
        }
      };

      if (feedback.decision === 'BLOCK') {
        newTrade.status = 'CLOSED';
      } else {
        // 2. Record Trade in Backend if allowed
        try {
          const savedTrade = await api.recordTrade({
            ...trade,
            user_id: userProfile.id,
            symbol: trade.asset,
            side: trade.direction,
            entry_price: trade.entryPrice,
            quantity: trade.positionSize / trade.entryPrice,
            entry_time: new Date().toISOString(),
            status: 'OPEN'
          });
          console.log('[App] Trade saved to DB successfully:', savedTrade);
          // Use the DB's ID for the trade
          if (savedTrade?.id) {
            newTrade.id = savedTrade.id;
          }
        } catch (saveError) {
          console.error('[App] Error saving trade to database:', saveError);
        }
      }

      setTradeHistory(prev => [newTrade, ...prev]);
      const messageText = (feedback.decision === 'BLOCK')
        ? `BLOCKING TRADE: ${feedback.reason}`
        : (feedback.reason);

      setMessages(prev => [...prev, { id: Date.now() + Math.random(), sender: 'ai', type: 'text', text: messageText || "Đã kiểm tra xong." }]);
    } catch (error) {
      console.error("Error getting trade feedback:", error);
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', type: 'text', text: "Đã có lỗi xảy ra. Vui lòng thử lại." }]);
    } finally { setIsLoading(false); }
  };


  const handleCloseTrade = (tradeToClose: Trade) => setTradeToClose(tradeToClose);

  const handleSavePnlAndEvaluate = (pnl: number) => {
    if (!tradeToClose) return;
    const closedTrade: Trade = { ...tradeToClose, status: 'CLOSED', pnl };
    setTradeHistory(prev => {
      const newHistory = prev.map(t => t.id === tradeToClose.id ? closedTrade : t);
      setStats(s => ({ ...s, consecutiveLosses: pnl < 0 ? s.consecutiveLosses + 1 : 0, consecutiveWins: pnl > 0 ? s.consecutiveWins + 1 : 0 }));
      return newHistory;
    });
    setTradeToClose(null); setTradeToEvaluate(closedTrade);
  };

  const handleSaveUserEvaluation = async (userEvaluation: UserProcessEvaluation, interactionData: DojoInteractionData) => {
    if (!tradeToEvaluate) return;
    const aiEvaluation = processEvaluationEngine.evaluateTradeProcess(tradeToEvaluate, userEvaluation);
    const newShadowScore = shadowScoreEngine.calculateShadowScore({ ...tradeToEvaluate, userProcessEvaluation: userEvaluation, processEvaluation: aiEvaluation }, userEvaluation, interactionData);
    setShadowScore(newShadowScore);
    const evaluatedTrade: Trade = { ...tradeToEvaluate, userProcessEvaluation: userEvaluation, processEvaluation: aiEvaluation };
    behavioralGraphEngine.addTradeToGraph(evaluatedTrade);

    // Persist evaluation to database
    try {
      await api.updateTradeEvaluation(String(tradeToEvaluate.id), {
        user_process_evaluation: userEvaluation,
        process_evaluation: aiEvaluation,
        process_score: aiEvaluation.totalProcessScore
      });
      console.log('[App] Process evaluation saved to DB successfully');
    } catch (error) {
      console.error('[App] Error saving process evaluation to DB:', error);
    }

    setTradeHistory(prev => {
      const newHistory = prev.map(t => t.id === tradeToEvaluate.id ? evaluatedTrade : t);
      const recentEvals = newHistory.filter(t => t.processEvaluation && (simulationMode ? t.mode === 'SIMULATION' : t.mode === 'LIVE')).slice(0, 10);

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
        const weakestArea = Object.keys(recentEvals.reduce((acc, curr) => { acc[curr.processEvaluation!.weakestArea] = (acc[curr.processEvaluation!.weakestArea] || 0) + 1; return acc; }, {} as Record<string, number>)).reduce((a, b) => (recentEvals.filter(e => e.processEvaluation!.weakestArea === a).length > recentEvals.filter(e => e.processEvaluation!.weakestArea === b).length) ? a : b) as ProcessStats['weakestArea'];

        setProcessStats({
          averageScore: Math.round(newAvg),
          trend: newAvg > (processStats?.averageScore ?? 0) + 2 ? 'IMPROVING' : newAvg < (processStats?.averageScore ?? 0) - 2 ? 'DECLINING' : 'STABLE',
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

    // Self-Learning: Record trade outcome for AI learning
    learningEngine.learnFromTrade(evaluatedTrade, aiEvaluation, newShadowScore);
    console.log('[Learning] Trade outcome recorded for AI learning');

    setTradeToEvaluate(null); setSelectedTradeForAnalysis(evaluatedTrade);
  };

  const handleNewMessage = async (newMessage: ChatMessage) => {
    if (newMessage.type !== 'text') return;
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    const aiResponseId = Date.now() + Math.random();
    setMessages(prev => [...prev, { id: aiResponseId, sender: 'ai', type: 'text', text: '...' }]);
    try {
      setIsChatting(true);
      const mode = crisisIntervention ? 'PROTECTOR' : 'COACH';
      const response = await api.getChatResponse(newMessage.text, updatedMessages, mode);
      const displayText = response.display_text || response.text || "Tôi không hiểu ý bạn lắm.";
      const aiMessage: ChatMessage = { id: aiResponseId, sender: 'ai', type: 'text', text: displayText };
      setMessages(prev => prev.map(m => m.id === aiResponseId ? aiMessage : m));
    } catch (error) {
      console.error("Error getting chat response:", error);
      setMessages(prev => prev.map(m => (m.id === aiResponseId && m.type === 'text') ? { ...m, text: "Xin lỗi, tôi đang gặp sự cố." } : m));
    } finally { setIsChatting(false); }
  };

  const handleSendPodMessage = (text: string) => {
    if (!pod) return;

    const updatedPodWithUserMessage = masteryEngine.sendPodMessage(pod, text);
    setPod(updatedPodWithUserMessage);

    setTimeout(() => {
      const updatedPodWithPeerReply = masteryEngine.simulatePeerReply(updatedPodWithUserMessage);
      setPod(updatedPodWithPeerReply);
    }, 2000 + Math.random() * 1500);
  };

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...updates }));
  };

  const handleSaveProfileSettings = async () => {
    try {
      setIsLoading(true);
      await api.updateSettings({
        protection_level: userProfile.protectionLevel || 'SURVIVAL',
        cooldown_minutes: Number(userProfile.cooldownMinutes) || 30,
        consecutive_loss_limit: Number(userProfile.consecutiveLossLimit) || 2,
        account_balance: Number(userProfile.accountBalance) || 1000,
        max_position_size_usd: Number(userProfile.tradingRules.maxPositionSizeUSD) || 500,
        risk_per_trade_pct: Number(userProfile.tradingRules.riskPerTradePct) || 2,
        daily_trade_limit: Number(userProfile.tradingRules.dailyTradeLimit) || 5
      });
      console.log("[Profile] Settings saved successfully");
      // Optional: show a small toast/notification
    } catch (e) {
      console.error("[Profile] Failed to save settings:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMindsetReport = () => {
    const report = behavioralGraphEngine.generatePersonalBehaviorReport();
    setBehavioralReport(report);
  };

  // Sync user profile when auth user changes
  useEffect(() => {
    if (user) {
      setUserProfile(prev => ({
        ...prev,
        id: user.id,
        email: user.email,
        isPro: user.is_pro
      }));
    }
  }, [user]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleGetWeeklyGoals = async () => {
    setIsLoadingGoals(true); setWeeklyGoals(null);
    try {
      const goals = await api.getWeeklyGoals(tradeHistory, stats, checkinHistory);
      setWeeklyGoals(goals);
    } catch (error) { console.error("Failed to get weekly goals:", error); }
    finally { setIsLoadingGoals(false); }
  };

  const handleGetWeeklyReport = async () => {
    setIsLoadingReport(true); setWeeklyReport(null);
    try {
      const report = await geminiService.getWeeklyReport(tradeHistory);
      setWeeklyReport(report);
    } catch (error) { console.error("Failed to get weekly report:", error); }
    finally { setIsLoadingReport(false); }
  };

  const handleCheckinSubmit = async (answers: { [key: string]: string }) => {
    setShowCheckin(false);
    localStorage.setItem('thekey_last_checkin_date', new Date().toDateString());
    if (!dailyQuestions) return;

    setActiveTab('EXECUTION'); // Force transition to execution view for check-in analysis
    const tempId = Date.now();
    setMessages(prev => [...prev, { id: tempId, sender: 'ai', type: 'text', text: 'Analyzing your check-in...' }]);

    try {
      const answerValues = dailyQuestions.map(q => answers[q.id]);
      const analysis = await api.submitCheckin(answerValues);

      const analysisMessage: ChatMessage = { id: tempId, sender: 'ai', type: 'analysis', analysis: analysis };
      setCheckinHistory(prev => [analysis, ...prev]);
      setMessages(prev => prev.map(msg => msg.id === tempId ? analysisMessage : msg));
    } catch (error) {
      console.error("Failed to get check-in analysis:", error);
      setMessages(prev => prev.map(msg => msg.id === tempId ? { id: tempId, sender: 'ai', type: 'text', text: 'Sorry, I had trouble analyzing your responses.' } : msg));
    }
  };


  const handleCrisisActionComplete = (actionId: string) => {
    if (!crisisIntervention) return;

    const action = crisisIntervention.recommendedActions.find(a => a.id === actionId);
    if (!action) return;

    // Assuming duration is like "5 minutes"
    const durationMinutes = parseInt(action.duration.split(' ')[0], 10);
    if (isNaN(durationMinutes)) return;

    setCrisisIntervention(prevData => {
      if (!prevData) return null;
      const newCooldown = Math.max(0, prevData.cooldownMinutes - durationMinutes);
      return { ...prevData, cooldownMinutes: newCooldown };
    });
  };
  const currentTradeHistory = tradeHistory.filter(t => (simulationMode ? t.mode === 'SIMULATION' : t.mode === 'LIVE'));

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30 flex">
        {/* Background Decorative Blur */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none transition-all duration-1000">
          <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] transition-colors duration-1000 ${crisisIntervention ? 'bg-accent-red/20 animate-pulse' : 'bg-accent-primary/10'} rounded-full blur-[120px]`}></div>
          <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] transition-colors duration-1000 ${crisisIntervention ? 'bg-accent-red/20 animate-pulse' : 'bg-accent-green/10'} rounded-full blur-[120px]`}></div>
        </div>

        {/* Global Modals & Notifications */}
        <div className="relative z-[100]">
          {inAppNotification && <InAppNotification notification={inAppNotification} onClose={() => setInAppNotification(null)} />}
          {showCheckin && dailyQuestions && <DailyCheckinModal questions={dailyQuestions} onSubmit={handleCheckinSubmit} />}
          {showProfile && <ProfileModal userProfile={userProfile} onSave={handleSaveProfile} onClose={() => setShowProfile(false)} onDiscoverArchetype={handleDiscoverArchetype} />}
          {tradeToClose && <UpdatePnlModal trade={tradeToClose} onClose={() => setTradeToClose(null)} onSave={handleSavePnlAndEvaluate} />}
          {tradeToEvaluate && <ProcessDojoModal trade={tradeToEvaluate} onClose={() => setTradeToEvaluate(null)} onSave={handleSaveUserEvaluation} />}
          {decision?.decision === 'BLOCK' && !crisisIntervention && <BlockedScreen reason={decision.reason} cooldown={decision.cooldown || 0} onClose={() => setDecision(null)} />}
          {crisisIntervention && <CrisisInterventionModal data={crisisIntervention} onClose={() => { setCrisisIntervention(null); setStats(prev => ({ ...prev, consecutiveLosses: 0 })); }} onActionComplete={handleCrisisActionComplete} />}
          <XpPopup xpGain={lastXpGain} trigger={xpGainTrigger} />
          <LevelUpCelebration show={showLevelUp} newLevel={newLevelTitle} onComplete={() => setShowLevelUp(false)} />
        </div>

        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col ml-64 min-h-screen relative overflow-hidden">
          <MainHeader
            onProfileClick={() => setShowProfile(true)}
            onLogout={handleLogout}
            userEmail={user?.email}
            isPro={user?.is_pro}
            simulationMode={simulationMode}
            setSimulationMode={setSimulationMode}
            crisisIntervention={crisisIntervention}
            notificationPermission={notificationPermission}
            handleRequestNotificationPermission={handleRequestNotificationPermission}
            streak={streak}
            lastActiveDate={lastActiveDate}
          />

          <main className="flex-1 p-6 relative overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                className="max-w-[1600px] mx-auto w-full"
              >
                {activeTab === 'SURVIVAL' && (
                  <DashboardView
                    stats={stats}
                    marketAnalysis={marketAnalysis}
                    onMarketAnalysis={setMarketAnalysis}
                    processStats={processStats}
                    tradeHistory={currentTradeHistory}
                    onAnalyzeTrade={setSelectedTradeForAnalysis}
                    isAnalyzingTrade={isAnalyzingTrade}
                    selectedTradeForAnalysis={selectedTradeForAnalysis}
                    onCloseTrade={handleCloseTrade}
                    onPatternDetected={setActivePattern}
                    checkinHistory={checkinHistory}
                    masteryData={masteryData}
                    pod={pod}
                    onSendPodMessage={handleSendPodMessage}
                    tradeAnalysis={tradeAnalysis}
                    onClearAnalysis={() => { setSelectedTradeForAnalysis(null); setTradeAnalysis(null); }}
                    onGenerateBehavioralReport={handleGenerateMindsetReport}
                    behavioralReport={behavioralReport}
                    shadowScore={shadowScore}
                    onGetWeeklyGoals={handleGetWeeklyGoals}
                    weeklyGoals={weeklyGoals}
                    isLoadingGoals={isLoadingGoals}
                    onGetWeeklyReport={handleGetWeeklyReport}
                    weeklyReport={weeklyReport}
                    isLoadingReport={isLoadingReport}
                  />
                )}

                {activeTab === 'EXECUTION' && (
                  <ExecutionView
                    onSubmit={handleTradeSubmit}
                    isLoading={isLoading}
                    decision={decision}
                    onProceed={() => setDecision(null)}
                    tradeHistory={currentTradeHistory}
                    onAnalyzeTrade={setSelectedTradeForAnalysis}
                    isAnalyzingTrade={isAnalyzingTrade}
                    selectedTradeForAnalysis={selectedTradeForAnalysis}
                    onCloseTrade={handleCloseTrade}
                    tradeAnalysis={tradeAnalysis}
                    onClearAnalysis={() => { setSelectedTradeForAnalysis(null); setTradeAnalysis(null); }}
                    messages={messages}
                    onSendMessage={handleNewMessage}
                    isLoadingChat={isChatting}
                    isCrisisMode={!!crisisIntervention}
                  />
                )}

                {activeTab === 'MINDSET' && (
                  <MindsetView
                    behavioralReport={behavioralReport}
                    shadowScore={shadowScore}
                    processStats={processStats}
                    onGenerateReport={handleGenerateMindsetReport}
                    tradeCount={tradeHistory.length}
                    profile={userProfile}
                    onUpdateProfile={handleUpdateProfile}
                    onSaveProfile={handleSaveProfileSettings}
                  />
                )}

                {activeTab === 'PROGRESS' && (
                  <ProgressView
                    masteryData={masteryData}
                    pod={pod}
                    onSendPodMessage={handleSendPodMessage}
                    shadowScore={shadowScore}
                    weeklyGoals={weeklyGoals}
                    isLoadingGoals={isLoadingGoals}
                    onGetWeeklyGoals={handleGetWeeklyGoals}
                    weeklyReport={weeklyReport}
                    isLoadingReport={isLoadingReport}
                    onGetWeeklyReport={handleGetWeeklyReport}
                    tradeHistory={currentTradeHistory}
                    stats={stats}
                  />
                )}

                {activeTab === 'SETTINGS' && (
                  <div className="bento-card p-12 text-center">
                    <h2 className="text-2xl font-black uppercase tracking-[0.3em] mb-4">Under Construction</h2>
                    <p className="text-text-secondary">Trading Rules and System Settings are coming soon.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          <footer className="p-4 text-center border-t border-white/5 bg-black/20 backdrop-blur-md">
            <div className="flex items-center justify-center gap-6 opacity-30 hover:opacity-100 transition-opacity">
              <PrinciplesWidget />
            </div>
          </footer>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default App;