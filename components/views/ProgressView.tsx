
import React from 'react';
import type { MasteryData, Pod, WeeklyGoals, WeeklyReport, Trade, TraderStats } from '../../types';
import { MasteryTracker } from '../MasteryTracker';
import { WeeklyGoalsCard } from '../WeeklyGoalsCard';
import { WeeklyReportCard } from '../WeeklyReportCard';
import { CalendarIcon, FileTextIcon, TrophyIcon, ChartBarIcon } from '../icons';
import { LearningInsights } from '../LearningInsights';
import AIAccuracyDashboard from '../AIAccuracyDashboard';

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
    stats
}) => {
    return (
        <div className="space-y-6 animate-entrance">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Mastery & Quests - Taking more space */}
                <div className="lg:col-span-12">
                    <div className="bento-card p-6 bg-black/40 border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <TrophyIcon className="w-5 h-5 text-accent-primary-neon" />
                            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Survivor Growth & Mastery</h3>
                        </div>
                        <MasteryTracker
                            masteryData={masteryData}
                            pod={pod}
                            onSendPodMessage={onSendPodMessage}
                            shadowScore={shadowScore}
                        />
                    </div>
                </div>

                {/* Analytical Reports Section */}
                <div className="lg:col-span-6">
                    <div className="bento-card p-6 bg-black/40 border-white/5 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center">
                                <CalendarIcon className="w-5 h-5 mr-3 text-accent-primary" />
                                Weekly Objectives
                            </h3>
                            <button
                                onClick={onGetWeeklyGoals}
                                disabled={isLoadingGoals || tradeHistory.length < 3}
                                className="px-4 py-2 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-accent-primary/20 transition-all disabled:opacity-30"
                            >
                                {isLoadingGoals ? 'Calibrating...' : 'Refresh Goals'}
                            </button>
                        </div>

                        {isLoadingGoals && <div className="p-12 text-center text-text-secondary animate-pulse uppercase text-xs font-bold tracking-widest">Generating personalized objectives...</div>}
                        {!weeklyGoals && !isLoadingGoals && (
                            <div className="p-12 text-center border border-dashed border-white/5 rounded-2xl">
                                <p className="text-white/20 text-xs font-bold uppercase tracking-widest">No active goals. Generate them to track your progress.</p>
                            </div>
                        )}
                        {weeklyGoals && <WeeklyGoalsCard goals={weeklyGoals} />}
                    </div>
                </div>

                <div className="lg:col-span-6">
                    <div className="bento-card p-6 bg-black/40 border-white/5 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center">
                                <FileTextIcon className="w-5 h-5 mr-3 text-accent-primary" />
                                Survival Performance Report
                            </h3>
                            <button
                                onClick={onGetWeeklyReport}
                                disabled={isLoadingReport || tradeHistory.length < 5}
                                className="px-4 py-2 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-accent-primary/20 transition-all disabled:opacity-30"
                            >
                                {isLoadingReport ? 'Processing...' : 'Generate Report'}
                            </button>
                        </div>

                        {isLoadingReport && <div className="p-12 text-center text-text-secondary animate-pulse uppercase text-xs font-bold tracking-widest">Compiling weekly metrics...</div>}
                        {!weeklyReport && !isLoadingReport && (
                            <div className="p-12 text-center border border-dashed border-white/5 rounded-2xl">
                                <p className="text-white/20 text-xs font-bold uppercase tracking-widest text-center">Cần ít nhất 5 trades để tạo báo cáo hiệu suất chi tiết.</p>
                            </div>
                        )}
                        {weeklyReport && <WeeklyReportCard report={weeklyReport} />}
                    </div>
                </div>

                {/* AI Accuracy Dashboard Section */}
                <div className="lg:col-span-12">
                    <AIAccuracyDashboard />
                </div>

                {/* AI Self-Learning Section */}
                <div className="lg:col-span-12">
                    <div className="bento-card p-6 bg-black/40 border-white/5">
                        <LearningInsights />
                    </div>
                </div>
            </div>
        </div>
    );
};
