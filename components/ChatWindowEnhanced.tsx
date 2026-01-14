// components/ChatWindowEnhanced.tsx
/**
 * THEKEY AI - Enhanced Chat Window
 * 
 * Features:
 * - Real-time typing indicator
 * - Streaming text animation
 * - Offline support
 * - Message retry on failure
 * 
 * @author THEKEY AI Team
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage } from '../types';
import { SendIcon, WifiOffIcon, RefreshIcon } from './icons';
import { AnalysisCard } from './AnalysisCard';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface ChatWindowEnhancedProps {
    messages: ChatMessage[];
    onSendMessage: (message: ChatMessage) => Promise<void>;
    isLoading: boolean;
    streamingText?: string;
}

// Typing indicator component
const TypingIndicator: React.FC<{ text?: string }> = ({ text }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-start gap-2 mb-4"
    >
        <div className="flex flex-col max-w-xs md:max-w-md lg:max-w-xs xl:max-w-md">
            {/* Avatar */}
            <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center">
                    <span className="text-xs">🧠</span>
                </div>
                <span className="text-[10px] text-accent-primary font-bold uppercase tracking-wider">Kaito</span>
            </div>

            {/* Typing bubble */}
            <div className="bg-gray-700 rounded-2xl rounded-tl-lg px-4 py-3">
                {text ? (
                    // Streaming text
                    <p className="text-sm text-white/90" style={{ whiteSpace: 'pre-wrap' }}>
                        {text}
                        <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="inline-block w-2 h-4 bg-accent-primary ml-1"
                        />
                    </p>
                ) : (
                    // Dots animation
                    <div className="flex items-center gap-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    scale: [1, 1.3, 1],
                                    opacity: [0.5, 1, 0.5]
                                }}
                                transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    delay: i * 0.2
                                }}
                                className="w-2 h-2 rounded-full bg-accent-primary"
                            />
                        ))}
                        <span className="ml-2 text-xs text-white/50">đang suy nghĩ...</span>
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);

// Failed message component
const FailedMessage: React.FC<{
    message: ChatMessage;
    onRetry: () => void;
}> = ({ message, onRetry }) => (
    <div className="flex items-end justify-end mb-2">
        <div className="relative">
            <div className="bg-accent-red/20 border border-accent-red/30 text-white/80 px-4 py-2 rounded-2xl rounded-br-lg max-w-xs">
                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{(message as any).text}</p>
            </div>
            <div className="flex items-center justify-end gap-2 mt-1">
                <span className="text-[10px] text-accent-red">Gửi thất bại</span>
                <button
                    onClick={onRetry}
                    className="text-accent-red hover:text-white transition-colors"
                >
                    <RefreshIcon className="w-3 h-3" />
                </button>
            </div>
        </div>
    </div>
);

export const ChatWindowEnhanced: React.FC<ChatWindowEnhancedProps> = ({
    messages,
    onSendMessage,
    isLoading,
    streamingText
}) => {
    const [input, setInput] = useState('');
    const [failedMessages, setFailedMessages] = useState<ChatMessage[]>([]);
    const scrollableContainerRef = useRef<null | HTMLDivElement>(null);
    const { isOnline } = useNetworkStatus();
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll on new messages
    useEffect(() => {
        if (scrollableContainerRef.current) {
            scrollableContainerRef.current.scrollTop = scrollableContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading, streamingText]);

    // Focus input when component mounts
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSend = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const messageText = input.trim();
        setInput('');

        const userMessage: ChatMessage = {
            id: Date.now() + Math.random(),
            sender: 'user',
            type: 'text',
            text: messageText,
        };

        try {
            await onSendMessage(userMessage);
        } catch (error) {
            setFailedMessages(prev => [...prev, userMessage]);
        }
    }, [input, isLoading, onSendMessage]);

    const handleRetry = useCallback(async (message: ChatMessage) => {
        setFailedMessages(prev => prev.filter(m => m.id !== message.id));
        try {
            await onSendMessage(message);
        } catch (error) {
            setFailedMessages(prev => [...prev, message]);
        }
    }, [onSendMessage]);

    // Quick action buttons
    const quickActions = [
        { label: '💪 Động viên tôi', text: 'Tôi cần động viên' },
        { label: '😰 Tôi đang lo lắng', text: 'Tôi đang cảm thấy lo lắng về giao dịch' },
        { label: '🤔 Phân tích quy trình', text: 'Hãy giúp tôi phân tích quy trình giao dịch' },
    ];

    return (
        <div className="h-[calc(100vh-280px)] min-h-[500px] flex flex-col bg-black/40 backdrop-blur-sm rounded-2xl border border-accent-neon/10 overflow-hidden">
            {/* Offline indicator */}
            <AnimatePresence>
                {!isOnline && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-accent-red/10 border-b border-accent-red/20 px-4 py-2 flex items-center gap-2"
                    >
                        <WifiOffIcon className="w-4 h-4 text-accent-red" />
                        <span className="text-[10px] uppercase tracking-widest text-accent-red/80 font-bold">SYSTEM OFFLINE - ENCRYPTION QUEUE ACTIVE</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages container */}
            <div ref={scrollableContainerRef} className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col space-y-6">
                    {/* Welcome message if empty */}
                    {messages.length === 0 && (
                        <div className="text-center py-12">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-20 h-20 bg-accent-neon/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-accent-neon/20 neon-glow"
                            >
                                <span className="text-4xl">🤖</span>
                            </motion.div>
                            <h3 className="text-xl font-black text-white mb-2 tracking-tighter">KAITO_OS v2.5</h3>
                            <p className="text-xs text-accent-neon/50 max-w-sm mx-auto uppercase tracking-[0.2em] font-medium">
                                Neural Trading Psychology Interface
                            </p>

                            {/* Quick actions */}
                            <div className="flex flex-wrap justify-center gap-3 mt-8">
                                {quickActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(action.text)}
                                        className="px-4 py-2 bg-black border border-accent-neon/30 rounded-lg text-[10px] font-bold text-accent-neon uppercase tracking-widest hover:bg-accent-neon hover:text-black transition-all active:scale-95"
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Render messages */}
                    {messages.map((msg) => (
                        <motion.div
                            initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={msg.id}
                            className={`flex items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.type === 'text' ? (
                                <div className="flex flex-col max-w-[80%]">
                                    {/* Avatar for AI */}
                                    {msg.sender === 'ai' && (
                                        <div className="flex items-center gap-2 mb-2 ml-1">
                                            <div className="w-5 h-5 rounded-full bg-accent-neon/20 flex items-center justify-center border border-accent-neon/40 shadow-sm shadow-accent-neon/20">
                                                <span className="text-[10px]">🤖</span>
                                            </div>
                                            <span className="text-[9px] text-accent-neon font-black uppercase tracking-[0.2em]">KAITO</span>
                                        </div>
                                    )}
                                    <div
                                        className={`px-5 py-3 rounded-2xl shadow-2xl ${msg.sender === 'user'
                                            ? 'bg-accent-neon text-black font-bold rounded-br-none'
                                            : 'bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-bl-none'
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="neon-glow rounded-3xl overflow-hidden p-[1px] bg-gradient-to-br from-accent-neon/50 to-transparent">
                                    <AnalysisCard analysis={msg.analysis} />
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {/* Failed messages */}
                    {failedMessages.map((msg) => (
                        <FailedMessage
                            key={msg.id}
                            message={msg}
                            onRetry={() => handleRetry(msg)}
                        />
                    ))}

                    {/* Typing indicator */}
                    <AnimatePresence>
                        {isLoading && <TypingIndicator text={streamingText} />}
                    </AnimatePresence>
                </div>
            </div>

            {/* Input area - "NEON GLOW SEARCH" STYLE */}
            <div className="p-6 bg-black">
                <form onSubmit={handleSend} className="relative group">
                    {/* The Neon Glow Background Ring */}
                    <div className="absolute -inset-1 bg-accent-neon/20 rounded-2xl blur-md group-focus-within:bg-accent-neon/40 transition-all duration-500" />

                    <div className="relative flex items-center bg-black border border-accent-neon/30 rounded-xl p-1 group-focus-within:border-accent-neon transition-all">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isLoading ? "Neural connection active..." : "Neural link established. Input query..."}
                            className="flex-1 bg-transparent px-6 py-4 text-white placeholder:text-accent-neon/20 text-sm focus:outline-none uppercase tracking-widest font-bold"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            className={`p-4 rounded-lg transition-all ${isLoading || !input.trim()
                                ? 'text-white/10'
                                : 'text-accent-neon hover:scale-110 active:scale-95'
                                }`}
                            disabled={isLoading || !input.trim()}
                        >
                            <SendIcon className="w-6 h-6" />
                        </button>
                    </div>
                </form>

                {/* Status Bar */}
                <div className="flex justify-between items-center mt-4 px-2">
                    <div className="flex items-center gap-4">
                        <span className="text-[9px] text-accent-neon/40 font-black uppercase tracking-widest flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-neon animate-pulse" />
                            Core.Stable
                        </span>
                        <span className="text-[9px] text-accent-neon/40 font-black uppercase tracking-widest">
                            Buffer: 1024kb
                        </span>
                    </div>
                    {!isOnline && (
                        <span className="text-[9px] text-accent-red font-black uppercase tracking-widest flex items-center gap-1">
                            <WifiOffIcon className="w-3 h-3" /> Offline.Queueing
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
