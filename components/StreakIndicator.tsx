
import React from 'react';
import { motion } from 'framer-motion';

interface StreakIndicatorProps {
    streak: number;
    lastActiveDate?: string | null;
}

const FireIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.5 1.5-5 3-6.5.5 4.5 3.5 6.5 4.5 6.5.5 0 1-.5 1-1 0-.5 0-1-.5-2 2.5 1.5 4 4 4 7 0 3.866-3.134 7-7 7zm0-16c-1.5 0-3 1-4 3-.5-2.5.5-5 2-7 0 0 1 1 1.5 2 .5-.5 1-1.5 1-2.5 1.5 1 2.5 3 2.5 5 0 1-.5 2-1.5 2-.5-1.5-1-2.5-1.5-2.5z" />
    </svg>
);

export const StreakIndicator: React.FC<StreakIndicatorProps> = ({ streak, lastActiveDate = null }) => {
    const isActiveToday = lastActiveDate === new Date().toISOString().split('T')[0];
    const streakLevel = streak >= 7 ? 'LEGENDARY' : streak >= 3 ? 'STRONG' : 'BUILDING';

    const streakColors = {
        LEGENDARY: 'from-yellow-500 via-orange-500 to-red-500',
        STRONG: 'from-orange-400 to-red-500',
        BUILDING: 'from-gray-400 to-orange-400'
    };

    const glowColors = {
        LEGENDARY: 'shadow-yellow-500/50',
        STRONG: 'shadow-orange-500/30',
        BUILDING: 'shadow-gray-500/20'
    };

    return (
        <motion.div
            className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${streakColors[streakLevel]} ${glowColors[streakLevel]} shadow-lg`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
            <motion.div
                animate={isActiveToday ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                } : {}}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut"
                }}
            >
                <FireIcon className="w-5 h-5 text-white drop-shadow-lg" />
            </motion.div>

            <div className="flex flex-col items-start leading-none">
                <span className="text-white font-black text-sm tracking-tight">
                    {streak}
                </span>
                <span className="text-white/70 text-[8px] font-bold uppercase tracking-widest">
                    {streak === 1 ? 'DAY' : 'DAYS'}
                </span>
            </div>

            {streak >= 7 && (
                <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                />
            )}
        </motion.div>
    );
};
