import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuitIcon } from './icons';

interface GrowthGardenProps {
    score: number;
    blooms?: string[];
    needsWatering?: boolean;
}

const GrowthGarden: React.FC<GrowthGardenProps> = ({ score, blooms = [], needsWatering = false }) => {
    return (
        <div className="bg-black/40 backdrop-blur-xl rounded-[2rem] p-8 border border-accent-neon/10 relative overflow-hidden shadow-2xl group group-hover:border-accent-neon/20 transition-all duration-500">
            <div className="absolute inset-0 cyber-grid opacity-[0.05] pointer-events-none" />

            <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                    <h3 className="text-[10px] font-black text-accent-neon uppercase tracking-[0.5em] mb-2 drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]">NEURAL_DENSITY_PROTOCOL</h3>
                    <h2 className="text-xl font-black text-white tracking-widest uppercase italic font-sans italic">DISCIPLINE_GROWTH</h2>
                </div>
                <div className="text-right">
                    <span className="text-4xl font-black text-white tracking-tighter italic drop-shadow-[0_0_15px_rgba(0,255,157,0.3)]">{score}%</span>
                    <span className="text-[8px] font-black text-white/30 block uppercase tracking-widest mt-1">CALIBRATION_STRENGTH</span>
                </div>
            </div>

            <div className="h-48 flex items-end justify-center relative mb-6">
                {/* HUD Scanline Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-accent-neon/[0.02] to-transparent pointer-events-none" />

                {/* Neural Density Visualization */}
                <div className="relative w-full h-full flex items-center justify-center">
                    <motion.div
                        className="w-1.5 bg-accent-neon shadow-[0_0_20px_rgba(0,255,157,0.6)] rounded-full relative"
                        initial={{ height: 0 }}
                        animate={{ height: `${score}%` }}
                        transition={{ duration: 2, ease: "easeOut" }}
                    >
                        {/* Recursive Nodes */}
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-black border border-accent-neon rounded-lg shadow-[0_0_10px_rgba(0,255,157,0.4)]"
                                style={{ bottom: `${i * 20}%` }}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: score > i * 20 ? 1 : 0.1,
                                    scale: score > i * 20 ? 1 : 0.5,
                                    boxShadow: score > i * 20 ? '0 0 15px rgba(0,255,157,0.5)' : 'none'
                                }}
                                transition={{ delay: i * 0.2 }}
                            >
                                {score > i * 20 && (
                                    <motion.div
                                        className="absolute inset-1 bg-accent-neon rounded-sm"
                                        animate={{ opacity: [1, 0.4, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                                    />
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Critical Maintenance Alert */}
                {needsWatering && (
                    <motion.div
                        className="absolute top-0 right-0 flex items-center gap-2"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    >
                        <span className="text-[10px] font-black text-accent-red uppercase tracking-widest">NEURAL_DEGRADATION_DETECTED</span>
                        <div className="w-2 h-2 rounded-full bg-accent-red shadow-[0_0_10px_rgba(255,0,85,0.8)]" />
                    </motion.div>
                )}
            </div>

            <div className="flex flex-wrap gap-3 relative z-10 min-h-[40px] items-center">
                {blooms.map((bloom, i) => (
                    <motion.span
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="px-4 py-1.5 bg-accent-neon/10 text-accent-neon text-[9px] font-black rounded-lg border border-accent-neon/30 uppercase tracking-[0.2em] shadow-inner"
                    >
                        {bloom}
                    </motion.span>
                ))}
                {blooms.length === 0 && (
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] w-full text-center py-4 border border-dashed border-white/5 rounded-2xl italic">
                        SYSTEM_IDLE: AWAITING_CALIBRATION_MILESTONES
                    </p>
                )}
            </div>

            {/* Matrix Decorative Elements */}
            <div className="absolute -bottom-6 -right-6 text-accent-neon opacity-[0.03] rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <BrainCircuitIcon className="w-48 h-48" />
            </div>
        </div>
    );
};

export default GrowthGarden;
