
import React from 'react';
import { motion } from 'framer-motion';
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
        <div className="h-full flex flex-col overflow-hidden bg-black selection:bg-accent-neon selection:text-black">
            {/* Chat Area */}
            <div className="flex-[3] min-h-0 flex flex-col">
                {props.isCrisisMode && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-accent-red/20 border-b border-accent-red/30 px-4 py-2 flex items-center gap-3 shrink-0"
                    >
                        <div className="w-2 h-2 rounded-full bg-accent-red animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-red">System_Crisis_Protocol_Engaged</span>
                    </motion.div>
                )}
                <div className="flex-1 overflow-hidden p-4">
                    <ChatWindowEnhanced
                        messages={props.messages}
                        onSendMessage={props.onSendMessage}
                        isLoading={props.isLoading}
                        streamingText={props.streamingText}
                    />
                </div>
            </div>

            {/* History Area */}
            <div className="flex-[2] border-t border-accent-neon/10 overflow-hidden flex flex-col bg-black/40 backdrop-blur-sm">
                <div className="px-6 py-3 bg-gradient-to-r from-accent-neon/5 to-transparent border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-3 bg-accent-neon shadow-[0_0_8px_rgba(0,255,157,0.5)]" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Historical_Memory_Core</span>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
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
        </div>
    );
};