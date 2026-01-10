
import React, { useState, useEffect } from 'react';
import type { MarketAnalysis } from '../types';
import { api } from '../services/api';
import { GaugeIcon, AlertTriangleIcon, KeyIcon } from './icons';

interface MarketContextProps {
    analysis: MarketAnalysis | null;
    onAnalysisReceived: (analysis: MarketAnalysis) => void;
    isLocked: boolean;
    unlockDays: number;
}

export const MarketContext: React.FC<MarketContextProps> = ({ analysis: externalAnalysis, onAnalysisReceived, isLocked, unlockDays }) => {
    const [analysis, setAnalysis] = useState<MarketAnalysis | null>(externalAnalysis);
    const [isLoading, setIsLoading] = useState(false);

    // Auto-fetch on component mount if it's not locked and no analysis exists
    useEffect(() => {
        if (!isLocked && !analysis) {
            handleAnalyze();
        }
    }, [isLocked]);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setAnalysis(null);
        try {
            const result = await api.getMarketContext();
            setAnalysis(result);
            onAnalysisReceived(result);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    const getLevelClasses = (level: MarketAnalysis['danger_level']) => {
        switch (level) {
            case 'SAFE': return 'text-accent-green';
            case 'CAUTION': return 'text-accent-primary';
            case 'DANGEROUS': return 'text-accent-yellow';
            case 'EXTREME': return 'text-accent-red';
            default: return 'text-gray-400';
        }
    }

    if (isLocked) {
        return (
            <div className="p-4 rounded-lg text-center">
                <KeyIcon className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                <h3 className="text-md font-semibold text-text-secondary">Market Context Locked</h3>
                <p className="text-xs text-text-secondary">
                    Survive for <span className="font-bold text-accent-yellow">{unlockDays}</span> days to unlock this feature.
                </p>
            </div>
        );
    }


    return (
        <div className="space-y-6 flex flex-col h-full">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] px-2">Market Context</h3>

            {!analysis && !isLoading && (
                <button
                    onClick={handleAnalyze}
                    className="w-full font-bold py-4 px-6 rounded-xl transition-all duration-300 bg-accent-primary text-white hover:scale-[1.02] shadow-lg shadow-accent-primary/20"
                >
                    REFRESH MARKET ANALYSIS
                </button>
            )}

            {isLoading && (
                <div className="animate-entrance space-y-4 flex-1">
                    <div className="flex flex-col md:flex-row gap-6 h-full">
                        <div className="h-40 bg-white/5 rounded-2xl md:w-1/3 animate-pulse border border-white/10"></div>
                        <div className="h-40 bg-white/5 rounded-2xl md:w-2/3 space-y-4 p-6 animate-pulse border border-white/10">
                            <div className="h-5 bg-white/10 rounded-full w-3/4"></div>
                            <div className="h-20 bg-white/5 rounded-xl w-full"></div>
                        </div>
                    </div>
                </div>
            )}

            {analysis && (
                <div className="flex flex-col md:flex-row gap-6 animate-entrance flex-1">
                    <div className="flex flex-col items-center justify-center p-6 bg-black rounded-2xl md:w-1/3 text-center border border-white/10 shadow-inner group hover:border-white/20 transition-all duration-500">
                        <div className={`p-4 rounded-full bg-white/5 mb-4 group-hover:neon-border-blue transition-all ${getLevelClasses(analysis.danger_level).replace('text-', 'neon-text-')}`}>
                            <GaugeIcon className={`w-10 h-10 ${getLevelClasses(analysis.danger_level)}`} />
                        </div>
                        <p className={`text-2xl font-black tracking-tighter mb-1 ${getLevelClasses(analysis.danger_level)}`}>{analysis.danger_level}</p>
                        <div className="bg-white/5 px-3 py-1 rounded-full">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Risk: <span className="text-white font-mono">{analysis.danger_score}/100</span></p>
                        </div>
                    </div>

                    <div className="md:w-2/3 space-y-4 flex flex-col justify-center">
                        <div className="space-y-2 px-2">
                            <p className="text-xl font-bold text-white leading-tight">"{analysis.headline}"</p>
                        </div>

                        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group hover:border-accent-red/30 transition-all duration-500">
                            {/* Decorative Red Glow if Dangerous */}
                            {(analysis.danger_level === 'DANGEROUS' || analysis.danger_level === 'EXTREME') && (
                                <div className="absolute top-0 right-0 w-20 h-20 bg-accent-red/5 blur-3xl pointer-events-none"></div>
                            )}

                            <h4 className="flex items-center text-xs font-black text-accent-red uppercase tracking-widest mb-3">
                                <AlertTriangleIcon className="w-4 h-4 mr-2 neon-text-red" />
                                Protocol Recommendation
                            </h4>

                            <p className="text-base font-bold text-white mb-2">{analysis.recommendation?.action?.replace('_', ' ') || 'REDUCE POSITION'}</p>
                            <p className="text-sm text-text-secondary leading-relaxed mb-4">{analysis.recommendation.rationale}</p>

                            <div className="flex items-center space-x-3 bg-black/40 p-3 rounded-xl border border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-red-neon animate-pulse"></div>
                                <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
                                    <span className="text-accent-red-neon">Adjustment:</span> {analysis.recommendation.position_adjustment}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};