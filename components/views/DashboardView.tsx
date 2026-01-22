import React, { useState } from 'react';
import type { Trade, TraderStats, DetectedPattern, CheckinAnalysisResult, MasteryData, Pod, TradeAnalysis, ProcessStats, MarketAnalysis, BehavioralReport, ShadowScore, WeeklyGoals, WeeklyReport } from '../../types';
import { StatusCard } from '../StatusCard';
import { MarketContext } from '../MarketContext';
import { ProgressTracker } from '../ProgressTracker';
import { MasteryTracker } from '../MasteryTracker';
import { TradeAnalysisDetail } from '../TradeAnalysisDetail';
import { ShieldCheckIcon, TrendingDownIcon, TrophyIcon, BrainCircuitIcon, TrendingUpIcon, AlertTriangleIcon, KeyIcon, ActivityIcon } from '../icons';
import { BioStatusWidget } from '../BioStatusWidget';
import { MarketIntelWidget } from '../MarketIntelWidget';
import { OnboardingBanner } from '../OnboardingBanner';
import { Tooltip, FeatureTooltips, InfoTooltip } from '../Tooltip';
import { useLanguage } from '../../contexts/LanguageContext';
import GrowthGarden from '../GrowthGarden';
import TrustBattery from '../TrustBattery';

interface DashboardViewProps {
    stats: TraderStats;
    marketAnalysis: MarketAnalysis | null;
    onMarketAnalysis: (analysis: MarketAnalysis) => void;
    processStats: ProcessStats | null;
    tradeHistory: Trade[];
    onAnalyzeTrade: (trade: Trade) => void;
    isAnalyzingTrade: boolean;
    selectedTradeForAnalysis: Trade | null;
    onCloseTrade: (trade: Trade) => void;
    onPatternDetected: (pattern: DetectedPattern) => void;
    checkinHistory: CheckinAnalysisResult[];
    masteryData: MasteryData | null;
    pod: Pod | null;
    onSendPodMessage: (text: string) => void;
    tradeAnalysis: TradeAnalysis | null;
    onClearAnalysis: () => void;
    onGenerateBehavioralReport: () => void;
    behavioralReport: BehavioralReport | null;
    shadowScore: ShadowScore | null;
    onGetWeeklyGoals: () => void;
    weeklyGoals: WeeklyGoals | null;
    isLoadingGoals: boolean;
    onGetWeeklyReport: () => void;
    weeklyReport: WeeklyReport | null;
    isLoadingReport: boolean;
    // New props for onboarding
    dojoCount?: number;
    hasCheckin?: boolean;
}

const DashboardHeader: React.FC<{ stats: TraderStats, processStats: ProcessStats | null }> = ({ stats, processStats }) => {
    const { t } = useLanguage();
    const isCrisisState = stats.consecutiveLosses >= 2;
    if (isCrisisState) {
        return (
            <div className="bg-accent-red/5 border border-accent-red/20 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(255,51,102,0.1)] col-span-full relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-accent-red/5 via-transparent to-accent-red/5 animate-pulse-slow" />
                <div className="relative bg-black border border-accent-red/30 p-5 rounded-3xl mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-700">
                    <AlertTriangleIcon className="w-12 h-12 text-accent-red drop-shadow-[0_0_15px_rgba(255,51,102,0.6)]" />
                </div>
                <h3 className="text-3xl font-black text-white uppercase tracking-[0.4em] mb-3 italic">{t('dashboard.crisisTitle')}</h3>
                <p className="text-accent-red/60 font-bold uppercase text-[10px] tracking-[0.3em] max-w-lg leading-relaxed">{t('dashboard.crisisDesc')}</p>
                <div className="mt-8 px-6 py-2 bg-accent-red/20 border border-accent-red/40 rounded-full shadow-[0_0_20px_rgba(255,51,102,0.2)]">
                    <span className="text-[10px] font-black text-accent-red uppercase tracking-[0.4em]">PROTOCOL_LOCKDOWN_ENGAGED</span>
                </div>
            </div>
        )
    }
    return (
        <>
            <StatusCard
                icon={<TrophyIcon className="w-6 h-6 text-accent-neon" />}
                label={t('dashboard.survivalDays')}
                value={stats.survivalDays.toString()}
                tooltip={FeatureTooltips.survivalDays}
            />
            <StatusCard
                icon={<ShieldCheckIcon className="w-6 h-6 text-accent-neon" />}
                label={t('dashboard.disciplineScore')}
                value={`${stats.disciplineScore}%`}
                tooltip={FeatureTooltips.disciplineScore}
            />
            <StatusCard
                icon={<BrainCircuitIcon className="w-6 h-6 text-accent-yellow" />}
                label={t('dashboard.avgProcessScore')}
                value={processStats ? `${processStats.averageScore}` : 'N/A'}
                tooltip={FeatureTooltips.processScore}
            />
            <StatusCard
                icon={processStats?.trend === 'IMPROVING' ? <TrendingUpIcon className="w-6 h-6 text-accent-neon" /> : <TrendingDownIcon className="w-6 h-6 text-accent-red" />}
                label={t('dashboard.processTrend')}
                value={processStats?.trend || 'STABLE'}
                tooltip={FeatureTooltips.processTrend}
            />
        </>
    );
};

export const DashboardView: React.FC<DashboardViewProps> = (props) => {
    const { t } = useLanguage();
    const tradeCount = props.tradeHistory?.length || 0;
    const dojoCount = props.dojoCount ?? (props.tradeHistory?.filter(t => t.processEvaluation).length || 0);
    const hasCheckin = props.hasCheckin ?? props.checkinHistory?.length > 0;

    return (
        <div className="space-y-10 pb-20 selection:bg-accent-neon selection:text-black">
            {/* Onboarding Banner for New Users */}
            <OnboardingBanner
                tradeCount={tradeCount}
                dojoCount={dojoCount}
                hasCheckin={hasCheckin}
            />

            {/* Top Row: Core Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                <DashboardHeader stats={props.stats} processStats={props.processStats} />
            </div>

            <div className="grid grid-cols-12 gap-4 sm:gap-6 lg:gap-10">
                {/* Left Column: Market & Analysis Detail */}
                <div className="col-span-12 lg:col-span-8 space-y-10">
                    <div className="bento-card !p-10 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:opacity-10 transition-opacity duration-1000">
                            <ActivityIcon className="w-64 h-64 text-white -rotate-12" />
                        </div>
                        <MarketContext analysis={props.marketAnalysis} onAnalysisReceived={props.onMarketAnalysis} isLocked={false} unlockDays={0} />
                    </div>

                    <div className="bento-card !p-0 overflow-hidden min-h-[550px] relative shadow-2xl">
                        {/* High-End Corner HUD Markers */}
                        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-white/5 rounded-tl-[2.5rem] pointer-events-none" />
                        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-white/5 rounded-tr-[2.5rem] pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-white/5 rounded-bl-[2.5rem] pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-white/5 rounded-br-[2.5rem] pointer-events-none" />

                        {props.selectedTradeForAnalysis ? (
                            <TradeAnalysisDetail
                                trade={props.selectedTradeForAnalysis}
                                analysis={props.tradeAnalysis}
                                isAnalyzing={props.isAnalyzingTrade}
                                onClose={props.onClearAnalysis}
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-16 text-center relative overflow-hidden h-full min-h-[550px]">
                                {/* Decorative Architecture */}
                                <div className="absolute inset-0 cyber-grid opacity-[0.04] pointer-events-none" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent-neon/5 rounded-full blur-[100px] pointer-events-none" />

                                <div className="w-28 h-28 bg-black border border-white/10 rounded-[2rem] flex items-center justify-center mb-12 shadow-2xl relative group transition-transform duration-700 hover:scale-105">
                                    <div className="absolute inset-0 bg-accent-neon/5 rounded-[2rem] animate-pulse-slow" />
                                    <BrainCircuitIcon className="w-14 h-14 text-accent-neon drop-shadow-[0_0_15px_rgba(0,245,155,0.6)]" />
                                </div>

                                <h3 className="text-2xl font-black text-white uppercase tracking-[0.5em] mb-6 italic tracking-tighter">
                                    AWAITING_INPUT_STREAM
                                </h3>
                                <p className="text-white/30 text-[11px] uppercase font-bold tracking-[0.3em] max-w-sm leading-loose mb-12">
                                    {t('dashboard.selectTradeDesc')}
                                </p>

                                <div className="flex flex-col items-center gap-6">
                                    <div className="inline-flex items-center gap-5 px-10 py-4 bg-black/60 border border-white/5 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all hover:border-accent-neon/30 hover:shadow-[0_0_30px_rgba(0,245,155,0.05)] cursor-default group">
                                        <div className="w-2.5 h-2.5 rounded-full bg-accent-neon animate-ping" />
                                        <span className="text-[10px] font-black text-accent-neon uppercase tracking-[0.4em] group-hover:scale-105 transition-transform">Kernel_Idle_Ready</span>
                                    </div>
                                    <div className="h-px w-48 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Bio & Live Feed Proxy */}
                <div className="col-span-12 lg:col-span-4 space-y-10">
                    <div className="bento-card !p-10 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-10 transition-opacity duration-1000">
                            <ActivityIcon className="w-48 h-48 text-accent-neon scale-110" />
                        </div>

                        <div className="flex justify-between items-start mb-12 relative z-10">
                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-black text-accent-neon uppercase tracking-[0.5em] flex items-center">
                                    <div className="w-1.5 h-5 bg-accent-neon mr-4 shadow-[0_0_12px_rgba(0,245,155,0.8)]" />
                                    {t('dashboard.biometricStatus')}
                                </h3>
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-5.5 italic">Cortex_Sync: 100%</span>
                            </div>
                            <TrustBattery
                                score={props.shadowScore?.score || 100}
                                chargingFactors={props.shadowScore?.chargingFactors}
                                drainingFactors={props.shadowScore?.drainingFactors}
                            />
                        </div>
                        <BioStatusWidget />
                    </div>

                    {/* Market Intelligence Widget */}
                    <div className="bento-card !p-8 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-neon/[0.02] to-transparent pointer-events-none" />
                        <MarketIntelWidget analysis={props.marketAnalysis} />
                    </div>

                    <div className="bento-card !p-0 overflow-hidden relative">
                        <div className="absolute top-4 left-6 z-10">
                            <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">{t('nav.progress')} // GROWTH_VECTORS</h4>
                        </div>
                        <GrowthGarden
                            score={props.stats.disciplineScore}
                            blooms={props.stats.achievements || []} // Assuming achievements map to blooms
                            needsWatering={!hasCheckin}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};