// components/AIAccuracyDashboard.tsx
/**
 * AI Accuracy Dashboard
 * Displays AI decision accuracy statistics and insights.
 * Uses pure CSS/SVG for charts (no external chart library).
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

interface AIAccuracyStats {
    overall_accuracy: number;
    total_evaluated: number;
    by_decision: {
        BLOCK: { accuracy: number; count: number };
        WARN: { accuracy: number; count: number };
        ALLOW: { accuracy: number; count: number };
    };
    override_analysis: {
        total_overrides: number;
        successful_overrides: number;
        failed_overrides: number;
    };
    insights: string[];
}

const AIAccuracyDashboard: React.FC = () => {
    const [stats, setStats] = useState<AIAccuracyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await api.getAIAccuracy();
                setStats(data);
            } catch (err) {
                setError('Chưa có đủ dữ liệu để phân tích');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const getAccuracyColor = (accuracy: number): string => {
        if (accuracy >= 0.7) return '#10B981'; // Green
        if (accuracy >= 0.5) return '#F59E0B'; // Yellow
        return '#EF4444'; // Red
    };

    const getAccuracyLabel = (accuracy: number): string => {
        if (accuracy >= 0.8) return 'Xuất sắc';
        if (accuracy >= 0.7) return 'Tốt';
        if (accuracy >= 0.5) return 'Trung bình';
        return 'Cần cải thiện';
    };

    if (loading) {
        return (
            <div className="ai-accuracy-dashboard loading">
                <div className="loading-spinner"></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (error || !stats || stats.total_evaluated === 0) {
        return (
            <motion.div
                className="bg-black/40 backdrop-blur-xl border border-white/10 border-dashed rounded-3xl p-12 text-center relative overflow-hidden group"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="absolute inset-0 cyber-grid opacity-[0.03] pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-accent-neon/10 rounded-full flex items-center justify-center mb-6 border border-accent-neon/20 animate-pulse">
                        <span className="text-2xl">📊</span>
                    </div>
                    <h3 className="text-[12px] font-black text-white/60 uppercase tracking-[0.4em] mb-4">NEURAL_ACCURACY_MATRIX: OFFLINE</h3>
                    <p className="text-[11px] text-white/30 font-medium max-w-[400px] leading-relaxed italic mb-8">
                        AI cần ít nhất 1 lệnh ĐÃ ĐÓNG để bắt đầu tính toán độ chính xác. Hãy thực hiện giao dịch và ghi nhận kết quả để kích hoạt ma trận này.
                    </p>
                    <div className="flex gap-2 items-center">
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="w-0 h-full bg-accent-neon" />
                                </div>
                            ))}
                        </div>
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-2">Progress: 0%</span>
                    </div>
                </div>
            </motion.div>
        );
    }

    const overallPercent = Math.round(stats.overall_accuracy * 100);

    return (
        <motion.div
            className="bg-black/40 backdrop-blur-xl border border-accent-neon/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="absolute inset-0 cyber-grid opacity-[0.03] pointer-events-none" />

            <div className="flex justify-between items-center mb-10 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-accent-neon shadow-[0_0_8px_rgba(0,255,157,0.8)]" />
                    <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.5em]">AI_NEURAL_ACCURACY_MATRIX</h2>
                </div>
                <span className="text-[10px] font-black text-accent-neon/60 bg-accent-neon/5 border border-accent-neon/20 px-4 py-1.5 rounded-full uppercase tracking-widest">
                    TOTAL_EVALUATIONS: {stats.total_evaluated}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                {/* Overall Accuracy */}
                <div className="bg-black/60 border border-white/5 rounded-2xl p-6 flex flex-col items-center group-hover:border-accent-neon/20 transition-all duration-500">
                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-8">SYSTEM_PRECISION</h3>
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                fill="none"
                                stroke="rgba(255,255,255,0.03)"
                                strokeWidth="6"
                            />
                            <motion.circle
                                cx="64"
                                cy="64"
                                r="58"
                                fill="none"
                                stroke={getAccuracyColor(stats.overall_accuracy)}
                                strokeWidth="6"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: "0 364.4" }}
                                animate={{ strokeDasharray: `${stats.overall_accuracy * 364.4} 364.4` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="drop-shadow-[0_0_10px_rgba(0,255,157,0.4)]"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white italic tracking-tighter">{overallPercent}%</span>
                            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">{getAccuracyLabel(stats.overall_accuracy)}</span>
                        </div>
                    </div>
                </div>

                {/* Accuracy by Decision Type */}
                <div className="bg-black/60 border border-white/5 rounded-2xl p-6 group-hover:border-accent-neon/20 transition-all duration-500">
                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-6">DECISION_VECTOR_ANALYSIS</h3>
                    <div className="space-y-5">
                        {(['BLOCK', 'WARN', 'ALLOW'] as const).map(type => {
                            const data = stats.by_decision[type];
                            const percent = Math.round(data.accuracy * 100);
                            return (
                                <div key={type} className="space-y-2">
                                    <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase">
                                        <span className={type === 'BLOCK' ? 'text-accent-red' : type === 'WARN' ? 'text-accent-yellow' : 'text-accent-neon'}>
                                            {type}
                                        </span>
                                        <span className="text-white/40">{data.count} SESSIONS</span>
                                    </div>
                                    <div className="h-1.5 bg-black border border-white/5 rounded-full overflow-hidden p-0.5">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{
                                                backgroundColor: getAccuracyColor(data.accuracy),
                                                boxShadow: `0 0 10px ${getAccuracyColor(data.accuracy)}66`
                                            }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percent}%` }}
                                            transition={{ duration: 1, delay: 0.2 }}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <span className="text-[9px] font-black text-white/60 italic">{percent}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Override Analysis */}
                <div className="bg-black/60 border border-white/5 rounded-2xl p-6 group-hover:border-accent-neon/20 transition-all duration-500">
                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-6">NEURAL_OVERRIDE_LOG</h3>
                    {stats.override_analysis.total_overrides > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 p-4 bg-black/40 border border-white/5 rounded-xl text-center">
                                <span className="text-2xl font-black text-white italic block mb-1">{stats.override_analysis.total_overrides}</span>
                                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">TOTAL_MANUAL_INTERVENTIONS</span>
                            </div>
                            <div className="p-4 bg-accent-neon/5 border border-accent-neon/10 rounded-xl text-center">
                                <span className="text-lg font-black text-accent-neon italic block mb-1">{stats.override_analysis.successful_overrides}</span>
                                <span className="text-[8px] font-black text-accent-neon/40 uppercase tracking-widest">VALIDATED</span>
                            </div>
                            <div className="p-4 bg-accent-red/5 border border-accent-red/10 rounded-xl text-center">
                                <span className="text-lg font-black text-accent-red italic block mb-1">{stats.override_analysis.failed_overrides}</span>
                                <span className="text-[8px] font-black text-accent-red/40 uppercase tracking-widest">REJECTED</span>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                            <div className="w-12 h-12 bg-accent-neon/10 rounded-full flex items-center justify-center mb-4 border border-accent-neon/20">
                                <span className="text-xl">🛡️</span>
                            </div>
                            <p className="text-[10px] font-black text-accent-neon uppercase tracking-widest leading-relaxed">PROTOCOL_ADHERRANCE: 100%</p>
                            <p className="text-[8px] font-medium text-white/20 uppercase mt-2">No manual overrides detected in current epoch.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Insights */}
            {stats.insights.length > 0 && (
                <div className="mt-8 pt-8 border-t border-accent-neon/5 relative z-10">
                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-6">AI_SYSTEM_REFLECTIONS</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stats.insights.map((insight, index) => (
                            <motion.div
                                key={index}
                                className="bg-black/60 border-l-2 border-l-accent-neon border-y border-r border-white/5 p-4 rounded-r-xl group/insight hover:bg-accent-neon/5 transition-all duration-300"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <p className="text-[11px] text-white/60 font-medium leading-relaxed group-hover/insight:text-white transition-colors italic">
                                    {">"} {insight}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};
export default AIAccuracyDashboard;
