/**
 * THEKEY AI - Model Router Service
 * Routes requests to appropriate model tier based on task complexity
 * Reduces cost by 40-70% by using Flash for non-critical tasks
 */

export type ModelTier = 'PRO' | 'FLASH' | 'LOCAL';

export interface ModelConfig {
    model: string;
    costPer1kTokens: number;
    maxTokens: number;
    temperature: number;
}

// Model configurations - Using Gemini 2.5 Flash (Free Tier - Most Powerful)
// Stable version: gemini-2.5-flash (released June 17, 2025)
export const MODEL_CONFIGS: Record<ModelTier, ModelConfig> = {
    PRO: {
        model: 'gemini-2.5-flash', // Free tier: Most powerful available (stable)
        costPer1kTokens: 0, // Free tier
        maxTokens: 8192,
        temperature: 0.7,
    },
    FLASH: {
        model: 'gemini-2.5-flash', // Same model for consistency
        costPer1kTokens: 0, // Free tier
        maxTokens: 8192,
        temperature: 0.7,
    },
    LOCAL: {
        model: 'local-rules-engine',
        costPer1kTokens: 0,
        maxTokens: 0,
        temperature: 0,
    }
};

// Task-to-tier mapping
export type TaskType =
    | 'TRADE_FEEDBACK'
    | 'CRISIS_INTERVENTION'
    | 'POST_TRADE_ANALYSIS'
    | 'CHECKIN_ANALYSIS'
    | 'CHAT_RESPONSE'
    | 'PATTERN_DETECTION'
    | 'WEEKLY_REPORT'
    | 'WEEKLY_GOALS'
    | 'MARKET_ANALYSIS'
    | 'ARCHETYPE';

interface TaskConfig {
    tier: ModelTier;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    rationale: string;
}

const TASK_ROUTING: Record<TaskType, TaskConfig> = {
    // CRITICAL tasks - Must use PRO for accuracy
    TRADE_FEEDBACK: {
        tier: 'PRO',
        priority: 'CRITICAL',
        rationale: 'Core protection logic - accuracy is essential'
    },
    CRISIS_INTERVENTION: {
        tier: 'PRO',
        priority: 'CRITICAL',
        rationale: 'Mental health sensitive - needs careful responses'
    },
    POST_TRADE_ANALYSIS: {
        tier: 'PRO',
        priority: 'HIGH',
        rationale: 'Deep analysis requires reasoning capability'
    },

    // HIGH priority but can use FLASH
    WEEKLY_REPORT: {
        tier: 'FLASH',
        priority: 'HIGH',
        rationale: 'Structured output, can handle with Flash'
    },
    WEEKLY_GOALS: {
        tier: 'FLASH',
        priority: 'HIGH',
        rationale: 'Goal generation is straightforward'
    },
    MARKET_ANALYSIS: {
        tier: 'FLASH',
        priority: 'HIGH',
        rationale: 'Narrative generation, Flash is sufficient'
    },

    // MEDIUM priority - Use FLASH
    CHECKIN_ANALYSIS: {
        tier: 'FLASH',
        priority: 'MEDIUM',
        rationale: 'Simple sentiment analysis'
    },
    CHAT_RESPONSE: {
        tier: 'FLASH',
        priority: 'MEDIUM',
        rationale: 'General chat can use faster model'
    },
    ARCHETYPE: {
        tier: 'FLASH',
        priority: 'MEDIUM',
        rationale: 'Pattern matching is straightforward'
    },

    // LOW priority - Can use LOCAL
    PATTERN_DETECTION: {
        tier: 'LOCAL',
        priority: 'LOW',
        rationale: 'Can be done with local rules engine'
    }
};

class ModelRouter {
    private stats = {
        proRequests: 0,
        flashRequests: 0,
        localRequests: 0,
        estimatedCost: 0
    };

    /**
     * Get the appropriate model configuration for a task
     */
    getModelForTask(taskType: TaskType): ModelConfig {
        const taskConfig = TASK_ROUTING[taskType];
        const modelConfig = MODEL_CONFIGS[taskConfig.tier];

        // Track statistics
        if (taskConfig.tier === 'PRO') this.stats.proRequests++;
        else if (taskConfig.tier === 'FLASH') this.stats.flashRequests++;
        else this.stats.localRequests++;

        console.log(`[ModelRouter] ${taskType} → ${taskConfig.tier} (${taskConfig.rationale})`);

        return modelConfig;
    }

    /**
     * Get the model name for a task
     */
    getModelName(taskType: TaskType): string {
        return this.getModelForTask(taskType).model;
    }

    /**
     * Check if task should use local processing
     */
    shouldUseLocal(taskType: TaskType): boolean {
        return TASK_ROUTING[taskType].tier === 'LOCAL';
    }

    /**
     * Estimate cost for a request
     */
    estimateCost(taskType: TaskType, tokenCount: number): number {
        const config = this.getModelForTask(taskType);
        const cost = (tokenCount / 1000) * config.costPer1kTokens;
        this.stats.estimatedCost += cost;
        return cost;
    }

    /**
     * Get router statistics
     */
    getStats(): typeof this.stats & { savingsVsAllPro: string } {
        const allProCost = (this.stats.proRequests + this.stats.flashRequests + this.stats.localRequests)
            * MODEL_CONFIGS.PRO.costPer1kTokens * 2; // Assume 2k tokens avg
        const currentCost = this.stats.estimatedCost;
        const savings = allProCost > 0 ? ((1 - currentCost / allProCost) * 100).toFixed(1) : '0';

        return {
            ...this.stats,
            savingsVsAllPro: `${savings}%`
        };
    }

    /**
     * Get task priority
     */
    getTaskPriority(taskType: TaskType): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
        return TASK_ROUTING[taskType].priority;
    }

    /**
     * Check if we should upgrade to PRO (e.g., during crisis)
     */
    shouldUpgradeToPro(taskType: TaskType, context: { isCrisisMode?: boolean; consecutiveLosses?: number }): boolean {
        // Always upgrade during crisis mode
        if (context.isCrisisMode) return true;

        // Upgrade if user is struggling
        if (context.consecutiveLosses && context.consecutiveLosses >= 2) return true;

        return false;
    }
}

// Singleton instance
export const modelRouter = new ModelRouter();
