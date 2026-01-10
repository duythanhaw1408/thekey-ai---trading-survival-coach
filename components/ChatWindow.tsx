
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { SendIcon } from './icons';
import { AnalysisCard } from './AnalysisCard';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (message: ChatMessage) => void;
  isLoading: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const scrollableContainerRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    // This more precise scrolling method prevents the entire page from jumping.
    if (scrollableContainerRef.current) {
      scrollableContainerRef.current.scrollTop = scrollableContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage({
        id: Date.now() + Math.random(),
        sender: 'user',
        type: 'text',
        text: input.trim(),
      });
      setInput('');
    }
  };

  return (
    <div className="h-[calc(100vh-280px)] min-h-[500px] flex flex-col">
      <div ref={scrollableContainerRef} className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.type === 'text' ? (
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-xs xl:max-w-md px-4 py-2 rounded-2xl ${msg.sender === 'user'
                      ? 'bg-accent-primary text-white rounded-br-lg'
                      : 'bg-gray-700 text-text-main rounded-bl-lg'
                    }`}
                >
                  <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                </div>
              ) : (
                <AnalysisCard analysis={msg.analysis} />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 border-t border-divider">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "Coach is typing..." : "Ask your coach..."}
            className="flex-1 bg-panel border border-divider rounded-lg px-4 py-2 text-text-main placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-accent-primary text-white rounded-lg p-2.5 hover:brightness-110 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};