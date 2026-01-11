
import React from 'react';
import type { ProcessEvaluation, UserProcessEvaluation } from '../types';
import { BrainCircuitIcon, ShieldCheckIcon, AlertTriangleIcon, TrendingUpIcon, TrendingDownIcon } from './icons';

interface ComparativeProcessScoresProps {
    aiEvaluation: ProcessEvaluation;
    userEvaluation: UserProcessEvaluation;
}

interface MetricInfo {
    key: string;
    label: string;
    aiScore: number;
    userScore: number;
    description: string;
    improveHint: string;
}

const ScoreComparisonRow: React.FC<{ metric: MetricInfo }> = ({ metric }) => {
    const { label, aiScore, userScore, description, improveHint } = metric;
    const difference = userScore - aiScore;
    const accuracy = Math.abs(difference) <= 1;

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'bg-accent-green';
        if (score >= 5) return 'bg-accent-yellow';
        return 'bg-accent-red';
    };

    const getScoreTextColor = (score: number) => {
        if (score >= 8) return 'text-accent-green';
        if (score >= 5) return 'text-accent-yellow';
        return 'text-accent-red';
    };

    return (
        <div className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{label}</span>
                    <span className="text-[10px] text-gray-500 hidden sm:inline" title={description}>ⓘ</span>
                </div>
                <div className="flex items-center gap-3">
                    {/* User Score */}
                    <div className="text-right">
                        <span className="text-[10px] text-gray-500 block">Bạn đánh giá</span>
                        <span className={`text-lg font-black ${getScoreTextColor(userScore)}`}>{userScore}</span>
                    </div>
                    {/* AI Score */}
                    <div className="text-right">
                        <span className="text-[10px] text-gray-500 block">AI đánh giá</span>
                        <span className={`text-lg font-black ${getScoreTextColor(aiScore)}`}>{aiScore.toFixed(1)}</span>
                    </div>
                    {/* Accuracy Indicator */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${accuracy ? 'bg-accent-green/20' : 'bg-accent-yellow/20'}`}>
                        {accuracy ? (
                            <ShieldCheckIcon className="w-4 h-4 text-accent-green" />
                        ) : difference > 0 ? (
                            <TrendingUpIcon className="w-4 h-4 text-accent-yellow" />
                        ) : (
                            <TrendingDownIcon className="w-4 h-4 text-accent-red" />
                        )}
                    </div>
                </div>
            </div>

            {/* Comparison Bars */}
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-6">You</span>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full ${getScoreColor(userScore)} transition-all duration-500`}
                            style={{ width: `${userScore * 10}%` }} />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-6">AI</span>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full ${getScoreColor(aiScore)} transition-all duration-500`}
                            style={{ width: `${aiScore * 10}%` }} />
                    </div>
                </div>
            </div>

            {/* Insight */}
            {!accuracy && (
                <p className="text-[10px] text-gray-500 mt-2 italic">
                    {difference > 1 ? `💡 Bạn tự đánh giá cao hơn AI ${difference.toFixed(1)} điểm` : `⚠️ AI đánh giá cao hơn bạn ${Math.abs(difference).toFixed(1)} điểm`}
                </p>
            )}
        </div>
    );
};

export const ComparativeProcessScores: React.FC<ComparativeProcessScoresProps> = ({ aiEvaluation, userEvaluation }) => {
    // Convert emotional influence (1=good, 10=bad) to score (10=good, 1=bad)
    const userEmotionScore = 11 - (userEvaluation?.emotionalInfluence || 5);

    if (!aiEvaluation?.scores || !userEvaluation) {
        return null;
    }

    const metrics: MetricInfo[] = [
        {
            key: 'planning',
            label: '📋 Kế hoạch & Setup',
            aiScore: aiEvaluation.scores.setup,
            userScore: userEvaluation.setupClarity,
            description: 'Đánh giá chất lượng chuẩn bị trước giao dịch: entry point, tín hiệu, confluence',
            improveHint: 'Chuẩn bị checklist trước khi vào lệnh'
        },
        {
            key: 'risk',
            label: '🛡️ Quản lý Rủi ro',
            aiScore: aiEvaluation.scores.risk,
            userScore: userEvaluation.followedPositionSizing,
            description: 'Đánh giá việc đặt Stop Loss, Take Profit và position sizing',
            improveHint: 'Luôn xác định SL/TP trước khi vào lệnh'
        },
        {
            key: 'execution',
            label: '⚡ Kỷ luật Thực thi',
            aiScore: aiEvaluation.scores.execution,
            userScore: userEvaluation.planAdherence,
            description: 'Đánh giá việc tuân thủ kế hoạch đã đề ra, không FOMO hay panic',
            improveHint: 'Viết ra kế hoạch và tuân thủ 100%'
        },
        {
            key: 'emotion',
            label: '🧠 Kiểm soát Cảm xúc',
            aiScore: aiEvaluation.scores.emotion,
            userScore: userEmotionScore,
            description: 'Đánh giá mức độ để cảm xúc ảnh hưởng đến quyết định giao dịch',
            improveHint: 'Nghỉ ngơi 5 phút sau mỗi lệnh thua'
        }
    ];

    // Calculate averages
    const avgUserScore = metrics.reduce((sum, m) => sum + m.userScore, 0) / metrics.length;
    const avgAIScore = metrics.reduce((sum, m) => sum + m.aiScore, 0) / metrics.length;
    const accuracyPercentage = metrics.filter(m => Math.abs(m.userScore - m.aiScore) <= 1).length / metrics.length * 100;

    return (
        <div className="w-full space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="flex items-center text-sm font-bold text-white uppercase tracking-wider">
                    <BrainCircuitIcon className="w-5 h-5 mr-2 text-accent-blue" />
                    So sánh Đánh giá Quy trình
                </h3>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">Độ chính xác tự đánh giá:</span>
                    <span className={`font-bold ${accuracyPercentage >= 75 ? 'text-accent-green' : 'text-accent-yellow'}`}>
                        {accuracyPercentage.toFixed(0)}%
                    </span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500/10 to-transparent rounded-xl border border-blue-500/20">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Điểm TB của bạn</p>
                    <p className="text-2xl font-black text-blue-400">{avgUserScore.toFixed(1)}<span className="text-sm opacity-60">/10</span></p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl border border-purple-500/20">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Điểm TB AI</p>
                    <p className="text-2xl font-black text-purple-400">{avgAIScore.toFixed(1)}<span className="text-sm opacity-60">/10</span></p>
                </div>
            </div>

            {/* Metric Rows */}
            <div className="space-y-2">
                {metrics.map(metric => (
                    <ScoreComparisonRow key={metric.key} metric={metric} />
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-[10px] text-gray-500 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-accent-green/30 flex items-center justify-center">
                        <ShieldCheckIcon className="w-2 h-2 text-accent-green" />
                    </div>
                    <span>Chính xác (±1 điểm)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-accent-yellow/30 flex items-center justify-center">
                        <TrendingUpIcon className="w-2 h-2 text-accent-yellow" />
                    </div>
                    <span>Tự đánh giá cao hơn</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-accent-red/30 flex items-center justify-center">
                        <TrendingDownIcon className="w-2 h-2 text-accent-red" />
                    </div>
                    <span>AI đánh giá cao hơn</span>
                </div>
            </div>
        </div>
    );
};
