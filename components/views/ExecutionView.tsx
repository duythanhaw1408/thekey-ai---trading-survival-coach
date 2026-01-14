
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TerminalView } from './TerminalView';
import { CoachView } from './CoachView';
import { TerminalIcon, AcademicCapIcon } from '../icons';
import type { Trade, TradeDecision, ChatMessage, TradeAnalysis } from '../../types';

interface ExecutionViewProps {
    onSubmit: (trade: any) => void;
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
    messages: ChatMessage[];
    onSendMessage: (message: ChatMessage) => Promise<void>;
    isLoadingChat: boolean;
    streamingText?: string;
    isCrisisMode: boolean;
    // Profile settings for Terminal
    profileAccountSize: number;
    profileRiskPercent: number;
    profileMaxPositionSize: number;
}

export const ExecutionView: React.FC<ExecutionViewProps> = ({
    onSubmit,
    isLoading,
    decision,
    onProceed,
    tradeHistory,
    onAnalyzeTrade,
    isAnalyzingTrade,
    selectedTradeForAnalysis,
    onCloseTrade,
    tradeAnalysis,
    onClearAnalysis,
    messages,
    onSendMessage,
    isLoadingChat,
    streamingText,
    isCrisisMode,
    profileAccountSize = 1000,
    profileRiskPercent = 2,
    profileMaxPositionSize = 500
}) => {
    const [subTab, setSubTab] = useState<'terminal' | 'coach'>('terminal');

    return (
        <div className="flex flex-col h-full animate-entrance">
            <div className="bento-card flex-1 p-0 overflow-hidden flex flex-col bg-black/40 border-white/5">
                {/* Internal Tabs for Execution */}
                <div className="flex border-b border-white/5 bg-white/5 p-1 gap-1">
                    <button
                        onClick={() => setSubTab('terminal')}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all ${subTab === 'terminal'
                            ? 'bg-white/10 text-accent-primary shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                            : 'text-text-secondary hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <TerminalIcon className="w-4 h-4" />
                        Terminal
                    </button>
                    <button
                        onClick={() => setSubTab('coach')}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all ${subTab === 'coach'
                            ? 'bg-white/10 text-accent-primary shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                            : 'text-text-secondary hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <AcademicCapIcon className="w-4 h-4" />
                        AI Coach
                    </button>
                </div>

                {/* Sub-view Content */}
                <div className="flex-1 overflow-auto custom-scrollbar min-h-[600px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={subTab}
                            initial={{ opacity: 0, x: subTab === 'terminal' ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: subTab === 'terminal' ? 20 : -20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="h-full"
                        >
                            {subTab === 'terminal' ? (
                                <TerminalView
                                    onSubmit={onSubmit}
                                    isLoading={isLoading}
                                    decision={decision}
                                    onProceed={onProceed}
                                    tradeHistory={tradeHistory}
                                    onAnalyzeTrade={onAnalyzeTrade}
                                    isAnalyzingTrade={isAnalyzingTrade}
                                    selectedTradeForAnalysis={selectedTradeForAnalysis}
                                    onCloseTrade={onCloseTrade}
                                    tradeAnalysis={tradeAnalysis}
                                    onClearAnalysis={onClearAnalysis}
                                    profileAccountSize={profileAccountSize}
                                    profileRiskPercent={profileRiskPercent}
                                    profileMaxPositionSize={profileMaxPositionSize}
                                />
                            ) : (
                                <CoachView
                                    messages={messages}
                                    onSendMessage={onSendMessage}
                                    isLoading={isLoadingChat}
                                    streamingText={streamingText}
                                    isCrisisMode={isCrisisMode}
                                    tradeHistory={tradeHistory}
                                    onAnalyzeTrade={onAnalyzeTrade}
                                    isAnalyzingTrade={isAnalyzingTrade}
                                    selectedTradeForAnalysis={selectedTradeForAnalysis}
                                    onCloseTrade={onCloseTrade}
                                    tradeAnalysis={tradeAnalysis}
                                    onClearAnalysis={onClearAnalysis}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
