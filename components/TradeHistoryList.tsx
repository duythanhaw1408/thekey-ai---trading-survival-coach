import React from 'react';
import { motion } from 'framer-motion';
import type { Trade, TradeAnalysis } from '../types';
import { ShieldCheckIcon, AlertTriangleIcon, FileTextIcon, BrainCircuitIcon } from './icons';
import { TradeAnalysisDetail } from './TradeAnalysisDetail';

interface TradeHistoryListProps {
    tradeHistory: Trade[];
    onAnalyze: (trade: Trade) => void;
    onCloseTrade: (trade: Trade) => void;
    isAnalyzing: boolean;
    selectedTrade: Trade | null;
    analysis: TradeAnalysis | null;
    onClearAnalysis: () => void;
    mode?: 'LIST_ONLY' | 'DETAIL_ONLY' | 'FULL';
}

const DecisionIcon: React.FC<{ decision: Trade['decision'] }> = ({ decision }) => {
    switch (decision) {
        case 'ALLOW':
            return <span title="Allowed"><ShieldCheckIcon className="w-4 h-4 text-accent-neon drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]" /></span>;
        case 'WARN':
            return <span title="Warned"><AlertTriangleIcon className="w-4 h-4 text-accent-yellow drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" /></span>;
        case 'BLOCK':
            return <span title="Blocked"><AlertTriangleIcon className="w-4 h-4 text-accent-red drop-shadow-[0_0_5px_rgba(255,0,85,0.5)]" /></span>;
        default:
            return null;
    }
}

export const TradeHistoryList: React.FC<TradeHistoryListProps> = ({ tradeHistory, onAnalyze, onCloseTrade, isAnalyzing, selectedTrade, analysis, onClearAnalysis, mode = 'FULL' }) => {

    return (
        <div className="space-y-4 flex flex-col h-full w-full bg-black/20">
            {mode !== 'DETAIL_ONLY' && (
                <div className="px-4 pt-6 pb-2">
                    <h2 className="text-[10px] font-black text-accent-neon/30 uppercase tracking-[0.4em]">LEDGER_PROTOCOL_HISTORY</h2>
                </div>
            )}

            {tradeHistory.length === 0 && mode !== 'DETAIL_ONLY' ? (
                <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-accent-neon/20 rounded-2xl flex-1 bg-black/40 mx-4 mb-4 backdrop-blur-md">
                    <div className="w-16 h-16 bg-accent-neon/5 rounded-full flex items-center justify-center mb-6 border border-accent-neon/10 neon-glow">
                        <FileTextIcon className="w-8 h-8 text-accent-neon/40" />
                    </div>
                    <h3 className="font-black text-white text-xs mb-2 uppercase tracking-widest">NO_RECORDS_FOUND_IN_BUFFER</h3>
                    <p className="text-accent-neon/30 text-[10px] mb-6 max-w-xs uppercase tracking-wider font-bold">
                        Initialize trade protocol to begin neural recording.
                    </p>
                    <div className="space-y-2 w-full max-w-[200px]">
                        <div className="h-px bg-gradient-to-r from-transparent via-accent-neon/20 to-transparent" />
                        <p className="text-[9px] text-accent-neon/20 font-black uppercase tracking-widest">STANDBY_MODE</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Trade List Panel */}
                    {(mode === 'FULL' || mode === 'LIST_ONLY') && (
                        <div className={`space-y-3 px-4 pb-6 overflow-y-auto custom-scrollbar w-full ${selectedTrade && mode === 'FULL' ? 'hidden md:block' : 'block'}`}>
                            {tradeHistory.map((trade, idx) => {
                                const isSelected = selectedTrade?.id === trade.id;

                                return (
                                    <motion.div
                                        key={trade.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`group border transition-all cursor-pointer relative overflow-hidden rounded-xl bg-black/60 shadow-xl ${isSelected ? 'border-accent-neon ring-1 ring-accent-neon/30' : 'border-white/5 hover:border-accent-neon/20'}`}
                                        onClick={() => onAnalyze(trade)}
                                    >
                                        {/* Background accent */}
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-accent-neon/5 animate-pulse" />
                                        )}

                                        <div className="relative p-4 flex justify-between items-center">
                                            <div className="flex items-center space-x-4 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-accent-neon text-black' : 'bg-white/5 group-hover:bg-accent-neon/10'}`}>
                                                    <DecisionIcon decision={trade.decision} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-black text-[12px] text-white tracking-widest uppercase italic">{trade.asset}</span>
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded leading-none uppercase tracking-tighter ${trade.direction === 'BUY' ? 'bg-accent-neon/10 text-accent-neon' : 'bg-accent-red/10 text-accent-red'}`}>
                                                            {trade.direction}
                                                        </span>
                                                    </div>
                                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">ID_AUTH_{String(trade.id).toUpperCase()}</p>
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0 ml-4">
                                                {trade.processEvaluation ? (
                                                    <div className="flex items-center gap-2 group/score">
                                                        <div className="text-right">
                                                            <p className="text-[8px] font-black text-white/10 uppercase leading-tight tracking-tighter">DISCIPLINE</p>
                                                            <p className="text-xs font-black text-accent-neon tracking-tighter">{trade.processEvaluation?.totalProcessScore || 0}%</p>
                                                        </div>
                                                        <div className="w-10 h-10 rounded-full border border-accent-neon/20 flex items-center justify-center bg-accent-neon/5 shadow-inner">
                                                            <BrainCircuitIcon className="w-4 h-4 text-accent-neon" />
                                                        </div>
                                                    </div>
                                                ) : trade.status === 'OPEN' ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onCloseTrade(trade); }}
                                                        className="px-4 py-2 rounded-lg bg-black border border-accent-neon text-accent-neon text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(0,255,157,0.1)] hover:bg-accent-neon hover:text-black transition-all active:scale-95"
                                                    >
                                                        REVIEW_CORE
                                                    </button>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center opacity-30">
                                                        <BrainCircuitIcon className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Detail View Panel */}
                    {mode === 'FULL' && selectedTrade && (
                        <div className="w-full h-full overflow-auto p-4 bg-black/40 backdrop-blur-xl border-t border-accent-neon/10">
                            <TradeAnalysisDetail
                                trade={selectedTrade}
                                analysis={analysis}
                                isAnalyzing={isAnalyzing}
                                onClose={onClearAnalysis}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};