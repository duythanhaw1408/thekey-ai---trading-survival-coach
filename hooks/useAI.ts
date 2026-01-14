// hooks/useAI.ts
/**
 * THEKEY AI Hook v2.0
 * 
 * Centralized AI state management with world-class patterns:
 * - Automatic retry with exponential backoff
 * - Request deduplication
 * - Optimistic updates
 * - Error boundary integration
 * - Loading states per operation
 * 
 * @author THEKEY AI Team
 */

import { useState, useCallback, useRef, useMemo } from 'react';

// ============================================
// Types
// ============================================

export type AIRequestType =
    | 'trade_eval'
    | 'checkin_questions'
    | 'checkin_analysis'
    | 'trade_analysis'
    | 'chat'
    | 'market_analysis'
    | 'weekly_goals'
    | 'weekly_report'
    | 'archetype'
    | 'tilt_detection';

export interface AIRequestConfig {
    maxRetries?: number;
    retryDelayMs?: number;
    timeout?: number;
    deduplicate?: boolean;
    cacheKey?: string;
    cacheTTL?: number; // seconds
}

export interface AIState<T = unknown> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    lastUpdated: Date | null;
    retryCount: number;
}

interface PendingRequest {
    promise: Promise<unknown>;
    timestamp: number;
}

// ============================================
// Constants
// ============================================

const DEFAULT_CONFIG: Required<AIRequestConfig> = {
    maxRetries: 3,
    retryDelayMs: 1000,
    timeout: 30000,
    deduplicate: true,
    cacheKey: '',
    cacheTTL: 300, // 5 minutes
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// ============================================
// Cache Management
// ============================================

class AICache {
    private cache: Map<string, { data: unknown; expiry: number }> = new Map();

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    set(key: string, data: unknown, ttlSeconds: number): void {
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttlSeconds * 1000,
        });
    }

    invalidate(pattern?: string): void {
        if (!pattern) {
            this.cache.clear();
            return;
        }

        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    getStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}

// Global cache instance
const aiCache = new AICache();

// ============================================
// Request Deduplication
// ============================================

const pendingRequests: Map<string, PendingRequest> = new Map();

function generateRequestKey(type: AIRequestType, params: unknown): string {
    return `${type}:${JSON.stringify(params)}`;
}

// ============================================
// Retry Logic with Exponential Backoff
// ============================================

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry<T>(
    fn: () => Promise<T>,
    config: Required<AIRequestConfig>,
    onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt < config.maxRetries) {
                const delay = config.retryDelayMs * Math.pow(2, attempt) + Math.random() * 1000;
                console.log(`[AI] Retry ${attempt + 1}/${config.maxRetries} after ${Math.round(delay)}ms`);
                onRetry?.(attempt + 1, lastError);
                await sleep(delay);
            }
        }
    }

    throw lastError;
}

// ============================================
// Main API Call Function
// ============================================

async function makeAIRequest<T>(
    type: AIRequestType,
    params: Record<string, unknown>,
    config: AIRequestConfig = {},
    token?: string
): Promise<T> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const requestKey = generateRequestKey(type, params);

    // Check cache first
    if (finalConfig.cacheKey) {
        const cached = aiCache.get<T>(finalConfig.cacheKey);
        if (cached) {
            console.log(`[AI] Cache hit for ${type}`);
            return cached;
        }
    }

    // Deduplicate: return existing pending request
    if (finalConfig.deduplicate && pendingRequests.has(requestKey)) {
        console.log(`[AI] Deduplicating request: ${type}`);
        return pendingRequests.get(requestKey)!.promise as Promise<T>;
    }

    // Create the request
    const requestFn = async (): Promise<T> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

        try {
            // Map request type to endpoint
            const endpoint = getEndpoint(type);

            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(params),
                signal: controller.signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}`);
            }

            const data = await response.json();

            // Cache successful response
            if (finalConfig.cacheKey) {
                aiCache.set(finalConfig.cacheKey, data, finalConfig.cacheTTL);
            }

            return data;
        } finally {
            clearTimeout(timeoutId);
        }
    };

    // Execute with retry
    const promise = withRetry(requestFn, finalConfig);

    if (finalConfig.deduplicate) {
        pendingRequests.set(requestKey, { promise, timestamp: Date.now() });
        promise.finally(() => pendingRequests.delete(requestKey));
    }

    return promise;
}

function getEndpoint(type: AIRequestType): string {
    const endpoints: Record<AIRequestType, string> = {
        trade_eval: '/api/v1/protection/evaluate',
        checkin_questions: '/api/v1/reflection/questions',
        checkin_analysis: '/api/v1/reflection/analyze',
        trade_analysis: '/api/v1/trades/analyze',
        chat: '/api/v1/chat',
        market_analysis: '/api/v1/protection/market',
        weekly_goals: '/api/v1/progress/goals',
        weekly_report: '/api/v1/progress/report',
        archetype: '/api/v1/users/archetype',
        tilt_detection: '/api/v1/protection/tilt',
    };

    return endpoints[type] || `/api/v1/${type}`;
}

// ============================================
// Main Hook
// ============================================

export function useAI<T = unknown>(defaultConfig?: AIRequestConfig) {
    const [state, setState] = useState<AIState<T>>({
        data: null,
        loading: false,
        error: null,
        lastUpdated: null,
        retryCount: 0,
    });

    const abortControllerRef = useRef<AbortController | null>(null);
    const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...defaultConfig }), [defaultConfig]);

    const execute = useCallback(async (
        type: AIRequestType,
        params: Record<string, unknown>,
        overrideConfig?: AIRequestConfig,
        token?: string
    ): Promise<T | null> => {
        // Cancel previous request
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const finalConfig = { ...config, ...overrideConfig };
            const data = await makeAIRequest<T>(type, params, finalConfig, token);

            setState({
                data,
                loading: false,
                error: null,
                lastUpdated: new Date(),
                retryCount: 0,
            });

            return data;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            setState(prev => ({
                ...prev,
                loading: false,
                error: err,
                retryCount: prev.retryCount + 1,
            }));
            return null;
        }
    }, [config]);

    const reset = useCallback(() => {
        abortControllerRef.current?.abort();
        setState({
            data: null,
            loading: false,
            error: null,
            lastUpdated: null,
            retryCount: 0,
        });
    }, []);

    const invalidateCache = useCallback((pattern?: string) => {
        aiCache.invalidate(pattern);
    }, []);

    return {
        ...state,
        execute,
        reset,
        invalidateCache,
        isStale: state.lastUpdated
            ? Date.now() - state.lastUpdated.getTime() > config.cacheTTL * 1000
            : true,
    };
}

// ============================================
// Specialized Hooks
// ============================================

/**
 * Hook for trade evaluations with optimistic UI
 */
export function useTradeEvaluation() {
    const ai = useAI<{
        decision: 'ALLOW' | 'WARN' | 'BLOCK';
        reason: string;
        behavioral_insight?: string;
        alternatives?: { type: string; description: string; rationale: string }[];
        coaching_question?: string;
        immediate_action?: string;
        tone?: 'SUPPORTIVE' | 'CAUTIOUS' | 'EMPOWERING';
    }>();

    const evaluate = useCallback(async (
        trade: {
            asset: string;
            direction: 'BUY' | 'SELL';
            positionSize: number;
            entryPrice?: number;
            stopLoss?: number;
            takeProfit?: number;
            reasoning?: string;
        },
        stats: {
            consecutiveLosses: number;
            consecutiveWins: number;
        },
        token?: string
    ) => {
        return ai.execute('trade_eval', { trade, stats }, {
            cacheKey: `trade_eval_${stats.consecutiveLosses}_${trade.positionSize}`,
            cacheTTL: 60, // 1 minute cache for trade evals
        }, token);
    }, [ai]);

    return {
        ...ai,
        evaluate,
    };
}

/**
 * Hook for chat with streaming support (future)
 */
export function useAIChat() {
    const [messages, setMessages] = useState<Array<{
        id: string;
        sender: 'user' | 'ai';
        text: string;
        timestamp: Date;
    }>>([]);

    const ai = useAI<{
        display_text: string;
        internal_reasoning: string;
        detected_emotion?: string;
        action_trigger?: string;
    }>();

    const sendMessage = useCallback(async (
        text: string,
        context: Record<string, unknown>,
        token?: string
    ) => {
        const userMessage = {
            id: `user_${Date.now()}`,
            sender: 'user' as const,
            text,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);

        const response = await ai.execute('chat', {
            message: text,
            history: messages.map(m => ({ sender: m.sender, text: m.text })),
            context,
        }, { deduplicate: false }, token);

        if (response) {
            setMessages(prev => [
                ...prev,
                {
                    id: `ai_${Date.now()}`,
                    sender: 'ai',
                    text: response.display_text,
                    timestamp: new Date(),
                },
            ]);
        }

        return response;
    }, [ai, messages]);

    const clearHistory = useCallback(() => {
        setMessages([]);
    }, []);

    return {
        messages,
        sendMessage,
        clearHistory,
        loading: ai.loading,
        error: ai.error,
    };
}

/**
 * Hook for check-in flow
 */
export function useCheckin() {
    const questionsAI = useAI<{
        questions: Array<{
            id: string;
            text: string;
            type: 'scale' | 'multiple-choice' | 'text';
            options?: { value: number; text: string }[];
        }>;
        daily_theme?: string;
    }>();

    const analysisAI = useAI<{
        emotional_state: string;
        readiness_score: number;
        insights: Array<{ title: string; description: string }>;
        daily_prescription: {
            mindset_shift: string;
            behavioral_rule: string;
            success_metric: string;
        };
        encouragement: string;
        trading_recommendation: 'PROCEED' | 'PROCEED_WITH_CAUTION' | 'REDUCE_SIZE' | 'CONSIDER_SKIPPING';
    }>();

    const getQuestions = useCallback(async (context: Record<string, unknown>, token?: string) => {
        return questionsAI.execute('checkin_questions', { context }, {
            cacheKey: 'checkin_questions',
            cacheTTL: 3600, // 1 hour cache
        }, token);
    }, [questionsAI]);

    const submitAnswers = useCallback(async (
        answers: string[],
        questions: string[],
        context: Record<string, unknown>,
        token?: string
    ) => {
        return analysisAI.execute('checkin_analysis', {
            answers,
            questions,
            context,
        }, { deduplicate: false }, token);
    }, [analysisAI]);

    return {
        questions: questionsAI.data?.questions || [],
        dailyTheme: questionsAI.data?.daily_theme,
        analysis: analysisAI.data,
        getQuestions,
        submitAnswers,
        loadingQuestions: questionsAI.loading,
        loadingAnalysis: analysisAI.loading,
        error: questionsAI.error || analysisAI.error,
    };
}

// ============================================
// Utility Exports
// ============================================

export { aiCache };

export function prefetchAI(type: AIRequestType, params: Record<string, unknown>, config?: AIRequestConfig): void {
    // Fire and forget prefetch
    makeAIRequest(type, params, { ...config, deduplicate: true }).catch(() => {
        // Silently fail prefetch
    });
}
