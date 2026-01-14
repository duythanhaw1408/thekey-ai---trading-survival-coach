
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
            <div className="flex-1 p-0 overflow-hidden flex flex-col bento-card relative">
                {/* Corner HUD Markers */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-accent-neon/20 rounded-tl-3xl pointer-events-none" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-accent-neon/20 rounded-tr-3xl pointer-events-none" />

                {/* Internal Tabs for Execution */}
                <div className="flex border-b border-accent-neon/5 bg-black/60 p-1.5 gap-1.5 relative z-10">
                    <button
                        onClick={() => setSubTab('terminal')}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 relative overflow-hidden group ${subTab === 'terminal'
                            ? 'bg-accent-neon/10 text-accent-neon border border-accent-neon/30 shadow-[0_0_20px_rgba(0,255,157,0.1)]'
                            : 'text-white/40 border border-transparent hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        {subTab === 'terminal' && <div className="absolute inset-0 bg-accent-neon/[0.02] animate-pulse" />}
                        <TerminalIcon className={`w-4 h-4 transition-transform duration-500 ${subTab === 'terminal' ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,255,157,0.6)]' : 'group-hover:scale-110'}`} />
                        TERMINAL_CORE
                    </button>
                    <button
                        onClick={() => setSubTab('coach')}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 relative overflow-hidden group ${subTab === 'coach'
                            ? 'bg-accent-neon/10 text-accent-neon border border-accent-neon/30 shadow-[0_0_20px_rgba(0,255,157,0.1)]'
                            : 'text-white/40 border border-transparent hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        {subTab === 'coach' && <div className="absolute inset-0 bg-accent-neon/[0.02] animate-pulse" />}
                        <AcademicCapIcon className={`w-4 h-4 transition-transform duration-500 ${subTab === 'coach' ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,255,157,0.6)]' : 'group-hover:scale-110'}`} />
                        AI_STRATEGIST
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
