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
        <div className="bg-black/40 backdrop-blur-md border border-accent-neon/20 rounded-2xl p-6 shadow-2xl space-y-6 neon-glow">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-[10px] font-black text-accent-neon/40 uppercase tracking-[0.4em]">
                        NEURAL_GOAL_TRACKER
                    </h3>
                    <p className="text-2xl font-black text-white tracking-tight uppercase italic">
                        {completedCount}<span className="text-accent-neon/30 mx-1">/</span>{progressList.length} <span className="text-xs not-italic tracking-widest text-white/50">Objectives Locked</span>
                    </p>
                </div>
                <div className="relative w-20 h-20">
                    {/* Futuristic Circular progress */}
                    <div className="absolute inset-0 rounded-full border border-accent-neon/5" />
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="40"
                            cy="40"
                            r="34"
                            fill="none"
                            stroke="rgba(0, 255, 157, 0.03)"
                            strokeWidth="4"
                        />
                        <motion.circle
                            cx="40"
                            cy="40"
                            r="34"
                            fill="none"
                            stroke="var(--accent-neon)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            initial={{ strokeDasharray: '0 213.6' }}
                            animate={{ strokeDasharray: `${(overallProgress / 100) * 213.6} 213.6` }}
                            transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
                            className="drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-accent-neon/5 rounded-full">
                        <span className="text-xl font-black text-white italic">{overallProgress}%</span>
                    </div>
                </div>
            </div>

            {/* Goal list */}
            <div className="space-y-5">
                {progressList.map((progress, index) => (
                    <motion.div
                        key={progress.goalId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-2"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-xl filter grayscale group-hover:grayscale-0 transition-all">{progress.icon}</span>
                                <span className="text-[11px] font-black text-white/70 uppercase tracking-widest">{progress.title}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`text-[10px] font-black tracking-widest ${progress.status === 'completed' ? 'text-accent-neon' :
                                    progress.status === 'in_progress' ? 'text-accent-yellow' :
                                        'text-white/20'
                                    }`}>
                                    {progress.current}<span className="mx-1 text-white/10">|</span>{progress.target}
                                </span>
                            </div>
                        </div>

                        {/* Cyberpunk Progress bar */}
                        <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                className={`absolute inset-y-0 left-0 rounded-full ${progress.status === 'completed' ? 'bg-accent-neon' :
                                    progress.status === 'in_progress' ? 'bg-accent-yellow' :
                                        'bg-white/20'
                                    }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(progress.percentage, 100)}%` }}
                                transition={{ duration: 1, ease: [0.19, 1, 0.22, 1], delay: index * 0.1 }}
                            />
                            {/* Scanline effect */}
                            <motion.div
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Encouragement */}
            {completedCount === progressList.length && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-accent-neon/10 border border-accent-neon/30 rounded-xl p-4 text-center neon-glow"
                >
                    <p className="text-[10px] text-accent-neon font-black uppercase tracking-[0.3em]">
                        SYSTEM_STATUS: PEAK_PERFORMANCE_UNLOCKED
                    </p>
                </motion.div>
            )}
        </div>
    );
};
