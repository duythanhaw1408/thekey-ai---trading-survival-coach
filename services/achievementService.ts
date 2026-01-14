// services/achievementService.ts
/**
 * THEKEY AI - Achievement System
 * 
 * Gamification layer for trader motivation:
 * - Tracks unlockable achievements
 * - Awards XP for positive behaviors
 * - Displays progress notifications
 */

import type { Trade, TraderStats, CheckinAnalysisResult } from '../types';

// ============================================
// Types
// ============================================

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    xpReward: number;
    category: 'discipline' | 'protection' | 'reflection' | 'growth' | 'milestone';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    unlockedAt?: Date;
}

export interface AchievementProgress {
    achievementId: string;
    current: number;
    target: number;
    percentage: number;
}

// ============================================
// Achievement Definitions
// ============================================

const ACHIEVEMENTS: Achievement[] = [
    // Discipline Category
    {
        id: 'first_sl',
        title: '🛡️ Bước Đầu Tiên',
        description: 'Đặt Stop-Loss cho lệnh đầu tiên',
        icon: '🛡️',
        xpReward: 50,
        category: 'discipline',
        rarity: 'common'
    },
    {
        id: 'sl_streak_5',
        title: '⚔️ Chiến Binh Kỷ Luật',
        description: 'Tuân thủ SL 5 lệnh liên tiếp',
        icon: '⚔️',
        xpReward: 150,
        category: 'discipline',
        rarity: 'rare'
    },
    {
        id: 'sl_streak_20',
        title: '🔥 Bất Khả Chiến Bại',
        description: 'Tuân thủ SL 20 lệnh liên tiếp',
        icon: '🔥',
        xpReward: 500,
        category: 'discipline',
        rarity: 'epic'
    },
    {
        id: 'sl_streak_100',
        title: '👑 Vua Kỷ Luật',
        description: 'Tuân thủ SL 100 lệnh liên tiếp',
        icon: '👑',
        xpReward: 2000,
        category: 'discipline',
        rarity: 'legendary'
    },

    // Reflection Category
    {
        id: 'first_checkin',
        title: '🌅 Ngày Mới',
        description: 'Hoàn thành check-in đầu tiên',
        icon: '🌅',
        xpReward: 50,
        category: 'reflection',
        rarity: 'common'
    },
    {
        id: 'checkin_streak_7',
        title: '📿 7 Ngày Thiền Định',
        description: 'Check-in 7 ngày liên tiếp',
        icon: '📿',
        xpReward: 200,
        category: 'reflection',
        rarity: 'rare'
    },
    {
        id: 'checkin_streak_30',
        title: '🧘 Thiền Sư',
        description: 'Check-in 30 ngày liên tiếp',
        icon: '🧘',
        xpReward: 1000,
        category: 'reflection',
        rarity: 'epic'
    },
    {
        id: 'first_dojo',
        title: '🥋 Môn Sinh',
        description: 'Hoàn thành Process Dojo đầu tiên',
        icon: '🥋',
        xpReward: 75,
        category: 'reflection',
        rarity: 'common'
    },
    {
        id: 'dojo_master',
        title: '🏯 Võ Sư',
        description: 'Hoàn thành 50 phiên Process Dojo',
        icon: '🏯',
        xpReward: 500,
        category: 'reflection',
        rarity: 'epic'
    },

    // Protection Category
    {
        id: 'survived_drawdown',
        title: '🌊 Vượt Bão',
        description: 'Thoát khỏi drawdown >10% một cách an toàn',
        icon: '🌊',
        xpReward: 300,
        category: 'protection',
        rarity: 'rare'
    },
    {
        id: 'revenge_avoided',
        title: '🧠 Tâm Bất Biến',
        description: 'Tuân thủ cooldown sau khi bị block',
        icon: '🧠',
        xpReward: 200,
        category: 'protection',
        rarity: 'rare'
    },
    {
        id: 'small_position',
        title: '🐢 Bước Đi Thận Trọng',
        description: 'Giữ position <2% tài khoản 10 lệnh liên tiếp',
        icon: '🐢',
        xpReward: 150,
        category: 'protection',
        rarity: 'rare'
    },

    // Growth Category
    {
        id: 'first_profit',
        title: '💸 Chiến Thắng Đầu',
        description: 'Đóng lệnh có lãi đầu tiên',
        icon: '💸',
        xpReward: 50,
        category: 'growth',
        rarity: 'common'
    },
    {
        id: 'win_streak_3',
        title: '🎯 Tay Săn',
        description: 'Thắng 3 lệnh liên tiếp',
        icon: '🎯',
        xpReward: 150,
        category: 'growth',
        rarity: 'rare'
    },
    {
        id: 'win_streak_5',
        title: '🌟 Ngôi Sao',
        description: 'Thắng 5 lệnh liên tiếp',
        icon: '🌟',
        xpReward: 350,
        category: 'growth',
        rarity: 'epic'
    },
    {
        id: 'positive_week',
        title: '📈 Tuần Xanh',
        description: 'Kết thúc tuần với lợi nhuận dương',
        icon: '📈',
        xpReward: 200,
        category: 'growth',
        rarity: 'rare'
    },

    // Milestone Category
    {
        id: 'survival_7',
        title: '⏳ 7 Ngày Sống Sót',
        description: 'Giao dịch 7 ngày liên tiếp mà không bị margin call',
        icon: '⏳',
        xpReward: 100,
        category: 'milestone',
        rarity: 'common'
    },
    {
        id: 'survival_30',
        title: '🗓️ 1 Tháng Bất Bại',
        description: 'Survive 30 ngày trading',
        icon: '🗓️',
        xpReward: 500,
        category: 'milestone',
        rarity: 'epic'
    },
    {
        id: 'survival_90',
        title: '🏆 Nhà Giao Dịch Thực Thụ',
        description: 'Survive 90 ngày trading',
        icon: '🏆',
        xpReward: 1500,
        category: 'milestone',
        rarity: 'legendary'
    }
];

// ============================================
// Achievement Service
// ============================================

class AchievementService {
    private unlockedIds: Set<string> = new Set();
    private readonly storageKey = 'thekey_achievements';

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const ids = JSON.parse(stored) as string[];
                this.unlockedIds = new Set(ids);
            }
        } catch (e) {
            console.error('[Achievements] Failed to load:', e);
        }
    }

    private saveToStorage(): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify([...this.unlockedIds]));
        } catch (e) {
            console.error('[Achievements] Failed to save:', e);
        }
    }

    public getAllAchievements(): Achievement[] {
        return ACHIEVEMENTS.map(a => ({
            ...a,
            unlockedAt: this.unlockedIds.has(a.id) ? new Date() : undefined
        }));
    }

    public getUnlockedAchievements(): Achievement[] {
        return ACHIEVEMENTS.filter(a => this.unlockedIds.has(a.id));
    }

    public getLockedAchievements(): Achievement[] {
        return ACHIEVEMENTS.filter(a => !this.unlockedIds.has(a.id));
    }

    public getTotalXP(): number {
        return this.getUnlockedAchievements().reduce((sum, a) => sum + a.xpReward, 0);
    }

    public getLevel(): { level: number; currentXP: number; nextLevelXP: number; title: string } {
        const totalXP = this.getTotalXP();

        const levels = [
            { level: 1, xp: 0, title: 'Tân Binh' },
            { level: 2, xp: 100, title: 'Học Viên' },
            { level: 3, xp: 300, title: 'Môn Sinh' },
            { level: 4, xp: 600, title: 'Chiến Binh' },
            { level: 5, xp: 1000, title: 'Kiếm Sĩ' },
            { level: 6, xp: 1500, title: 'Đại Sư' },
            { level: 7, xp: 2500, title: 'Huyền Thoại' },
            { level: 8, xp: 4000, title: 'Bất Tử' },
            { level: 9, xp: 6000, title: 'Đế Vương' },
            { level: 10, xp: 10000, title: 'Vĩnh Cửu' }
        ];

        let currentLevel = levels[0];
        let nextLevel = levels[1];

        for (let i = 0; i < levels.length; i++) {
            if (totalXP >= levels[i].xp) {
                currentLevel = levels[i];
                nextLevel = levels[i + 1] || { ...levels[i], xp: levels[i].xp + 10000 };
            } else {
                break;
            }
        }

        return {
            level: currentLevel.level,
            currentXP: totalXP - currentLevel.xp,
            nextLevelXP: nextLevel.xp - currentLevel.xp,
            title: currentLevel.title
        };
    }

    public unlock(achievementId: string): Achievement | null {
        if (this.unlockedIds.has(achievementId)) return null;

        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return null;

        this.unlockedIds.add(achievementId);
        this.saveToStorage();

        return { ...achievement, unlockedAt: new Date() };
    }

    public checkAndUnlock(
        trades: Trade[],
        stats: TraderStats,
        checkinCount: number,
        dojoCount: number
    ): Achievement[] {
        const newlyUnlocked: Achievement[] = [];

        // Check discipline achievements
        const slCompliantTrades = trades.filter(t => t.stopLoss);
        if (slCompliantTrades.length >= 1) {
            const a = this.unlock('first_sl');
            if (a) newlyUnlocked.push(a);
        }

        // Check consecutive SL compliance
        let slStreak = 0;
        for (let i = trades.length - 1; i >= 0; i--) {
            if (trades[i].stopLoss) slStreak++;
            else break;
        }
        if (slStreak >= 5) { const a = this.unlock('sl_streak_5'); if (a) newlyUnlocked.push(a); }
        if (slStreak >= 20) { const a = this.unlock('sl_streak_20'); if (a) newlyUnlocked.push(a); }
        if (slStreak >= 100) { const a = this.unlock('sl_streak_100'); if (a) newlyUnlocked.push(a); }

        // Check checkin achievements
        if (checkinCount >= 1) { const a = this.unlock('first_checkin'); if (a) newlyUnlocked.push(a); }
        if (checkinCount >= 7) { const a = this.unlock('checkin_streak_7'); if (a) newlyUnlocked.push(a); }
        if (checkinCount >= 30) { const a = this.unlock('checkin_streak_30'); if (a) newlyUnlocked.push(a); }

        // Check dojo achievements
        if (dojoCount >= 1) { const a = this.unlock('first_dojo'); if (a) newlyUnlocked.push(a); }
        if (dojoCount >= 50) { const a = this.unlock('dojo_master'); if (a) newlyUnlocked.push(a); }

        // Check profit achievements
        const profitTrades = trades.filter(t => t.pnl && t.pnl > 0);
        if (profitTrades.length >= 1) { const a = this.unlock('first_profit'); if (a) newlyUnlocked.push(a); }

        // Check win streak
        if (stats.consecutiveWins >= 3) { const a = this.unlock('win_streak_3'); if (a) newlyUnlocked.push(a); }
        if (stats.consecutiveWins >= 5) { const a = this.unlock('win_streak_5'); if (a) newlyUnlocked.push(a); }

        // Check survival milestones
        if (stats.survivalDays >= 7) { const a = this.unlock('survival_7'); if (a) newlyUnlocked.push(a); }
        if (stats.survivalDays >= 30) { const a = this.unlock('survival_30'); if (a) newlyUnlocked.push(a); }
        if (stats.survivalDays >= 90) { const a = this.unlock('survival_90'); if (a) newlyUnlocked.push(a); }

        return newlyUnlocked;
    }

    public reset(): void {
        this.unlockedIds.clear();
        localStorage.removeItem(this.storageKey);
    }
}

// Singleton export
export const achievementService = new AchievementService();
