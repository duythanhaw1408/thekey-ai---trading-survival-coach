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
    isPro?: boolean;
    simulationMode?: boolean;
    setSimulationMode?: React.Dispatch<React.SetStateAction<boolean>>;
    crisisIntervention?: CrisisData | null;
    notificationPermission?: NotificationPermission;
    handleRequestNotificationPermission?: () => Promise<void>;
    streak?: number;
    lastActiveDate?: string | null;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
    onProfileClick,
    onLogout,
    userEmail,
    isPro,
    simulationMode,
    setSimulationMode,
    crisisIntervention,
    streak = 0,
}) => {
    return (
        <header className="sticky top-0 z-50 px-6 py-4 hidden md:flex items-center justify-between glass-panel rounded-none border-t-0 border-x-0">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
                    <KeyIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gradient">THEKEY AI</h1>
                    <div className="flex items-center gap-2">
                        <OnlineIndicator />
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Trading Survival Coach</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <StreakIndicator streak={streak} />
                <LanguageSelector />

                <div className="flex items-center gap-2 h-10 px-1 bg-white/5 rounded-full border border-white/10">
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors relative group">
                        <BellIcon className="w-5 h-5 text-gray-400 group-hover:text-cyan-400" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-900"></span>
                    </button>

                    <div className="w-px h-4 bg-white/10 mx-1"></div>

                    <button
                        onClick={onProfileClick}
                        className="flex items-center gap-2 pl-2 pr-3 py-1.5 hover:bg-white/10 rounded-full transition-all active-shrink"
                    >
                        <div className="w-7 h-7 bg-gradient-to-tr from-cyan-600 to-blue-700 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold">
                            {userEmail?.[0].toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm font-medium text-gray-300">{userEmail?.split('@')[0]}</span>
                        {isPro && (
                            <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[9px] font-bold tracking-tighter uppercase">Pro</span>
                        )}
                    </button>

                    <button
                        onClick={onLogout}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                        title="Sair"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
};
