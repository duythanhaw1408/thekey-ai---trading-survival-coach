
import React, { useState, useMemo } from 'react';
import type { Trade, DetectedPattern, WeeklyGoals, TraderStats, WeeklyReport, CheckinAnalysisResult, ProcessStats, BehavioralReport, ShadowScore, MarketAnalysis } from '../types';
import { getDetectedPattern, getWeeklyGoals, getWeeklyReport, getProgressInsight } from '../services/geminiService';
import { PatternCard } from './PatternCard';
import { WeeklyGoalsCard } from './WeeklyGoalsCard';
import { WeeklyReportCard } from './WeeklyReportCard';
import { SearchIcon, CalendarIcon, FileTextIcon, BrainCircuitIcon } from './icons';
import { ProcessMetricsDisplay } from './ProcessMetricsDisplay';
import { useLanguage } from '../contexts/LanguageContext';

interface ProgressTrackerProps {
    tradeHistory: Trade[];
    stats: TraderStats;
    onPatternDetected: (pattern: DetectedPattern) => void;
    checkinHistory: CheckinAnalysisResult[];
    marketAnalysis: MarketAnalysis | null;
    processStats: ProcessStats | null;
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

const BehavioralReportCard: React.FC<{ report: BehavioralReport }> = ({ report }) => {
    const { t } = useLanguage();
    return (
        <div className="w-full mt-6 p-6 glass-panel flex flex-col space-y-4 animate-entrance border-accent-primary/20 shadow-2xl shadow-accent-primary/10">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-black text-accent-primary-neon uppercase tracking-[0.2em] flex items-center">
                    <BrainCircuitIcon className="w-4 h-4 mr-2 neon-text-blue" />
                    {t('mindset.behavioralFingerprint')}
                </h3>
                <div className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary uppercase tracking-widest border border-accent-primary/30">
                    {t('mindset.aiDeepAnalysis')}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1 group-hover:text-white/50">{t('mindset.emotionalTrigger')}</h4>
                    <p className="text-sm font-medium text-white/80">{report.fingerprint.emotionalTrigger}</p>
                </div>
                <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1 group-hover:text-white/50">{t('mindset.activePattern')}</h4>
                    <p className="text-sm font-black text-accent-yellow-neon uppercase tracking-tight neon-text-yellow">{report.activePattern.name}</p>
                    <p className="text-[11px] italic text-text-secondary mt-1 opacity-70">"{report.activePattern.description}"</p>
                </div>
                <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1 group-hover:text-white/50">{t('mindset.strategicFocus')}</h4>
                    <p className="text-sm font-medium text-white/80">{report.predictions.nextWeekFocus}</p>
                </div>
                <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1 group-hover:text-white/50">{t('mindset.survivalProtocol')}</h4>
                    <p className="text-sm font-bold text-accent-green-neon neon-text-green">{report.recommendations.action}</p>
                </div>
            </div>
        </div>
    );
};


const ShadowScoreDisplay: React.FC<{ score: ShadowScore }> = ({ score }) => {
    const { t } = useLanguage();
    return (
        <div className="w-full mt-4 p-4 glass-panel flex items-center justify-between group hover:border-white/20">
            <div className="flex flex-col">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">{t('progress.selfAwarenessEngine')}</p>
                <p className="text-sm text-text-secondary">{t('progress.trustLevel')}: <span className={`font-black uppercase ${score.trustLevel === 'HIGH_TRUST' ? 'text-accent-green' : score.trustLevel === 'MEDIUM_TRUST' ? 'text-accent-yellow' : 'text-accent-red'}`}>{score.trustLevel.replace('_', ' ')}</span></p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 group-hover:neon-border-blue transition-all">
                <p className={`text-2xl font-black font-mono leading-none ${score.trustLevel === 'HIGH_TRUST' ? 'text-accent-green-neon neon-text-green' : score.trustLevel === 'MEDIUM_TRUST' ? 'text-accent-yellow-neon neon-text-yellow' : 'text-accent-red-neon neon-text-red'}`}>
                    {score.rawScore}
                </p>
            </div>
        </div>
    );
};


export const ProgressTracker: React.FC<ProgressTrackerProps> = (props) => {
    const { t } = useLanguage();
    const { tradeHistory, stats, onPatternDetected, checkinHistory, marketAnalysis, processStats,
        onGenerateBehavioralReport, behavioralReport, shadowScore,
        onGetWeeklyGoals, weeklyGoals, isLoadingGoals,
        onGetWeeklyReport, weeklyReport, isLoadingReport } = props;
    const [isLoadingPattern, setIsLoadingPattern] = useState(false);
    const [pattern, setPattern] = useState<DetectedPattern | null>(null);

    const handleDetectPattern = async () => {
        setIsLoadingPattern(true);
        setPattern(null);
        try {
            const result = await getDetectedPattern(tradeHistory, marketAnalysis);
            setPattern(result);
            if (result.pattern_name !== "Không tìm thấy khuôn mẫu rõ ràng") {
                onPatternDetected(result);
            }
        } catch (error) { console.error(error); }
        finally { setIsLoadingPattern(false); }
    };

    return (
        <div className="w-full space-y-6">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] px-2">{t('progress.title')}</h2>

            {processStats && <ProcessMetricsDisplay processStats={processStats} />}
            {shadowScore && <ShadowScoreDisplay score={shadowScore} />}

            <div className="w-full grid grid-cols-2 gap-4 my-8">
                <button
                    onClick={handleDetectPattern}
                    disabled={isLoadingPattern || tradeHistory.length < 5}
                    className="flex flex-col items-center justify-center p-6 glass-panel hover:bg-white/5 hover:border-accent-primary/50 transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <div className="p-3 bg-white/5 rounded-full mb-3 group-hover:neon-border-blue transition-all">
                        <SearchIcon className="w-5 h-5 text-accent-primary group-hover:neon-text-blue" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-all text-center">
                        {isLoadingPattern ? t('progress.parsing') : t('progress.analyzePatterns')}
                    </span>
                </button>
                <button
                    onClick={onGenerateBehavioralReport}
                    disabled={tradeHistory.length < 5}
                    className="flex flex-col items-center justify-center p-6 glass-panel hover:bg-white/5 hover:border-accent-primary/50 transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <div className="p-3 bg-white/5 rounded-full mb-3 group-hover:neon-border-blue transition-all">
                        <BrainCircuitIcon className="w-5 h-5 text-accent-primary group-hover:neon-text-blue" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-all text-center">
                        {t('progress.fingerprintReport')}
                    </span>
                </button>
                <button
                    onClick={onGetWeeklyGoals}
                    disabled={isLoadingGoals || tradeHistory.length < 3}
                    className="flex flex-col items-center justify-center p-6 glass-panel hover:bg-white/5 hover:border-accent-primary/50 transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <div className="p-3 bg-white/5 rounded-full mb-3 group-hover:neon-border-blue transition-all">
                        <CalendarIcon className="w-5 h-5 text-accent-primary group-hover:neon-text-blue" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-all text-center">
                        {isLoadingGoals ? t('progress.calibrating') : t('progress.setObjectives')}
                    </span>
                </button>
                <button
                    onClick={onGetWeeklyReport}
                    disabled={isLoadingReport || tradeHistory.length < 5}
                    className="flex flex-col items-center justify-center p-6 glass-panel hover:bg-white/5 hover:border-accent-primary/50 transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <div className="p-3 bg-white/5 rounded-full mb-3 group-hover:neon-border-blue transition-all">
                        <FileTextIcon className="w-5 h-5 text-accent-primary group-hover:neon-text-blue" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-all text-center">
                        {isLoadingReport ? t('progress.syncing') : t('progress.survivalReport')}
                    </span>
                </button>
            </div>
            {(tradeHistory.length < 5) && <p className="text-xs text-text-secondary text-center -mt-4 mb-4">{t('progress.requirementNote', { count: 5 })}</p>}

            {isLoadingPattern && <div className="w-full mt-4 p-4 text-center text-text-secondary">{t('progress.analyzingPatterns')}</div>}
            {pattern && !isLoadingPattern && <PatternCard pattern={pattern} />}
            {behavioralReport && <BehavioralReportCard report={behavioralReport} />}

            {isLoadingGoals && <div className="w-full mt-4 p-4 text-center text-text-secondary">{t('progress.generatingGoals')}</div>}
            {weeklyGoals && <WeeklyGoalsCard goals={weeklyGoals} />}

            {isLoadingReport && <div className="w-full mt-4 p-4 text-center text-text-secondary">{t('progress.compilingReport')}</div>}
            {weeklyReport && <WeeklyReportCard report={weeklyReport} />}
        </div>
    );
};