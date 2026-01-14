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
        <header className="sticky top-0 z-50 px-10 py-5 hidden md:flex items-center justify-between bg-black border-b border-accent-neon/20 shadow-[0_0_30px_rgba(0,255,157,0.05)] backdrop-blur-xl">
            <div className="flex items-center gap-6">
                <div className="p-3 bg-black border border-accent-neon/40 rounded-2xl shadow-[0_0_15px_rgba(0,255,157,0.1)] group hover:border-accent-neon transition-colors duration-500">
                    <KeyIcon className="w-7 h-7 text-accent-neon drop-shadow-[0_0_8px_rgba(0,255,157,0.6)]" />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black tracking-[0.2em] text-white uppercase italic leading-none">
                            THE<span className="text-accent-neon">KEY</span>
                        </h1>
                        <div className="px-2 py-0.5 bg-accent-neon/10 border border-accent-neon/20 rounded-md">
                            <span className="text-[9px] font-black text-accent-neon uppercase tracking-widest">v2.5_STABLE</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 mt-2">
                        <div className="flex gap-0.5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-1 h-3 bg-accent-neon/20 rounded-full overflow-hidden">
                                    <motion.div
                                        animate={{ height: ['20%', '100%', '20%'] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                        className="w-full bg-accent-neon"
                                    />
                                </div>
                            ))}
                        </div>
                        <span className="text-[9px] text-accent-neon/40 uppercase tracking-[0.4em] font-black italic">Neural_Protocol_Active</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-10">
                <div className="flex items-center gap-8">
                    <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/5 hover:border-accent-neon/20 transition-all">
                        <StreakIndicator streak={streak} />
                    </div>
                    <LanguageSelector />
                </div>

                <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent mx-2" />

                <div className="flex items-center gap-6">
                    <div className="relative group p-2.5 cursor-pointer bg-white/5 rounded-xl border border-white/5 hover:border-accent-neon/30 transition-all">
                        <BellIcon className="w-5 h-5 text-accent-neon/40 group-hover:text-accent-neon transition-colors" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent-red rounded-full shadow-[0_0_10px_rgba(255,0,85,0.8)] animate-pulse"></span>
                    </div>

                    <button
                        onClick={onProfileClick}
                        className="flex items-center gap-4 pl-1.5 pr-6 py-1.5 bg-black border border-accent-neon/20 rounded-2xl hover:border-accent-neon/50 hover:bg-accent-neon/5 transition-all active:scale-95 group shadow-lg"
                    >
                        <div className="w-10 h-10 bg-accent-neon/10 border border-accent-neon/30 rounded-xl flex items-center justify-center text-xs font-black text-accent-neon shadow-inner overflow-hidden uppercase group-hover:bg-accent-neon group-hover:text-black transition-all">
                            {userEmail?.[0] || 'U'}
                        </div>
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[12px] font-black text-white uppercase tracking-wider">{userEmail?.split('@')[0]}</span>
                            {isPro ? (
                                <span className="text-[8px] font-black text-accent-neon uppercase tracking-[0.3em] mt-1.5 px-1.5 py-0.5 bg-accent-neon/5 border border-accent-neon/20 rounded leading-none">PRO_LICENSE</span>
                            ) : (
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mt-1.5">BASIC_INTEL</span>
                            )}
                        </div>
                    </button>

                    <button
                        onClick={onLogout}
                        className="p-3 text-accent-red/30 hover:text-accent-red hover:bg-accent-red/10 rounded-xl border border-transparent hover:border-accent-red/20 transition-all active:scale-90"
                        title="TERMINATE_SESSION"
                    >
                        <svg className="w-5 h-5 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
};
