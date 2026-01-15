
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
            case 'SAFE': return 'text-accent-neon';
            case 'CAUTION': return 'text-accent-blue';
            case 'DANGEROUS': return 'text-accent-yellow';
            case 'EXTREME': return 'text-accent-red';
            default: return 'text-white/20';
        }
    }

    if (isLocked) {
        return (
            <div className="p-12 text-center bg-white/[0.01] backdrop-blur-3xl rounded-[2.5rem] border border-white/[0.05]">
                <div className="w-16 h-16 bg-black border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <KeyIcon className="w-8 h-8 text-white/10" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-[0.3em] mb-3">CONFINEMENT_ACTIVE</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] max-w-[240px] mx-auto leading-relaxed">
                    Survive for <span className="text-accent-yellow">{unlockDays}</span> days to breach this intelligence layer.
                </p>
            </div>
        );
    }


    return (
        <div className="space-y-8 flex flex-col h-full">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-5 bg-accent-neon shadow-[0_0_10px_rgba(0,245,155,0.5)]" />
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Market_Intelligence_Core</h3>
                </div>
            </div>

            {!analysis && !isLoading && (
                <button
                    onClick={handleAnalyze}
                    className="w-full font-black py-6 px-8 rounded-2xl transition-all duration-500 bg-accent-neon text-black hover:scale-[1.02] shadow-[0_0_25px_rgba(0,245,155,0.2)] uppercase text-[11px] tracking-[0.4em]"
                >
                    INITIALIZE_SCAN
                </button>
            )}

            {isLoading && (
                <div className="animate-entrance space-y-6 flex-1">
                    <div className="flex flex-col md:flex-row gap-8 h-full">
                        <div className="h-48 bg-white/[0.02] rounded-[2.5rem] md:w-1/3 animate-pulse border border-white/[0.05]"></div>
                        <div className="h-48 bg-white/[0.02] rounded-[2.5rem] md:w-2/3 space-y-6 p-8 animate-pulse border border-white/[0.05]">
                            <div className="h-6 bg-white/5 rounded-full w-3/4"></div>
                            <div className="h-24 bg-white/5 rounded-2xl w-full"></div>
                        </div>
                    </div>
                </div>
            )}

            {analysis && (
                <div className="flex flex-col md:flex-row gap-8 animate-entrance flex-1">
                    <div className="flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-3xl rounded-[2.5rem] md:w-1/3 text-center border border-white/5 shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/[0.02] pointer-events-none" />
                        <div className={`p-6 rounded-full bg-white/[0.02] mb-6 shadow-inner ring-1 ring-white/5 transition-all duration-700 ${getLevelClasses(analysis.danger_level).replace('text-', 'drop-shadow-[0_0_15px_rgba(').replace(')', ',0.4)]')}`}>
                            <GaugeIcon className={`w-12 h-12 ${getLevelClasses(analysis.danger_level)} transition-transform duration-700 group-hover:scale-110`} />
                        </div>
                        <p className={`text-3xl font-black tracking-tighter mb-2 uppercase italic ${getLevelClasses(analysis.danger_level)}`}>{analysis.danger_level}</p>
                        <div className="bg-black border border-white/5 px-4 py-1.5 rounded-full shadow-inner">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">RISK_EXP: <span className="text-white">{analysis.danger_score}</span></p>
                        </div>
                    </div>

                    <div className="md:w-2/3 space-y-6 flex flex-col justify-center">
                        <div className="space-y-3 px-2">
                            <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Global_Headline</h4>
                            <p className="text-[22px] font-black text-white leading-[1.15] italic tracking-tighter uppercase">{analysis.headline}</p>
                        </div>

                        <div className="p-6 bg-white/[0.01] border border-white/[0.05] rounded-[2.5rem] relative overflow-hidden group hover:border-accent-red/20 transition-all duration-500 shadow-xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-red/5 blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                            <h4 className="flex items-center text-[10px] font-black text-accent-red uppercase tracking-[0.3em] mb-4">
                                <AlertTriangleIcon className="w-4 h-4 mr-2 drop-shadow-[0_0_8px_rgba(255,51,102,0.5)]" />
                                Protocol_Directive
                            </h4>

                            <p className="text-lg font-black text-white mb-2 uppercase italic tracking-tight">{analysis.recommendation?.action?.replace('_', ' ') || 'REDUCE POSITION'}</p>
                            <p className="text-xs font-bold text-white/40 leading-relaxed mb-6 uppercase tracking-wider">{analysis.recommendation.rationale}</p>

                            <div className="flex items-center space-x-4 bg-black/60 p-4 rounded-2xl border border-white/5 group-hover:border-accent-red/20 transition-all">
                                <div className="w-2 h-2 rounded-full bg-accent-red animate-pulse shadow-[0_0_8px_rgba(255,51,102,0.6)]" />
                                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none">
                                    <span className="text-accent-red drop-shadow-[0_0_3px_rgba(255,51,102,0.3)]">ADJUSTMENT:</span> {analysis.recommendation.position_adjustment}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};