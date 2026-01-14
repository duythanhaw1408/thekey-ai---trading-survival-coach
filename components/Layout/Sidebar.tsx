
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
            {/* Mobile Header with Hamburger */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-2xl border-b border-accent-neon/20 z-50 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-black border border-accent-neon/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,255,157,0.1)]">
                        <KeyIcon className="w-5 h-5 text-accent-neon" />
                    </div>
                    <span className="font-black text-xl tracking-tighter uppercase italic text-white leading-none">
                        THE<span className="text-accent-neon">KEY</span>
                    </span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all active:scale-95"
                >
                    {isMobileMenuOpen ? (
                        <XIcon className="w-6 h-6 text-white" />
                    ) : (
                        <MenuIcon className="w-6 h-6 text-white" />
                    )}
                </button>
            </header>

            {/* Mobile Slide-out Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                        />
                        {/* Menu Panel */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="md:hidden fixed left-0 top-16 bottom-0 w-72 bg-black border-r border-accent-neon/10 z-50 p-6 flex flex-col"
                        >
                            <nav className="flex-1 space-y-4">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleTabChange(item.id as AppTab)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative overflow-hidden ${activeTab === item.id
                                            ? 'bg-accent-neon/5 border border-accent-neon/20 text-accent-neon'
                                            : 'text-white/40 hover:bg-white/5'
                                            }`}
                                    >
                                        <div className={activeTab === item.id ? 'text-accent-neon drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]' : 'text-inherit'}>
                                            {item.icon}
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-[0.2em]">
                                            {t(item.labelKey)}
                                        </span>
                                        {activeTab === item.id && (
                                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-accent-neon" />
                                        )}
                                    </button>
                                ))}
                                <div className="pt-6 border-t border-white/5">
                                    <button
                                        onClick={() => handleTabChange('SETTINGS')}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'SETTINGS'
                                            ? 'bg-accent-neon/5 border border-accent-neon/20 text-accent-neon'
                                            : 'text-white/40 hover:bg-white/5'
                                            }`}
                                    >
                                        <SettingsIcon className="w-5 h-5" />
                                        <span className="text-sm font-black uppercase tracking-[0.2em]">
                                            {t('nav.settings')}
                                        </span>
                                    </button>
                                </div>
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile Bottom Navigation - Cyberpunk Style */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-black/90 backdrop-blur-2xl border-t border-accent-neon/10 z-50 flex items-center justify-around px-2 safe-area-inset-bottom">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id as AppTab)}
                        className={`flex flex-col items-center justify-center p-2 transition-all relative min-w-[64px] ${activeTab === item.id
                            ? 'text-accent-neon'
                            : 'text-white/20'
                            }`}
                    >
                        <div className={`mb-1.5 transition-transform duration-300 ${activeTab === item.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,255,157,0.4)]' : ''}`}>
                            {item.icon}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-center leading-none">
                            {t(item.labelKey).split(' ')[0]}
                        </span>
                        {activeTab === item.id && (
                            <motion.div
                                layoutId="mobile-nav-active"
                                className="absolute -top-1 w-8 h-0.5 bg-accent-neon shadow-[0_0_8px_rgba(0,255,157,0.8)]"
                            />
                        )}
                    </button>
                ))}
            </nav>

            {/* Desktop Sidebar - Futuristic HUD style */}
            <aside className={`hidden md:block sticky left-0 top-0 h-screen bg-black/20 backdrop-blur-3xl border-r border-white/5 z-50 transition-all duration-500 ease-in-out group/sidebar ${isCollapsed ? 'w-24' : 'w-72'}`}>
                <div className="flex flex-col h-full p-6">
                    {/* Logo Section */}
                    <div className="flex items-center gap-4 px-2 mb-16 mt-6">
                        <div className="w-12 h-12 bg-black border border-accent-neon/30 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,255,157,0.1)] group-hover/sidebar:border-accent-neon/60 transition-colors duration-500">
                            <KeyIcon className="w-7 h-7 text-accent-neon drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col">
                                <span className="font-black text-2xl tracking-tighter uppercase italic text-white leading-none">
                                    THE<span className="text-accent-neon">KEY</span>
                                </span>
                                <span className="text-[8px] font-black text-accent-neon/30 uppercase tracking-[0.4em] mt-1">SYSTEM_CORE</span>
                            </div>
                        )}
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 space-y-4">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as AppTab)}
                                className={`w-full flex items-center gap-5 p-4 rounded-2xl transition-all relative overflow-hidden group/item ${activeTab === item.id
                                    ? 'bg-accent-neon/10 border border-accent-neon/30 text-white shadow-[0_0_15px_rgba(0,255,157,0.1)]'
                                    : 'text-white/50 hover:bg-white/5 hover:text-white border border-transparent'
                                    }`}
                            >
                                <div className={`transition-all duration-300 ${activeTab === item.id ? 'scale-110 drop-shadow-[0_0_10px_rgba(0,255,157,0.4)]' : 'group-hover/item:scale-110'}`}>
                                    {item.icon}
                                </div>
                                {!isCollapsed && (
                                    <span className={`text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === item.id ? 'opacity-100' : 'opacity-80 group-hover/item:opacity-100'}`}>
                                        {t(item.labelKey)}
                                    </span>
                                )}

                                {/* Hover Glow */}
                                <div className="absolute inset-0 bg-gradient-to-r from-accent-neon/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {/* Active Indicator Bar */}
                                {activeTab === item.id && (
                                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-accent-neon rounded-r-full shadow-[0_0_10px_rgba(0,255,157,0.8)]" />
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* Bottom Section */}
                    <div className="pt-8 border-t border-white/5">
                        <button
                            onClick={() => setActiveTab('SETTINGS')}
                            className={`w-full flex items-center gap-5 p-4 rounded-2xl transition-all group/item overflow-hidden relative ${activeTab === 'SETTINGS'
                                ? 'bg-accent-neon/5 border border-accent-neon/20 text-accent-neon'
                                : 'text-white/30 hover:bg-white/5 hover:text-white border border-transparent'
                                }`}
                        >
                            <SettingsIcon className={`w-5 h-5 transition-transform duration-300 group-hover/item:rotate-90 ${activeTab === 'SETTINGS' ? 'drop-shadow-[0_0_8px_rgba(0,255,157,0.4)]' : ''}`} />
                            {!isCollapsed && (
                                <span className="text-xs font-black uppercase tracking-[0.2em] opacity-60 group-hover/item:opacity-100">
                                    {t('nav.settings')}
                                </span>
                            )}
                            {activeTab === 'SETTINGS' && (
                                <div className="absolute left-0 top-2 bottom-2 w-1 bg-accent-neon rounded-r-full shadow-[0_0_10px_rgba(0,255,157,0.8)]" />
                            )}
                        </button>
                    </div>

                    {/* Footer decoration */}
                    {!isCollapsed && (
                        <div className="mt-8 px-2">
                            <div className="h-px bg-gradient-to-r from-accent-neon/20 via-transparent to-transparent mb-4" />
                            <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em]">PROTOCOL_REV_7.2</p>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};
