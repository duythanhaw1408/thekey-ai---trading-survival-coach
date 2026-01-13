
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
}

// Hamburger Menu Icon
const MenuIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed = false }) => {
    const { t } = useLanguage();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { id: 'SURVIVAL', labelKey: 'nav.survival', icon: <ShieldCheckIcon className="w-5 h-5" />, color: 'text-accent-green' },
        { id: 'EXECUTION', labelKey: 'nav.execution', icon: <TerminalIcon className="w-5 h-5" />, color: 'text-accent-primary' },
        { id: 'MINDSET', labelKey: 'nav.mindset', icon: <BrainCircuitIcon className="w-5 h-5" />, color: 'text-accent-yellow' },
        { id: 'PROGRESS', labelKey: 'nav.progress', icon: <TrendingUpIcon className="w-5 h-5" />, color: 'text-accent-primary-neon' },
    ];

    const handleTabChange = (tab: AppTab) => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            {/* Mobile Header with Hamburger */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-black/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-accent-primary/20 rounded-lg flex items-center justify-center border border-accent-primary/30">
                        <KeyIcon className="w-5 h-5 text-accent-primary" />
                    </div>
                    <span className="font-black text-lg tracking-tighter uppercase italic">
                        THE<span className="text-accent-primary">KEY</span>
                    </span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
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
                            className="md:hidden fixed inset-0 bg-black/60 z-40"
                        />
                        {/* Menu Panel */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="md:hidden fixed left-0 top-14 bottom-0 w-64 bg-black/95 backdrop-blur-xl border-r border-white/10 z-50"
                        >
                            <nav className="p-4 space-y-2">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleTabChange(item.id as AppTab)}
                                        className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeTab === item.id
                                                ? 'bg-white/10 text-white'
                                                : 'text-text-secondary hover:bg-white/5'
                                            }`}
                                    >
                                        <div className={activeTab === item.id ? item.color : 'text-inherit'}>
                                            {item.icon}
                                        </div>
                                        <span className="text-sm font-bold uppercase tracking-widest">
                                            {t(item.labelKey)}
                                        </span>
                                    </button>
                                ))}
                                <div className="pt-4 border-t border-white/10">
                                    <button
                                        onClick={() => handleTabChange('SETTINGS')}
                                        className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeTab === 'SETTINGS'
                                                ? 'bg-white/10 text-white'
                                                : 'text-text-secondary hover:bg-white/5'
                                            }`}
                                    >
                                        <SettingsIcon className="w-5 h-5" />
                                        <span className="text-sm font-bold uppercase tracking-widest">
                                            {t('nav.settings')}
                                        </span>
                                    </button>
                                </div>
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-xl border-t border-white/10 z-50 flex items-center justify-around px-2 safe-area-inset-bottom">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id as AppTab)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[60px] ${activeTab === item.id
                                ? 'text-white'
                                : 'text-text-secondary'
                            }`}
                    >
                        <div className={`mb-1 ${activeTab === item.id ? item.color : 'text-inherit'}`}>
                            {item.icon}
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${activeTab === item.id ? 'opacity-100' : 'opacity-50'}`}>
                            {t(item.labelKey).split(' ')[0]}
                        </span>
                        {activeTab === item.id && (
                            <motion.div
                                layoutId="mobile-nav-active"
                                className="absolute bottom-1 w-8 h-1 bg-accent-primary rounded-full"
                            />
                        )}
                    </button>
                ))}
                <button
                    onClick={() => handleTabChange('SETTINGS')}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[60px] ${activeTab === 'SETTINGS' ? 'text-white' : 'text-text-secondary'
                        }`}
                >
                    <SettingsIcon className={`w-5 h-5 mb-1 ${activeTab === 'SETTINGS' ? 'text-accent-primary' : ''}`} />
                    <span className={`text-[10px] font-bold uppercase ${activeTab === 'SETTINGS' ? 'opacity-100' : 'opacity-50'}`}>
                        {t('nav.settings').split(' ')[0]}
                    </span>
                </button>
            </nav>

            {/* Desktop Sidebar - Hidden on Mobile */}
            <aside className={`hidden md:block fixed left-0 top-0 h-screen bg-black/40 backdrop-blur-xl border-r border-white/5 z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
                <div className="flex flex-col h-full p-4">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3 px-2 mb-12 mt-4">
                        <div className="w-10 h-10 bg-accent-primary/20 rounded-xl flex items-center justify-center border border-accent-primary/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                            <KeyIcon className="w-6 h-6 text-accent-primary" />
                        </div>
                        {!isCollapsed && (
                            <span className="font-black text-xl tracking-tighter uppercase italic">
                                THE<span className="text-accent-primary">KEY</span>
                            </span>
                        )}
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as AppTab)}
                                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group relative ${activeTab === item.id
                                    ? 'bg-white/10 text-white'
                                    : 'text-text-secondary hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <div className={`${activeTab === item.id ? item.color : 'text-inherit'} transition-colors`}>
                                    {item.icon}
                                </div>
                                {!isCollapsed && (
                                    <span className={`text-sm font-bold uppercase tracking-widest ${activeTab === item.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                                        {t(item.labelKey)}
                                    </span>
                                )}

                                {/* Active Indicator */}
                                {activeTab === item.id && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute left-0 w-1 h-6 bg-accent-primary rounded-r-full"
                                    />
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* Bottom Section */}
                    <div className="pt-4 border-t border-white/5">
                        <button
                            onClick={() => setActiveTab('SETTINGS')}
                            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${activeTab === 'SETTINGS'
                                ? 'bg-white/10 text-white'
                                : 'text-text-secondary hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <SettingsIcon className={`w-5 h-5 ${activeTab === 'SETTINGS' ? 'text-white' : 'text-inherit'}`} />
                            {!isCollapsed && (
                                <span className="text-sm font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">
                                    {t('nav.settings')}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};
