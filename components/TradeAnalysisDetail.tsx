
import React from 'react';
import type { Trade, TradeAnalysis } from '../types';
import { PostTradeAnalysisCard } from './PostTradeAnalysisCard';
import { ComparativeProcessScores } from './ComparativeProcessScores';
import { ArrowLeftIcon, BrainCircuitIcon, ShieldCheckIcon, AlertTriangleIcon, TrendingUpIcon, TrendingDownIcon } from './icons';

interface TradeAnalysisDetailProps {
    trade: Trade;
    analysis: TradeAnalysis | null;
    isAnalyzing: boolean;
    onClose: () => void;
}

const ScoreBar: React.FC<{ label: string; score: number; maxScore?: number }> = ({ label, score, maxScore = 10 }) => {
    const percentage = (score / maxScore) * 100;
    const color = percentage >= 70 ? 'bg-accent-green' : percentage >= 50 ? 'bg-accent-yellow' : 'bg-accent-red';
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-text-secondary">{label}</span>
                <span className="font-bold text-white">{score}/{maxScore}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
};

const EmotionBadge: React.FC<{ emotion: string }> = ({ emotion }) => {
    const config: Record<string, { emoji: string; color: string }> = {
        PATIENCE: { emoji: '🧘', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
        CONFIDENCE: { emoji: '😎', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
        NEUTRAL: { emoji: '😐', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
        FEAR: { emoji: '😨', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
        GREED: { emoji: '🤑', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
        FOMO: { emoji: '🏃', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    };
    const { emoji, color } = config[emotion] || config.NEUTRAL;
    return (
        <span className={`px-3 py-1.5 rounded-full text-sm font-bold border ${color}`}>
            {emoji} {emotion}
        </span>
    );
};

export const TradeAnalysisDetail: React.FC<TradeAnalysisDetailProps> = ({ trade, analysis, isAnalyzing, onClose }) => {
    const processScore = trade?.processEvaluation?.totalProcessScore;
    const scoreColor = processScore && processScore > 75 ? 'text-accent-green' : processScore && processScore > 50 ? 'text-accent-yellow' : 'text-accent-red';
    const hasDojoData = trade?.processEvaluation && trade?.userProcessEvaluation;

    return (
        <div className="bg-background/95 p-6 rounded-2xl h-full flex flex-col min-h-[500px] max-h-[85vh] border border-white/10 shadow-3xl glass-panel animate-entrance">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center pb-5 border-b border-white/5 mb-5">
                <button onClick={onClose} className="mr-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 hover-scale transition-all">
                    <ArrowLeftIcon className="w-5 h-5 text-accent-primary" />
                </button>
                <div>
                    <h3 className="text-lg font-bold text-text-main">{trade?.asset || 'Unknown Asset'}</h3>
                    <p className="text-xs text-text-secondary">
                        {trade?.timestamp ? new Date(trade.timestamp).toLocaleString() : 'No date'}
                    </p>
                </div>
                {processScore !== undefined && (
                    <div className="ml-auto text-right">
                        <p className="text-xs text-text-secondary">Process Score</p>
                        <p className={`font-bold text-2xl ${scoreColor}`}>{processScore}<span className="text-sm opacity-60">/100</span></p>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                {/* Loading State */}
                {isAnalyzing && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <svg className="animate-spin mx-auto h-8 w-8 text-accent-yellow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="mt-2 text-text-secondary">AI is analyzing your trade...</p>
                        </div>
                    </div>
                )}

                {/* With AI Analysis */}
                {!isAnalyzing && analysis && (
                    <div className="space-y-4">
                        {hasDojoData && (
                            <ComparativeProcessScores
                                aiEvaluation={trade.processEvaluation!}
                                userEvaluation={trade.userProcessEvaluation!}
                            />
                        )}
                        <PostTradeAnalysisCard analysis={analysis} />
                    </div>
                )}

                {/* With Dojo but no AI Analysis - NEW ENHANCED UI */}
                {!isAnalyzing && !analysis && hasDojoData && (
                    <div className="space-y-6">
                        {/* Process Evaluation Summary */}
                        <div className="bento-card p-5 bg-gradient-to-br from-accent-primary/10 to-transparent border-accent-primary/20">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                                    <BrainCircuitIcon className="w-5 h-5 mr-2 text-accent-primary" />
                                    Process Dojo Evaluation
                                </h4>
                                {trade.processEvaluation?.weakestArea && (
                                    <span className="text-xs px-2 py-1 bg-accent-red/20 text-accent-red rounded-full border border-accent-red/30">
                                        Focus: {trade.processEvaluation.weakestArea}
                                    </span>
                                )}
                            </div>

                            {/* Score Breakdown */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <ScoreBar label="Setup Clarity" score={trade.processEvaluation!.scores.setup} />
                                <ScoreBar label="Risk Management" score={trade.processEvaluation!.scores.risk} />
                                <ScoreBar label="Emotional Control" score={trade.processEvaluation!.scores.emotion} />
                                <ScoreBar label="Execution Discipline" score={trade.processEvaluation!.scores.execution} />
                            </div>

                            {/* Summary */}
                            <p className="text-sm text-text-secondary italic border-l-2 border-accent-primary/50 pl-3">
                                {trade.processEvaluation?.summary || "No summary available"}
                            </p>
                        </div>

                        {/* User Self-Evaluation */}
                        <div className="bento-card p-5 bg-white/5 border-white/10">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
                                <ShieldCheckIcon className="w-5 h-5 mr-2 text-accent-green" />
                                Your Self-Assessment
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Emotion */}
                                <div>
                                    <p className="text-xs text-text-secondary mb-2">Dominant Emotion</p>
                                    <EmotionBadge emotion={trade.userProcessEvaluation!.dominantEmotion} />
                                </div>

                                {/* Plan Checklist */}
                                <div>
                                    <p className="text-xs text-text-secondary mb-2">Pre-Trade Planning</p>
                                    <div className="space-y-1 text-sm">
                                        <div className={`flex items-center ${trade.userProcessEvaluation!.hadPredefinedEntry ? 'text-accent-green' : 'text-text-secondary'}`}>
                                            {trade.userProcessEvaluation!.hadPredefinedEntry ? '✓' : '✗'} Entry Point
                                        </div>
                                        <div className={`flex items-center ${trade.userProcessEvaluation!.hadPredefinedSL ? 'text-accent-green' : 'text-text-secondary'}`}>
                                            {trade.userProcessEvaluation!.hadPredefinedSL ? '✓' : '✗'} Stop Loss
                                        </div>
                                        <div className={`flex items-center ${trade.userProcessEvaluation!.hadPredefinedTP ? 'text-accent-green' : 'text-text-secondary'}`}>
                                            {trade.userProcessEvaluation!.hadPredefinedTP ? '✓' : '✗'} Take Profit
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reflection */}
                            {trade.userProcessEvaluation!.reflection && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <p className="text-xs text-text-secondary mb-2">Key Lesson Learned</p>
                                    <p className="text-sm text-white bg-white/5 p-3 rounded-lg italic">
                                        "{trade.userProcessEvaluation!.reflection}"
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Improvement Tip */}
                        <div className="flex items-start gap-3 p-4 bg-accent-yellow/10 rounded-xl border border-accent-yellow/20">
                            <AlertTriangleIcon className="w-5 h-5 text-accent-yellow flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-accent-yellow">Improvement Tip</p>
                                <p className="text-xs text-text-secondary mt-1">
                                    {trade.processEvaluation?.weakestArea === 'SETUP' && "Spend more time identifying clear entry signals before placing trades."}
                                    {trade.processEvaluation?.weakestArea === 'RISK' && "Always define your stop-loss BEFORE entering a trade."}
                                    {trade.processEvaluation?.weakestArea === 'EMOTION' && "Take a 5-minute break after each losing trade to reset emotionally."}
                                    {trade.processEvaluation?.weakestArea === 'EXECUTION' && "Stick to your plan - avoid moving stop-losses or adding to losing positions."}
                                    {!trade.processEvaluation?.weakestArea && "Continue refining your trading process with each trade."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* No Dojo and No Analysis - Blocked or New Trade */}
                {!isAnalyzing && !analysis && !hasDojoData && trade.decision !== 'BLOCK' && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary p-4">
                        <BrainCircuitIcon className="w-10 h-10 mb-3 opacity-20" />
                        <p className="mb-2 text-lg font-semibold text-white">No Evaluation Yet</p>
                        <p className="mb-4 text-sm">Complete the Process Dojo after closing this trade to see detailed insights.</p>
                        <button
                            onClick={onClose}
                            className="text-xs px-4 py-2 bg-accent-primary/20 hover:bg-accent-primary/30 text-accent-primary rounded-lg transition-colors border border-accent-primary/30"
                        >
                            Close & Return to List
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};