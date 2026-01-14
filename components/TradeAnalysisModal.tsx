
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
            className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[150] p-6 overflow-hidden"
            onClick={onClose}
        >
            <div className="absolute inset-0 cyber-grid opacity-[0.05] pointer-events-none" />
            <div
                className="bg-black border border-accent-yellow/20 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-2xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Corner HUD Markers */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-accent-yellow/30 rounded-tl-[3rem] pointer-events-none" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-accent-yellow/30 rounded-tr-[3rem] pointer-events-none" />

                <div className="sticky top-0 bg-black/80 backdrop-blur-md p-10 border-b border-white/5 flex justify-between items-center z-20">
                    <div className="flex flex-col">
                        <h2 className="text-[10px] font-black text-accent-yellow uppercase tracking-[0.5em] mb-2 drop-shadow-[0_0_5px_rgba(255,170,0,0.5)]">POST_TRADE_DIAGNOSTICS</h2>
                        <h3 className="text-3xl font-black text-white tracking-widest uppercase italic font-sans italic leading-none">ANALYSIS_CORE</h3>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all font-sans text-2xl relative z-10">&times;</button>
                </div>

                <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar relative z-10">
                    {/* Identification Chip */}
                    <div className="flex items-center gap-4 bg-accent-yellow/5 border border-accent-yellow/10 px-6 py-3 rounded-2xl">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-yellow animate-pulse" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">ID: {String(trade.id).slice(0, 8)}</span>
                        <div className="ml-auto flex items-center gap-3">
                            <span className="text-[10px] font-black text-accent-yellow uppercase tracking-widest">{trade.asset}</span>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {trade.processEvaluation && trade.userProcessEvaluation && (
                            <div className="group">
                                <ComparativeProcessScores
                                    aiEvaluation={trade.processEvaluation}
                                    userEvaluation={trade.userProcessEvaluation}
                                />
                            </div>
                        )}

                        {trade.processEvaluation && !trade.userProcessEvaluation && (
                            <ProcessScoreDisplay evaluation={trade.processEvaluation} />
                        )}

                        {analysis ? (
                            <PostTradeAnalysisCard analysis={analysis} />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-3xl">
                                <div className="w-12 h-12 border-4 border-accent-yellow/20 border-t-accent-yellow rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] animate-pulse">DECRYPTING_NEURAL_LOGS...</p>
                            </div>
                        )}
                    </div>
                </div>

                <footer className="p-8 border-t border-white/5 bg-black/60 flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-12 py-4 rounded-xl text-[10px] font-black text-black bg-accent-yellow hover:scale-[1.05] active:scale-[0.95] uppercase tracking-[0.5em] transition-all shadow-[0_0_20px_rgba(255,170,0,0.2)]"
                    >
                        ARCHIVE_ANALYSIS
                    </button>
                </footer>
            </div>
        </div>
    );
};
