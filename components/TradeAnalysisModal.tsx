
import React from 'react';
import type { Trade, TradeAnalysis } from '../types';
import { PostTradeAnalysisCard } from './PostTradeAnalysisCard';
import { ProcessScoreDisplay } from './ProcessScoreDisplay';
import { ComparativeProcessScores } from './ComparativeProcessScores';

interface TradeAnalysisModalProps {
    trade: Trade;
    analysis: TradeAnalysis | null;
    onClose: () => void;
}

export const TradeAnalysisModal: React.FC<TradeAnalysisModalProps> = ({ trade, analysis, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                 <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-accent-yellow">Post-Trade Analysis</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div className="p-4 space-y-4">
                    {trade.processEvaluation && trade.userProcessEvaluation && (
                        <ComparativeProcessScores 
                            aiEvaluation={trade.processEvaluation} 
                            userEvaluation={trade.userProcessEvaluation}
                        />
                    )}
                    
                    {trade.processEvaluation && !trade.userProcessEvaluation && (
                        <ProcessScoreDisplay evaluation={trade.processEvaluation} />
                    )}

                    {analysis ? (
                        <PostTradeAnalysisCard analysis={analysis} />
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-400">Analyzing trade...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
