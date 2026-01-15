import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LightBulbIcon, ChartBarIcon, BeakerIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';

interface Insight {
    id: string;
    insight_type: 'CORRELATION' | 'PATTERN' | 'ANOMALY' | 'TREND';
    confidence: number;
    description: string;
    is_actionable: boolean;
    recommendation?: string;
}

export const LearningInsights: React.FC = () => {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const data = await api.getLearningInsights();
                setInsights(data);
            } catch (error) {
                console.error('Failed to fetch AI insights:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInsights();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'CORRELATION': return <BeakerIcon className="w-5 h-5 text-accent-blue" />;
            case 'PATTERN': return <ChartBarIcon className="w-5 h-5 text-accent-purple" />;
            case 'ANOMALY': return <LightBulbIcon className="w-5 h-5 text-accent-yellow" />;
            case 'TREND': return <ArrowTrendingUpIcon className="w-5 h-5 text-accent-green" />;
            default: return <LightBulbIcon className="w-5 h-5 text-accent-primary" />;
        }
    };

    if (isLoading) return <div className="animate-pulse space-y-3">
        {[1, 2].map(i => <div key={i} className="h-24 bg-panel rounded-xl border border-divider" />)}
    </div>;

    return (
        <div className="space-y-8">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center">
                <BeakerIcon className="w-5 h-5 mr-4 text-accent-neon drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]" />
                AI_SELF_LEARNING_ANALYTICS
            </h3>

            {insights.length === 0 ? (
                <div className="bg-black/40 backdrop-blur-md border border-accent-neon/10 border-dashed rounded-3xl p-10 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 cyber-grid opacity-[0.05] pointer-events-none" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-accent-neon/5 rounded-xl border border-accent-neon/10 flex items-center justify-center mx-auto mb-6">
                            <BeakerIcon className="w-6 h-6 text-accent-neon/40 animate-pulse" />
                        </div>
                        <p className="text-[10px] font-black text-accent-neon/40 uppercase tracking-widest leading-relaxed max-w-[350px] mx-auto">
                            SYSTEM_IDLE: AWAITING_NEURAL_DENSITY_THRESHOLD. <br />
                            <span className="text-white/20 mt-4 block italic font-medium lowercase first-letter:uppercase">Cần ít nhất 3 lệnh để AI bắt đầu tìm kiếm các mẫu hành vi và sự thấu thị cá nhân hóa.</span>
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {insights.map((insight, idx) => (
                            <motion.div
                                key={insight.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-black/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-accent-neon/30 transition-all duration-500 group relative overflow-hidden"
                            >
                                <div className="absolute inset-y-0 left-0 w-1 bg-accent-neon opacity-20 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(0,255,157,0.5)]" />
                                <div className="flex items-start space-x-6 relative z-10">
                                    <div className="p-3 bg-black border border-white/10 rounded-xl group-hover:border-accent-neon/20 transition-colors shadow-inner">
                                        {React.cloneElement(getIcon(insight.insight_type) as React.ReactElement, { className: 'w-6 h-6 text-accent-neon' })}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">{insight.insight_type}_PROTOCOL</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">CONFIDENCE</span>
                                                <span className="text-[10px] text-accent-neon font-black italic tracking-tighter">
                                                    {Math.round(insight.confidence * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-white/70 font-medium leading-relaxed mb-4 uppercase tracking-wide truncate-lines-2">{insight.description}</p>
                                        {insight.is_actionable && insight.recommendation && (
                                            <div className="bg-accent-neon/5 border border-accent-neon/20 rounded-xl p-4 mt-2 group-hover:bg-accent-neon/10 transition-colors">
                                                <p className="text-[10px] text-accent-neon font-black uppercase tracking-widest mb-1 shadow-sm">NEURAL_ADVICE_LINK:</p>
                                                <p className="text-[10px] text-white/60 italic font-medium">
                                                    {insight.recommendation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
