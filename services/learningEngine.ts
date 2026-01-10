/**
 * THEKEY AI - Self-Learning Engine
 * Learns from user behavior patterns to improve predictions and recommendations
 */

import type { Trade, ShadowScore, TraderStats, ProcessEvaluation } from '../types';
import { api } from './api';

// Learning data structures
interface TradeOutcomeCorrelation {
    processScore: number;
    profitability: 'WIN' | 'LOSS' | 'BREAKEVEN';
    emotionAtEntry: string;
    patternType: string;
    count: number;
}

interface ShadowScorePattern {
    trustLevel: 'HIGH_TRUST' | 'MEDIUM_TRUST' | 'LOW_TRUST';
    averageHonesty: number;
    outcomeCorrelation: number; // -1 to 1
    sampleSize: number;
}

interface CrisisRecoveryData {
    averageRecoveryTime: number; // in hours
    successfulRecoveries: number;
    failedRecoveries: number;
    bestRecoveryAction: string;
}

interface CrowdMetrics {
    averageShadowScore: number;
    percentInCrisis: number;
    topActivePatterns: string[];
    communityDisciplineScore: number;
    timestamp: number;
}

interface LearningInsight {
    type: 'CORRELATION' | 'PATTERN' | 'ANOMALY' | 'TREND';
    confidence: number;
    description: string;
    actionable: boolean;
    recommendation?: string;
}

class LearningEngine {
    private correlations: TradeOutcomeCorrelation[] = [];
    private shadowPatterns: Map<string, ShadowScorePattern> = new Map();
    private crisisData: CrisisRecoveryData = {
        averageRecoveryTime: 0,
        successfulRecoveries: 0,
        failedRecoveries: 0,
        bestRecoveryAction: 'breathing'
    };
    private crowdMetrics: CrowdMetrics | null = null;

    /**
     * Learn from a completed trade
     */
    learnFromTrade(trade: Trade, processEvaluation: ProcessEvaluation | undefined, shadowScore: ShadowScore | null): void {
        if (!trade.pnl || !processEvaluation) return;

        const profitability = trade.pnl > 0 ? 'WIN' : trade.pnl < 0 ? 'LOSS' : 'BREAKEVEN';

        // Find or create correlation entry
        const existingCorrelation = this.correlations.find(c =>
            Math.abs(c.processScore - processEvaluation.totalProcessScore) < 10 &&
            c.profitability === profitability
        );

        if (existingCorrelation) {
            existingCorrelation.count++;
        } else {
            this.correlations.push({
                processScore: processEvaluation.totalProcessScore,
                profitability,
                emotionAtEntry: trade.userProcessEvaluation?.dominantEmotion || 'NEUTRAL',
                patternType: trade.processEvaluation?.weakestArea || 'UNKNOWN',
                count: 1
            });
        }

        // Learn shadow score patterns
        if (shadowScore) {
            const key = shadowScore.trustLevel;
            const existing = this.shadowPatterns.get(key);

            if (existing) {
                const outcome = profitability === 'WIN' ? 1 : profitability === 'LOSS' ? -1 : 0;
                existing.outcomeCorrelation = (existing.outcomeCorrelation * existing.sampleSize + outcome) / (existing.sampleSize + 1);
                existing.averageHonesty = (existing.averageHonesty * existing.sampleSize + shadowScore.rawScore) / (existing.sampleSize + 1);
                existing.sampleSize++;
            } else {
                this.shadowPatterns.set(key, {
                    trustLevel: shadowScore.trustLevel,
                    averageHonesty: shadowScore.rawScore,
                    outcomeCorrelation: profitability === 'WIN' ? 1 : profitability === 'LOSS' ? -1 : 0,
                    sampleSize: 1
                });
            }
        }

        this.saveLearningData();

        // Sync to backend
        api.recordTradeCorrelation({
            process_score_bucket: processEvaluation.totalProcessScore,
            profitability,
            emotion_at_entry: trade.userProcessEvaluation?.dominantEmotion || 'NEUTRAL',
            pattern_type: trade.processEvaluation?.weakestArea,
            pnl: trade.pnl
        }).catch(err => console.warn('[LearningEngine] Correlation sync failed:', err));

        if (shadowScore) {
            api.recordShadowPattern({
                trust_level: shadowScore.trustLevel,
                honesty_score: shadowScore.rawScore,
                outcome: profitability
            }).catch(err => console.warn('[LearningEngine] Shadow sync failed:', err));
        }
    }

    /**
     * Learn from crisis recovery
     */
    learnFromCrisisRecovery(recoveryTimeHours: number, wasSuccessful: boolean, actionTaken: string): void {
        if (wasSuccessful) {
            this.crisisData.successfulRecoveries++;
        } else {
            this.crisisData.failedRecoveries++;
        }

        // Update average recovery time
        const totalRecoveries = this.crisisData.successfulRecoveries + this.crisisData.failedRecoveries;
        this.crisisData.averageRecoveryTime =
            (this.crisisData.averageRecoveryTime * (totalRecoveries - 1) + recoveryTimeHours) / totalRecoveries;

        // Track best recovery action
        if (wasSuccessful) {
            // Simple frequency-based tracking (could upgrade to more sophisticated analysis)
            this.crisisData.bestRecoveryAction = actionTaken;
        }

        this.saveLearningData();

        // Sync to backend
        api.recordCrisisRecovery({
            action_taken: actionTaken,
            recovery_time_hours: recoveryTimeHours,
            was_successful: wasSuccessful
        }).catch(err => console.warn('[LearningEngine] Crisis recovery sync failed:', err));
    }

    /**
     * Generate insights from learned data
     */
    generateInsights(): LearningInsight[] {
        const insights: LearningInsight[] = [];

        // Insight 1: Process Score vs Profitability correlation
        const winCorrelations = this.correlations.filter(c => c.profitability === 'WIN');
        const lossCorrelations = this.correlations.filter(c => c.profitability === 'LOSS');

        if (winCorrelations.length > 5 && lossCorrelations.length > 5) {
            const avgWinScore = winCorrelations.reduce((sum, c) => sum + c.processScore * c.count, 0) /
                winCorrelations.reduce((sum, c) => sum + c.count, 0);
            const avgLossScore = lossCorrelations.reduce((sum, c) => sum + c.processScore * c.count, 0) /
                lossCorrelations.reduce((sum, c) => sum + c.count, 0);

            if (avgWinScore - avgLossScore > 15) {
                insights.push({
                    type: 'CORRELATION',
                    confidence: 0.85,
                    description: `Trades với Process Score cao hơn (>${Math.round(avgWinScore)}) có tỷ lệ thắng cao hơn đáng kể`,
                    actionable: true,
                    recommendation: `Chỉ vào lệnh khi Process Score >= ${Math.round(avgWinScore - 10)}`
                });
            }
        }

        // Insight 2: Shadow Score pattern
        const highTrustPattern = this.shadowPatterns.get('HIGH_TRUST');
        const lowTrustPattern = this.shadowPatterns.get('LOW_TRUST');

        if (highTrustPattern && lowTrustPattern &&
            highTrustPattern.outcomeCorrelation > lowTrustPattern.outcomeCorrelation + 0.3) {
            insights.push({
                type: 'PATTERN',
                confidence: 0.75,
                description: 'Traders trung thực trong tự đánh giá có tỷ lệ thắng cao hơn 30%',
                actionable: true,
                recommendation: 'Khuyến khích tự đánh giá thành thật trong Process Dojo'
            });
        }

        // Insight 3: Crisis recovery pattern
        const recoverySuccessRate = this.crisisData.successfulRecoveries /
            (this.crisisData.successfulRecoveries + this.crisisData.failedRecoveries);

        if (recoverySuccessRate > 0.7 && this.crisisData.successfulRecoveries > 10) {
            insights.push({
                type: 'TREND',
                confidence: 0.9,
                description: `${(recoverySuccessRate * 100).toFixed(0)}% users phục hồi thành công từ Crisis Mode`,
                actionable: true,
                recommendation: `Action hiệu quả nhất: ${this.crisisData.bestRecoveryAction}`
            });
        }

        return insights;
    }

    /**
     * Update crowd metrics
     */
    updateCrowdMetrics(metrics: Partial<CrowdMetrics>): void {
        this.crowdMetrics = {
            averageShadowScore: metrics.averageShadowScore || 0,
            percentInCrisis: metrics.percentInCrisis || 0,
            topActivePatterns: metrics.topActivePatterns || [],
            communityDisciplineScore: metrics.communityDisciplineScore || 0,
            timestamp: Date.now()
        };
    }

    /**
     * Get crowd wisdom insight
     */
    getCrowdWisdom(): string | null {
        if (!this.crowdMetrics) return null;

        if (this.crowdMetrics.percentInCrisis > 30) {
            return `⚠️ ${Math.round(this.crowdMetrics.percentInCrisis)}% traders đang trong Crisis Mode - Thị trường có thể đang volatile`;
        }

        if (this.crowdMetrics.topActivePatterns.includes('FOMO')) {
            return '🔥 FOMO đang là pattern phổ biến nhất - Cẩn thận với quyết định vội vàng';
        }

        if (this.crowdMetrics.communityDisciplineScore > 80) {
            return '✅ Cộng đồng đang giao dịch kỷ luật - Trend tốt';
        }

        return null;
    }

    /**
     * Get prediction based on learned data
     */
    predictOutcome(processScore: number, emotionalState: string): { prediction: 'LIKELY_WIN' | 'LIKELY_LOSS' | 'NEUTRAL'; confidence: number } {
        const relevantCorrelations = this.correlations.filter(c =>
            Math.abs(c.processScore - processScore) < 15
        );

        if (relevantCorrelations.length < 5) {
            return { prediction: 'NEUTRAL', confidence: 0 };
        }

        const weightedWins = relevantCorrelations
            .filter(c => c.profitability === 'WIN')
            .reduce((sum, c) => sum + c.count, 0);
        const weightedLosses = relevantCorrelations
            .filter(c => c.profitability === 'LOSS')
            .reduce((sum, c) => sum + c.count, 0);
        const total = weightedWins + weightedLosses;

        if (total < 10) {
            return { prediction: 'NEUTRAL', confidence: 0.3 };
        }

        const winRate = weightedWins / total;

        if (winRate > 0.6) {
            return { prediction: 'LIKELY_WIN', confidence: winRate };
        } else if (winRate < 0.4) {
            return { prediction: 'LIKELY_LOSS', confidence: 1 - winRate };
        }

        return { prediction: 'NEUTRAL', confidence: 0.5 };
    }

    /**
     * Save learning data to localStorage
     */
    private saveLearningData(): void {
        try {
            localStorage.setItem('thekey-learning-correlations', JSON.stringify(this.correlations));
            localStorage.setItem('thekey-learning-shadow', JSON.stringify(Array.from(this.shadowPatterns.entries())));
            localStorage.setItem('thekey-learning-crisis', JSON.stringify(this.crisisData));
        } catch (e) {
            console.warn('[LearningEngine] Failed to save learning data:', e);
        }
    }

    /**
     * Load learning data from localStorage
     */
    loadLearningData(): void {
        try {
            const correlations = localStorage.getItem('thekey-learning-correlations');
            const shadow = localStorage.getItem('thekey-learning-shadow');
            const crisis = localStorage.getItem('thekey-learning-crisis');

            if (correlations) this.correlations = JSON.parse(correlations);
            if (shadow) this.shadowPatterns = new Map(JSON.parse(shadow));
            if (crisis) this.crisisData = JSON.parse(crisis);

            console.log(`[LearningEngine] Loaded ${this.correlations.length} correlations, ${this.shadowPatterns.size} shadow patterns`);
        } catch (e) {
            console.warn('[LearningEngine] Failed to load learning data:', e);
        }
    }

    /**
     * Get learning statistics
     */
    getStats(): { totalCorrelations: number; shadowPatterns: number; crisisRecoveries: number; insights: number } {
        return {
            totalCorrelations: this.correlations.reduce((sum, c) => sum + c.count, 0),
            shadowPatterns: this.shadowPatterns.size,
            crisisRecoveries: this.crisisData.successfulRecoveries + this.crisisData.failedRecoveries,
            insights: this.generateInsights().length
        };
    }
}

// Singleton instance
export const learningEngine = new LearningEngine();

// Auto-load learning data on init
if (typeof window !== 'undefined') {
    learningEngine.loadLearningData();
}
