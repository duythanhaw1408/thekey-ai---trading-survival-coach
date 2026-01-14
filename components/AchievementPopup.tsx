// components/AchievementPopup.tsx
/**
 * THEKEY AI - Achievement Unlock Popup
 * 
 * Celebratory popup when user unlocks an achievement.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Achievement } from '../services/achievementService';

interface AchievementPopupProps {
    achievement: Achievement | null;
    onClose: () => void;
}

const rarityColors = {
    common: 'from-gray-500 to-gray-600',
    rare: 'from-blue-500 to-blue-600',
    epic: 'from-purple-500 to-purple-600',
    legendary: 'from-amber-500 to-orange-500'
};

const rarityGlow = {
    common: 'shadow-gray-500/30',
    rare: 'shadow-blue-500/30',
    epic: 'shadow-purple-500/30',
    legendary: 'shadow-amber-500/50'
};

export const AchievementPopup: React.FC<AchievementPopupProps> = ({
    achievement,
    onClose
}) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (achievement) {
            setShow(true);
            // Auto close after 5 seconds
            const timer = setTimeout(() => {
                setShow(false);
                setTimeout(onClose, 300);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [achievement, onClose]);

    return (
        <AnimatePresence>
            {show && achievement && (
                <motion.div
                    initial={{ opacity: 0, y: 100, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.8 }}
                    className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[300]"
                >
                    <div
                        className={`relative bg-gradient-to-r ${rarityColors[achievement.rarity]} rounded-2xl p-1 shadow-2xl ${rarityGlow[achievement.rarity]}`}
                    >
                        <div className="bg-black/90 backdrop-blur-xl rounded-xl p-4 flex items-center gap-4">
                            {/* Icon with glow */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 10, -10, 0]
                                }}
                                transition={{ duration: 0.5, repeat: 2 }}
                                className="text-4xl"
                            >
                                {achievement.icon}
                            </motion.div>

                            {/* Content */}
                            <div className="flex-1">
                                <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold">
                                    Thành Tựu Mới!
                                </p>
                                <h3 className="text-lg font-black text-white">
                                    {achievement.title}
                                </h3>
                                <p className="text-xs text-white/70 mt-0.5">
                                    {achievement.description}
                                </p>
                            </div>

                            {/* XP Badge */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: 'spring' }}
                                className={`bg-gradient-to-r ${rarityColors[achievement.rarity]} rounded-full px-3 py-1`}
                            >
                                <span className="text-sm font-black text-white">
                                    +{achievement.xpReward} XP
                                </span>
                            </motion.div>
                        </div>

                        {/* Sparkles effect */}
                        {achievement.rarity === 'legendary' && (
                            <div className="absolute inset-0 pointer-events-none">
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-1 h-1 bg-amber-300 rounded-full"
                                        initial={{
                                            x: '50%',
                                            y: '50%',
                                            opacity: 0
                                        }}
                                        animate={{
                                            x: `${50 + (Math.random() - 0.5) * 100}%`,
                                            y: `${50 + (Math.random() - 0.5) * 100}%`,
                                            opacity: [0, 1, 0],
                                            scale: [0, 1.5, 0]
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            delay: i * 0.2,
                                            repeat: Infinity
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tap to dismiss */}
                    <button
                        onClick={() => {
                            setShow(false);
                            setTimeout(onClose, 300);
                        }}
                        className="block mx-auto mt-2 text-[10px] text-white/30 hover:text-white/50 transition-colors"
                    >
                        Nhấn để đóng
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
