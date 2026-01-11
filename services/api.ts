/**
 * @module api
 * @description Centralized API service for THEKEY AI application.
 * Handles all HTTP communication with the backend including authentication,
 * trade operations, AI interactions, and user settings.
 * 
 * @example
 * ```ts
 * import { api } from './services/api';
 * 
 * // Check trade with AI protection
 * const result = await api.checkTrade(tradeData);
 * 
 * // Get user settings
 * const user = await api.getCurrentUser();
 * ```
 */

// Base URL configuration - defaults to localhost for development
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000';

/**
 * Trade intent data structure for protection checks
 * @interface TradeIntent
 */
export interface TradeIntent {
    /** Trading symbol (e.g., 'BTCUSD') */
    symbol: string;
    /** Trade direction */
    side: 'BUY' | 'SELL';
    /** Position size in base currency */
    size: number;
    /** Entry price */
    entry_price: number;
    /** Current account balance */
    account_balance: number;
}

/**
 * Centralized request helper with automatic token refresh.
 * 
 * Features:
 * - Automatic auth header injection
 * - JSON parsing
 * - Token refresh on 401 (retry once)
 * - Error handling with detailed messages
 * 
 * @template T - Expected response type
 * @param endpoint - API endpoint path (e.g., '/api/trades/')
 * @param options - Fetch request options
 * @param _isRetry - Internal flag to prevent infinite retry loops
 * @returns Promise resolving to the response data
 * @throws Error with detail message on failure
 * 
 * @example
 * ```ts
 * const data = await request<UserProfile>('/auth/me');
 * ```
 */
const request = async <T = any>(endpoint: string, options: RequestInit = {}, _isRetry = false): Promise<T> => {
    const token = localStorage.getItem('thekey_access_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Handle 401 with token refresh (only retry once)
    if (response.status === 401 && !_isRetry) {
        console.log('[API] Got 401, attempting token refresh...');
        const refreshToken = localStorage.getItem('thekey_refresh_token');
        if (refreshToken) {
            try {
                const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`, {
                    method: 'POST'
                });
                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    localStorage.setItem('thekey_access_token', data.access_token);
                    console.log('[API] Token refreshed successfully, retrying request...');
                    return request<T>(endpoint, options, true); // Retry with new token
                }
            } catch (e) {
                console.error('[API] Token refresh failed:', e);
            }
        }
        console.warn('[API] Token refresh failed, user needs to re-authenticate');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
        throw new Error(error.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
};

/**
 * THEKEY AI API client with all endpoint methods.
 * All methods return Promises and handle authentication automatically.
 */
export const api = {
    // ==========================================
    // Protection & AI Guardian
    // ==========================================

    /** Get current market context and danger level */
    getMarketContext: () => request('/api/protection/market-context'),

    /** 
     * Check trade with AI Protection Guardian
     * @returns Trade decision (ALLOW/WARN/BLOCK) with reasoning
     */
    checkTrade: (data: any) => request('/api/protection/check-trade', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    getTraderArchetype: (data: any) => request('/api/learning/archetype', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    // Reflection
    getCheckinQuestions: () => request('/api/reflection/checkin/questions'),
    submitCheckin: (answers: any[]) => request('/api/reflection/checkin/submit', {
        method: 'POST',
        body: JSON.stringify({ answers }),
    }),

    // Trades
    recordTrade: (trade: any) => request('/api/trades/', {
        method: 'POST',
        body: JSON.stringify(trade),
    }),
    getTradeHistory: () => request('/api/trades/'),  // No userId needed - backend uses auth token

    // User Profile
    updateUsername: (username: string) => request('/api/users/username', {
        method: 'PUT',
        body: JSON.stringify({ username }),
    }),

    updateTradeEvaluation: (tradeId: string, data: {
        user_process_evaluation?: any;
        process_evaluation?: any;
        process_score?: number;
    }) => request(`/api/trades/${tradeId}/evaluation`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    // Progress
    getProgressSummary: () => request('/api/progress/summary'),

    // Coach / AI Chat
    getInitialMessage: async () => {
        const data = await request('/api/reflection/initial-message');
        return data.text;
    },
    getChatResponse: (message: string, history: any[], mode: 'COACH' | 'PROTECTOR' = 'COACH') =>
        request('/api/reflection/chat', {
            method: 'POST',
            body: JSON.stringify({ message, history, mode }),
        }),

    getPostTradeAnalysis: (trade: any) => request('/api/protection/analyze-trade', {
        method: 'POST',
        body: JSON.stringify(trade),
    }),

    getEmotionalTiltIntervention: (stats: any, history: any[]) => request('/api/protection/emotional-tilt', {
        method: 'POST',
        body: JSON.stringify({ stats, history }),
    }),

    getWeeklyGoals: (history: any[], stats: any, checkinHistory: any[]) => request('/api/progress/weekly-goals', {
        method: 'POST',
        body: JSON.stringify({ history, stats, checkinHistory }),
    }),

    getWeeklyReport: (history: any[]) => request('/api/progress/weekly-report', {
        method: 'POST',
        body: JSON.stringify({ history }),
    }),

    // User Settings
    getCurrentUser: () => request('/auth/me'),
    updateSettings: (settings: any) => request('/auth/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
    }),

    // Learning Engine Sync
    recordTradeCorrelation: (data: any) => request('/api/learning/correlations/record', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    recordShadowPattern: (data: any) => request('/api/learning/shadow-patterns/record', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    recordCrisisRecovery: (data: any) => request('/api/learning/crisis-recovery/record', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getLearningInsights: () => request('/api/learning/insights'),
    getLearningStats: () => request('/api/learning/stats'),

    // AI Accuracy Dashboard
    getAIAccuracy: () => request('/api/progress/ai-accuracy')
};
