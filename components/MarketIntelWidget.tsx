import React from 'react';
import { motion } from 'framer-motion';
import { MarketAnalysis } from '../types';
import { BeakerIcon, FireIcon, ShieldExclamationIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { ActivityIcon, AlertTriangleIcon } from './icons';

interface MarketIntelWidgetProps {
    analysis: MarketAnalysis | null;
}

export const MarketIntelWidget: React.FC<MarketIntelWidgetProps> = ({ analysis }) => {
    if (!analysis) {
        return (
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center">
                    <ActivityIcon className="w-4 h-4 mr-2 text-accent-neon" />
                    Phân Tích Thị Trường
                </h3>
                <div className="p-6 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                    <ActivityIcon className="w-8 h-8 text-accent-neon/30 mx-auto mb-3" />
                    <p className="text-sm font-bold text-white mb-2">Đang chờ dữ liệu</p>
                    <p className="text-xs text-gray-500">Thông số thị trường sẽ hiển thị khi có dữ liệu</p>
                </div>
            </div>
        );
    }

    const dangerColor = analysis.danger_level === 'DANGEROUS' || analysis.danger_level === 'EXTREME' ? 'text-accent-red' :
        analysis.danger_level === 'CAUTION' ? 'text-accent-yellow' : 'text-accent-neon';

    const dangerBg = analysis.danger_level === 'DANGEROUS' || analysis.danger_level === 'EXTREME' ? 'bg-accent-red/10 border-accent-red/30' :
        analysis.danger_level === 'CAUTION' ? 'bg-accent-yellow/10 border-accent-yellow/30' : 'bg-accent-neon/10 border-accent-neon/30';

    const sentiment = analysis.factors?.sentiment || 50;
    const volatility = analysis.factors?.volatility || 50;
    const sentimentLabel = sentiment > 60 ? 'Tham lam' : sentiment < 40 ? 'Sợ hãi' : 'Trung lập';
    const volatilityLabel = volatility > 70 ? 'Rất cao' : volatility > 50 ? 'Cao' : volatility > 30 ? 'TB' : 'Thấp';

    const getDangerLabel = (level: string) => {
        switch (level) {
            case 'SAFE': return 'An toàn';
            case 'CAUTION': return 'Cẩn thận';
            case 'DANGEROUS': return 'Nguy hiểm';
            case 'EXTREME': return 'Cực kỳ nguy hiểm';
            default: return level;
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center">
                    <ActivityIcon className="w-4 h-4 mr-2 text-accent-neon" />
                    Thị Trường
                </h3>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${dangerBg} ${dangerColor}`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${dangerColor.replace('text-', 'bg-')}`} />
                    <span className="text-[10px] font-bold uppercase">{getDangerLabel(analysis.danger_level)}</span>
                </div>
            </div>

            {/* Sentiment & Volatility - Stacked Layout */}
            <div className="space-y-3">
                {/* Sentiment Card */}
                <div className="p-4 bg-black/30 border border-white/5 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <FireIcon className="w-4 h-4 text-orange-500" />
                            <span className="text-xs font-bold text-white/60">Tâm Lý Thị Trường</span>
                        </div>
                        <span className={`text-xs font-bold ${sentiment > 60 ? 'text-accent-red' : sentiment < 40 ? 'text-accent-neon' : 'text-white/50'}`}>
                            {sentimentLabel}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-white">{sentiment}</span>
                        <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${sentiment}%` }}
                                className={`h-full rounded-full ${sentiment > 60 ? 'bg-accent-red' : sentiment < 40 ? 'bg-accent-neon' : 'bg-white/30'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Volatility Card */}
                <div className="p-4 bg-black/30 border border-white/5 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <BeakerIcon className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-bold text-white/60">Độ Biến Động</span>
                        </div>
                        <span className={`text-xs font-bold ${volatility > 50 ? 'text-accent-yellow' : 'text-accent-neon'}`}>
                            {volatilityLabel}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-white">{volatility}</span>
                        <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${volatility}%` }}
                                className={`h-full rounded-full ${volatility > 70 ? 'bg-accent-red' : volatility > 50 ? 'bg-accent-yellow' : 'bg-accent-neon'}`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Risk Factors */}
            {analysis.risk_factors && analysis.risk_factors.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white/40 flex items-center gap-2">
                        <ShieldExclamationIcon className="w-4 h-4 text-accent-red/60" />
                        Yếu Tố Rủi Ro
                    </h4>
                    <div className="space-y-2">
                        {analysis.risk_factors.slice(0, 2).map((risk, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-black/20 border border-white/5 rounded-lg">
                                <div className="w-7 h-7 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-white/50">{idx + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white leading-tight">{risk.factor}</p>
                                    <p className="text-[10px] text-white/40 mt-0.5 leading-tight line-clamp-1">{risk.description}</p>
                                </div>
                                {risk.impact && (
                                    <div className={`text-[9px] font-bold px-2 py-1 rounded flex-shrink-0 ${risk.impact === 'HIGH' ? 'bg-accent-red/20 text-accent-red' :
                                            risk.impact === 'MEDIUM' ? 'bg-accent-yellow/20 text-accent-yellow' :
                                                'bg-white/10 text-white/40'
                                        }`}>
                                        {risk.impact === 'HIGH' ? 'Cao' : risk.impact === 'MEDIUM' ? 'TB' : 'Thấp'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trading Advice */}
            <div className="p-3 bg-accent-neon/5 border border-accent-neon/20 rounded-lg">
                <p className="text-[11px] text-white/70 leading-relaxed">
                    <span className="font-bold text-accent-neon mr-1">Khuyến nghị:</span>
                    {analysis.danger_level === 'SAFE' ?
                        'Điều kiện thuận lợi. Có thể tăng khối lượng giao dịch.' :
                        analysis.danger_level === 'CAUTION' ?
                            'Thị trường nhiều nhiễu. Giữ khối lượng chuẩn, siết stop loss.' :
                            'Nguy hiểm cao. Giảm mạnh khối lượng hoặc tạm dừng giao dịch.'
                    }
                </p>
            </div>
        </div>
    );
};
