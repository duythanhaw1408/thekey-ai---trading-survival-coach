import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { CrisisData } from '../types';
import { BookOpenIcon, BrainCircuitIcon } from './icons'; // Re-using an icon for journaling

interface CrisisInterventionModalProps {
    data: CrisisData;
    onClose: () => void;
    onActionComplete: (actionId: string) => void;
}

const CRISIS_CONFIG = {
    LEVEL_1: { title: 'Cần bình tĩnh', colorClass: 'border-gray-400 text-gray-200', icon: '🧠', severity: 'Mild' },
    LEVEL_2: { title: 'Cảm xúc cao', colorClass: 'border-gray-300 text-gray-100', icon: '⚠️', severity: 'Moderate' },
    LEVEL_3: { title: 'REVENGE TRADE DETECTED', colorClass: 'border-white text-white', icon: '🛡️', severity: 'High' },
    LEVEL_4: { title: '🚨 ACCOUNT AT RISK', colorClass: 'border-white text-white font-bold', icon: '📉', severity: 'Critical' }
};

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const MetricItem: React.FC<{ label: string; value: string | number; }> = ({ label, value }) => (
    <div className="bg-black/80 p-5 rounded-2xl border border-white/5 group-hover:border-accent-red/30 transition-all duration-500 text-center shadow-inner">
        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">{label}</p>
        <p className="text-xl font-black text-white tracking-widest italic font-sans italic">{value}</p>
    </div>
);

const ActionCard: React.FC<{ action: CrisisData['recommendedActions'][0], onClick: (id: string) => void }> = ({ action, onClick }) => (
    <div
        onClick={() => onClick(action.id)}
        className="bg-black/60 border border-white/5 p-5 rounded-2xl cursor-pointer flex items-center space-x-6 hover:border-accent-neon/40 hover:bg-accent-neon/[0.03] transition-all duration-500 group relative overflow-hidden"
    >
        <div className="text-4xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform duration-500">{action.icon}</div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white uppercase tracking-widest mb-1">
                {action.title} <span className="text-[9px] text-white/20 ml-2">[{action.duration}]</span>
            </p>
            <p className="text-[10px] text-white/40 font-medium uppercase tracking-wide italic">{action.description}</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-accent-neon opacity-0 group-hover:opacity-100 transition-opacity animate-pulse shadow-[0_0_10px_rgba(0,255,157,0.8)]" />
    </div>
);

export const CrisisInterventionModal: React.FC<CrisisInterventionModalProps> = ({ data, onClose, onActionComplete }) => {
    const [timer, setTimer] = useState(data.cooldownMinutes * 60);
    const config = CRISIS_CONFIG[data.level];

    useEffect(() => {
        setTimer(data.cooldownMinutes * 60);
    }, [data.cooldownMinutes]);

    useEffect(() => {
        if (timer <= 0) return;
        const interval = setInterval(() => {
            setTimer(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const isCritical = data.level === 'LEVEL_3' || data.level === 'LEVEL_4';

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[200] p-6 lg:p-12 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-b ${isCritical ? 'from-accent-red/[0.05]' : 'from-accent-yellow/[0.05]'} to-transparent pointer-events-none`} />
            <div className="absolute inset-0 cyber-grid opacity-[0.05] pointer-events-none" />

            <div
                className={`bg-black rounded-[3rem] shadow-[0_0_100px_rgba(255,0,0,0.2)] max-w-2xl w-full border border-white/10 relative overflow-hidden flex flex-col max-h-[90vh] ${isCritical ? 'shadow-accent-red/20 border-accent-red/30' : 'shadow-accent-yellow/20 border-accent-yellow/30'}`}
            >
                {/* Corner Markers */}
                <div className={`absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 rounded-tl-[3rem] pointer-events-none opacity-40 ${isCritical ? 'border-accent-red' : 'border-accent-yellow'}`} />
                <div className={`absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 rounded-tr-[3rem] pointer-events-none opacity-40 ${isCritical ? 'border-accent-red' : 'border-accent-yellow'}`} />

                {/* Header */}
                <header className="p-10 border-b border-white/5 relative z-10 flex justify-between items-center bg-black/60">
                    <div className="flex items-center gap-6">
                        <span className="text-4xl drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{config.icon}</span>
                        <div>
                            <h2 className={`text-[11px] font-black uppercase tracking-[0.5em] mb-2 ${isCritical ? 'text-accent-red drop-shadow-[0_0_8px_rgba(255,0,85,0.6)]' : 'text-accent-yellow'}`}>
                                SYSTEM_INTERVENTION_LEVEL: {data.level}
                            </h2>
                            <h3 className="text-3xl font-black text-white tracking-widest uppercase italic font-sans leading-none">
                                {config.title}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all font-sans text-2xl"
                    >
                        &times;
                    </button>
                </header>

                {/* Content */}
                <div className="flex-grow overflow-y-auto px-10 py-8 custom-scrollbar relative z-10">
                    <div className="space-y-10">
                        {/* Reasons */}
                        <div className="bg-black/40 border border-white/5 p-6 rounded-2xl">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4 flex items-center">
                                <span className={`w-1.5 h-4 mr-3 ${isCritical ? 'bg-accent-red shadow-[0_0_8px_rgba(255,0,85,0.8)]' : 'bg-accent-yellow'}`} />
                                THREAT_VECTORS_DETECTED
                            </h3>
                            <ul className="space-y-3">
                                {data.reasons.map((reason, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[11px] font-black text-white/80 uppercase tracking-widest">
                                        <span className="text-accent-red">{">>"}</span>
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Bio Insight */}
                        {data.bioInsight && (
                            <div className="bg-accent-neon/[0.03] border border-accent-neon/20 p-6 rounded-3xl relative overflow-hidden group">
                                <div className="absolute inset-x-0 top-0 h-1 bg-accent-neon opacity-20 group-hover:opacity-100 transition-opacity" />
                                <h3 className="text-[10px] font-black text-accent-neon uppercase tracking-[0.4em] mb-4 flex items-center">
                                    <BrainCircuitIcon className="w-5 h-5 mr-3 drop-shadow-[0_0_8px_rgba(0,255,157,0.5)] animate-pulse" />
                                    NEURAL_FEED_DIAGNOSTICS
                                </h3>
                                <p className="text-[11px] text-white/70 italic font-medium leading-relaxed uppercase tracking-wide">
                                    {data.bioInsight}
                                </p>
                            </div>
                        )}

                        {/* Data Insights */}
                        <div>
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-6">HISTORICAL_RISK_METRICS</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <MetricItem label="POST_LOSS_WIN_RATE" value={`${data.userMetrics.winRateAfterLoss}%`} />
                                <MetricItem label="BASELINE_EFFICIENCY" value={`${data.userMetrics.normalWinRate}%`} />
                                <MetricItem label="EQUITY_DRAINDOWN (REVENGE)" value={`$${data.userMetrics.revengeTradeLoss}`} />
                                <MetricItem label="EMOTIONAL_TURBULENCE" value={`${data.userMetrics.emotionalLevel}/10`} />
                            </div>
                        </div>

                        {/* Timer */}
                        <div className="bg-black/80 border border-white/10 p-10 rounded-[2.5rem] shadow-inner text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-accent-red/[0.02] animate-pulse pointer-events-none" />
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-6">MANDATORY_COOLDOWN_EPOCH</p>
                            <p className="text-7xl font-black text-white tracking-[0.2em] italic font-mono drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                {formatTime(timer)}
                            </p>
                            <div className="w-full bg-white/5 h-1.5 mt-8 rounded-full overflow-hidden p-0.5">
                                <motion.div
                                    className={`h-full rounded-full ${isCritical ? 'bg-accent-red shadow-[0_0_15px_rgba(255,0,85,0.6)]' : 'bg-accent-yellow shadow-[0_0_15px_rgba(255,238,0,0.6)]'}`}
                                    initial={{ width: '100%' }}
                                    animate={{ width: `${(timer / (data.cooldownMinutes * 60)) * 100}%` }}
                                    transition={{ duration: 1, ease: "linear" }}
                                />
                            </div>
                        </div>

                        {/* Action Cards */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">NEURAL_RESET_PROTOCOLS</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {data.recommendedActions.map(action => (
                                    <ActionCard key={action.id} action={action} onClick={onActionComplete} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="p-10 border-t border-white/5 bg-black/80 rounded-b-[3rem] flex justify-between items-center relative z-10">
                    <div className="flex flex-col gap-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">ESTIMATED_ACCOUNT_HAZARD</p>
                        <p className={`text-xl font-black italic ${isCritical ? 'text-accent-red' : 'text-accent-yellow'}`}>{data.estimatedRisk}%</p>
                    </div>
                    <button
                        disabled={timer > 0}
                        onClick={onClose}
                        className={`px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500 shadow-xl border
                            ${timer > 0
                                ? 'bg-white/5 text-white/20 border-white/5 cursor-not-allowed'
                                : 'bg-white text-black border-transparent hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                            }`}
                    >
                        {timer > 0 ? `RESTRICTED [${formatTime(timer)}]` : "DISMISS_HAZARD"}
                    </button>
                </footer>
            </div>
        </div>
    );
};