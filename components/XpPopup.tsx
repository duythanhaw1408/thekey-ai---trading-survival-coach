
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface XpPopupProps {
    xpGain: number;
    trigger: number; // Change this value to trigger the animation
}

export const XpPopup: React.FC<XpPopupProps> = ({ xpGain, trigger }) => {
    const [shows, setShows] = useState<{ id: number; amount: number }[]>([]);

    useEffect(() => {
        if (xpGain > 0 && trigger > 0) {
            const newId = Date.now();
            setShows(prev => [...prev, { id: newId, amount: xpGain }]);

            setTimeout(() => {
                setShows(prev => prev.filter(s => s.id !== newId));
            }, 2000);
        }
    }, [trigger, xpGain]);

    return (
        <div className="fixed top-20 right-8 z-50 pointer-events-none">
            <AnimatePresence>
                {shows.map((show, index) => (
                    <motion.div
                        key={show.id}
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{
                            opacity: [0, 1, 1, 0],
                            y: [20, 0, -20, -60],
                            scale: [0.8, 1.2, 1, 0.8]
                        }}
                        exit={{ opacity: 0, y: -80 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="flex items-center justify-center mb-2"
                        style={{ marginTop: index * 10 }}
                    >
                        <div className="relative">
                            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 drop-shadow-lg">
                                +{show.amount} XP
                            </span>
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 blur-xl"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0] }}
                                transition={{ duration: 1.5 }}
                            />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// Confetti component for level-up celebration
interface ConfettiPiece {
    id: number;
    x: number;
    delay: number;
    color: string;
}

export const LevelUpCelebration: React.FC<{ show: boolean; newLevel: string; onComplete: () => void }> = ({
    show,
    newLevel,
    onComplete
}) => {
    const colors = ['#FFD700', '#00FF88', '#00D4FF', '#FF6B6B', '#A855F7'];
    const confetti: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)]
    }));

    useEffect(() => {
        if (show) {
            const timer = setTimeout(onComplete, 4000);
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={onComplete}
                >
                    {/* Confetti */}
                    {confetti.map((piece) => (
                        <motion.div
                            key={piece.id}
                            className="absolute w-3 h-3 rounded-sm"
                            style={{
                                left: `${piece.x}%`,
                                top: '-5%',
                                backgroundColor: piece.color
                            }}
                            initial={{ y: 0, rotate: 0 }}
                            animate={{
                                y: '120vh',
                                rotate: 720,
                                x: [0, 30, -30, 20, 0]
                            }}
                            transition={{
                                duration: 3 + Math.random(),
                                delay: piece.delay,
                                ease: "easeIn"
                            }}
                        />
                    ))}

                    {/* Level Up Message */}
                    <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="text-center z-10"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            <span className="text-6xl">🎉</span>
                        </motion.div>
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 mt-4">
                            LEVEL UP!
                        </h2>
                        <p className="text-2xl font-bold text-white mt-2">{newLevel}</p>
                        <p className="text-sm text-white/60 mt-4">Tap to continue</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
