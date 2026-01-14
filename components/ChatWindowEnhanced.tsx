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
                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
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
        <div className="h-[calc(100vh-280px)] min-h-[500px] flex flex-col">
            {/* Offline indicator */}
            <AnimatePresence>
                {!isOnline && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center gap-2"
                    >
                        <WifiOffIcon className="w-4 h-4 text-amber-500" />
                        <span className="text-xs text-amber-500">Đang offline - Tin nhắn sẽ được gửi khi có mạng</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages container */}
            <div ref={scrollableContainerRef} className="flex-1 p-4 overflow-y-auto">
                <div className="flex flex-col space-y-4">
                    {/* Welcome message if empty */}
                    {messages.length === 0 && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🧠</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Xin chào! Tôi là Kaito</h3>
                            <p className="text-sm text-white/60 max-w-sm mx-auto">
                                Huấn luyện viên sinh tồn giao dịch của bạn. Hãy chia sẻ bất kỳ điều gì bạn đang suy nghĩ.
                            </p>

                            {/* Quick actions */}
                            <div className="flex flex-wrap justify-center gap-2 mt-6">
                                {quickActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(action.text)}
                                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Render messages */}
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.type === 'text' ? (
                                <div className="flex flex-col">
                                    {/* Avatar for AI */}
                                    {msg.sender === 'ai' && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center">
                                                <span className="text-xs">🧠</span>
                                            </div>
                                            <span className="text-[10px] text-accent-primary font-bold uppercase tracking-wider">Kaito</span>
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-xs md:max-w-md lg:max-w-xs xl:max-w-md px-4 py-2 rounded-2xl ${msg.sender === 'user'
                                                ? 'bg-accent-primary text-white rounded-br-lg'
                                                : 'bg-gray-700 text-text-main rounded-bl-lg'
                                            }`}
                                    >
                                        <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                                    </div>
                                </div>
                            ) : (
                                <AnalysisCard analysis={msg.analysis} />
                            )}
                        </div>
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

            {/* Input area */}
            <div className="p-3 border-t border-divider bg-panel/50">
                <form onSubmit={handleSend} className="flex items-center space-x-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isLoading ? "Kaito đang trả lời..." : "Hỏi Kaito bất cứ điều gì..."}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className={`p-3 rounded-xl transition-all ${isLoading || !input.trim()
                                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                : 'bg-accent-primary text-white hover:brightness-110 active:scale-95'
                            }`}
                        disabled={isLoading || !input.trim()}
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>

                {/* Character hint */}
                <div className="flex justify-between items-center mt-2 px-1">
                    <span className="text-[10px] text-white/30">
                        💡 Tip: Chia sẻ cảm xúc để nhận lời khuyên tốt hơn
                    </span>
                    {!isOnline && (
                        <span className="text-[10px] text-amber-500 flex items-center gap-1">
                            <WifiOffIcon className="w-3 h-3" /> Offline
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
