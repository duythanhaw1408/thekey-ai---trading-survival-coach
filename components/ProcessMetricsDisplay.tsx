
import React from 'react';
import type { ProcessStats } from '../types';
import { TargetIcon, ShieldCheckIcon, ActivityIcon, ClipboardCheckIcon } from './icons';

const MetricBar: React.FC<{ icon: React.ReactNode; label: string; score: number; isWeakest: boolean }> = ({ icon, label, score, isWeakest }) => {
    const scoreColor = score > 7 ? 'bg-accent-green-neon neon-text-green' : score > 5 ? 'bg-accent-yellow-neon neon-text-yellow' : 'bg-accent-red-neon neon-text-red';
    const highlightClass = isWeakest ? 'ring-1 ring-accent-red/50 bg-accent-red/5' : 'bg-white/5';

    return (
        <div className={`p-4 rounded-xl ${highlightClass} transition-all duration-500 hover:border-white/10 border border-transparent`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-xs font-black text-white/40 uppercase tracking-widest">
                    {icon}
                    <span className="ml-2">{label}</span>
                </div>
                <span className={`font-mono font-black text-sm ${scoreColor}`}>{score.toFixed(1)}</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${scoreColor.split(' ')[0]}`} style={{ width: `${score * 10}%` }}></div>
            </div>
        </div>
    );
};


export const ProcessMetricsDisplay: React.FC<{ processStats: ProcessStats }> = ({ processStats }) => {
    if (!processStats.detailedScores) {
        return (
            <div className="w-full glass-panel p-8 text-center text-white/20 font-bold uppercase tracking-widest text-xs">
                Initialize protocol for process metrics
            </div>
        );
    }

    const { detailedScores, weakestArea } = processStats;

    return (
        <div className="w-full glass-panel p-6 space-y-4 bg-black/40 border-white/5">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center mb-4">Performance Vectors</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetricBar
                    icon={<TargetIcon className="w-4 h-4 text-accent-primary" />}
                    label="Setup"
                    score={detailedScores.averageSetup}
                    isWeakest={weakestArea === 'SETUP'}
                />
                <MetricBar
                    icon={<ShieldCheckIcon className="w-4 h-4 text-accent-green" />}
                    label="Risk"
                    score={detailedScores.averageRisk}
                    isWeakest={weakestArea === 'RISK'}
                />
                <MetricBar
                    icon={<ClipboardCheckIcon className="w-4 h-4 text-accent-yellow" />}
                    label="Logic"
                    score={detailedScores.averageExecution}
                    isWeakest={weakestArea === 'EXECUTION'}
                />
                <MetricBar
                    icon={<ActivityIcon className="w-4 h-4 text-accent-red" />}
                    label="Emotion"
                    score={detailedScores.averageEmotion}
                    isWeakest={weakestArea === 'EMOTION'}
                />
            </div>
        </div>
    );
};
