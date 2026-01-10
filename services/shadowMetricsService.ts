
import type { Trade, UserProcessEvaluation, DojoInteractionData, ShadowScore, TrustLevel } from '../types';

class ShadowScoreEngine {
    
    public calculateShadowScore(trade: Trade, userEval: UserProcessEvaluation, interactionData: DojoInteractionData): ShadowScore {
        const responseAuthenticity = this.calculateResponseAuthenticity(interactionData);
        const behaviorGap = this.calculateBehaviorGap(trade, userEval);

        const rawScore = Math.round((responseAuthenticity * 0.4) + (behaviorGap * 0.6));
        
        const trustLevel = this.getTrustLevel(rawScore);
        
        const adjustmentFactors = this.getAdjustmentFactors(trustLevel);
        
        return {
            rawScore,
            trustLevel,
            breakdown: {
                responseAuthenticity,
                behaviorGap,
            },
            adjustmentFactors,
        };
    }

    private calculateResponseAuthenticity(interactionData: DojoInteractionData): number {
        const timeTakenMs = interactionData.endTime - interactionData.startTime;
        const timeTakenSeconds = timeTakenMs / 1000;

        if (timeTakenSeconds < 10) return 20; // Likely rushed, low authenticity
        if (timeTakenSeconds > 120) return 95; // Very thoughtful
        
        const score = 20 + (timeTakenSeconds - 10) * (75 / 110); // Scale score between 10s and 120s
        return Math.min(100, Math.round(score));
    }

    private calculateBehaviorGap(trade: Trade, userEval: UserProcessEvaluation): number {
        if (!trade.processEvaluation) return 50; // Neutral score if no AI eval

        const aiScores = trade.processEvaluation.scores;
        const userScores = {
            setup: userEval.setupClarity,
            risk: userEval.followedPositionSizing,
            emotion: 11 - userEval.emotionalInfluence, // Invert user score
            execution: (userEval.planAdherence + userEval.impulsiveActions) / 2
        };

        const scoreDiffs = [
            Math.abs(aiScores.setup - userScores.setup),
            Math.abs(aiScores.risk - userScores.risk),
            Math.abs(aiScores.emotion - userScores.emotion),
            Math.abs(aiScores.execution - userScores.execution),
        ];

        const averageDifference = scoreDiffs.reduce((a, b) => a + b, 0) / scoreDiffs.length;

        // Score is inversely proportional to the difference. Max diff is 9, so we scale it.
        const score = 100 - (averageDifference / 9 * 100);

        return Math.max(0, Math.round(score));
    }

    private getTrustLevel(score: number): TrustLevel {
        if (score > 80) return 'HIGH_TRUST';
        if (score > 50) return 'MEDIUM_TRUST';
        return 'LOW_TRUST';
    }

    private getAdjustmentFactors(trustLevel: TrustLevel): ShadowScore['adjustmentFactors'] {
        switch (trustLevel) {
            case 'HIGH_TRUST': return { xpMultiplier: 1.15, verificationLevel: 'HIGH' };
            case 'MEDIUM_TRUST': return { xpMultiplier: 1.0, verificationLevel: 'MEDIUM' };
            case 'LOW_TRUST': return { xpMultiplier: 0.85, verificationLevel: 'LOW' };
        }
    }
}

export const shadowScoreEngine = new ShadowScoreEngine();
