
import React from 'react';
import { motion } from 'framer-motion';
import type { BehavioralReport, ShadowScore, ProcessStats } from '../../types';
import { BrainCircuitIcon, ShieldCheckIcon } from '../icons';
import { ProcessMetricsDisplay } from '../ProcessMetricsDisplay';
import { ProtectionSettings } from '../ProtectionSettings';
import type { UserProfile } from '../../types';

interface MindsetViewProps {
    behavioralReport: BehavioralReport | null;
    shadowScore: ShadowScore | null;
    processStats: ProcessStats | null;
    onGenerateReport: () => void;
    tradeCount: number;
    profile: UserProfile;
    onUpdateProfile: (updates: Partial<UserProfile>) => void;
    onSaveProfile: () => Promise<void>;
}

export const MindsetView: React.FC<MindsetViewProps> = ({
    behavioralReport,
    shadowScore,
    processStats,
    onGenerateReport,
    tradeCount,
    profile,
    onUpdateProfile,
    onSaveProfile
}) => {
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
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                            <BrainCircuitIcon className="w-12 h-12 text-white/10 mb-4" />
                            <p className="text-text-secondary text-sm mb-6 max-w-xs">
                                Phân tích hành vi sâu sắc dựa trên lịch sử giao dịch và tâm lý của bạn.
                            </p>
                            <button
                                onClick={onGenerateReport}
                                disabled={tradeCount < 5}
                                className="px-6 py-3 bg-accent-primary text-black font-black uppercase text-xs tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                            >
                                {tradeCount < 5 ? `Cần ${5 - tradeCount} lệnh nữa` : 'Generate Fingerprint'}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 group hover:border-accent-primary/30 transition-all">
                                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Emotional Trigger</h4>
                                <p className="text-sm font-medium text-white/90 leading-relaxed">{behavioralReport.fingerprint.emotionalTrigger}</p>
                            </div>
                            <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 group hover:border-accent-yellow/30 transition-all">
                                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Active Pattern</h4>
                                <p className="text-sm font-black text-accent-yellow uppercase tracking-tight">{behavioralReport.activePattern.name}</p>
                                <p className="text-[11px] italic text-text-secondary mt-1 opacity-70">"{behavioralReport.activePattern.description}"</p>
                            </div>
                            <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 group hover:border-accent-primary/30 transition-all">
                                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Strategic Focus</h4>
                                <p className="text-sm font-medium text-white/90 leading-relaxed">{behavioralReport.predictions.nextWeekFocus}</p>
                            </div>
                            <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 group hover:border-accent-green/30 transition-all">
                                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Survival Protocol</h4>
                                <p className="text-sm font-bold text-accent-green">{behavioralReport.recommendations.action}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Shadow Score & Trust Level */}
                <div className="flex flex-col gap-6">
                    <div className="bento-card p-6 bg-black/40 border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Self-Awareness Engine</h3>
                            <ShieldCheckIcon className="w-5 h-5 text-accent-primary/50" />
                        </div>

                        {!shadowScore ? (
                            <div className="p-8 text-center text-white/20 font-bold uppercase tracking-widest text-xs border border-white/5 rounded-2xl">
                                Đang chờ dữ liệu đánh giá lệnh...
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
