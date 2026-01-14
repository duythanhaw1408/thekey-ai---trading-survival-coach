
import React from 'react';
import type { ChatMessage, Trade, TradeAnalysis } from '../../types';
import { ChatWindowEnhanced } from '../ChatWindowEnhanced';
import { TradeHistoryList } from '../TradeHistoryList';

interface CoachViewProps {
    messages: ChatMessage[];
    onSendMessage: (message: ChatMessage) => Promise<void>;
    isLoading: boolean;
    streamingText?: string;
    isCrisisMode: boolean;
    tradeHistory: Trade[];
    onAnalyzeTrade: (trade: Trade) => void;
    isAnalyzingTrade: boolean;
    selectedTradeForAnalysis: Trade | null;
    onCloseTrade: (trade: Trade) => void;
    tradeAnalysis: TradeAnalysis | null;
    onClearAnalysis: () => void;
}

export const CoachView: React.FC<CoachViewProps> = (props) => {
    return (
        <div className="h-full flex flex-col overflow-hidden bg-black/20">
            {/* Chat Area */}
            <div className="flex-[3] min-h-0 flex flex-col">
                {props.isCrisisMode && (
                    <div className="bg-accent-red/10 border-b border-accent-red/20 text-red-300 p-2 text-center shrink-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Crisis Protocol Active</p>
                    </div>
                )}
                <div className="flex-1 overflow-hidden">
                    <ChatWindowEnhanced
                        messages={props.messages}
                        onSendMessage={props.onSendMessage}
                        isLoading={props.isLoading}
                        streamingText={props.streamingText}
                    />
                </div>
            </div>

            {/* History Area */}
            <div className="flex-[2] border-t border-white/5 overflow-hidden flex flex-col">
                <TradeHistoryList
                    tradeHistory={props.tradeHistory}
                    onAnalyze={props.onAnalyzeTrade}
                    isAnalyzing={props.isAnalyzingTrade}
                    selectedTrade={props.selectedTradeForAnalysis}
                    onCloseTrade={props.onCloseTrade}
                    analysis={props.tradeAnalysis}
                    onClearAnalysis={props.onClearAnalysis}
                    mode="LIST_ONLY"
                />
            </div>
        </div>
    );
};