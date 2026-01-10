
import React from 'react';
import type { Trade, TradeAnalysis } from '../types';
import { PostTradeAnalysisCard } from './PostTradeAnalysisCard';
import { ComparativeProcessScores } from './ComparativeProcessScores';
import { ArrowLeftIcon, BrainCircuitIcon } from './icons';

interface TradeAnalysisDetailProps {
    trade: Trade;
    analysis: TradeAnalysis | null;
    isAnalyzing: boolean;
    onClose: () => void;
}

export const TradeAnalysisDetail: React.FC<TradeAnalysisDetailProps> = ({ trade, analysis, isAnalyzing, onClose }) => {
    const score = trade?.processEvaluation?.totalProcessScore;
    const scoreColor = score && score > 75 ? 'text-accent-green' : score && score > 50 ? 'text-accent-yellow' : 'text-accent-red';

    return (
        <div className="bg-background/95 p-6 rounded-2xl h-full flex flex-col min-h-[500px] max-h-[85vh] border border-white/10 shadow-3xl glass-panel animate-entrance">
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
                {trade.processEvaluation && (
                    <div className="ml-auto text-right">
                        <p className="text-xs text-text-secondary">Process Score</p>
                        <p className={`font-semibold text-lg ${scoreColor}`}>{trade.processEvaluation.totalProcessScore}/100</p>
                    </div>
                )}
                {trade.decision === 'BLOCK' && (
                    <div className="ml-auto text-right">
                        <p className={`font-semibold text-lg text-accent-red`}>BLOCKED</p>
                    </div>
                )}
            </div>

            <div className="flex-grow overflow-y-auto pr-2">
                {isAnalyzing && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            {/* FIX: Corrected the malformed viewBox attribute in the SVG element. */}
                            <svg className="animate-spin mx-auto h-8 w-8 text-accent-yellow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="mt-2 text-text-secondary">AI is analyzing your trade...</p>
                        </div>
                    </div>
                )}

                {!isAnalyzing && analysis && (
                    <div className="space-y-4">
                        {trade.processEvaluation && trade.userProcessEvaluation && (
                            <ComparativeProcessScores
                                aiEvaluation={trade.processEvaluation}
                                userEvaluation={trade.userProcessEvaluation}
                            />
                        )}
                        <PostTradeAnalysisCard analysis={analysis} />
                    </div>
                )}

                {!isAnalyzing && !analysis && trade.decision !== 'BLOCK' && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary p-4">
                        <BrainCircuitIcon className="w-10 h-10 mb-3 opacity-20" />
                        <p className="mb-4">Analysis will appear here after the AI has processed the trade.</p>
                        <button
                            onClick={onClose}
                            className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
                        >
                            Try refreshing or re-selecting this trade
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
};