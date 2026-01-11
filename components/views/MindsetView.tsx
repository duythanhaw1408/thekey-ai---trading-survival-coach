import React from 'react';
import { motion } from 'framer-motion';
import type { BehavioralReport, ShadowScore, ProcessStats, WeeklyReport, WeeklyGoals } from '../../types';
import { BrainCircuitIcon, ShieldCheckIcon } from '../icons';
import { ProcessMetricsDisplay } from '../ProcessMetricsDisplay';
import { ProtectionSettings } from '../ProtectionSettings';
import type { UserProfile } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { InfoTooltip, FeatureTooltips } from '../Tooltip';



interface MindsetViewProps {
    behavioralReport: BehavioralReport | null;
    shadowScore: ShadowScore | null;
    processStats: ProcessStats | null;
    onGenerateReport: () => void;
    tradeCount: number;
    profile: UserProfile;
    onUpdateProfile: (updates: Partial<UserProfile>) => void;
    onSaveProfile: () => Promise<void>;
    // Optional new props for future features
    weeklyReport?: WeeklyReport | null;
    weeklyGoals?: WeeklyGoals | null;
    onGetWeeklyReport?: () => void;
    onGetWeeklyGoals?: () => void;
    isLoadingReport?: boolean;
    isLoadingGoals?: boolean;
}

export const MindsetView: React.FC<MindsetViewProps> = ({
    behavioralReport,
    shadowScore,
    processStats,
    onGenerateReport,
    tradeCount,
    profile,
    onUpdateProfile,
    onSaveProfile,
    weeklyReport,
    weeklyGoals,
    onGetWeeklyReport,
    onGetWeeklyGoals,
    isLoadingReport,
    isLoadingGoals,
}) => {
    const { t } = useLanguage();

    return (
        <div className="space-y-6 animate-entrance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Behavioral Fingerprint Section */}
                <div className="bento-card p-6 flex flex-col h-full bg-black/40 border-white/5 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black text-accent-primary uppercase tracking-[0.2em] flex items-center">
                            <BrainCircuitIcon className="w-5 h-5 mr-3" />
                            Behavioral Fingerprint
                        </h3>
                        {behavioralReport && (
                            <div className="text-[10px] font-bold px-3 py-1 rounded-full bg-accent-primary/20 text-accent-primary uppercase tracking-widest border border-accent-primary/30">
                                AI Deep Analysis
                            </div>
                        )}
                    </div>

                    {!behavioralReport ? (
                        <div className="p-6 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                            <BrainCircuitIcon className="w-10 h-10 text-accent-primary/30 mx-auto mb-3" />
                            <p className="text-sm font-bold text-white mb-2">{t('mindset.analysisBehaviorAI')}</p>
                            <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
                                {t('mindset.analysisBehaviorDesc')}
                            </p>

                            {/* Progress indicator */}
                            <div className="w-full max-w-xs mb-4">
                                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                    <span>{t('mindset.unlockProgress')}</span>
                                    <span>{Math.min(tradeCount, 5)}/5 trades</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent-primary transition-all duration-500"
                                        style={{ width: `${Math.min(tradeCount / 5 * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={onGenerateReport}
                                disabled={tradeCount < 5}
                                className="px-6 py-3 bg-accent-primary text-black font-black uppercase text-xs tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                            >
                                {tradeCount < 5 ? t('mindset.needMoreTrades', { count: 5 - tradeCount }) : t('mindset.generateReport')}
                            </button>

                            {tradeCount < 5 && (
                                <p className="text-[10px] text-gray-500 mt-3 max-w-xs">
                                    💡 <span className="text-accent-yellow">{t('common.tipLabel')}</span> {t('mindset.tipGoToDojo')}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 group hover:border-accent-primary/30 transition-all">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t('mindset.emotionalTrigger')}</h4>
                                    <InfoTooltip text={FeatureTooltips.emotionalTrigger} />
                                </div>
                                <p className="text-sm font-medium text-white/90 leading-relaxed">{behavioralReport.fingerprint.emotionalTrigger || t('common.notEnoughData')}</p>
                            </div>
                            <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 group hover:border-accent-yellow/30 transition-all">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t('mindset.activePattern')}</h4>
                                    <InfoTooltip text={FeatureTooltips.activePattern} />
                                </div>
                                <p className="text-sm font-black text-accent-yellow uppercase tracking-tight">{behavioralReport.activePattern.name || t('mindset.noSignificantPattern')}</p>
                                <p className="text-[11px] italic text-text-secondary mt-1 opacity-70">"{behavioralReport.activePattern.description || t('mindset.behaviorConsistent')}"</p>
                            </div>
                            <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 group hover:border-accent-primary/30 transition-all">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t('mindset.strategicFocus')}</h4>
                                    <InfoTooltip text={FeatureTooltips.strategicFocus} />
                                </div>
                                <p className="text-sm font-medium text-white/90 leading-relaxed">{behavioralReport.predictions.nextWeekFocus || t('mindset.maintainDiscipline')}</p>
                            </div>
                            <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 group hover:border-accent-green/30 transition-all">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t('mindset.survivalProtocol')}</h4>
                                    <InfoTooltip text={FeatureTooltips.survivalProtocol} />
                                </div>
                                <p className="text-sm font-bold text-accent-green">{behavioralReport.recommendations.action || t('mindset.continueCheckins')}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Shadow Score & Trust Level */}
                <div className="flex flex-col gap-6">
                    <div className="bento-card p-6 bg-black/40 border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">
                                {t('mindset.behavioralFingerprint')}
                            </h2>
                            <span className="px-2 py-1 bg-accent-primary/10 text-accent-primary text-[10px] font-bold uppercase tracking-wider rounded-md border border-accent-primary/20">
                                {t('mindset.aiDeepAnalysis')}
                            </span>
                        </div>
                        {!shadowScore ? (
                            <div className="p-6 text-center border border-white/10 rounded-2xl bg-white/[0.02]">
                                <ShieldCheckIcon className="w-8 h-8 text-accent-primary/30 mx-auto mb-3" />
                                <p className="text-white font-bold text-sm mb-2">Shadow Score</p>
                                <p className="text-text-secondary text-xs mb-3">
                                    Điểm tín nhiệm dựa trên độ trung thực tự đánh giá so với AI.
                                </p>
                                <div className="text-[10px] text-gray-500 bg-white/5 rounded-lg p-3">
                                    <p className="mb-1">📊 <strong className="text-accent-yellow">Yêu cầu:</strong> Hoàn thành ít nhất 1 trade với Dojo</p>
                                    <p>💡 Đóng lệnh → Hoàn thành 7 bước Dojo để bắt đầu tích lũy Shadow Score</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-6 bg-white/[0.03] rounded-2xl border border-white/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 blur-[40px] rounded-full group-hover:bg-accent-primary/10 transition-all"></div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Shadow Score</p>
                                    <p className="text-sm text-text-secondary">Trust Level: <span className={`font-black uppercase ${shadowScore.trustLevel === 'HIGH_TRUST' ? 'text-accent-green' : shadowScore.trustLevel === 'MEDIUM_TRUST' ? 'text-accent-yellow' : 'text-accent-red'}`}>{shadowScore.trustLevel.replace('_', ' ')}</span></p>
                                </div>
                                <div className="text-4xl font-black font-mono text-white relative z-10 px-4 py-2 bg-black/40 rounded-xl border border-white/5">
                                    {shadowScore.rawScore}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Insight or Motivation */}
                    <div className="bento-card p-6 bg-gradient-to-br from-accent-primary/10 to-transparent border-accent-primary/20">
                        <h4 className="text-xs font-black text-accent-primary uppercase tracking-widest mb-2">AI Wisdom</h4>
                        <p className="text-sm italic text-white/80 leading-relaxed">
                            "Kỷ luật không phải là sự gò bó, mà là sự tự giải phóng khỏi những lỗi lầm lặp lại."
                        </p>
                    </div>
                </div>
            </div>

            {/* Protection Protocol Section */}
            <div className="bento-card p-6 bg-panel shadow-2xl border border-white/5">
                <ProtectionSettings
                    profile={profile}
                    onUpdate={onUpdateProfile}
                    onSave={onSaveProfile}
                />
            </div>

            {/* Performance Vectors (Process Stats) */}
            {processStats && (
                <div className="animate-entrance delay-100">
                    <ProcessMetricsDisplay processStats={processStats} />
                </div>
            )}
        </div>
    );
};
