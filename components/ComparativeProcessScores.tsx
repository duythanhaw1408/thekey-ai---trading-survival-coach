
import React from 'react';
import type { ProcessEvaluation, UserProcessEvaluation } from '../types';
import { BrainCircuitIcon } from './icons';

interface ComparativeProcessScoresProps {
    aiEvaluation: ProcessEvaluation;
    userEvaluation: UserProcessEvaluation;
}

const ScoreComparisonBar: React.FC<{ label: string; aiScore: number; userScore: number }> = ({ label, aiScore, userScore }) => {
    const difference = userScore - aiScore;
    const diffColor = difference > 1 ? 'text-accent-green' : difference < -1 ? 'text-accent-red' : 'text-gray-400';
    const diffSign = difference > 0 ? '+' : '';

    const getScoreColor = (score: number) => score > 7 ? '#00C853' : score > 4 ? '#FFD700' : '#D50000';

    return (
        <div>
            <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-400 font-semibold">{label}</span>
                <div className="flex items-center space-x-2">
                    <span className="font-mono text-gray-300">User: {userScore}/10</span>
                    <span className="font-mono text-gray-300">AI: {aiScore}/10</span>
                    <span className={`font-mono font-bold w-8 text-right ${diffColor}`}>{diffSign}{difference.toFixed(1)}</span>
                </div>
            </div>
            <div className="relative w-full bg-gray-600 rounded-full h-2.5">
                {/* AI Score Bar */}
                <div
                    className="absolute top-0 left-0 h-2.5 rounded-full"
                    style={{ width: `${aiScore * 10}%`, backgroundColor: getScoreColor(aiScore), zIndex: 1 }}
                ></div>
                {/* User Score Indicator */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-3 w-1 bg-white rounded-full border border-gray-900"
                    style={{ left: `calc(${userScore * 10}% - 2px)`, zIndex: 2 }}
                    title={`Your score: ${userScore}`}
                ></div>
            </div>
        </div>
    );
};

export const ComparativeProcessScores: React.FC<ComparativeProcessScoresProps> = ({ aiEvaluation, userEvaluation }) => {
    // Note: emotionalInfluence is inverted (1=low influence/good, 10=high influence/bad). We convert it for display.
    const userEmotionScore = 11 - (userEvaluation?.emotionalInfluence || 0);

    if (!aiEvaluation?.scores || !userEvaluation) {
        return null;
    }

    return (
        <div className="w-full mt-4 p-4 bg-gray-900/50 rounded-lg">
            <h3 className="flex items-center text-md font-semibold text-gray-200 mb-4">
                <BrainCircuitIcon className="w-5 h-5 mr-2 text-accent-blue" />
                AI vs. User Process Evaluation
            </h3>
            <div className="space-y-4">
                <ScoreComparisonBar label="Planning" aiScore={aiEvaluation.scores.setup} userScore={userEvaluation.setupClarity} />
                <ScoreComparisonBar label="Risk Mgt." aiScore={aiEvaluation.scores.risk} userScore={userEvaluation.followedPositionSizing} />
                <ScoreComparisonBar label="Execution" aiScore={aiEvaluation.scores.execution} userScore={userEvaluation.planAdherence} />
                <ScoreComparisonBar label="Emotion" aiScore={aiEvaluation.scores.emotion} userScore={userEmotionScore} />
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
                The colored bar represents the AI's objective score. The white marker indicates your self-evaluation.
            </p>
        </div>
    );
};
