import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BehavioralReport, ShadowScore, ProcessStats, WeeklyReport, WeeklyGoals, TraderArchetypeAnalysis, UserProfile } from '../../types';
import { BrainCircuitIcon, ShieldCheckIcon, SparklesIcon, ZapIcon, LockIcon } from '../icons';
import { ProcessMetricsDisplay } from '../ProcessMetricsDisplay';
import { ProtectionSettings } from '../ProtectionSettings';
import { useLanguage } from '../../contexts/LanguageContext';
import { InfoTooltip, FeatureTooltips } from '../Tooltip';

interface MindsetViewProps {
    behavioralReport: BehavioralReport | null;
    traderArchetype: TraderArchetypeAnalysis | null;
    isAnalyzing: boolean;
    shadowScore: ShadowScore | null;
    processStats: ProcessStats | null;
    onGenerateReport: () => void;
    tradeCount: number;
    dojoTradesCount: number;
    profile: UserProfile;
    onUpdateProfile: (updates: Partial<UserProfile>) => void;
    onSaveProfile: () => Promise<void>;
}

export const MindsetView: React.FC<MindsetViewProps> = ({
    behavioralReport,
    traderArchetype,
    isAnalyzing,
    shadowScore,
    processStats,
    onGenerateReport,
    tradeCount,
    dojoTradesCount,
    profile,
    onUpdateProfile,
    onSaveProfile,
}) => {
    const { t } = useLanguage();

    // Helper for Archetype display
    const getArchetypeDisplay = (archetypeId: string = 'UNDEFINED') => {
        switch (archetypeId) {
            case 'ANALYTICAL_TRADER': return { name: t('mindset.stoicSentinel'), color: 'text-cyan-400', icon: '🛡️', badge: 'bg-cyan-500/10 border-cyan-500/30' };
            case 'SYSTEMATIC_TRADER': return { name: t('mindset.systematicZen'), color: 'text-emerald-400', icon: '🧘', badge: 'bg-emerald-500/10 border-emerald-500/30' };
            case 'EMOTIONAL_TRADER': return { name: t('mindset.chaosMaster'), color: 'text-amber-400', icon: '⚡', badge: 'bg-amber-500/10 border-amber-500/30' };
            default: return { name: t('common.notEnoughData'), color: 'text-gray-400', icon: '❓', badge: 'bg-gray-500/10 border-gray-500/30' };
        }
    };

    const archDisplay = getArchetypeDisplay(traderArchetype?.archetype || profile.archetype);

    // Shadow Score Prestige Logic
    const getPrestigeTier = (score: number) => {
        if (score >= 90) return { label: t('common.statusElite'), color: 'text-accent-primary-neon', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]' };
        if (score >= 70) return { label: t('common.statusVeteran'), color: 'text-accent-green-neon', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]' };
        return { label: t('common.statusSurviving'), color: 'text-accent-yellow', glow: '' };
    };

    const prestige = shadowScore ? getPrestigeTier(shadowScore.rawScore) : null;

    return (
        <div className="space-y-6 animate-entrance pb-12">
            {/* Elite Mirror: Archetype Hero Section */}
            <div className="relative overflow-hidden bento-card border-white/5 bg-black/40 backdrop-blur-xl">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/5 blur-[120px] rounded-full pointer-events-none -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent-primary/5 blur-[80px] rounded-full pointer-events-none -ml-24 -mb-24"></div>

                <div className="p-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-10">
                        {/* Archetype Avatar / Visual */}
                        <div className="relative">
                            <motion.div
                                className={`w-36 h-36 rounded-full border-4 border-white/5 flex items-center justify-center text-6xl relative z-10 ${isAnalyzing ? 'animate-pulse' : ''}`}
                                animate={{ rotate: isAnalyzing ? 360 : 0 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            >
                                <span className="drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                    {isAnalyzing ? '🔎' : archDisplay.icon}
                                </span>
                            </motion.div>

                            {/* Scanning Ring Animation */}
                            <AnimatePresence>
                                {isAnalyzing && (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1.2, opacity: 1 }}
                                        exit={{ scale: 1.5, opacity: 0 }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="absolute inset-0 border-2 border-accent-primary items-center rounded-full"
                                    />
                                )}
                            </AnimatePresence>

                            {/* Scanning Line */}
                            <AnimatePresence>
                                {isAnalyzing && (
                                    <motion.div
                                        initial={{ top: '0%' }}
                                        animate={{ top: '100%' }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-[-20%] right-[-20%] h-[2px] bg-gradient-to-r from-transparent via-accent-primary to-transparent shadow-[0_0_10px_rgba(34,211,238,0.8)] z-20"
                                    />
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex-1 text-center lg:text-left">
                            <div className="flex items-center justify-center lg:justify-start gap-4 mb-2">
                                <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">
                                    {t('mindset.eliteMirror')}
                                </h2>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${archDisplay.badge} ${archDisplay.color}`}>
                                    {t('mindset.aiDeepAnalysis')}
                                </span>
                            </div>

                            <motion.h1
                                className={`text-4xl font-black mb-1 uppercase tracking-tight ${archDisplay.color} drop-shadow-sm font-sans`}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                            >
                                {isAnalyzing ? t('common.scanning') : archDisplay.name}
                            </motion.h1>

                            <p className="text-sm text-white/60 max-w-2xl leading-relaxed font-light">
                                {isAnalyzing
                                    ? t('mindset.scanningBehavior')
                                    : (traderArchetype?.rationale || t('mindset.analysisBehaviorDesc'))}
                            </p>

                            {!behavioralReport && !isAnalyzing && (
                                <div className="mt-8 flex flex-col sm:flex-row items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-accent-primary" style={{ width: `${Math.min(dojoTradesCount / 5 * 100, 100)}%` }}></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-white/30 uppercase">{dojoTradesCount}/5</span>
                                    </div>
                                    <button
                                        onClick={onGenerateReport}
                                        disabled={dojoTradesCount < 5}
                                        className="px-8 py-4 bg-accent-primary text-black font-black uppercase text-xs tracking-[0.2em] rounded-full hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed group flex items-center gap-3"
                                    >
                                        <BrainCircuitIcon className="w-4 h-4" />
                                        {t('mindset.generateReport')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Report Insights (If Available) */}
                <AnimatePresence>
                    {behavioralReport && !isAnalyzing && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="border-t border-white/5 bg-white/[0.02]"
                        >
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: t('mindset.emotionalTrigger'), val: behavioralReport.fingerprint.emotionalTrigger, icon: '🌊', color: 'border-white/10' },
                                    { label: t('mindset.activePattern'), val: behavioralReport.activePattern.name, icon: '🔄', color: 'border-accent-yellow/20', sub: behavioralReport.activePattern.description },
                                    { label: t('mindset.strategicFocus'), val: behavioralReport.predictions.nextWeekFocus, icon: '🎯', color: 'border-accent-primary/20' },
                                    { label: t('mindset.survivalProtocol'), val: behavioralReport.recommendations.action, icon: '🧬', color: 'border-accent-green/20' }
                                ].map((item, i) => (
                                    <div key={i} className={`p-4 rounded-xl border ${item.color} bg-black/20 hover:bg-white/[0.04] transition-all group`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg opacity-70 group-hover:scale-110 transition-transform">{item.icon}</span>
                                            <h4 className="text-[9px] font-black text-white/30 uppercase tracking-widest">{item.label}</h4>
                                        </div>
                                        <p className="text-xs font-bold text-white/90 leading-tight">{item.val || t('common.notEnoughData')}</p>
                                        {item.sub && <p className="text-[10px] italic text-white/40 mt-1 line-clamp-1">"{item.sub}"</p>}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Shadow Score Prestige Section */}
                <div className="lg:col-span-1 bento-card p-0 overflow-hidden border-white/5 bg-panel">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                            <ShieldCheckIcon className="w-4 h-4 text-accent-primary" />
                            {t('mindset.prestigeTier')}
                        </h3>
                        {prestige && (
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 ${prestige.color}`}>
                                Rank: {prestige.label}
                            </span>
                        )}
                    </div>

                    <div className="p-10 flex flex-col items-center justify-center relative">
                        {!shadowScore ? (
                            <div className="text-center py-6">
                                <LockIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                <p className="text-xs text-white/40 px-6">{t('mindset.completeOneDojo')}</p>
                            </div>
                        ) : (
                            <>
                                {/* Large Score Circle */}
                                <div className={`w-32 h-32 rounded-3xl bg-black/40 border-2 border-white/10 flex flex-col items-center justify-center relative transition-all duration-500 ${prestige?.glow}`}>
                                    <span className="text-4xl font-black font-mono text-white leading-none">{shadowScore.rawScore}</span>
                                    <span className="text-[9px] font-black text-white/20 uppercase mt-1 tracking-tighter">SCORE</span>

                                    {/* Small floating accents */}
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent-primary/20 blur-xl"></div>
                                </div>

                                <div className="mt-8 w-full space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[9px] font-black text-white/30 uppercase">{t('progress.trustLevel')}</span>
                                        <span className={`text-[11px] font-black uppercase ${shadowScore.trustLevel === 'HIGH_TRUST' ? 'text-accent-green' : 'text-accent-yellow'}`}>
                                            {shadowScore.trustLevel.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${shadowScore.rawScore}%` }}
                                            className={`h-full bg-gradient-to-r ${shadowScore.rawScore > 80 ? 'from-accent-primary to-accent-primary-neon' : 'from-accent-green to-accent-primary'}`}
                                        />
                                    </div>
                                    <p className="text-[10px] text-white/40 italic text-center px-4 leading-relaxed">
                                        "{t('mindset.shadowScoreDesc')}"
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* System Wisdom / Quote Section */}
                <div className="lg:col-span-2 bento-card p-8 bg-gradient-to-br from-white/[0.03] to-transparent border-white/5 flex flex-col justify-center relative group">
                    <SparklesIcon className="absolute top-6 right-6 w-8 h-8 text-white/5 group-hover:text-accent-primary/20 transition-colors" />
                    <h4 className="text-[10px] font-black text-accent-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <ZapIcon className="w-3 h-3" />
                        {t('mindset.wisdomTitle')}
                    </h4>
                    <blockquote className="relative">
                        <span className="absolute -top-4 -left-4 text-4xl text-white/5 font-serif">"</span>
                        <p className="text-xl md:text-2xl font-black text-white/90 leading-tight tracking-tight italic">
                            Kỷ luật không phải là sự gò bó, mà là sự tự giải phóng khỏi những lỗi lầm lặp lại.
                        </p>
                        <p className="text-sm text-white/30 mt-4 font-mono uppercase tracking-widest">— System Protocol 0x1</p>
                    </blockquote>
                </div>
            </div>

            {/* Performance Vectors (Process Stats) */}
            {processStats && (
                <div className="animate-entrance delay-100">
                    <ProcessMetricsDisplay processStats={processStats} />
                </div>
            )}

            {/* Protection Protocol Section */}
            <div className="bento-card p-6 bg-panel shadow-2xl border border-white/5">
                <ProtectionSettings
                    profile={profile}
                    onUpdate={onUpdateProfile}
                    onSave={onSaveProfile}
                />
            </div>
        </div>
    );
};
