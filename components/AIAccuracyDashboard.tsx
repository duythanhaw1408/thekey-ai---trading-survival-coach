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
                className="ai-accuracy-dashboard empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="empty-state">
                    <span className="empty-icon">📊</span>
                    <h3>AI Accuracy Dashboard</h3>
                    <p>Chưa có đủ dữ liệu để phân tích. Hãy thực hiện thêm giao dịch để xem AI có đúng hay không!</p>
                </div>
            </motion.div>
        );
    }

    const overallPercent = Math.round(stats.overall_accuracy * 100);

    return (
        <motion.div
            className="ai-accuracy-dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="dashboard-header">
                <h2>🎯 AI Accuracy Dashboard</h2>
                <span className="total-evaluated">{stats.total_evaluated} lệnh đã đánh giá</span>
            </div>

            <div className="dashboard-grid">
                {/* Overall Accuracy - Circular Progress */}
                <div className="stat-card overall-accuracy">
                    <h3>Độ chính xác tổng</h3>
                    <div className="circular-progress">
                        <svg viewBox="0 0 100 100">
                            <circle
                                className="progress-background"
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="#2a2a2a"
                                strokeWidth="8"
                            />
                            <motion.circle
                                className="progress-bar"
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke={getAccuracyColor(stats.overall_accuracy)}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${overallPercent * 2.83} 283`}
                                transform="rotate(-90 50 50)"
                                initial={{ strokeDasharray: "0 283" }}
                                animate={{ strokeDasharray: `${overallPercent * 2.83} 283` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </svg>
                        <div className="progress-text">
                            <span className="percent">{overallPercent}%</span>
                            <span className="label">{getAccuracyLabel(stats.overall_accuracy)}</span>
                        </div>
                    </div>
                </div>

                {/* Accuracy by Decision Type */}
                <div className="stat-card by-decision">
                    <h3>Theo loại quyết định</h3>
                    <div className="decision-bars">
                        {(['BLOCK', 'WARN', 'ALLOW'] as const).map(type => {
                            const data = stats.by_decision[type];
                            const percent = Math.round(data.accuracy * 100);
                            return (
                                <div key={type} className="decision-bar">
                                    <div className="bar-header">
                                        <span className={`decision-type ${type.toLowerCase()}`}>
                                            {type === 'BLOCK' ? '🛑 BLOCK' : type === 'WARN' ? '⚠️ WARN' : '✅ ALLOW'}
                                        </span>
                                        <span className="bar-count">{data.count} lệnh</span>
                                    </div>
                                    <div className="bar-container">
                                        <motion.div
                                            className="bar-fill"
                                            style={{ backgroundColor: getAccuracyColor(data.accuracy) }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percent}%` }}
                                            transition={{ duration: 0.8, delay: 0.2 }}
                                        />
                                    </div>
                                    <span className="bar-percent">{percent}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Override Analysis */}
                <div className="stat-card override-analysis">
                    <h3>Phân tích Override</h3>
                    {stats.override_analysis.total_overrides > 0 ? (
                        <div className="override-stats">
                            <div className="override-stat">
                                <span className="stat-number">{stats.override_analysis.total_overrides}</span>
                                <span className="stat-label">Lần bỏ qua AI</span>
                            </div>
                            <div className="override-stat success">
                                <span className="stat-number">{stats.override_analysis.successful_overrides}</span>
                                <span className="stat-label">Thành công</span>
                            </div>
                            <div className="override-stat failed">
                                <span className="stat-number">{stats.override_analysis.failed_overrides}</span>
                                <span className="stat-label">Thất bại</span>
                            </div>
                        </div>
                    ) : (
                        <p className="no-overrides">Bạn chưa bao giờ bỏ qua khuyến nghị AI. Tuyệt vời! 🎉</p>
                    )}
                </div>
            </div>

            {/* Insights */}
            {stats.insights.length > 0 && (
                <div className="insights-section">
                    <h3>💡 Insights</h3>
                    <div className="insights-list">
                        {stats.insights.map((insight, index) => (
                            <motion.div
                                key={index}
                                className="insight-card"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {insight}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .ai-accuracy-dashboard {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 16px;
                    padding: 24px;
                    margin: 16px 0;
                }

                .ai-accuracy-dashboard.loading,
                .ai-accuracy-dashboard.empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 200px;
                    color: #888;
                }

                .empty-state {
                    text-align: center;
                }

                .empty-icon {
                    font-size: 48px;
                    display: block;
                    margin-bottom: 12px;
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .dashboard-header h2 {
                    margin: 0;
                    font-size: 18px;
                    color: #fff;
                }

                .total-evaluated {
                    font-size: 13px;
                    color: #888;
                    background: rgba(255,255,255,0.1);
                    padding: 4px 12px;
                    border-radius: 12px;
                }

                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                }

                .stat-card {
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 16px;
                }

                .stat-card h3 {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    color: #aaa;
                    font-weight: 500;
                }

                /* Circular Progress */
                .circular-progress {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    margin: 0 auto;
                }

                .circular-progress svg {
                    width: 100%;
                    height: 100%;
                }

                .progress-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                }

                .progress-text .percent {
                    font-size: 28px;
                    font-weight: bold;
                    color: #fff;
                    display: block;
                }

                .progress-text .label {
                    font-size: 11px;
                    color: #888;
                }

                /* Decision Bars */
                .decision-bar {
                    margin-bottom: 12px;
                }

                .bar-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                    font-size: 12px;
                }

                .decision-type {
                    font-weight: 500;
                }

                .decision-type.block { color: #EF4444; }
                .decision-type.warn { color: #F59E0B; }
                .decision-type.allow { color: #10B981; }

                .bar-count {
                    color: #666;
                }

                .bar-container {
                    height: 8px;
                    background: #2a2a2a;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .bar-fill {
                    height: 100%;
                    border-radius: 4px;
                }

                .bar-percent {
                    font-size: 12px;
                    color: #888;
                }

                /* Override Stats */
                .override-stats {
                    display: flex;
                    justify-content: space-around;
                    text-align: center;
                }

                .override-stat {
                    flex: 1;
                }

                .stat-number {
                    font-size: 24px;
                    font-weight: bold;
                    color: #fff;
                    display: block;
                }

                .override-stat.success .stat-number { color: #10B981; }
                .override-stat.failed .stat-number { color: #EF4444; }

                .stat-label {
                    font-size: 11px;
                    color: #888;
                }

                .no-overrides {
                    text-align: center;
                    color: #10B981;
                    font-size: 13px;
                }

                /* Insights */
                .insights-section {
                    margin-top: 20px;
                }

                .insights-section h3 {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    color: #aaa;
                }

                .insights-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .insight-card {
                    background: rgba(59, 130, 246, 0.1);
                    border-left: 3px solid #3B82F6;
                    padding: 12px 16px;
                    border-radius: 0 8px 8px 0;
                    font-size: 13px;
                    color: #ddd;
                    line-height: 1.5;
                }

                .loading-spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid #333;
                    border-top-color: #3B82F6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </motion.div>
    );
};

export default AIAccuracyDashboard;
