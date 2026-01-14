import React from 'react';
import { motion } from 'framer-motion';

interface GrowthGardenProps {
    score: number;
    blooms?: string[];
    needsWatering?: boolean;
}

const GrowthGarden: React.FC<GrowthGardenProps> = ({ score, blooms = [], needsWatering = false }) => {
    // Map score (0-100) to tree height (10-100%)
    const treeHeight = Math.max(10, score);

    return (
        <div className="growth-garden bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">Khu Vườn Kỷ Luật</h3>
                    <p className="text-xs text-slate-400">Đang phát triển dựa trên sự kiên định của bạn</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-emerald-400">{score}</span>
                    <span className="text-xs text-slate-500 block">S-Score</span>
                </div>
            </div>

            <div className="garden-area h-48 flex items-end justify-center relative">
                {/* Soil/Grass */}
                <div className="absolute bottom-0 w-full h-4 bg-emerald-900/30 rounded-full blur-sm" />

                {/* The Tree */}
                <motion.div
                    className="tree-trunk bg-amber-900 w-4 rounded-t-lg relative"
                    initial={{ height: 0 }}
                    animate={{ height: `${treeHeight}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                >
                    {/* Leaves/Canopy */}
                    <motion.div
                        className="absolute -top-12 -left-12 w-28 h-20 bg-emerald-500 rounded-full blur-[2px]"
                        animate={{ scale: [1, 1.05, 1], rotate: [0, 2, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    >
                        {/* Buds/Flowers based on score milestones */}
                        {score > 70 && <div className="absolute top-2 left-4 w-3 h-3 bg-pink-400 rounded-full shadow-lg" />}
                        {score > 85 && <div className="absolute top-8 right-6 w-3 h-3 bg-yellow-400 rounded-full shadow-lg" />}
                        {score > 95 && <div className="absolute bottom-4 left-10 w-4 h-4 bg-red-400 rounded-full shadow-lg" />}
                    </motion.div>
                </motion.div>

                {/* Animation for Watering need */}
                {needsWatering && (
                    <div className="absolute top-0 right-0 animate-bounce">
                        <span className="text-2xl">💧</span>
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {blooms.map((bloom, i) => (
                    <span key={i} className="px-2 py-1 bg-emerald-900/40 text-emerald-400 text-[10px] rounded border border-emerald-500/20">
                        🌸 {bloom}
                    </span>
                ))}
                {blooms.length === 0 && (
                    <p className="text-[10px] text-slate-500 italic text-center w-full">
                        Duy trì kỷ luật để những bông hoa đầu tiên nở rộ
                    </p>
                )}
            </div>

            {/* Visual metaphor helper */}
            <div className="absolute -bottom-1 -right-1 opacity-10 pointer-events-none">
                <span className="text-8xl">🌿</span>
            </div>
        </div>
    );
};

export default GrowthGarden;
