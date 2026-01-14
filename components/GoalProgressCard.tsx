// components/GoalProgressCard.tsx
/**
 * THEKEY AI - Goal Progress Display Card
 * 
 * Visual display of weekly goal progress with:
 * - Progress bars
 * - Status indicators
 * - Encouraging messages
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { Trade, WeeklyGoals } from '../types';
import { useGoalProgress } from '../hooks/useGoalProgress';

interface GoalProgressCardProps {
    goals: WeeklyGoals | null;
    trades: Trade[];
    checkinCount?: number;
}

export const GoalProgressCard: React.FC<GoalProgressCardProps> = ({
    goals,
    trades,
    checkinCount = 0
}) => {
    const progressList = useGoalProgress(goals, trades, checkinCount);

    if (progressList.length === 0) {
        return null;
    }

    const completedCount = progressList.filter(p => p.status === 'completed').length;
    const overallProgress = Math.round(
        progressList.reduce((sum, p) => sum + p.percentage, 0) / progressList.length
    );

    return (
        <div className="glass-panel p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">
                        Tiến Độ Tuần Này
                    </h3>
                    <p className="text-lg font-bold text-white mt-1">
                        {completedCount}/{progressList.length} mục tiêu
                    </p>
                </div>
                <div className="relative w-16 h-16">
                    {/* Circular progress */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="4"
                        />
                        <motion.circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke={overallProgress >= 100 ? '#10b981' : overallProgress >= 50 ? '#f59e0b' : '#6366f1'}
                            strokeWidth="4"
                            strokeLinecap="round"
                            initial={{ strokeDasharray: '0 176' }}
                            animate={{ strokeDasharray: `${(overallProgress / 100) * 176} 176` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-white">{overallProgress}%</span>
                    </div>
                </div>
            </div>

            {/* Goal list */}
            <div className="space-y-3">
                {progressList.map((progress, index) => (
                    <motion.div
                        key={progress.goalId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-1"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{progress.icon}</span>
                                <span className="text-sm text-white/80">{progress.title}</span>
                            </div>
                            <span className={`text-xs font-bold ${progress.status === 'completed' ? 'text-accent-green' :
                                progress.status === 'in_progress' ? 'text-accent-yellow' :
                                    'text-white/40'
                                }`}>
                                {progress.current}/{progress.target}
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full rounded-full ${progress.status === 'completed' ? 'bg-accent-green' :
                                    progress.status === 'in_progress' ? 'bg-accent-yellow' :
                                        'bg-white/20'
                                    }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(progress.percentage, 100)}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Encouragement */}
            {completedCount === progressList.length && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-accent-green/10 border border-accent-green/20 rounded-xl p-3 text-center"
                >
                    <span className="text-2xl">🎉</span>
                    <p className="text-sm text-accent-green font-bold mt-1">
                        Xuất sắc! Bạn đã hoàn thành tất cả mục tiêu tuần này!
                    </p>
                </motion.div>
            )}
        </div>
    );
};
