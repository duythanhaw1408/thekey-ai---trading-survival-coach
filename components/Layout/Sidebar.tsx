
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheckIcon,
    TerminalIcon,
    BrainCircuitIcon,
    TrendingUpIcon,
    SettingsIcon,
    KeyIcon,
    XIcon
} from '../icons';
import { useLanguage } from '../../contexts/LanguageContext';

export type AppTab = 'SURVIVAL' | 'EXECUTION' | 'MINDSET' | 'PROGRESS' | 'SETTINGS';

interface SidebarProps {
    activeTab: AppTab;
    setActiveTab: (tab: AppTab) => void;
    isCollapsed?: boolean;
    onLogout?: () => void;
    isPro?: boolean;
    simulationMode?: boolean;
    setSimulationMode?: (mode: boolean) => void;
}

// Hamburger Menu Icon
const MenuIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed = false, onLogout }) => {
    const { t } = useLanguage();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { id: 'SURVIVAL', labelKey: 'nav.survival', icon: <ShieldCheckIcon className="w-5 h-5" />, color: 'text-accent-neon' },
        { id: 'EXECUTION', labelKey: 'nav.execution', icon: <TerminalIcon className="w-5 h-5" />, color: 'text-accent-neon' },
        { id: 'MINDSET', labelKey: 'nav.mindset', icon: <BrainCircuitIcon className="w-5 h-5" />, color: 'text-accent-neon' },
        { id: 'PROGRESS', labelKey: 'nav.progress', icon: <TrendingUpIcon className="w-5 h-5" />, color: 'text-accent-neon' },
    ];

    const handleTabChange = (tab: AppTab) => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            {/* Mobile Header (Minimal) */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-3xl border-b border-white/5 z-50 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <KeyIcon className="w-6 h-6 text-accent-neon" />
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onLogout}
                        className="p-2 text-accent-red/60 hover:text-accent-red transition-colors"
                    >
                        <ShieldCheckIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Centralized Floating Pill Navigation (Desktop & Mobile) */}
            <nav className="floating-pill-nav">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as AppTab)}
                        className={`flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-6 py-2 sm:py-3 rounded-full transition-all relative group ${activeTab === item.id
                            ? 'bg-accent-neon text-black shadow-[0_0_20px_rgba(0,255,136,0.3)]'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <div className="transition-transform duration-300 group-hover:scale-110">
                            {item.icon}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] overflow-hidden transition-all duration-300 ${activeTab === item.id ? 'w-auto opacity-100 ml-1' : 'w-0 opacity-0'
                            }`}>
                            {t(item.labelKey).split(' ')[0]}
                        </span>
                    </button>
                ))}

                <div className="w-px h-6 bg-white/10 mx-2" />

                <button
                    onClick={() => setActiveTab('SETTINGS')}
                    className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all group ${activeTab === 'SETTINGS'
                        ? 'bg-white/10 text-accent-neon'
                        : 'text-white/20 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <SettingsIcon className={`w-5 h-5 transition-transform duration-500 group-hover:rotate-90 ${activeTab === 'SETTINGS' ? 'drop-shadow-[0_0_8px_rgba(0,255,157,0.4)]' : ''}`} />
                </button>
            </nav>
        </>
    );
};
