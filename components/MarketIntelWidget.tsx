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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-accent-neon/5">
                <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em] flex items-center">
                    <ActivityIcon className="w-4 h-4 mr-3 text-accent-neon drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]" />
                    Market_Intelligence
                </h3>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-black border ${dangerColor.replace('text-', 'border-')}/30 ${dangerColor} shadow-inner`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${dangerColor.replace('text-', 'bg-')}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{analysis.danger_level}</span>
                </div>
            </div>

            {/* Sentiment & Volatility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-black/40 border border-accent-neon/5 rounded-2xl relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.03] to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">
                            <FireIcon className="w-4 h-4 mr-2 text-orange-500/60" />
                            SENTIMENT_INDEX
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${sentiment > 60 ? 'text-accent-red' : sentiment < 40 ? 'text-accent-neon' : 'text-white/40'}`}>
                            {sentimentLabel}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <span className="text-3xl font-black text-white tracking-tighter italic font-sans">{sentiment}</span>
                        <div className="flex-1 h-3 bg-black border border-white/5 rounded-full overflow-hidden shadow-inner p-0.5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${sentiment}%` }}
                                className={`h-full rounded-full transition-all duration-1000 ${sentiment > 60 ? 'bg-accent-red shadow-[0_0_10px_rgba(255,0,85,0.5)]' : sentiment < 40 ? 'bg-accent-neon shadow-[0_0_10px_rgba(0,255,157,0.5)]' : 'bg-white/20'}`}
                            />
                        </div>
                    </div>
                    <p className="text-[9px] font-bold text-white/20 mt-4 uppercase tracking-widest italic group-hover:text-white/40 transition-colors">
                        {sentiment > 60 ? 'ALERT: EXCESSIVE_GREED_DETECTED' : sentiment < 40 ? 'OPPORTUNITY: EXTREME_FEAR_STAGED' : 'SYSTEM_STATUS: NEUTRAL_STABILITY'}
                    </p>
                </div>

                <div className="p-5 bg-black/40 border border-accent-neon/5 rounded-2xl relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
                            <BeakerIcon className="w-4 h-4 mr-2 text-blue-500/60" />
                            VOLATILITY_FLOW
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${volatility > 50 ? 'text-accent-yellow' : 'text-accent-neon'}`}>
                            {volatilityLabel}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <span className="text-3xl font-black text-white tracking-tighter italic font-sans">{volatility}</span>
                        <div className="flex-1 h-3 bg-black border border-white/5 rounded-full overflow-hidden shadow-inner p-0.5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${volatility}%` }}
                                className={`h-full rounded-full transition-all duration-1000 ${volatility > 70 ? 'bg-accent-red shadow-[0_0_10px_rgba(255,0,85,0.5)]' : volatility > 50 ? 'bg-accent-yellow shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-accent-neon shadow-[0_0_10px_rgba(0,255,157,0.5)]'}`}
                            />
                        </div>
                    </div>
                    <p className="text-[9px] font-bold text-white/20 mt-4 uppercase tracking-widest italic group-hover:text-white/40 transition-colors">
                        {volatility > 70 ? 'WARNING: UNSTABLE_VECTORS' : volatility > 50 ? 'CAUTION: INCREASED_NOISE' : 'SIGNAL: OPTIMAL_VELOCITY'}
                    </p>
                </div>
            </div>

            {/* Risk Factors */}
            {analysis.risk_factors && analysis.risk_factors.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em] flex items-center">
                        <ShieldExclamationIcon className="w-4 h-4 mr-3 text-accent-red/60" />
                        CRITICAL_RISK_FACTORS
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                        {analysis.risk_factors.slice(0, 3).map((risk, idx) => (
                            <div key={idx} className="flex items-center space-x-4 p-4 bg-black/20 border border-white/5 rounded-2xl group hover:border-accent-neon/20 transition-all duration-500">
                                <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-accent-neon/30 transition-colors">
                                    <span className="text-xs font-black text-white/40 group-hover:text-accent-neon transition-colors">{idx + 1}</span>
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="text-xs font-black text-white uppercase tracking-tighter truncate">{risk.factor}</p>
                                    <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider mt-1 truncate">{risk.description}</p>
                                </div>
                                {risk.impact && (
                                    <div className={`text-[8px] font-black px-3 py-1 rounded-full border ${risk.impact === 'HIGH' ? 'bg-accent-red/10 border-accent-red/30 text-accent-red' :
                                        risk.impact === 'MEDIUM' ? 'bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow' :
                                            'bg-white/5 border-white/10 text-white/30'
                                        }`}>
                                        {risk.impact}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trading Tip */}
            <div className="p-4 bg-accent-neon/5 border border-accent-neon/20 rounded-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-accent-neon/[0.02] animate-pulse" />
                <p className="text-[10px] text-white/60 font-medium relative z-10 leading-relaxed uppercase tracking-widest">
                    <span className="font-black text-accent-neon mr-2">PROTOCOL_ADVICE:</span>
                    {analysis.danger_level === 'SAFE' ?
                        'OPTIMAL CONDITIONS. OVERWEIGHT POSITIONING AUTHORIZED.' :
                        analysis.danger_level === 'CAUTION' ?
                            'ELEVATED NOISE. MAINTAIN STANDARD SIZING. TIGHTEN STOPS.' :
                            'EXTREME HAZARD. DRASTIC SIZING REDUCTION OR SYSTEM HALT ADVISED.'
                    }
                </p>
            </div>
        </div>
    );
};
