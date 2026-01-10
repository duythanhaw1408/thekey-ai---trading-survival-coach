
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
}

const DashboardHeader: React.FC<{ stats: TraderStats, processStats: ProcessStats | null }> = ({ stats, processStats }) => {
    const isCrisisState = stats.consecutiveLosses >= 2;
    if (isCrisisState) {
        return (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg animate-pulse col-span-full">
                <AlertTriangleIcon className="w-12 h-12 text-accent-red mb-3" />
                <h3 className="text-xl font-bold text-white">BÌNH TĨNH. RỦI RO TRẢ THÙ ĐANG RẤT CAO.</h3>
                <p className="text-text-secondary mt-2">Hệ thống bảo vệ khuyến nghị bạn nên nghỉ ngơi.</p>
            </div>
        )
    }
    return (
        <>
            <StatusCard icon={<TrophyIcon className="w-8 h-8 text-accent-primary" />} label="Survival Days" value={stats.survivalDays.toString()} />
            <StatusCard icon={<ShieldCheckIcon className="w-8 h-8 text-accent-green" />} label="Discipline Score" value={`${stats.disciplineScore}%`} />
            <StatusCard icon={<BrainCircuitIcon className="w-8 h-8 text-accent-yellow" />} label="Avg Process Score" value={processStats ? `${processStats.averageScore}` : 'N/A'} />
            <StatusCard icon={processStats?.trend === 'IMPROVING' ? <TrendingUpIcon className="w-8 h-8 text-accent-green" /> : <TrendingDownIcon className="w-8 h-8 text-accent-red" />} label="Process Trend" value={processStats?.trend || 'STABLE'} />
        </>
    );
};

export const DashboardView: React.FC<DashboardViewProps> = (props) => {
    return (
        <div className="space-y-6 animate-entrance">
            {/* Top Row: Core Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DashboardHeader stats={props.stats} processStats={props.processStats} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Market & Analysis Detail */}
                <div className="lg:col-span-8 space-y-6 flex flex-col">
                    <div className="bento-card bg-black/40 border-white/5">
                        <MarketContext analysis={props.marketAnalysis} onAnalysisReceived={props.onMarketAnalysis} isLocked={false} unlockDays={0} />
                    </div>

                    <div className="flex-1 bento-card flex flex-col p-0 overflow-hidden min-h-[500px] bg-black/40 border-white/5 shadow-2xl">
                        {props.selectedTradeForAnalysis ? (
                            <TradeAnalysisDetail
                                trade={props.selectedTradeForAnalysis}
                                analysis={props.tradeAnalysis}
                                isAnalyzing={props.isAnalyzingTrade}
                                onClose={props.onClearAnalysis}
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                                <KeyIcon className="w-12 h-12 text-accent-primary mx-auto mb-4 opacity-50" />
                                <p className="text-sm font-mono uppercase tracking-[0.2em]">Protection Protocol Active</p>
                                <p className="text-[10px] mt-2 opacity-60">SELECT A CLOSED TRADE TO ANALYZE BEHAVIOR</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Bio & Live Feed Proxy */}
                <div className="lg:col-span-4 space-y-6 flex flex-col">
                    <div className="bento-card p-6 flex-1 bg-gradient-to-br from-accent-primary/5 to-transparent border-white/5">
                        <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-6 flex items-center">
                            <ActivityIcon className="w-4 h-4 mr-2 text-accent-primary" />
                            Biometric Status
                        </h3>
                        <BioStatusWidget />
                    </div>

                    {/* Market Intelligence Widget */}
                    <div className="bento-card p-6 bg-black/40 border-white/5">
                        <MarketIntelWidget analysis={props.marketAnalysis} />
                    </div>

                    <div className="bento-card p-6 bg-black/40 border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Survival Streak</h3>
                            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></div>
                        </div>
                        <div className="text-3xl font-black italic tracking-tighter text-white">
                            {props.stats.survivalDays} <span className="text-xs font-bold uppercase not-italic text-text-secondary">Days Standing</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};