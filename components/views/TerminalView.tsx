
import React from 'react';
import { motion } from 'framer-motion';
import type { Trade, TradeDecision, TradeAnalysis } from '../../types';
import { TradeInputForm } from '../TradeInputForm';
import { TradeHistoryList } from '../TradeHistoryList';
import { AlertTriangleIcon } from '../icons';

interface TerminalViewProps {
    onSubmit: (trade: {
        asset: string;
        positionSize: number;
        reasoning: string;
        direction: 'BUY' | 'SELL';
        entryPrice: number;
        takeProfit?: number;
        stopLoss?: number;
    }) => void;
    isLoading: boolean;
    decision: TradeDecision | null;
    onProceed: () => void;
    tradeHistory: Trade[];
    onAnalyzeTrade: (trade: Trade) => void;
    isAnalyzingTrade: boolean;
    selectedTradeForAnalysis: Trade | null;
    onCloseTrade: (trade: Trade) => void;
    tradeAnalysis: TradeAnalysis | null;
    onClearAnalysis: () => void;
    // Profile settings for Terminal
    profileAccountSize: number;
    profileRiskPercent: number;
    profileMaxPositionSize: number;
}

export const TerminalView: React.FC<TerminalViewProps> = (props) => {
    const simulationMode = true;

    return (
        <div className="h-full flex flex-col pt-4 overflow-hidden selection:bg-accent-neon selection:text-black">
            <div className="flex-shrink-0 px-4 pb-2">
                {simulationMode && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-accent-neon/5 border border-accent-neon/20 p-2.5 rounded-xl flex items-center mb-6 neon-glow"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-neon animate-pulse mr-3" />
                        <p className="text-[10px] font-black text-accent-neon uppercase tracking-[0.2em]">Simulation_Engine: ACTIVE // Sandbox_Mode</p>
                    </motion.div>
                )}
                <TradeInputForm
                    onSubmit={props.onSubmit}
                    isLoading={props.isLoading}
                    decision={props.decision}
                    onProceed={props.onProceed}
                    tradeHistory={props.tradeHistory}
                    profileAccountSize={props.profileAccountSize}
                    profileRiskPercent={props.profileRiskPercent}
                    profileMaxPositionSize={props.profileMaxPositionSize}
                />
            </div>

            <div className="flex-1 overflow-auto border-t border-accent-neon/10 bg-black/40 backdrop-blur-md">
                <div className="px-4 py-2 bg-gradient-to-r from-accent-neon/5 to-transparent border-b border-accent-neon/5 flex items-center gap-2">
                    <div className="w-1 h-3 bg-accent-neon/40 shadow-sm" />
                    <span className="text-[9px] font-black text-accent-neon/40 uppercase tracking-widest">Trade_Ledger_History</span>
                </div>
                <TradeHistoryList
                    tradeHistory={props.tradeHistory}
                    onAnalyze={props.onAnalyzeTrade}
                    isAnalyzing={props.isAnalyzingTrade}
                    selectedTrade={props.selectedTradeForAnalysis}
                    onCloseTrade={props.onCloseTrade}
                    analysis={props.tradeAnalysis}
                    onClearAnalysis={props.onClearAnalysis}
                    mode="FULL"
                />
            </div>
        </div>
    );
};
