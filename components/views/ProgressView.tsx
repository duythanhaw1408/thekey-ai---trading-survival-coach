import React from 'react';
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
        <div className="space-y-6 animate-entrance">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Real-time Progress Card */}
                <div className="lg:col-span-12">
                    <GoalProgressCard
                        goals={weeklyGoals}
                        trades={tradeHistory}
                        checkinCount={checkinCount}
                    />
                </div>

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
                            <div className="p-6 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                <CalendarIcon className="w-8 h-8 text-accent-primary/30 mx-auto mb-3" />
                                <p className="text-white font-bold text-sm mb-2">Mục tiêu Tuần</p>
                                <p className="text-text-secondary text-xs mb-4">
                                    AI sẽ tạo mục tiêu cá nhân hóa dựa trên dữ liệu trading của bạn.
                                </p>
                                <div className="text-[10px] text-gray-500 bg-white/5 rounded-lg p-3 text-left">
                                    <p className="font-semibold text-accent-yellow mb-2">📋 Yêu cầu mở khóa:</p>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${tradeHistory.length >= 3 ? 'bg-accent-green text-black' : 'bg-white/10'}`}>
                                            {tradeHistory.length >= 3 ? '✓' : tradeHistory.length}
                                        </span>
                                        <span>Hoàn thành 3 trades với Dojo</span>
                                    </div>
                                    <p className="mt-2 text-accent-primary">👉 Còn cần {Math.max(0, 3 - tradeHistory.length)} trade nữa</p>
                                </div>
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
                            <div className="p-6 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                <FileTextIcon className="w-8 h-8 text-accent-primary/30 mx-auto mb-3" />
                                <p className="text-white font-bold text-sm mb-2">Báo cáo Hiệu suất</p>
                                <p className="text-text-secondary text-xs mb-4">
                                    AI phân tích chi tiết hiệu suất trading trong tuần và đề xuất cải thiện.
                                </p>
                                <div className="text-[10px] text-gray-500 bg-white/5 rounded-lg p-3 text-left">
                                    <p className="font-semibold text-accent-yellow mb-2">📊 Yêu cầu mở khóa:</p>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${tradeHistory.length >= 5 ? 'bg-accent-green text-black' : 'bg-white/10'}`}>
                                            {tradeHistory.length >= 5 ? '✓' : tradeHistory.length}
                                        </span>
                                        <span>Hoàn thành 5 trades với Dojo</span>
                                    </div>
                                    <p className="mt-2 text-accent-primary">👉 Còn cần {Math.max(0, 5 - tradeHistory.length)} trade nữa</p>
                                </div>
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
