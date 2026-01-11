
import React from 'react';
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
            return <span title="Allowed"><ShieldCheckIcon className="w-4 h-4 text-accent-green" /></span>;
        case 'WARN':
            return <span title="Warned"><AlertTriangleIcon className="w-4 h-4 text-accent-yellow" /></span>;
        case 'BLOCK':
            return <span title="Blocked"><AlertTriangleIcon className="w-4 h-4 text-accent-red" /></span>;
        default:
            return null;
    }
}

export const TradeHistoryList: React.FC<TradeHistoryListProps> = ({ tradeHistory, onAnalyze, onCloseTrade, isAnalyzing, selectedTrade, analysis, onClearAnalysis, mode = 'FULL' }) => {

    return (
        <div className="space-y-4 flex flex-col h-full w-full">
            {mode !== 'DETAIL_ONLY' && (
                <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-3 pt-4">Entry Log & Analytics</h2>
            )}

            {tradeHistory.length === 0 && mode !== 'DETAIL_ONLY' ? (
                <div className="flex flex-col items-center justify-center text-center p-6 glass-panel border-dashed flex-1 bg-white/[0.02] mx-3 mb-3">
                    <FileTextIcon className="w-10 h-10 text-accent-primary/30 mb-3" />
                    <h3 className="font-bold text-white text-sm mb-2">Chưa có lịch sử giao dịch</h3>
                    <p className="text-text-secondary text-xs mb-4 max-w-xs">
                        Ghi lại lệnh đầu tiên để bắt đầu theo dõi và phân tích hành vi trading.
                    </p>
                    <div className="text-[10px] text-gray-500 bg-white/5 rounded-lg p-3 w-full max-w-xs">
                        <p className="font-semibold text-accent-yellow mb-2">📋 Cách thêm lệnh:</p>
                        <ol className="text-left space-y-1">
                            <li>1️⃣ Nhập thông tin lệnh ở form bên trên</li>
                            <li>2️⃣ Bấm <strong className="text-white">Gửi</strong> để AI đánh giá</li>
                            <li>3️⃣ Khi đóng lệnh, hoàn thành <strong className="text-white">Dojo</strong></li>
                        </ol>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Trade List Panel */}
                    {(mode === 'FULL' || mode === 'LIST_ONLY') && (
                        <div className={`space-y-2 px-3 pb-4 overflow-y-auto custom-scrollbar w-full ${selectedTrade && mode === 'FULL' ? 'hidden md:block' : 'block'}`}>
                            {tradeHistory.map(trade => {
                                const isSelected = selectedTrade?.id === trade.id;

                                return (
                                    <div key={trade.id} className={`glass-panel p-3 hover:border-white/20 transition-all cursor-pointer w-full ${isSelected ? 'border-accent-primary bg-accent-primary/10' : ''}`} onClick={() => onAnalyze(trade)}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center space-x-3 min-w-0">
                                                <div className={`p-1.5 rounded-lg flex-shrink-0 ${isSelected ? 'bg-accent-primary/20' : 'bg-white/5'}`}>
                                                    <DecisionIcon decision={trade.decision} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm tracking-tight flex items-center">
                                                        {trade.asset}
                                                        <span className={`ml-2 font-bold text-[8px] px-1.5 py-0.5 rounded-full uppercase ${trade.direction === 'BUY' ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' : 'bg-accent-red/10 text-accent-red border border-accent-red/20'}`}>
                                                            {trade.direction}
                                                        </span>
                                                    </p>
                                                    <p className="text-[10px] font-mono text-text-secondary opacity-50">#{String(trade.id).slice(0, 8)}</p>
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 ml-2">
                                                {trade.processEvaluation ? (
                                                    // Show Dojo score if evaluation exists (regardless of status)
                                                    <div className="flex items-center space-x-1 bg-accent-green/10 px-2 py-1 rounded-lg border border-accent-green/20">
                                                        <BrainCircuitIcon className="w-3 h-3 text-accent-green" />
                                                        <span className="text-[10px] font-black text-accent-green">{trade.processEvaluation?.totalProcessScore || 0}</span>
                                                    </div>
                                                ) : trade.status === 'OPEN' ? (
                                                    // Show Review button for OPEN trades without evaluation
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onCloseTrade(trade); }}
                                                        className="text-[9px] font-black uppercase tracking-widest py-1 px-2.5 rounded-full bg-accent-primary text-white hover:brightness-110 transition-all border border-white/10 active:scale-95 shadow-lg shadow-accent-primary/20"
                                                    >
                                                        Review
                                                    </button>
                                                ) : (
                                                    // CLOSED but no evaluation - show pending indicator
                                                    <div className="flex items-center space-x-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                                        <BrainCircuitIcon className="w-3 h-3 text-gray-500" />
                                                        <span className="text-[10px] font-medium text-gray-500">--</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Detail View Panel - Only shown in FULL mode or if specifically requested */}
                    {mode === 'FULL' && selectedTrade && (
                        <div className="w-full h-full overflow-auto p-3">
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