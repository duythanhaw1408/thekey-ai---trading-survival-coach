import React from 'react';
import { motion } from 'framer-motion';
import type { MasteryData, Pod, WeeklyGoals, WeeklyReport, Trade, TraderStats } from '../../types';
import { MasteryTracker } from '../MasteryTracker';
import { WeeklyGoalsCard } from '../WeeklyGoalsCard';
import { WeeklyReportCard } from '../WeeklyReportCard';
import { CalendarIcon, FileTextIcon, TrophyIcon, ChartBarIcon } from '../icons';
import { LearningInsights } from '../LearningInsights';
import AIAccuracyDashboard from '../AIAccuracyDashboard';
import { useLanguage } from '../../contexts/LanguageContext';
import { GoalProgressCard } from '../GoalProgressCard';

interface ProgressViewProps {
    masteryData: MasteryData | null;
    pod: Pod | null;
    onSendPodMessage: (text: string) => void;
    shadowScore: any;
    weeklyGoals: WeeklyGoals | null;
    isLoadingGoals: boolean;
    onGetWeeklyGoals: () => void;
    weeklyReport: WeeklyReport | null;
    isLoadingReport: boolean;
    onGetWeeklyReport: () => void;
    tradeHistory: Trade[];
    stats: TraderStats;
    checkinCount?: number;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
    masteryData,
    pod,
    onSendPodMessage,
    shadowScore,
    weeklyGoals,
    isLoadingGoals,
    onGetWeeklyGoals,
    weeklyReport,
    isLoadingReport,
    onGetWeeklyReport,
    tradeHistory,
    stats,
    checkinCount = 0
}) => {
    const { t, language } = useLanguage();

    return (
        <div className="space-y-8 pb-12 animate-entrance selection:bg-accent-neon selection:text-black">
            <div className="bento-grid !p-0">
                {/* Real-time Progress Card */}
                <div className="span-full">
                    <GoalProgressCard
                        goals={weeklyGoals}
                        trades={tradeHistory}
                        checkinCount={checkinCount}
                    />
                </div>

                {/* Mastery & Quests */}
                <div className="span-full">
                    <div className="bento-card !p-8 relative overflow-hidden group">
                        <div className="absolute inset-0 cyber-grid opacity-5" />
                        <div className="flex items-center gap-3 mb-8 relative z-10">
                            <div className="w-1.5 h-6 bg-accent-neon" />
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">SURVIVOR_GROWTH_&_MASTERY_CORE</h3>
                        </div>
                        <div className="relative z-10">
                            <MasteryTracker
                                masteryData={masteryData}
                                pod={pod}
                                onSendPodMessage={onSendPodMessage}
                                shadowScore={shadowScore}
                            />
                        </div>
                    </div>
                </div>

                {/* Analytical Reports Section */}
                <div className="span-6">
                    <div className="bento-card !p-8 h-full flex flex-col group">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center">
                                <CalendarIcon className="w-5 h-5 mr-4 text-accent-neon" />
                                WEEKLY_OBJECTIVES
                            </h3>
                            <button
                                onClick={onGetWeeklyGoals}
                                disabled={isLoadingGoals || tradeHistory.length < 3}
                                className="px-5 py-2.5 bg-accent-neon/5 border border-accent-neon/20 text-accent-neon text-[9px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-accent-neon hover:text-black transition-all disabled:opacity-20 neon-glow"
                            >
                                {isLoadingGoals ? 'SYNCING_DATA...' : 'REFRESH_GOALS'}
                            </button>
                        </div>

                        {isLoadingGoals && (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
                                <div className="w-8 h-8 border-2 border-accent-neon border-t-transparent rounded-full animate-spin" />
                                <p className="text-[10px] font-black text-accent-neon animate-pulse uppercase tracking-[0.3em]">CALIBRATING_PERSONALIZED_VECTORS...</p>
                            </div>
                        )}

                        {!weeklyGoals && !isLoadingGoals && (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center border border-dashed border-accent-neon/10 rounded-2xl bg-black/20 group-hover:bg-black/40 transition-colors">
                                <div className="w-16 h-16 bg-accent-neon/5 rounded-full flex items-center justify-center mb-8 border border-accent-neon/10">
                                    <CalendarIcon className="w-8 h-8 text-accent-neon/40" />
                                </div>
                                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-3">MỤC TIÊU TUẦN_LOCKED</h4>
                                <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest mb-8 max-w-[200px] leading-relaxed">
                                    AI protocol requires neural data before generating objectives.
                                </p>
                                <div className="w-full max-w-[240px] space-y-4 bg-black/40 p-5 rounded-xl border border-white/5">
                                    <p className="text-[8px] font-black text-accent-yellow uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1 h-3 bg-accent-yellow" /> UNLOCK_REQUIREMENTS:
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">DOJO_COMMITS</span>
                                            <span className={`text-[9px] font-black ${tradeHistory.length >= 3 ? 'text-accent-neon' : 'text-white/20'}`}>
                                                {tradeHistory.length}/3
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(tradeHistory.length / 3 * 100, 100)}%` }}
                                                className="h-full bg-accent-neon shadow-[0_0_8px_rgba(0,255,157,0.5)]"
                                            />
                                        </div>
                                    </div>
                                    {tradeHistory.length < 3 && (
                                        <p className="text-[8px] font-black text-accent-neon uppercase animate-pulse">
                                            {">>"} NEED_{Math.max(0, 3 - tradeHistory.length)}_MORE_SESSIONS
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                        {weeklyGoals && <WeeklyGoalsCard goals={weeklyGoals} />}
                    </div>
                </div>

                <div className="span-6">
                    <div className="bento-card !p-8 h-full flex flex-col group">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center">
                                <FileTextIcon className="w-5 h-5 mr-4 text-accent-neon" />
                                SURVIVAL_PERFORMANCE_LEDGER
                            </h3>
                            <button
                                onClick={onGetWeeklyReport}
                                disabled={isLoadingReport || tradeHistory.length < 5}
                                className="px-5 py-2.5 bg-accent-neon/5 border border-accent-neon/20 text-accent-neon text-[9px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-accent-neon hover:text-black transition-all disabled:opacity-20 neon-glow"
                            >
                                {isLoadingReport ? 'COMPILING...' : 'GENERATE_REPORT'}
                            </button>
                        </div>

                        {isLoadingReport && (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
                                <div className="w-8 h-8 border-2 border-accent-neon border-t-transparent rounded-full animate-spin" />
                                <p className="text-[10px] font-black text-accent-neon animate-pulse uppercase tracking-[0.3em]">PROCESSING_WEEKLY_METRICS...</p>
                            </div>
                        )}

                        {!weeklyReport && !isLoadingReport && (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center border border-dashed border-accent-neon/10 rounded-2xl bg-black/20 group-hover:bg-black/40 transition-colors">
                                <div className="w-16 h-16 bg-accent-neon/5 rounded-full flex items-center justify-center mb-8 border border-accent-neon/10">
                                    <FileTextIcon className="w-8 h-8 text-accent-neon/40" />
                                </div>
                                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-3">BÁO CÁO HIỆU SUẤT_STANDBY</h4>
                                <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest mb-8 max-w-[200px] leading-relaxed">
                                    Insufficient neural bandwidth for full performance ledger.
                                </p>
                                <div className="w-full max-w-[240px] space-y-4 bg-black/40 p-5 rounded-xl border border-white/5">
                                    <p className="text-[8px] font-black text-accent-yellow uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1 h-3 bg-accent-yellow" /> DATA_THRESHOLD:
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">MIN_SESSIONS</span>
                                            <span className={`text-[9px] font-black ${tradeHistory.length >= 5 ? 'text-accent-neon' : 'text-white/20'}`}>
                                                {tradeHistory.length}/5
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(tradeHistory.length / 5 * 100, 100)}%` }}
                                                className="h-full bg-accent-neon shadow-[0_0_8px_rgba(0,255,157,0.5)]"
                                            />
                                        </div>
                                    </div>
                                    {tradeHistory.length < 5 && (
                                        <p className="text-[8px] font-black text-accent-neon uppercase animate-pulse">
                                            {">>"} ACCUMULATE_{Math.max(0, 5 - tradeHistory.length)}_MORE_ENTRIES
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                        {weeklyReport && <WeeklyReportCard report={weeklyReport} />}
                    </div>
                </div>

                {/* AI Accuracy Dashboard Section */}
                <div className="span-full">
                    <AIAccuracyDashboard />
                </div>

                {/* AI Self-Learning Section */}
                <div className="span-full">
                    <div className="bento-card !p-10 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <ChartBarIcon className="w-32 h-32 text-accent-neon" />
                        </div>
                        <div className="relative z-10">
                            <LearningInsights />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
