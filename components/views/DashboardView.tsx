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
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(255,0,85,0.1)] col-span-full relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-accent-red/5 via-transparent to-accent-red/5 animate-pulse" />
                <AlertTriangleIcon className="w-16 h-16 text-accent-red mb-4 drop-shadow-[0_0_10px_rgba(255,0,85,0.5)]" />
                <h3 className="text-2xl font-black text-white uppercase tracking-[0.3em] mb-2">{t('dashboard.crisisTitle')}</h3>
                <p className="text-accent-red/70 font-bold uppercase text-xs tracking-widest max-w-md">{t('dashboard.crisisDesc')}</p>
                <div className="mt-6 px-4 py-1 bg-accent-red/20 border border-accent-red/30 rounded-full">
                    <span className="text-[10px] font-black text-accent-red uppercase tracking-widest">Protocol: LOCKDOWN_ACTIVE</span>
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
        <div className="space-y-8 pb-12 selection:bg-accent-neon selection:text-black">
            {/* Onboarding Banner for New Users */}
            <OnboardingBanner
                tradeCount={tradeCount}
                dojoCount={dojoCount}
                hasCheckin={hasCheckin}
            />

            {/* Top Row: Core Stats */}
            <div className="bento-grid !p-0">
                <DashboardHeader stats={props.stats} processStats={props.processStats} />
            </div>

            <div className="bento-grid !p-0">
                {/* Left Column: Market & Analysis Detail */}
                <div className="span-8 space-y-8">
                    <div className="bento-card !p-0 overflow-hidden">
                        <MarketContext analysis={props.marketAnalysis} onAnalysisReceived={props.onMarketAnalysis} isLocked={false} unlockDays={0} />
                    </div>

                    <div className="bento-card !p-0 overflow-hidden min-h-[500px] relative">
                        {/* Corner HUD Markers */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-accent-neon/20 rounded-tl-3xl pointer-events-none" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-accent-neon/20 rounded-tr-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-accent-neon/20 rounded-bl-3xl pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-accent-neon/20 rounded-br-3xl pointer-events-none" />

                        {props.selectedTradeForAnalysis ? (
                            <TradeAnalysisDetail
                                trade={props.selectedTradeForAnalysis}
                                analysis={props.tradeAnalysis}
                                isAnalyzing={props.isAnalyzingTrade}
                                onClose={props.onClearAnalysis}
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
                                {/* Decorative elements */}
                                <div className="absolute inset-0 cyber-grid opacity-[0.03] pointer-events-none" />

                                <div className="w-24 h-24 bg-black border border-accent-neon/20 rounded-3xl flex items-center justify-center mb-10 shadow-[0_0_40px_rgba(0,255,157,0.1)] relative group">
                                    <div className="absolute inset-0 bg-accent-neon/5 rounded-3xl animate-pulse" />
                                    <BrainCircuitIcon className="w-12 h-12 text-accent-neon drop-shadow-[0_0_10px_rgba(0,255,157,0.5)]" />
                                </div>

                                <h3 className="text-xl font-black text-white uppercase tracking-[0.4em] mb-4 italic">
                                    {t('dashboard.selectTradeHint')}
                                </h3>
                                <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em] max-w-sm leading-loose mb-10">
                                    {t('dashboard.selectTradeDesc')}
                                </p>

                                <div className="flex flex-col items-center gap-4">
                                    <div className="inline-flex items-center gap-4 px-8 py-3 bg-black border border-accent-neon/30 rounded-full shadow-[0_0_20px_rgba(0,255,157,0.05)]">
                                        <div className="w-2 h-2 rounded-full bg-accent-neon animate-ping" />
                                        <span className="text-[10px] font-black text-accent-neon uppercase tracking-[0.3em]">System_Idle_Awaiting_Data</span>
                                    </div>
                                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-accent-neon/20 to-transparent" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Bio & Live Feed Proxy */}
                <div className="span-4 space-y-8">
                    <div className="bento-card !p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:opacity-10 transition-opacity duration-1000">
                            <ActivityIcon className="w-40 h-40 text-accent-neon scale-110" />
                        </div>

                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-[10px] font-black text-accent-neon uppercase tracking-[0.4em] flex items-center">
                                    <div className="w-1.5 h-4 bg-accent-neon mr-3 shadow-[0_0_8px_rgba(0,255,157,0.8)]" />
                                    {t('dashboard.biometricStatus')}
                                </h3>
                                <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest ml-4.5">Core_Link_Established</span>
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
                            <h4 className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">{t('nav.progress')} // GROWTH_VECTORS</h4>
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