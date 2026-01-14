
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
    const currentXpInLevel = xp - (Object.values(MASTERY_LEVELS).find(l => l.title === levelTitle)?.xpThreshold ?? 0);
    const levelXpTotal = xpToNext - (Object.values(MASTERY_LEVELS).find(l => l.title === levelTitle)?.xpThreshold ?? 0);
    const levelProgress = levelXpTotal > 0 ? (currentXpInLevel / levelXpTotal) * 100 : 100;

    return (
        <div className="bg-black/60 p-8 rounded-[2.5rem] border border-accent-neon/10 mb-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-neon/[0.03] to-transparent pointer-events-none" />
            <div className="flex justify-between items-end mb-6">
                <div className="flex flex-col">
                    <p className="text-[10px] font-black text-accent-neon uppercase tracking-[0.5em] mb-2 drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]">OPERATOR_RANK</p>
                    <h3 className="text-3xl font-black text-white italic font-sans tracking-widest leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{levelTitle}</h3>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">NEURAL_DENSITY_SYNC</span>
                    <span className="text-sm font-black text-accent-neon font-mono tracking-tighter">{xp} <span className="text-white/20">/</span> {xpToNext} <span className="text-white/40">XP</span></span>
                </div>
            </div>
            <div className="w-full bg-black h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
                <motion.div
                    className="bg-accent-neon h-full rounded-full shadow-[0_0_15px_rgba(0,255,157,0.6)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:40px_40px] animate-[pulse_2s_infinite]" />
            </div>
        </div>
    );
};

const QuestCard: React.FC<{ quest: Quest }> = ({ quest }) => {
    const progress = (quest.progress / quest.target) * 100;
    return (
        <div className="bg-black/40 p-6 rounded-2xl border border-white/5 hover:border-accent-neon/20 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent-neon/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex-1 min-w-0 pr-4">
                    <p className="font-black text-[11px] text-white uppercase tracking-widest">{quest.title}</p>
                    <p className="text-[10px] text-white/40 font-medium uppercase tracking-tight mt-1 leading-relaxed line-clamp-2 italic">{quest.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-black text-accent-neon uppercase font-mono bg-accent-neon/10 px-2 py-0.5 rounded border border-accent-neon/20 shadow-inner">+{quest.rewardXp}_XP</p>
                    <p className="text-[9px] font-black text-white/20 mt-2 uppercase tracking-widest">{quest.progress} <span className="text-accent-neon/40 text-[8px]">/</span> {quest.target}</p>
                </div>
            </div>
            <div className="w-full bg-black h-1 rounded-full overflow-hidden relative">
                <div className="bg-accent-neon h-full rounded-full shadow-[0_0_5px_rgba(0,255,157,0.4)] opacity-60" style={{ width: `${progress}%` }}></div>
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
        <div className="bg-black border border-accent-neon/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent-neon/20 to-transparent" />
            <div className="flex items-center gap-4 mb-8">
                <div className="w-1.5 h-6 bg-accent-neon shadow-[0_0_10px_rgba(0,255,157,0.8)]" />
                <div>
                    <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">NEURAL_POD_COMMS</h4>
                    <p className="text-xs font-black text-accent-neon uppercase tracking-widest italic">{pod.name}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-neon animate-pulse shadow-[0_0_10px_rgba(0,255,157,0.8)]" />
                    <span className="text-[8px] font-black text-accent-neon uppercase tracking-widest">LIVE_DENSITY</span>
                </div>
            </div>

            <div className="h-64 overflow-y-auto space-y-6 pr-4 mb-6 custom-scrollbar relative">
                {pod.messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                        <p className={`text-[8px] font-black uppercase tracking-widest mb-2 ${msg.sender === 'You' ? 'text-accent-neon/60' : 'text-white/20'}`}>{msg.sender}</p>
                        <div className={`px-5 py-3 rounded-2xl max-w-[90%] border backdrop-blur-md transition-all duration-300 ${msg.sender === 'You'
                            ? 'bg-accent-neon/5 border-accent-neon/20 text-white shadow-[0_0_20px_rgba(0,255,157,0.05)]'
                            : 'bg-black/40 border-white/5 text-white/80'}`}>
                            <p className="text-[11px] font-medium leading-relaxed uppercase tracking-wide tracking-tighter italic">{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5 focus-within:border-accent-neon/40 transition-all duration-500">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="TRANSMIT_NEURAL_PULSE..."
                    className="flex-1 bg-transparent border-none rounded-xl px-4 py-2.5 text-[11px] font-black text-white/80 placeholder:text-white/10 uppercase tracking-widest focus:ring-0" />
                <button type="submit" className="bg-accent-neon text-black rounded-xl p-3 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] group">
                    <SendIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                </button>
            </form>
        </div>
    );
};

export const MasteryTracker: React.FC<MasteryTrackerProps> = ({ masteryData, pod, onSendPodMessage, shadowScore }) => {
    if (!masteryData) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-black/20 rounded-3xl border border-dashed border-white/5">
                <div className="w-12 h-12 border-4 border-accent-neon/20 border-t-accent-neon rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">INITIATING_MASTERY_PULSE...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <MasteryHeader levelTitle={masteryData.levelTitle} xp={masteryData.xp} xpToNext={masteryData.xpToNextLevel} />

            {shadowScore && (
                <div className="flex items-center justify-between px-8 py-4 bg-accent-neon/5 rounded-3xl border border-accent-neon/10 -mt-6 group hover:border-accent-neon/30 transition-all duration-500">
                    <div className="flex items-center gap-4">
                        <BrainCircuitIcon className="w-5 h-5 text-accent-neon animate-pulse drop-shadow-[0_0_8px_rgba(0,255,157,0.6)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">SELF_AWARENESS_VECTOR</span>
                    </div>
                    <div className={`text-xl font-black italic drop-shadow-[0_0_10px_rgba(0,255,157,0.4)] ${shadowScore.adjustmentFactors.xpMultiplier >= 1.0 ? 'text-accent-neon' : 'text-accent-red'}`}>
                        {shadowScore.adjustmentFactors.xpMultiplier}x
                    </div>
                </div>
            )}

            <div>
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-1 h-1 bg-accent-neon shadow-[0_0_5px_rgba(0,255,157,0.8)]" />
                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">ACTIVE_PROTOCOL_QUESTS</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {masteryData.quests.map(quest => <QuestCard key={quest.id} quest={quest} />)}
                </div>
            </div>

            {pod && <PodChat pod={pod} onSend={onSendPodMessage} />}

            <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1 h-1 bg-white/20" />
                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">DECRYPTED_DATABASE_CORE</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {masteryData.unlockedContent.map(content => (
                        <div key={content.id} className="bg-black/60 border border-white/5 p-5 rounded-2xl flex items-center space-x-6 group hover:border-accent-neon/20 transition-all duration-500">
                            <div className="w-10 h-10 rounded-xl bg-black border border-accent-neon/20 flex items-center justify-center flex-shrink-0 group-hover:border-accent-neon transition-colors">
                                <CheckCircleIcon className="w-5 h-5 text-accent-neon drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-xs text-white uppercase tracking-widest">{content.title}</p>
                                <p className="text-[10px] text-white/40 font-medium uppercase tracking-tight mt-1 line-clamp-1 italic">{content.summary}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const MASTERY_LEVELS = {
    NOVICE: { xpThreshold: 0, title: 'NOVICE_SURVIVOR' },
    APPRENTICE: { xpThreshold: 1000, title: 'APPRENTICE_OF_DISCIPLINE' },
    JOURNEYMAN: { xpThreshold: 3500, title: 'JOURNEYMAN_OF_PROCESS' },
    MASTER: { xpThreshold: 8000, title: 'MASTER_OF_SELF_CONTROL' },
    GRANDMASTER: { xpThreshold: 20000, title: 'GRANDMASTER_OF_SURVIVAL' }
};