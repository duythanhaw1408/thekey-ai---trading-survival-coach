
import type { ProcessEvaluation, Trade, UserProcessEvaluation } from '../types';

class ProcessEvaluationEngine {
    
    public evaluateTradeProcess(trade: Trade, userEval: UserProcessEvaluation): ProcessEvaluation {
        const scores = {
            setup: this.scoreSetup(trade.reasoning, userEval),
            risk: this.scoreRisk(trade.positionSize, userEval),
            emotion: this.scoreEmotion(trade.statsAtEntry?.consecutiveLosses ?? 0, userEval),
            execution: this.scoreExecution(trade, userEval),
        };

        // Refined weights
        const totalProcessScore = Math.round(
            (scores.setup * 0.25 + scores.risk * 0.35 + scores.execution * 0.20 + scores.emotion * 0.20) * 10
        );
        
        const weakestArea = Object.entries(scores).reduce((a, b) => a[1] < b[1] ? a : b)[0].toUpperCase() as ProcessEvaluation['weakestArea'];

        return {
            totalProcessScore,
            scores,
            weakestArea,
            summary: this.generateSummary(totalProcessScore, weakestArea),
        };
    }

    private scoreSetup(reasoning: string | undefined, userEval: UserProcessEvaluation): number {
        let objectiveScore = 2;
        if (reasoning && reasoning.length > 10) objectiveScore = 6;
        if (reasoning && reasoning.split(' ').length > 5) objectiveScore = 8;
        if (userEval.hadPredefinedEntry) objectiveScore += 2; // Bonus for having a plan

        // Average objective score with user's perceived clarity
        return parseFloat(( (userEval.setupClarity * 0.5) + (objectiveScore * 0.5) ).toFixed(1));
    }

    private scoreRisk(positionSize: number, userEval: UserProcessEvaluation): number {
        let objectiveSizeScore = 5;
        if (positionSize <= 50) objectiveSizeScore = 10;
        else if (positionSize <= 100) objectiveSizeScore = 8;
        else if (positionSize <= 200) objectiveSizeScore = 4;
        else objectiveSizeScore = 1;
        
        // Having a predefined SL is a huge part of risk management
        if (userEval.hadPredefinedSL) objectiveSizeScore = Math.min(10, objectiveSizeScore + 2);

        // Mix user's feeling of adherence with objective size score
        return parseFloat(( (userEval.followedPositionSizing * 0.5) + (objectiveSizeScore * 0.5) ).toFixed(1));
    }

    private scoreEmotion(consecutiveLosses: number, userEval: UserProcessEvaluation): number {
        let contextScore = 10;
        if (consecutiveLosses === 1) contextScore = 7;
        else if (consecutiveLosses >= 2) contextScore = 4; // High-risk emotional context

        // Lower score for negative dominant emotions
        const emotionImpact = ['FEAR', 'GREED', 'FOMO'].includes(userEval.dominantEmotion) ? -3 : 1;
        
        // User's perception of emotional influence is inverted: 10=bad, 1=good
        const userPerceptionScore = 11 - userEval.emotionalInfluence;
        
        const finalScore = (contextScore * 0.3) + (userPerceptionScore * 0.7) + emotionImpact;
        return parseFloat(Math.max(1, Math.min(10, finalScore)).toFixed(1));
    }

    private scoreExecution(trade: Trade, userEval: UserProcessEvaluation): number {
        let aiDecisionScore = 7;
        if (trade.decision === 'BLOCK') aiDecisionScore = 1;
        else if (trade.decision === 'WARN') aiDecisionScore = 5;
        else if (trade.decision === 'ALLOW') aiDecisionScore = 9;

        // User's perception of plan adherence and impulsivity
        const userExecutionScore = (userEval.planAdherence + userEval.impulsiveActions) / 2;

        return parseFloat(((aiDecisionScore * 0.3) + (userExecutionScore * 0.7)).toFixed(1));
    }

    private generateSummary(score: number, weakestArea: string): string {
        if (score > 80) return "Excellent process discipline shown across the board.";
        if (score > 60) return `Solid process overall, with a slight weakness in ${weakestArea}.`;
        if (score > 40) return `Inconsistent process. Focus on improving your ${weakestArea} is recommended.`;
        return `Process breakdown detected. Critical attention needed in the area of ${weakestArea}.`;
    }
}

export const processEvaluationEngine = new ProcessEvaluationEngine();
