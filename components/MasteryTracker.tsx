
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { MasteryData, Pod, PodMessage, Quest, ShadowScore } from '../types';
import { BrainCircuitIcon, BookOpenIcon, CheckCircleIcon, TargetIcon, SendIcon } from './icons';

interface MasteryTrackerProps {
    masteryData: MasteryData | null;
    pod: Pod | null;
    onSendPodMessage: (text: string) => void;
    shadowScore: ShadowScore | null;
}

const MasteryHeader: React.FC<{ levelTitle: string; xp: number; xpToNext: number }> = ({ levelTitle, xp, xpToNext }) => {
    const progress = xpToNext > 0 ? (xp / xpToNext) * 100 : 100;
    const currentXpInLevel = xp - (Object.values(MASTERY_LEVELS).find(l => l.title === levelTitle)?.xpThreshold ?? 0);
    const levelXpTotal = xpToNext - (Object.values(MASTERY_LEVELS).find(l => l.title === levelTitle)?.xpThreshold ?? 0);
    const levelProgress = levelXpTotal > 0 ? (currentXpInLevel / levelXpTotal) * 100 : 100;


    return (
        <div className="bg-background p-4 rounded-lg border border-divider mb-6">
            <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-accent-primary leading-tight">{levelTitle}</h3>
                    {/* Shadow Multiplier will be passed down or handled here if we pass it to MasteryHeader */}
                </div>
                <span className="text-sm font-mono text-text-secondary">{xp} / {xpToNext} XP</span>
            </div>
            <div className="w-full bg-divider rounded-full h-2.5">
                <motion.div
                    className="bg-accent-primary h-2.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                />
            </div>
        </div>
    );
};

const QuestCard: React.FC<{ quest: Quest }> = ({ quest }) => {
    const progress = (quest.progress / quest.target) * 100;
    return (
        <div className="bg-background p-3 rounded-lg border border-divider">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-sm text-text-main">{quest.title}</p>
                    <p className="text-[11px] text-text-secondary mt-1 leading-tight">{quest.description}</p>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                    <p className="text-xs font-mono text-accent-primary">+{quest.rewardXp} XP</p>
                    <p className="text-xs font-mono text-text-secondary">{quest.progress}/{quest.target}</p>
                </div>
            </div>
            <div className="w-full bg-divider rounded-full h-1.5 mt-2">
                <div className="bg-accent-green h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
};

const PodChat: React.FC<{ pod: Pod; onSend: (text: string) => void; }> = ({ pod, onSend }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current && messagesEndRef.current.parentElement) {
            messagesEndRef.current.parentElement.scrollTop = messagesEndRef.current.parentElement.scrollHeight;
        }
    }, [pod.messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSend(input.trim());
            setInput('');
        }
    };

    return (
        <div className="bg-background p-4 rounded-lg border border-divider">
            <h4 className="text-md font-semibold text-text-secondary mb-3">Anonymous Support Pod: <span className="text-accent-primary font-bold">{pod.name}</span></h4>
            <div className="h-48 overflow-y-auto space-y-4 pr-2 mb-3">
                {pod.messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                        <p className={`text-xs font-semibold px-1 mb-0.5 ${msg.sender === 'You' ? 'text-accent-primary' : 'text-text-secondary'}`}>{msg.sender}</p>
                        <div className={`px-3 py-2 rounded-xl max-w-[85%] ${msg.sender === 'You' ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/10' : 'bg-white/10 text-white'}`}>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="flex items-center space-x-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Share your process thoughts..."
                    className="flex-1 bg-panel border border-divider rounded-full px-4 py-1.5 text-sm text-text-main focus:outline-none focus:ring-1 focus:ring-accent-primary" />
                <button type="submit" className="bg-accent-primary text-white rounded-full p-2 hover:brightness-110 transition-colors">
                    <SendIcon className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
};

export const MasteryTracker: React.FC<MasteryTrackerProps> = ({ masteryData, pod, onSendPodMessage, shadowScore }) => {
    if (!masteryData) {
        return <div className="text-center text-text-secondary">Loading Mastery Data...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <MasteryHeader levelTitle={masteryData.levelTitle} xp={masteryData.xp} xpToNext={masteryData.xpToNextLevel} />
            </div>
            {shadowScore && (
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-lg border border-white/5 -mt-4 mb-4">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Self-Awareness Multiplier</span>
                    <div className={`text-xs font-black px-2 py-0.5 rounded-md ${shadowScore.adjustmentFactors.xpMultiplier >= 1.0 ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'}`}>
                        {shadowScore.adjustmentFactors.xpMultiplier}x
                    </div>
                </div>
            )}

            <div>
                <h4 className="flex items-center text-md font-semibold text-text-main mb-3">
                    <TargetIcon className="w-5 h-5 mr-2 text-accent-green" />
                    Active Quests
                </h4>
                <div className="space-y-3">
                    {masteryData.quests.map(quest => <QuestCard key={quest.id} quest={quest} />)}
                </div>
            </div>

            {pod && <PodChat pod={pod} onSend={onSendPodMessage} />}

            <div>
                <h4 className="flex items-center text-md font-semibold text-text-main mb-3">
                    <BookOpenIcon className="w-5 h-5 mr-2 text-text-secondary" />
                    Unlocked Content
                </h4>
                <div className="space-y-3">
                    {masteryData.unlockedContent.map(content => (
                        <div key={content.id} className="bg-background border border-divider p-3 rounded-lg flex items-center space-x-3">
                            <CheckCircleIcon className="w-5 h-5 text-accent-green flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-text-main">{content.title}</p>
                                <p className="text-xs text-text-secondary">{content.summary}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const MASTERY_LEVELS = {
    NOVICE: { xpThreshold: 0, title: 'Novice Survivor' },
    APPRENTICE: { xpThreshold: 1000, title: 'Apprentice of Discipline' },
    JOURNEYMAN: { xpThreshold: 3500, title: 'Journeyman of Process' },
    MASTER: { xpThreshold: 8000, title: 'Master of Self-Control' },
    GRANDMASTER: { xpThreshold: 20000, title: 'Grandmaster of Survival' }
};