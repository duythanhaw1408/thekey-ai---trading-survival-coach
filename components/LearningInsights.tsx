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
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center">
                <BeakerIcon className="w-4 h-4 mr-2" />
                AI Self-Learning Insights
            </h3>

            {insights.length === 0 ? (
                <div className="bg-panel/50 border border-divider border-dashed rounded-xl p-6 text-center">
                    <p className="text-sm text-text-secondary">AI đang thu thập thêm dữ liệu để học hỏi thói quen của bạn. Cần ít nhất 5 trades để bắt đầu tạo Insight.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    <AnimatePresence>
                        {insights.map((insight, idx) => (
                            <motion.div
                                key={insight.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-panel border border-divider rounded-xl p-4 hover:border-accent-primary/50 transition-all group"
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-background rounded-lg border border-divider group-hover:border-accent-primary/30 transition-colors">
                                        {getIcon(insight.insight_type)}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{insight.insight_type}</span>
                                            <span className="text-[10px] text-accent-primary font-mono">Confidence: {Math.round(insight.confidence * 100)}%</span>
                                        </div>
                                        <p className="text-sm text-text-main leading-relaxed mb-2">{insight.description}</p>
                                        {insight.is_actionable && insight.recommendation && (
                                            <div className="bg-accent-primary/5 border border-accent-primary/10 rounded-lg p-2 mt-2">
                                                <p className="text-xs text-accent-primary font-medium">
                                                    💡 Khuyến nghị: {insight.recommendation}
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
