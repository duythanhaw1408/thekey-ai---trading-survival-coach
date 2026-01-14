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
    common: 'from-accent-neon/20 to-accent-neon/40',
    rare: 'from-accent-neon/40 to-accent-neon/60',
    epic: 'from-accent-neon/60 to-accent-neon/80',
    legendary: 'from-accent-neon to-accent-neon hover:shadow-[0_0_30px_rgba(0,255,157,0.5)]'
};

const rarityGlow = {
    common: 'shadow-accent-neon/10',
    rare: 'shadow-accent-neon/20',
    epic: 'shadow-accent-neon/30',
    legendary: 'shadow-accent-neon/50'
};

export const AchievementPopup: React.FC<AchievementPopupProps> = ({
    achievement,
    onClose
}) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (achievement) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
                setTimeout(onClose, 300);
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [achievement, onClose]);

    if (!achievement) return null;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 100, scale: 0.9, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -50, scale: 0.9, filter: 'blur(10px)' }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] w-full max-w-sm px-4"
                >
                    <div className={`relative bg-black border border-accent-neon/30 rounded-3xl p-1 overflow-hidden shadow-2xl ${rarityGlow[achievement.rarity]}`}>
                        <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />

                        <div className="bg-black/80 backdrop-blur-2xl rounded-[1.4rem] p-6 flex items-center gap-6 relative z-10">
                            {/* Icon with pulsing neon glow */}
                            <div className="relative">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.15, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="text-5xl filter drop-shadow-[0_0_15px_rgba(0,255,157,0.4)]"
                                >
                                    {achievement.icon}
                                </motion.div>
                                <div className="absolute -inset-2 bg-accent-neon/20 blur-xl rounded-full animate-pulse pointer-events-none" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-1.5 h-3 bg-accent-neon shadow-[0_0_8px_rgba(0,255,157,0.8)]" />
                                    <p className="text-[10px] font-black text-accent-neon uppercase tracking-[0.3em]">
                                        ACHIEVEMENT_UNLOCKED
                                    </p>
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight italic font-sans truncate">
                                    {achievement.title}
                                </h3>
                                <p className="text-[10px] text-white/40 font-medium uppercase tracking-wide mt-1 leading-tight">
                                    {achievement.description}
                                </p>
                            </div>

                            {/* XP Reward Chip */}
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-accent-neon/10 border border-accent-neon/30 rounded-xl px-4 py-2 shadow-inner"
                            >
                                <span className="text-[11px] font-black text-accent-neon uppercase font-mono">
                                    +{achievement.xpReward}_XP
                                </span>
                            </motion.div>
                        </div>

                        {/* Particle Effects for Legendary */}
                        {achievement.rarity === 'legendary' && (
                            <div className="absolute inset-0 pointer-events-none">
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-0.5 h-0.5 bg-accent-neon rounded-full"
                                        initial={{ x: '50%', y: '80%', opacity: 0 }}
                                        animate={{
                                            x: `${10 + Math.random() * 80}%`,
                                            y: `${10 + Math.random() * 80}%`,
                                            opacity: [0, 1, 0]
                                        }}
                                        transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            setShow(false);
                            setTimeout(onClose, 300);
                        }}
                        className="block mx-auto mt-4 text-[9px] font-black text-white/20 hover:text-white/50 uppercase tracking-[0.5em] transition-all hover:tracking-[0.6em]"
                    >
                        [ TAP_TO_DISMISS ]
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
