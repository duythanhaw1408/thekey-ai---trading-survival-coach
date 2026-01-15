import React from 'react';
import { motion } from 'framer-motion';
import { KeyIcon, SettingsIcon, BellIcon, TerminalIcon, AcademicCapIcon } from '../icons';
import { StreakIndicator } from '../StreakIndicator';
import { OnlineIndicator } from '../EngagementWidgets';
import { LanguageSelector } from '../LanguageSelector';
import type { CrisisData } from '../../types';

interface MainHeaderProps {
    onProfileClick: () => void;
    onLogout: () => void;
    userEmail?: string;
    userProfile?: any;
    isPro?: boolean;
    simulationMode?: boolean;
    setSimulationMode?: (mode: boolean) => void;
    crisisIntervention?: any;
    notificationPermission?: NotificationPermission;
    handleRequestNotificationPermission?: () => Promise<void>;
    streak?: number;
    lastActiveDate?: string | null;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
    onProfileClick,
    onLogout,
    userEmail,
    userProfile,
    isPro,
    simulationMode,
    setSimulationMode,
    streak = 0,
}) => {
    return (
        <header className="sticky top-0 z-50 w-full bg-black/40 backdrop-blur-3xl border-b border-white/5 shadow-2xl">
            <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-black border border-accent-neon/30 rounded-xl shadow-[0_0_15px_rgba(0,255,157,0.1)]">
                        <KeyIcon className="w-6 h-6 text-accent-neon drop-shadow-[0_0_8px_rgba(0,255,157,0.6)]" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black tracking-[0.2em] text-white uppercase italic leading-none">
                                THE<span className="text-accent-neon">KEY</span>
                            </h1>
                            <div className="px-1.5 py-0.5 bg-accent-neon/10 border border-accent-neon/20 rounded-md">
                                <span className="text-[8px] font-black text-accent-neon uppercase tracking-widest">v2.5</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-4">
                        <StreakIndicator streak={streak} />
                        <LanguageSelector />
                    </div>

                    <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block" />

                    <div className="flex items-center gap-4">
                        <button
                            onClick={onProfileClick}
                            className="flex items-center gap-3 pl-1 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-xl hover:border-accent-neon/30 hover:bg-white/10 transition-all active:scale-95 group"
                        >
                            <div className="w-8 h-8 bg-accent-neon/10 border border-accent-neon/30 rounded-lg flex items-center justify-center text-[10px] font-black text-accent-neon uppercase group-hover:bg-accent-neon group-hover:text-black transition-all">
                                {userEmail?.[0] || 'U'}
                            </div>
                            <span className="text-[11px] font-black text-white/70 uppercase tracking-wider hidden md:block">
                                {userEmail?.split('@')[0]}
                            </span>
                        </button>

                        <button
                            onClick={onLogout}
                            className="p-2.5 text-white/20 hover:text-accent-red hover:bg-accent-red/10 rounded-xl transition-all"
                            title="LOGOUT"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
