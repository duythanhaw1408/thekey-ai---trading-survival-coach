import React from 'react';
import { MarketAnalysis } from '../types';
import { NewspaperIcon, BeakerIcon, FireIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

interface MarketIntelWidgetProps {
    analysis: MarketAnalysis | null;
}

export const MarketIntelWidget: React.FC<MarketIntelWidgetProps> = ({ analysis }) => {
    if (!analysis) return null;

    const dangerColor = analysis.danger_level === 'DANGER' ? 'text-accent-red' :
        analysis.danger_level === 'CAUTION' ? 'text-accent-yellow' : 'text-accent-green';

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center">
                    <NewspaperIcon className="w-4 h-4 mr-2 text-accent-primary" />
                    AI Market Intelligence
                </h3>
                <div className={`flex items-center space-x-2 px-2 py-1 rounded-md bg-white/5 border border-white/10 ${dangerColor}`}>
                    <span className="text-[10px] font-bold uppercase">{analysis.danger_level}</span>
                    <span className="text-sm">{analysis.color_code}</span>
                </div>
            </div>

            <div className="bg-panel/40 border border-divider rounded-xl p-4">
                <p className="text-sm font-bold text-white mb-2">{analysis.headline}</p>
                <p className="text-xs text-text-secondary leading-relaxed italic">
                    "{analysis.recommendation?.rationale || 'AI đang phân tích dữ liệu vĩ mô và tin tức để đưa ra nhận định...'}"
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                    <div className="flex items-center text-[10px] font-bold text-text-secondary uppercase mb-2">
                        <FireIcon className="w-3 h-3 mr-1 text-accent-yellow" />
                        Sentiment
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-lg font-black text-white">{analysis.factors?.sentiment || 50}</span>
                        <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-accent-yellow" style={{ width: `${analysis.factors?.sentiment || 50}%` }}></div>
                        </div>
                    </div>
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                    <div className="flex items-center text-[10px] font-bold text-text-secondary uppercase mb-2">
                        <BeakerIcon className="w-3 h-3 mr-1 text-accent-blue" />
                        Volatility
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-lg font-black text-white">{analysis.factors?.volatility || 50}</span>
                        <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-accent-blue" style={{ width: `${analysis.factors?.volatility || 50}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {analysis.risk_factors && analysis.risk_factors.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-1">Key Risk Factors (Sơ đồ rủi ro)</h4>
                    {analysis.risk_factors.slice(0, 2).map((risk, idx) => (
                        <div key={idx} className="flex items-center space-x-3 p-2 bg-accent-red/5 border border-accent-red/10 rounded-lg">
                            <ShieldExclamationIcon className="w-4 h-4 text-accent-red flex-shrink-0" />
                            <div className="flex-grow min-w-0">
                                <p className="text-[10px] font-bold text-white truncate">{risk.factor}</p>
                                <p className="text-[9px] text-text-secondary truncate">{risk.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
