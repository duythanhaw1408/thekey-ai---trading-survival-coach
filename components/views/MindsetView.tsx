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
            case 'ANALYTICAL_TRADER': return { name: t('mindset.stoicSentinel'), color: 'text-accent-blue', icon: '🛡️', badge: 'bg-accent-blue/10 border-accent-blue/30', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.3)]' };
            case 'SYSTEMATIC_TRADER': return { name: t('mindset.systematicZen'), color: 'text-accent-neon', icon: '🧘', badge: 'bg-accent-neon/10 border-accent-neon/30', glow: 'shadow-[0_0_15px_rgba(0,255,157,0.3)]' };
            case 'EMOTIONAL_TRADER': return { name: t('mindset.chaosMaster'), color: 'text-accent-yellow', icon: '⚡', badge: 'bg-accent-yellow/10 border-accent-yellow/30', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]' };
            default: return { name: t('common.notEnoughData'), color: 'text-white/20', icon: '❓', badge: 'bg-white/5 border-white/10', glow: '' };
        }
    };

    const archDisplay = getArchetypeDisplay(traderArchetype?.archetype || profile.archetype);

    // Shadow Score Prestige Logic
    const getPrestigeTier = (score: number) => {
        if (score >= 90) return { label: t('common.statusElite'), color: 'text-accent-neon', glow: 'shadow-[0_0_20px_rgba(0,255,157,0.4)]' };
        if (score >= 70) return { label: t('common.statusVeteran'), color: 'text-accent-blue', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.3)]' };
        return { label: t('common.statusSurviving'), color: 'text-accent-yellow', glow: '' };
    };

    const prestige = shadowScore ? getPrestigeTier(shadowScore.rawScore) : null;

    return (
        <div className="space-y-8 animate-entrance pb-12 selection:bg-accent-neon selection:text-black">
            {/* Elite Mirror: Archetype Hero Section */}
            <div className="bento-card !p-0 relative overflow-hidden">
                {/* Decorative Grid Background */}
                <div className="absolute inset-0 cyber-grid opacity-[0.05] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-accent-neon/[0.02] to-transparent pointer-events-none" />

                <div className="p-10 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        {/* Archetype Avatar / Visual */}
                        <div className="relative">
                            <motion.div
                                className={`w-44 h-44 rounded-full border-4 border-accent-neon/10 flex items-center justify-center text-7xl relative z-10 bg-black/60 shadow-inner ${isAnalyzing ? 'animate-pulse' : ''}`}
                                animate={{ rotate: isAnalyzing ? 360 : 0 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            >
                                <span className="drop-shadow-[0_0_20px_rgba(0,255,157,0.5)]">
                                    {isAnalyzing ? '🔎' : archDisplay.icon}
                                </span>
                            </motion.div>

                            {/* Scanning Ring Animation */}
                            <AnimatePresence>
                                {isAnalyzing && (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1.4, opacity: 1 }}
                                        exit={{ scale: 1.6, opacity: 0 }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 border-2 border-accent-neon items-center rounded-full"
                                    />
                                )}
                            </AnimatePresence>

                            {/* Scanning Line overlay */}
                            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                                <motion.div
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute left-0 right-0 h-px bg-accent-neon/60 shadow-[0_0_10px_rgba(0,255,157,1)] z-20"
                                />
                            </div>
                        </div>

                        <div className="flex-1 text-center lg:text-left">
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-4">
                                <h2 className="text-[10px] font-black text-accent-neon/40 uppercase tracking-[0.5em]">
                                    {t('mindset.eliteMirror')}
                                </h2>
                                <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${archDisplay.badge} ${archDisplay.color} neon-glow`}>
                                    {t('mindset.aiDeepAnalysis')}
                                </span>
                            </div>

                            <motion.h1
                                className={`text-5xl font-black mb-3 uppercase tracking-tighter italic ${archDisplay.color} drop-shadow-[0_0_10px_rgba(0,255,157,0.3)] font-sans`}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                            >
                                {isAnalyzing ? t('common.scanning') : archDisplay.name}
                            </motion.h1>

                            <p className="text-sm text-white/40 max-w-2xl leading-relaxed font-bold uppercase tracking-wide">
                                {isAnalyzing
                                    ? t('mindset.scanningBehavior')
                                    : (traderArchetype?.rationale || t('mindset.analysisBehaviorDesc'))}
                            </p>

                            {!behavioralReport && !isAnalyzing && (
                                <div className="mt-10 flex flex-col sm:flex-row items-center gap-8">
                                    <div className="flex items-center gap-4 bg-black/40 px-6 py-3 rounded-2xl border border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-white/20 uppercase mb-1">DATA_VECTORS</span>
                                            <span className="text-xs font-black text-white">{dojoTradesCount}/5</span>
                                        </div>
                                        <div className="h-2 w-32 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(dojoTradesCount / 5 * 100, 100)}%` }}
                                                className="h-full bg-accent-neon shadow-[0_0_10px_rgba(0,255,157,0.8)]"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={onGenerateReport}
                                        disabled={dojoTradesCount < 5}
                                        className="px-10 py-5 bg-accent-neon text-black font-black uppercase text-xs tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:cursor-not-allowed group flex items-center gap-4 neon-glow"
                                    >
                                        <BrainCircuitIcon className="w-5 h-5" />
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
                            className="border-t border-accent-neon/10 bg-black/60 backdrop-blur-xl"
                        >
                            <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {[
                                    { label: t('mindset.emotionalTrigger'), val: behavioralReport.fingerprint.emotionalTrigger, icon: '🌊', color: 'border-white/5' },
                                    { label: t('mindset.activePattern'), val: behavioralReport.activePattern.name, icon: '🔄', color: 'border-accent-yellow/30', sub: behavioralReport.activePattern.description },
                                    { label: t('mindset.strategicFocus'), val: behavioralReport.predictions.nextWeekFocus, icon: '🎯', color: 'border-accent-blue/30' },
                                    { label: t('mindset.survivalProtocol'), val: behavioralReport.recommendations.action, icon: '🧬', color: 'border-accent-neon/30' }
                                ].map((item, i) => (
                                    <div key={i} className={`p-5 rounded-2xl border ${item.color} bg-black/40 hover:bg-black group transition-all`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-xl group-hover:animate-bounce">{item.icon}</span>
                                            <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{item.label}</h4>
                                        </div>
                                        <p className="text-sm font-black text-white uppercase tracking-tight">{item.val || t('common.notEnoughData')}</p>
                                        {item.sub && <p className="text-[9px] font-bold text-white/10 mt-2 uppercase">"{item.sub}"</p>}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="bento-grid !p-0">
                {/* Shadow Score HUD Section */}
                <div className="span-4 bento-card !p-0 overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-accent-neon/5 flex justify-between items-center bg-black/20">
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-3">
                            <ShieldCheckIcon className="w-4 h-4 text-accent-neon" />
                            {t('mindset.prestigeTier')}
                        </h3>
                        {prestige && (
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border bg-black/40 ${prestige.color} border-current neon-glow`}>
                                RANK: {prestige.label}
                            </span>
                        )}
                    </div>

                    <div className="p-12 flex flex-col items-center justify-center relative">
                        {!shadowScore ? (
                            <div className="text-center py-10">
                                <LockIcon className="w-16 h-16 text-white/5 mx-auto mb-6" />
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-6">{t('mindset.completeOneDojo')}</p>
                            </div>
                        ) : (
                            <>
                                {/* Large Score Circle HUD */}
                                <div className={`w-40 h-40 rounded-3xl bg-black border-2 border-accent-neon/20 flex flex-col items-center justify-center relative group transition-all duration-500 shadow-2xl ${prestige?.glow}`}>
                                    <div className="absolute inset-0 cyber-grid opacity-10 rounded-2xl" />
                                    <span className="text-5xl font-black font-mono text-white leading-none tracking-tighter group-hover:text-accent-neon transition-colors">{shadowScore.rawScore}</span>
                                    <span className="text-[9px] font-black text-white/20 uppercase mt-2 tracking-[0.4em]">NEURAL_SCORE</span>

                                    {/* HUD markers */}
                                    <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-accent-neon/40" />
                                    <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-accent-neon/40" />
                                    <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-accent-neon/40" />
                                    <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-accent-neon/40" />
                                </div>

                                <div className="mt-10 w-full space-y-6">
                                    <div className="flex justify-between items-end px-1">
                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{t('progress.trustLevel')}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${shadowScore.trustLevel === 'HIGH_TRUST' ? 'text-accent-neon' : 'text-accent-yellow'}`}>
                                            {shadowScore.trustLevel.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${shadowScore.rawScore}%` }}
                                            className={`h-full shadow-[0_0_15px_rgba(0,255,157,0.6)] ${shadowScore.rawScore > 80 ? 'bg-accent-neon' : 'bg-gradient-to-r from-accent-yellow to-accent-neon'}`}
                                        />
                                    </div>
                                    <p className="text-[10px] text-white/20 font-bold uppercase italic text-center px-6 leading-relaxed">
                                        "{t('mindset.shadowScoreDesc')}"
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* System Wisdom HUD Section */}
                <div className="span-8 bento-card !p-12 flex flex-col justify-center relative group overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 cyber-grid opacity-[0.03] pointer-events-none" />
                    <SparklesIcon className="absolute top-8 right-8 w-12 h-12 text-accent-neon/5 group-hover:text-accent-neon/20 transition-all duration-1000" />

                    <h4 className="text-[10px] font-black text-accent-neon uppercase tracking-[0.5em] mb-12 flex items-center gap-4 relative z-10">
                        <div className="w-1.5 h-4 bg-accent-neon shadow-[0_0_8px_rgba(0,255,157,0.8)]" />
                        {t('mindset.wisdomTitle')}
                    </h4>

                    <blockquote className="relative z-10">
                        <div className="w-12 h-1 bg-accent-neon mb-8 shadow-[0_0_10px_rgba(0,255,157,0.5)]" />
                        <p className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight italic uppercase drop-shadow-lg">
                            "Kỷ luật không phải là sự gò bó, <br />
                            mà là sự <span className="text-accent-neon">tự giải phóng</span> khỏi <br />
                            những lỗi lầm lặp lại."
                        </p>
                        <div className="mt-8 flex items-center gap-4">
                            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">SYSTEM_PROTOCOL_0x1</p>
                            <div className="flex-1 h-px bg-white/5" />
                        </div>
                    </blockquote>
                </div>
            </div>

            {/* Performance Vectors HUD */}
            {processStats && (
                <div className="animate-entrance delay-100">
                    <ProcessMetricsDisplay processStats={processStats} />
                </div>
            )}

            {/* Protection Protocol Section */}
            <div className="bg-black/60 backdrop-blur-2xl border border-accent-neon/10 rounded-3xl p-10 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-1.5 h-6 bg-accent-neon" />
                    <h3 className="text-lg font-black text-white uppercase tracking-widest">{t('mindset.protectionSettings') || 'Protection_Settings'}</h3>
                </div>
                <ProtectionSettings
                    profile={profile}
                    onUpdate={onUpdateProfile}
                    onSave={onSaveProfile}
                />
            </div>
        </div>
    );
};
