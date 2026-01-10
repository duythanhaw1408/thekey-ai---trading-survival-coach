/**
 * THEKEY AI - Crowd Wisdom Service
 * Aggregates community intelligence for enhanced AI decisions
 * Metrics: Shadow scores, Crisis rates, Active patterns
 */

import { api } from './api';
import { learningEngine } from './learningEngine';

// Crowd metrics interface
export interface CrowdMetrics {
    averageShadowScore: number;
    percentInCrisis: number;
    communityDisciplineScore: number;
    totalActiveUsers: number;
    topActivePatterns: string[];
    recentInsights: CrowdInsight[];
    timestamp: number;
}

export interface CrowdInsight {
    type: 'WARNING' | 'TIP' | 'TREND';
    message: string;
    confidence: number;
}

interface UserContribution {
    shadowScore: number;
    disciplineScore: number;
    isInCrisis: boolean;
    activePattern: string | null;
}

class CrowdWisdomService {
    private metrics: CrowdMetrics | null = null;
    private contributions: Map<string, UserContribution> = new Map();
    private updateInterval: number | null = null;

    /**
     * Contribute current user's data to crowd wisdom (anonymized)
     */
    contributeUserData(
        userId: string,
        shadowScore: number,
        disciplineScore: number,
        isInCrisis: boolean,
        activePattern: string | null
    ): void {
        // Hash user ID for privacy
        const hashedId = this.hashUserId(userId);

        this.contributions.set(hashedId, {
            shadowScore,
            disciplineScore,
            isInCrisis,
            activePattern
        });

        // Recalculate metrics when data changes
        this.calculateMetrics();
    }

    /**
     * Calculate aggregated metrics from all contributions
     */
    private calculateMetrics(): void {
        const contributions = Array.from(this.contributions.values());

        if (contributions.length === 0) {
            this.metrics = null;
            return;
        }

        const totalUsers = contributions.length;
        const usersInCrisis = contributions.filter(c => c.isInCrisis).length;

        // Calculate averages
        const avgShadowScore = contributions.reduce((sum, c) => sum + c.shadowScore, 0) / totalUsers;
        const avgDisciplineScore = contributions.reduce((sum, c) => sum + c.disciplineScore, 0) / totalUsers;

        // Find top patterns
        const patternCounts: Record<string, number> = {};
        contributions.forEach(c => {
            if (c.activePattern) {
                patternCounts[c.activePattern] = (patternCounts[c.activePattern] || 0) + 1;
            }
        });

        const topPatterns = Object.entries(patternCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([pattern]) => pattern);

        // Generate insights
        const insights = this.generateCrowdInsights(
            avgShadowScore,
            usersInCrisis / totalUsers * 100,
            avgDisciplineScore,
            topPatterns
        );

        this.metrics = {
            averageShadowScore: Math.round(avgShadowScore * 10) / 10,
            percentInCrisis: Math.round(usersInCrisis / totalUsers * 100),
            communityDisciplineScore: Math.round(avgDisciplineScore),
            totalActiveUsers: totalUsers,
            topActivePatterns: topPatterns,
            recentInsights: insights,
            timestamp: Date.now()
        };

        // Update learning engine with crowd data
        learningEngine.updateCrowdMetrics({
            averageShadowScore: this.metrics.averageShadowScore,
            percentInCrisis: this.metrics.percentInCrisis,
            topActivePatterns: topPatterns,
            communityDisciplineScore: this.metrics.communityDisciplineScore
        });
    }

    /**
     * Generate crowd-based insights
     */
    private generateCrowdInsights(
        avgShadowScore: number,
        crisisPercent: number,
        avgDisciplineScore: number,
        topPatterns: string[]
    ): CrowdInsight[] {
        const insights: CrowdInsight[] = [];

        // High crisis rate warning
        if (crisisPercent > 30) {
            insights.push({
                type: 'WARNING',
                message: `⚠️ ${Math.round(crisisPercent)}% traders đang trong Crisis Mode. Thị trường có thể volatile.`,
                confidence: 0.85
            });
        }

        // FOMO epidemic detection
        if (topPatterns.includes('FOMO') && crisisPercent > 20) {
            insights.push({
                type: 'WARNING',
                message: '🔥 FOMO đang lan rộng trong cộng đồng. Hãy cẩn thận với quyết định vội vàng.',
                confidence: 0.8
            });
        }

        // High discipline community
        if (avgDisciplineScore > 80) {
            insights.push({
                type: 'TIP',
                message: '✅ Cộng đồng đang giao dịch rất kỷ luật. Đây là dấu hiệu tốt!',
                confidence: 0.9
            });
        }

        // Low shadow score trend
        if (avgShadowScore < 50) {
            insights.push({
                type: 'TREND',
                message: '📊 Shadow Score trung bình thấp - traders đang có xu hướng tự đánh giá không chính xác.',
                confidence: 0.75
            });
        }

        // Revenge trading epidemic
        if (topPatterns.includes('REVENGE_TRADING')) {
            insights.push({
                type: 'WARNING',
                message: '😤 Revenge Trading là pattern phổ biến nhất. Watchout!',
                confidence: 0.85
            });
        }

        return insights.slice(0, 3); // Max 3 insights
    }

    /**
     * Get current crowd metrics
     */
    getMetrics(): CrowdMetrics | null {
        return this.metrics;
    }

    /**
     * Get crowd wisdom message for display
     */
    getCrowdWisdomMessage(): string | null {
        if (!this.metrics) return null;

        const { recentInsights, percentInCrisis, totalActiveUsers } = this.metrics;

        if (recentInsights.length > 0) {
            return recentInsights[0].message;
        }

        if (totalActiveUsers > 0) {
            return `👥 ${totalActiveUsers} traders đang online. Cộng đồng đang giao dịch bình thường.`;
        }

        return null;
    }

    /**
     * Get trading recommendation based on crowd wisdom
     */
    getCrowdRecommendation(): {
        shouldTrade: boolean;
        adjustment: number;
        reason: string;
    } {
        if (!this.metrics) {
            return { shouldTrade: true, adjustment: 1.0, reason: 'Không có dữ liệu crowd.' };
        }

        const { percentInCrisis, topActivePatterns, communityDisciplineScore } = this.metrics;

        // High crisis rate - reduce position
        if (percentInCrisis > 40) {
            return {
                shouldTrade: true,
                adjustment: 0.5,
                reason: `Hơn ${percentInCrisis}% traders đang trong Crisis. Nên giảm size.`
            };
        }

        // FOMO/REVENGE epidemic - caution
        if (topActivePatterns.includes('FOMO') || topActivePatterns.includes('REVENGE_TRADING')) {
            return {
                shouldTrade: true,
                adjustment: 0.7,
                reason: `${topActivePatterns[0]} đang phổ biến. Cẩn thận với quyết định.`
            };
        }

        // High discipline community - favorable
        if (communityDisciplineScore > 80 && percentInCrisis < 15) {
            return {
                shouldTrade: true,
                adjustment: 1.0,
                reason: 'Cộng đồng đang giao dịch kỷ luật. Môi trường thuận lợi.'
            };
        }

        return { shouldTrade: true, adjustment: 0.9, reason: 'Điều kiện bình thường.' };
    }

    /**
     * Get personal stats compared to community averages
     * Returns insights showing how user compares to the community
     */
    getPersonalVsCommunity(userStats: {
        disciplineScore: number;
        shadowScore: number;
        isInCrisis: boolean;
        winRate?: number;
    }): {
        comparison: {
            discipline: { user: number; community: number; diff: number; status: 'ABOVE' | 'BELOW' | 'AVERAGE' };
            shadow: { user: number; community: number; diff: number; status: 'ABOVE' | 'BELOW' | 'AVERAGE' };
        };
        message: string;
        recommendation: string;
    } | null {
        if (!this.metrics) {
            return null;
        }

        const { communityDisciplineScore, averageShadowScore, percentInCrisis } = this.metrics;

        // Calculate discipline comparison
        const disciplineDiff = userStats.disciplineScore - communityDisciplineScore;
        const disciplineStatus = disciplineDiff > 5 ? 'ABOVE' : disciplineDiff < -5 ? 'BELOW' : 'AVERAGE';

        // Calculate shadow score comparison
        const shadowDiff = userStats.shadowScore - averageShadowScore;
        const shadowStatus = shadowDiff > 5 ? 'ABOVE' : shadowDiff < -5 ? 'BELOW' : 'AVERAGE';

        // Generate message
        let message = '';
        let recommendation = '';

        if (disciplineStatus === 'BELOW') {
            message = `📊 Điểm kỷ luật của bạn (${userStats.disciplineScore}) thấp hơn ${Math.abs(disciplineDiff).toFixed(0)} điểm so với trung bình cộng đồng (${communityDisciplineScore}).`;
            recommendation = 'Hãy tập trung vào việc tuân thủ kế hoạch giao dịch để cải thiện.';
        } else if (disciplineStatus === 'ABOVE') {
            message = `🎉 Tuyệt vời! Điểm kỷ luật của bạn (${userStats.disciplineScore}) cao hơn ${disciplineDiff.toFixed(0)} điểm so với cộng đồng (${communityDisciplineScore}).`;
            recommendation = 'Bạn đang làm tốt hơn đa số traders. Duy trì phong độ!';
        } else {
            message = `📈 Điểm kỷ luật của bạn (${userStats.disciplineScore}) ngang bằng với trung bình cộng đồng (${communityDisciplineScore}).`;
            recommendation = 'Bạn đang ở mức bình thường. Hãy cố gắng vươn lên top!';
        }

        // Crisis context
        if (userStats.isInCrisis && percentInCrisis > 30) {
            recommendation += ` Lưu ý: ${percentInCrisis}% traders cũng đang trong Crisis Mode - thị trường có thể đang khó khăn.`;
        }

        return {
            comparison: {
                discipline: {
                    user: userStats.disciplineScore,
                    community: communityDisciplineScore,
                    diff: disciplineDiff,
                    status: disciplineStatus
                },
                shadow: {
                    user: userStats.shadowScore,
                    community: averageShadowScore,
                    diff: shadowDiff,
                    status: shadowStatus
                }
            },
            message,
            recommendation
        };
    }


    /**
     * Hash user ID for privacy
     */
    private hashUserId(userId: string): string {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    /**
     * Simulate crowd data for demo (remove in production)
     */
    simulateCrowdData(): void {
        const demoUsers = [
            { id: 'user1', shadow: 75, discipline: 85, crisis: false, pattern: null },
            { id: 'user2', shadow: 60, discipline: 70, crisis: false, pattern: 'OVERTRADING' },
            { id: 'user3', shadow: 45, discipline: 55, crisis: true, pattern: 'FOMO' },
            { id: 'user4', shadow: 80, discipline: 90, crisis: false, pattern: null },
            { id: 'user5', shadow: 55, discipline: 65, crisis: true, pattern: 'REVENGE_TRADING' },
            { id: 'user6', shadow: 70, discipline: 75, crisis: false, pattern: null },
            { id: 'user7', shadow: 40, discipline: 50, crisis: true, pattern: 'FOMO' },
            { id: 'user8', shadow: 85, discipline: 88, crisis: false, pattern: null },
        ];

        demoUsers.forEach(user => {
            this.contributeUserData(user.id, user.shadow, user.discipline, user.crisis, user.pattern);
        });

        console.log('[CrowdWisdom] Simulated crowd data loaded');
    }

    /**
   * Persist metrics to backend
   */
    async persistToBackend(): Promise<void> {
        if (!this.metrics) return;

        try {
            const API_URL = (typeof process !== 'undefined' && process.env?.VITE_API_URL) || 'http://localhost:8000';
            await fetch(`${API_URL}/learning/crowd-metrics/snapshot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    total_active_users: this.metrics.totalActiveUsers,
                    users_in_crisis_mode: Math.round(this.metrics.percentInCrisis / 100 * this.metrics.totalActiveUsers),
                    average_shadow_score: this.metrics.averageShadowScore,
                    average_discipline_score: this.metrics.communityDisciplineScore,
                    average_process_score: 0,
                    top_active_patterns: this.metrics.topActivePatterns,
                    fear_greed_index: null,
                    btc_price: null,
                    market_sentiment: null
                })
            });
            console.log('[CrowdWisdom] Metrics persisted to backend');
        } catch (error) {
            console.warn('[CrowdWisdom] Failed to persist metrics:', error);
        }
    }

    /**
     * Start auto-update interval
     */
    startAutoUpdate(intervalMs: number = 60000): void {
        if (this.updateInterval) return;

        this.updateInterval = window.setInterval(() => {
            this.calculateMetrics();
        }, intervalMs);
    }

    /**
     * Stop auto-update
     */
    stopAutoUpdate(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Singleton instance
export const crowdWisdomService = new CrowdWisdomService();
