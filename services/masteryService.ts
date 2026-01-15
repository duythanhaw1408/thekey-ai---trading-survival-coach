
import type { MasteryData, MasteryLevel, Quest, UnlockedContent, Pod, PodMessage, TraderStats, Trade, DetectedPattern, ShadowScore } from '../types';

const MASTERY_LEVELS: Record<MasteryLevel, { xpThreshold: number; title: string }> = {
    NOVICE: { xpThreshold: 0, title: 'Novice Survivor' },
    APPRENTICE: { xpThreshold: 1000, title: 'Apprentice of Discipline' },
    JOURNEYMAN: { xpThreshold: 3500, title: 'Journeyman of Process' },
    MASTER: { xpThreshold: 8000, title: 'Master of Self-Control' },
    GRANDMASTER: { xpThreshold: 20000, title: 'Grandmaster of Survival' }
};

const EDUCATIONAL_CONTENT: UnlockedContent[] = [
    { id: 'article_1', levelRequired: 'NOVICE', title: 'The #1 Rule: Survival First', summary: 'An in-depth look at why capital preservation is the most critical skill.', type: 'ARTICLE' },
    { id: 'article_2', levelRequired: 'APPRENTICE', title: 'Decoding Your Emotions: Fear vs. Greed', summary: 'Learn to identify the key emotions that drive poor decisions.', type: 'ARTICLE' },
    { id: 'video_1', levelRequired: 'JOURNEYMAN', title: 'Advanced Risk Management Techniques', summary: 'Go beyond simple stop-losses and learn to manage risk like a pro.', type: 'VIDEO_LESSON' },
    { id: 'article_3', levelRequired: 'MASTER', title: 'Building an Iron Mind: The Psychology of Elite Traders', summary: 'Techniques for building unshakable mental fortitude.', type: 'ARTICLE' },
];

const PEER_REPLIES = [
    "That's a great insight. I've been struggling with that too.",
    "Thanks for sharing. It helps to know I'm not the only one.",
    "I tried something similar last week and it helped. Stick with it!",
    "Good process. Focusing on that is the key.",
    "Discipline over conviction. That's the way.",
];

class SurvivalMasteryEngine {

    public calculateMastery(stats: TraderStats, tradeHistory: Trade[], shadowScore: ShadowScore | null): Omit<MasteryData, 'quests'> {
        let xp = 0;
        // Award XP for survival days
        xp += stats.survivalDays * 50;

        // Award XP for disciplined trades (not blocked)
        const disciplinedTrades = tradeHistory.filter(t => t.decision !== 'BLOCK').length;
        xp += disciplinedTrades * 15;

        // Award bonus XP for high-quality process
        tradeHistory.forEach(trade => {
            if (trade.processEvaluation) {
                if (trade.processEvaluation.totalProcessScore > 85) {
                    xp += 25; // Bonus for excellent process
                } else if (trade.processEvaluation.totalProcessScore > 70) {
                    xp += 10; // Bonus for good process
                }
            }
        });

        if (shadowScore) {
            xp *= shadowScore.adjustmentFactors.xpMultiplier;
        }

        xp = Math.round(xp);

        const currentLevelInfo = this.getLevelFromXp(xp);
        const nextLevelInfo = this.getNextLevel(currentLevelInfo.level);

        return {
            level: currentLevelInfo.level,
            levelTitle: currentLevelInfo.title,
            xp,
            xpToNextLevel: nextLevelInfo.xpThreshold,
            unlockedContent: this.getUnlockedContent(currentLevelInfo.level),
        };
    }

    public generateQuests(
        masteryData: MasteryData,
        detectedPattern: DetectedPattern | null,
        checkinCount: number = 0,
        tradeHistory: Trade[] = []
    ): Quest[] {
        const quests: Quest[] = [];

        // Quest 1: Daily Check-in Streak - track actual checkin count (capped at 3)
        const checkinProgress = Math.min(checkinCount, 3);
        quests.push({
            id: 'daily_checkin_streak',
            title: 'Mindful Start',
            description: 'Complete the daily check-in for 3 consecutive days to build a routine of self-awareness.',
            metric: 'daily_checkins',
            target: 3,
            progress: checkinProgress,
            status: checkinProgress >= 3 ? 'COMPLETED' : 'ACTIVE',
            rewardXp: 150
        });

        // Quest 2: Warn-Free Streak or Cool-down Protocol based on pattern
        if (detectedPattern && detectedPattern.pattern_name.toLowerCase().includes('revenge')) {
            quests.push({
                id: 'revenge_killer',
                title: 'Cool-down Protocol',
                description: 'After your next 3 losing trades, wait at least 30 minutes before entering a new trade.',
                metric: 'cooldown_adherence',
                target: 3,
                progress: 0, // This would need special tracking
                status: 'ACTIVE',
                rewardXp: 300
            });
        } else {
            // Count consecutive trades without WARN decision
            let warnFreeCount = 0;
            // Check from most recent trades
            for (let i = tradeHistory.length - 1; i >= 0; i--) {
                if (tradeHistory[i].decision !== 'WARN' && tradeHistory[i].decision !== 'BLOCK') {
                    warnFreeCount++;
                } else {
                    break; // Stop at first WARN/BLOCK
                }
            }
            const warnFreeProgress = Math.min(warnFreeCount, 5);

            quests.push({
                id: 'warn_free_streak',
                title: 'Process Purity',
                description: 'Execute 5 consecutive trades without triggering a warning from the AI.',
                metric: 'warn_free_trades',
                target: 5,
                progress: warnFreeProgress,
                status: warnFreeProgress >= 5 ? 'COMPLETED' : 'ACTIVE',
                rewardXp: 250
            });
        }

        return quests;
    }

    private getLevelFromXp(xp: number): { level: MasteryLevel, title: string } {
        let currentLevel: MasteryLevel = 'NOVICE';
        const levels: MasteryLevel[] = ['NOVICE', 'APPRENTICE', 'JOURNEYMAN', 'MASTER', 'GRANDMASTER'];
        for (const levelKey of levels) {
            if (xp >= MASTERY_LEVELS[levelKey].xpThreshold) {
                currentLevel = levelKey;
            } else {
                break;
            }
        }
        return { level: currentLevel, title: MASTERY_LEVELS[currentLevel].title };
    }

    private getNextLevel(currentLevel: MasteryLevel): { level: MasteryLevel | null; xpThreshold: number } {
        const levels: MasteryLevel[] = ['NOVICE', 'APPRENTICE', 'JOURNEYMAN', 'MASTER', 'GRANDMASTER'];
        const currentIndex = levels.indexOf(currentLevel);
        if (currentIndex < levels.length - 1) {
            const nextLevelKey = levels[currentIndex + 1];
            return { level: nextLevelKey, xpThreshold: MASTERY_LEVELS[nextLevelKey].xpThreshold };
        }
        return { level: null, xpThreshold: MASTERY_LEVELS['GRANDMASTER'].xpThreshold };
    }

    private getUnlockedContent(currentLevel: MasteryLevel): UnlockedContent[] {
        const levels: MasteryLevel[] = ['NOVICE', 'APPRENTICE', 'JOURNEYMAN', 'MASTER', 'GRANDMASTER'];
        const currentLevelIndex = levels.indexOf(currentLevel);

        return EDUCATIONAL_CONTENT.filter(content => {
            const requiredLevelIndex = levels.indexOf(content.levelRequired);
            return currentLevelIndex >= requiredLevelIndex;
        });
    }

    // --- Anonymous Pod System ---
    public getPod(userId: string): Pod {
        // In a real system, this would involve matchmaking. Here, it's static.
        return {
            id: 'pod_alpha_7',
            name: 'The Process Jedis',
            members: ['You', 'Peer 1', 'Peer 2', 'Peer 3'],
            messages: MOCK_POD_MESSAGES
        };
    }

    public sendPodMessage(pod: Pod, text: string): Pod {
        const newMessage: PodMessage = {
            id: crypto.randomUUID(),
            sender: 'You',
            text,
            timestamp: Date.now()
        };
        return {
            ...pod,
            messages: [...pod.messages, newMessage]
        };
    }

    public simulatePeerReply(pod: Pod): Pod {
        const peers = pod.members.filter(m => m !== 'You');
        const randomPeer = peers[Math.floor(Math.random() * peers.length)];
        const randomReply = PEER_REPLIES[Math.floor(Math.random() * PEER_REPLIES.length)];

        const replyMessage: PodMessage = {
            id: crypto.randomUUID(),
            sender: randomPeer as PodMessage['sender'],
            text: randomReply,
            timestamp: Date.now()
        };

        return {
            ...pod,
            messages: [...pod.messages, replyMessage]
        };
    }
}

const MOCK_POD_MESSAGES: PodMessage[] = [
    { id: '1', sender: 'Peer 1', text: 'Struggled with FOMO today watching the pump. Managed to stick to my plan and not chase. Felt good.', timestamp: Date.now() - 3600000 },
    { id: '2', sender: 'Peer 2', text: 'Good job Peer 1. I got stopped out on a trade that followed my rules perfectly. Frustrating, but I know it was good process.', timestamp: Date.now() - 3500000 },
    { id: '3', sender: 'You', text: 'I\'m working on my revenge trading pattern. The AI suggested a 30-minute cooldown after a loss. Going to try that.', timestamp: Date.now() - 1200000 },
    { id: '4', sender: 'Peer 3', text: 'That\'s a great idea. I should probably do the same. My discipline score dropped this week because I jumped back in too fast.', timestamp: Date.now() - 1100000 },
];

export const masteryEngine = new SurvivalMasteryEngine();
