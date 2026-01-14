import React from 'react';
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
                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center">
                    <ActivityIcon className="w-4 h-4 mr-2 text-accent-primary" />
                    Thông Số Thị Trường
                </h3>
                <div className="p-6 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                    <ActivityIcon className="w-8 h-8 text-accent-primary/30 mx-auto mb-3" />
                    <p className="text-sm font-bold text-white mb-2">Đang chờ dữ liệu</p>
                    <p className="text-xs text-gray-500">Thông số thị trường sẽ hiển thị khi có Market Context</p>
                </div>
            </div>
        );
    }

    const dangerColor = analysis.danger_level === 'DANGEROUS' || analysis.danger_level === 'EXTREME' ? 'text-accent-red' :
        analysis.danger_level === 'CAUTION' ? 'text-accent-yellow' : 'text-accent-green';

    // Derived metrics from analysis (different from main MarketContext)
    const sentiment = analysis.factors?.sentiment || 50;
    const volatility = analysis.factors?.volatility || 50;
    const sentimentLabel = sentiment > 60 ? 'Tham lam' : sentiment < 40 ? 'Sợ hãi' : 'Trung lập';
    const volatilityLabel = volatility > 70 ? 'Rất cao' : volatility > 50 ? 'Cao' : volatility > 30 ? 'Trung bình' : 'Thấp';

    return (
        <div className="space-y-4">
            {/* Header - Different title from MarketContext */}
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center">
                    <ActivityIcon className="w-4 h-4 mr-2 text-accent-primary" />
                    Thông Số Thị Trường
                </h3>
                <div className={`flex items-center space-x-2 px-2 py-1 rounded-md bg-white/5 border border-white/10 ${dangerColor}`}>
                    <span className="text-[10px] font-bold uppercase">{analysis.danger_level}</span>
                    <span className="text-sm">{analysis.color_code}</span>
                </div>
            </div>

            {/* Sentiment & Volatility - UNIQUE to this widget */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-gradient-to-br from-orange-500/5 to-transparent border border-orange-500/10 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase">
                            <FireIcon className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
                            Sentiment
                        </div>
                        <span className={`text-xs font-bold ${sentiment > 60 ? 'text-accent-red' : sentiment < 40 ? 'text-accent-green' : 'text-gray-400'}`}>
                            {sentimentLabel}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-white">{sentiment}</span>
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${sentiment > 60 ? 'bg-accent-red' : sentiment < 40 ? 'bg-accent-green' : 'bg-gray-500'}`}
                                style={{ width: `${sentiment}%` }}
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-2">
                        {sentiment > 60 ? '⚠️ Thị trường đang quá tham lam' : sentiment < 40 ? '✅ Cơ hội tích lũy' : 'Tâm lý cân bằng'}
                    </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/10 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase">
                            <BeakerIcon className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                            Volatility
                        </div>
                        <span className={`text-xs font-bold ${volatility > 50 ? 'text-accent-yellow' : 'text-accent-green'}`}>
                            {volatilityLabel}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-white">{volatility}</span>
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${volatility > 70 ? 'bg-accent-red' : volatility > 50 ? 'bg-accent-yellow' : 'bg-accent-green'}`}
                                style={{ width: `${volatility}%` }}
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-2">
                        {volatility > 70 ? '🔥 Biến động mạnh, cẩn thận!' : volatility > 50 ? '⚡ Cần theo dõi' : '✨ Ổn định'}
                    </p>
                </div>
            </div>

            {/* Risk Factors - UNIQUE detailed breakdown */}
            {analysis.risk_factors && analysis.risk_factors.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center">
                        <ShieldExclamationIcon className="w-3.5 h-3.5 mr-1.5 text-accent-red" />
                        Yếu Tố Rủi Ro Chính
                    </h4>
                    <div className="space-y-2">
                        {analysis.risk_factors.slice(0, 3).map((risk, idx) => (
                            <div key={idx} className="flex items-start space-x-3 p-3 bg-accent-red/5 border border-accent-red/10 rounded-lg group hover:border-accent-red/30 transition-all">
                                <div className="w-5 h-5 rounded-full bg-accent-red/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-bold text-accent-red">{idx + 1}</span>
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="text-xs font-bold text-white">{risk.factor}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{risk.description}</p>
                                </div>
                                {risk.impact && (
                                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${risk.impact === 'HIGH' ? 'bg-accent-red/20 text-accent-red' :
                                        risk.impact === 'MEDIUM' ? 'bg-accent-yellow/20 text-accent-yellow' :
                                            'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {risk.impact}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trading Tip - UNIQUE actionable advice */}
            <div className="p-3 bg-accent-primary/5 border border-accent-primary/20 rounded-lg">
                <p className="text-[10px] text-gray-400">
                    💡 <span className="font-semibold text-accent-primary">Gợi ý:</span>{' '}
                    {analysis.danger_level === 'SAFE' ?
                        'Điều kiện thuận lợi, có thể tăng position size.' :
                        analysis.danger_level === 'CAUTION' ?
                            'Giữ position size bình thường, đặt SL chặt.' :
                            'Giảm position size hoặc đứng ngoài thị trường.'
                    }
                </p>
            </div>
        </div>
    );
};
