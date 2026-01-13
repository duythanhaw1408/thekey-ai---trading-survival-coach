
import React from 'react';
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
        <div className="h-full flex flex-col pt-4 overflow-hidden">
            <div className="flex-shrink-0 px-4 pb-2">
                {simulationMode && (
                    <div className="bg-accent-blue/10 border border-accent-blue/20 text-blue-300 p-2 rounded-lg flex items-center mb-4">
                        <AlertTriangleIcon className="h-4 w-4 text-accent-blue mr-3" />
                        <p className="text-[11px] font-semibold">Chế độ mô phỏng đang hoạt động.</p>
                    </div>
                )}
                <TradeInputForm
                    onSubmit={props.onSubmit}
                    isLoading={props.isLoading}
                    decision={props.decision}
                    onProceed={props.onProceed}
                    profileAccountSize={props.profileAccountSize}
                    profileRiskPercent={props.profileRiskPercent}
                    profileMaxPositionSize={props.profileMaxPositionSize}
                />
            </div>

            <div className="flex-1 overflow-auto border-t border-white/5 bg-black/20">
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
