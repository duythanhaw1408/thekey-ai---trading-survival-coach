import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    UserIcon,
    ShieldCheckIcon,
    BellIcon,
    ArrowLeftStartOnRectangleIcon as LogoutIcon,
    CpuChipIcon,
    FingerPrintIcon,
    ExclamationTriangleIcon,
    TrashIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import type { UserProfile } from '../../types';
import { ProtectionSettings } from '../ProtectionSettings';
import { useLanguage } from '../../contexts/LanguageContext';

interface SettingsViewProps {
    profile: UserProfile;
    onUpdateProfile: (updates: Partial<UserProfile>) => void;
    onSaveProfile: () => Promise<void>;
    onLogout: () => void;
    simulationMode: boolean;
    setSimulationMode: (mode: boolean) => void;
    xp: number;
    level: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
    profile,
    onUpdateProfile,
    onSaveProfile,
    onLogout,
    simulationMode,
    setSimulationMode,
    xp,
    level
}) => {
    const { t } = useLanguage();
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSaveProfile();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    const categories = [
        { id: 'profile', label: t('settings.profile'), icon: UserIcon },
        { id: 'protocol', label: t('settings.protocol'), icon: ShieldCheckIcon },
        { id: 'system', label: t('settings.system'), icon: CpuChipIcon },
        { id: 'notifications', label: t('settings.notifications'), icon: BellIcon },
    ];

    const [activeCategory, setActiveCategory] = useState('profile');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-entrance pb-20">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-3 space-y-4">
                <div className="bento-card !p-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-black uppercase text-[10px] tracking-[0.2em] ${activeCategory === cat.id
                                ? 'bg-accent-neon text-black shadow-[0_0_20px_rgba(0,255,157,0.3)]'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <cat.icon className="w-5 h-5" />
                            {cat.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={onLogout}
                    className="w-full bento-card flex items-center justify-between px-8 py-6 group hover:border-accent-red/30 transition-all active:scale-95"
                >
                    <span className="text-[10px] font-black text-accent-red/60 uppercase tracking-widest group-hover:text-accent-red transition-colors">{t('settings.logout')}</span>
                    <LogoutIcon className="w-5 h-5 text-accent-red/40 group-hover:text-accent-red group-hover:rotate-12 transition-all" />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9 space-y-8">
                {activeCategory === 'profile' && (
                    <div className="space-y-8">
                        {/* Profile Header Card */}
                        <div className="bento-card !p-0 overflow-hidden relative group">
                            <div className="absolute inset-0 cyber-grid opacity-[0.05] pointer-events-none" />
                            <div className="p-10 flex flex-col md:flex-row items-center gap-10 relative z-10">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full border-4 border-accent-neon/20 bg-black/60 flex items-center justify-center text-4xl shadow-inner overflow-hidden">
                                        {profile.archetype === 'SYSTEMATIC_TRADER' ? '🧘' :
                                            profile.archetype === 'ANALYTICAL_TRADER' ? '🛡️' : '⚡'}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-accent-neon text-black text-[10px] font-black px-3 py-1 rounded-full shadow-[0_0_10px_rgba(0,255,157,0.5)]">
                                        LEVEL {level}
                                    </div>
                                </div>

                                <div className="flex-1 text-center md:text-left space-y-4">
                                    <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter drop-shadow-lg">
                                        {profile.username || 'OPERATOR_0x1'}
                                    </h3>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">XP_SCORE</span>
                                            <span className="text-sm font-black text-accent-neon">{xp}</span>
                                        </div>
                                        <div className="h-8 w-px bg-white/5" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">EMAIL_LINK</span>
                                            <span className="text-xs font-bold text-white/40">{profile.email}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-[8px] font-black text-accent-neon/40 uppercase tracking-widest text-center mb-2 italic">Neural_Interface: OK</span>
                                    <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-accent-neon/40 hover:text-accent-neon transition-all">Thay đổi ảnh</button>
                                </div>
                            </div>
                        </div>

                        {/* Identity Form */}
                        <div className="bento-card p-10 space-y-8">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-1 h-6 bg-accent-neon shadow-[0_0_10px_rgba(0,255,157,0.5)]" />
                                <h4 className="text-sm font-black text-white uppercase tracking-[0.3em]">{t('settings.identityTitle')}</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">{t('settings.usernameLabel')}</label>
                                    <input
                                        type="text"
                                        value={profile.username || ''}
                                        onChange={(e) => onUpdateProfile({ username: e.target.value })}
                                        className="w-full bg-black/40 border-b-2 border-white/10 px-4 py-4 text-white font-black uppercase tracking-widest focus:border-accent-neon focus:outline-none transition-all rounded-t-xl"
                                        placeholder="GOSU_TRADER"
                                    />
                                </div>
                                <div className="space-y-3 opacity-50">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">{t('settings.emailLabel')}</label>
                                    <div className="w-full bg-black/20 border-b-2 border-white/5 px-4 py-4 text-white/40 font-mono text-sm rounded-t-xl">
                                        {profile.email}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeCategory === 'protocol' && (
                    <div className="space-y-8">
                        <div className="bento-card !p-8 border border-accent-neon/10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-6 bg-accent-neon" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-[0.3em]">{t('settings.tradingProtocol')}</h4>
                                </div>
                                <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-white/5">
                                    <div className={`w-2 h-2 rounded-full ${simulationMode ? 'bg-accent-yellow' : 'bg-accent-red animate-pulse'} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                                        {simulationMode ? 'SIMULATION_ACTIVE' : 'REAL_RISK_LIVE'}
                                    </span>
                                </div>
                            </div>

                            <ProtectionSettings
                                profile={profile}
                                onUpdate={onUpdateProfile}
                                onSave={handleSave}
                            />
                        </div>
                    </div>
                )}

                {activeCategory === 'system' && (
                    <div className="space-y-8">
                        <div className="bento-card p-10 space-y-10">
                            {/* Simulation Mode Toggle */}
                            <div className="flex items-center justify-between group">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <CpuChipIcon className="w-5 h-5 text-accent-yellow" />
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest">{t('settings.simulationEngine')}</h4>
                                    </div>
                                    <p className="text-[10px] text-white/30 font-bold uppercase leading-relaxed max-w-sm">
                                        {t('settings.simulationDesc')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSimulationMode(!simulationMode)}
                                    className={`relative w-16 h-8 rounded-full transition-all duration-300 ${simulationMode ? 'bg-accent-yellow' : 'bg-white/10 shadow-inner'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-lg ${simulationMode ? 'left-9' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="h-px bg-white/5" />

                            {/* Data Privacy Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <FingerPrintIcon className="w-5 h-5 text-accent-blue" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">{t('settings.dataPrivacy')}</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-2xl hover:border-white/10 transition-all text-left">
                                        <div>
                                            <span className="text-[9px] font-black text-white uppercase tracking-widest block mb-1">{t('settings.exportData')}</span>
                                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-tight">{t('settings.exportDesc')}</span>
                                        </div>
                                        <LogoutIcon className="w-4 h-4 text-white/20 -rotate-90" />
                                    </button>
                                    <button className="flex items-center justify-between p-6 bg-accent-red/5 border border-accent-red/10 rounded-2xl hover:bg-accent-red/10 transition-all text-left group">
                                        <div>
                                            <span className="text-[9px] font-black text-accent-red uppercase tracking-widest block mb-1">{t('settings.deleteAccount')}</span>
                                            <span className="text-[8px] font-bold text-accent-red/40 uppercase tracking-tight">{t('settings.deleteDesc')}</span>
                                        </div>
                                        <TrashIcon className="w-4 h-4 text-accent-red/20 group-hover:text-accent-red transition-all" />
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-white/5" />

                            {/* App Version Info */}
                            <div className="flex flex-col items-center justify-center py-6 opacity-20">
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.5em] mb-2">THEKEY_CORE_OS_v2.1</span>
                                <span className="text-[8px] font-bold text-white uppercase tracking-widest italic">Build: ALPHA-G-8812</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeCategory === 'notifications' && (
                    <div className="bento-card p-10 flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                        <div className="w-20 h-20 bg-accent-neon/5 rounded-full border border-accent-neon/10 flex items-center justify-center mb-4">
                            <BellIcon className="w-10 h-10 text-accent-neon/20 animate-pulse" />
                        </div>
                        <h4 className="text-xl font-black text-white uppercase tracking-widest">Push Notifications</h4>
                        <p className="text-[10px] font-bold text-white/40 uppercase max-w-sm leading-relaxed tracking-wider">
                            Đang phát triển hệ thống cảnh báo Real-time về Telegram và Trình duyệt khi bạn vi phạm kỷ luật.
                        </p>
                    </div>
                )}

                {/* Global Save Button - Floating for Mobile */}
                <div className="flex justify-end gap-4 mt-8">
                    {saveSuccess && (
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="flex items-center gap-2 px-4 py-2 bg-accent-neon/10 border border-accent-neon/30 rounded-xl text-accent-neon text-[10px] font-black uppercase tracking-widest"
                        >
                            <CheckCircleIcon className="w-4 h-4" />
                            {t('settings.saveSuccess')}
                        </motion.div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-12 py-5 bg-accent-neon text-black font-black uppercase text-[11px] tracking-[0.4em] rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 neon-glow shadow-2xl relative overflow-hidden"
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                SYNCHRONIZING...
                            </div>
                        ) : t('settings.saveAll')}
                    </button>
                </div>
            </div>
        </div>
    );
};
