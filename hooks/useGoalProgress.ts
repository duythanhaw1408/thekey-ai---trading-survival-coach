// hooks/useGoalProgress.ts
/**
 * THEKEY AI - Goal Progress Tracking Hook
 * 
 * Tracks real-time progress towards weekly goals.
 */

import { useMemo } from 'react';
import type { Trade, WeeklyGoals } from '../types';

interface GoalProgress {
    goalId: string;
    title: string;
    current: number;
    target: number;
    percentage: number;
    status: 'not_started' | 'in_progress' | 'completed' | 'exceeded';
    icon: string;
}

export function useGoalProgress(
    goals: WeeklyGoals | null,
    trades: Trade[],
    checkinCount: number = 0
) {
    return useMemo(() => {
        if (!goals) return [];

        const weekStart = getStartOfWeek(new Date());
        const weekTrades = trades.filter(t => new Date(t.timestamp) >= weekStart);

        const progressList: GoalProgress[] = [];

        // Parse goals from the structure
        if (goals.primary_goal) {
            const progress = calculateGoalProgress(goals.primary_goal as any, weekTrades, checkinCount);
            progressList.push({
                goalId: goals.primary_goal.id || 'primary_goal',
                title: goals.primary_goal.title,
                ...progress
            });
        }

        if (goals.secondary_goal) {
            const progress = calculateGoalProgress(goals.secondary_goal as any, weekTrades, checkinCount);
            progressList.push({
                goalId: goals.secondary_goal.id || 'secondary_goal',
                title: goals.secondary_goal.title,
                ...progress
            });
        }

        // Add default goals if none specified
        if (progressList.length === 0) {
            // Default: SL Compliance
            const tradesWithSL = weekTrades.filter(t => t.stopLoss);
            const slCompliance = weekTrades.length > 0
                ? Math.round((tradesWithSL.length / weekTrades.length) * 100)
                : 0;

            progressList.push({
                goalId: 'sl_compliance',
                title: 'Tuân thủ Stop-Loss',
                current: slCompliance,
                target: 100,
                percentage: slCompliance,
                status: slCompliance >= 100 ? 'completed' : slCompliance > 0 ? 'in_progress' : 'not_started',
                icon: '🛡️'
            });

            // Default: Daily Checkins
            const checkinTarget = 7;
            const checkinPercentage = Math.min(Math.round((checkinCount / checkinTarget) * 100), 100);

            progressList.push({
                goalId: 'daily_checkins',
                title: 'Check-in hàng ngày',
                current: checkinCount,
                target: checkinTarget,
                percentage: checkinPercentage,
                status: checkinCount >= checkinTarget ? 'completed' : checkinCount > 0 ? 'in_progress' : 'not_started',
                icon: '🌅'
            });

            // Default: Process Dojo completion
            const tradesWithAnalysis = weekTrades.filter(t => t.status === 'CLOSED' && t.pnl !== undefined);
            const analysisRate = weekTrades.filter(t => t.status === 'CLOSED').length > 0
                ? Math.round((tradesWithAnalysis.length / weekTrades.filter(t => t.status === 'CLOSED').length) * 100)
                : 0;

            progressList.push({
                goalId: 'post_trade_analysis',
                title: 'Phân tích sau lệnh',
                current: analysisRate,
                target: 100,
                percentage: analysisRate,
                status: analysisRate >= 100 ? 'completed' : analysisRate > 0 ? 'in_progress' : 'not_started',
                icon: '🧠'
            });
        }

        return progressList;
    }, [goals, trades, checkinCount]);
}

function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function calculateGoalProgress(
    goal: { description?: string; goal?: string; metric?: string; target?: number },
    trades: Trade[],
    checkinCount: number
): { current: number; target: number; percentage: number; status: GoalProgress['status']; icon: string } {
    const goalText = (goal.description || goal.goal || '').toLowerCase();

    // Detect goal type from text
    if (goalText.includes('stop') || goalText.includes('sl')) {
        const tradesWithSL = trades.filter(t => t.stopLoss);
        const rate = trades.length > 0 ? Math.round((tradesWithSL.length / trades.length) * 100) : 0;
        return {
            current: rate,
            target: 100,
            percentage: rate,
            status: rate >= 100 ? 'completed' : rate > 0 ? 'in_progress' : 'not_started',
            icon: '🛡️'
        };
    }

    if (goalText.includes('check') || goalText.includes('ritual')) {
        const target = goal.target || 7;
        const percentage = Math.min(Math.round((checkinCount / target) * 100), 100);
        return {
            current: checkinCount,
            target,
            percentage,
            status: checkinCount >= target ? 'completed' : checkinCount > 0 ? 'in_progress' : 'not_started',
            icon: '🌅'
        };
    }

    if (goalText.includes('trade') || goalText.includes('lệnh')) {
        const target = goal.target || 5;
        const closedTrades = trades.filter(t => t.status === 'CLOSED').length;
        const percentage = Math.min(Math.round((closedTrades / target) * 100), 100);
        return {
            current: closedTrades,
            target,
            percentage,
            status: closedTrades >= target ? 'completed' : closedTrades > 0 ? 'in_progress' : 'not_started',
            icon: '📊'
        };
    }

    // Default: assume it's a discipline goal
    return {
        current: 0,
        target: goal.target || 100,
        percentage: 0,
        status: 'not_started',
        icon: '🎯'
    };
}
