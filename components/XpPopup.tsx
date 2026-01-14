
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
                            <span className="text-2xl font-black text-accent-neon drop-shadow-[0_0_15px_rgba(0,255,157,0.8)] italic font-sans tracking-widest">
                                +{show.amount}_XP
                            </span>
                            <motion.div
                                className="absolute inset-0 bg-accent-neon/20 blur-xl"
                                animate={{ scale: [1, 2, 1], opacity: [0.5, 0.8, 0] }}
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
    const colors = ['#00FF9D', '#00E5FF', '#FFFFFF', '#00FF9D', '#00E5FF'];
    const confetti: ConfettiPiece[] = Array.from({ length: 80 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)]
    }));

    useEffect(() => {
        if (show) {
            const timer = setTimeout(onComplete, 5000);
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
                    className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-2xl"
                    onClick={onComplete}
                >
                    <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-accent-neon/[0.05] to-transparent pointer-events-none" />

                    {/* Confetti */}
                    {confetti.map((piece) => (
                        <motion.div
                            key={piece.id}
                            className="absolute w-1 h-3 rounded-full"
                            style={{
                                left: `${piece.x}%`,
                                top: '-5%',
                                backgroundColor: piece.color,
                                boxShadow: `0 0 10px ${piece.color}`
                            }}
                            initial={{ y: 0, rotate: 0 }}
                            animate={{
                                y: '120vh',
                                rotate: 1080,
                                x: [0, 50, -50, 30, 0]
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                delay: piece.delay,
                                ease: "easeIn"
                            }}
                        />
                    ))}

                    {/* Level Up Message */}
                    <motion.div
                        initial={{ scale: 0, scaleZ: 0, opacity: 0 }}
                        animate={{ scale: 1, scaleZ: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 100, damping: 12 }}
                        className="text-center z-10 p-12 relative"
                    >
                        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-accent-neon/40 rounded-tl-3xl" />
                        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-accent-neon/40 rounded-br-3xl" />

                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                rotateZ: [0, 5, -5, 0]
                            }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="relative inline-block"
                        >
                            <span className="text-8xl filter drop-shadow-[0_0_20px_rgba(0,255,157,0.5)]">💎</span>
                            <div className="absolute -inset-4 bg-accent-neon/20 blur-2xl rounded-full" />
                        </motion.div>

                        <div className="mt-12 space-y-2">
                            <p className="text-[10px] font-black text-accent-neon uppercase tracking-[0.8em] mb-4 drop-shadow-[0_0_8px_rgba(0,255,157,0.6)]">
                                CALIBRATION_COMPLETE
                            </p>
                            <h2 className="text-7xl font-black text-white tracking-[0.1em] uppercase italic font-sans italic leading-none">
                                LEVEL_UP
                            </h2>
                            <div className="h-0.5 w-full bg-accent-neon/30 mt-6 relative overflow-hidden">
                                <motion.div
                                    className="absolute inset-0 bg-accent-neon"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                            </div>
                            <p className="text-3xl font-black text-accent-neon mt-8 tracking-widest uppercase italic font-sans">{newLevel}</p>
                            <p className="text-[10px] font-black text-white/20 mt-12 uppercase tracking-[0.5em] animate-pulse">
                                [ CLICK_TO_SYNCHRONIZE ]
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
