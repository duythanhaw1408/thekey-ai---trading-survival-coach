
import React from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheckIcon,
    TerminalIcon,
    BrainCircuitIcon,
    TrendingUpIcon,
    SettingsIcon,
    KeyIcon
} from '../icons';
import { useLanguage } from '../../contexts/LanguageContext';

export type AppTab = 'SURVIVAL' | 'EXECUTION' | 'MINDSET' | 'PROGRESS' | 'SETTINGS';

interface SidebarProps {
    activeTab: AppTab;
    setActiveTab: (tab: AppTab) => void;
    isCollapsed?: boolean;
}



export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed = false }) => {
    const { t } = useLanguage();

    const navItems = [
        { id: 'SURVIVAL', labelKey: 'nav.survival', icon: <ShieldCheckIcon className="w-5 h-5" />, color: 'text-accent-green' },
        { id: 'EXECUTION', labelKey: 'nav.execution', icon: <TerminalIcon className="w-5 h-5" />, color: 'text-accent-primary' },
        { id: 'MINDSET', labelKey: 'nav.mindset', icon: <BrainCircuitIcon className="w-5 h-5" />, color: 'text-accent-yellow' },
        { id: 'PROGRESS', labelKey: 'nav.progress', icon: <TrendingUpIcon className="w-5 h-5" />, color: 'text-accent-primary-neon' },
    ];

    return (
        <aside className={`fixed left-0 top-0 h-screen bg-black/40 backdrop-blur-xl border-r border-white/5 z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
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
    );
};
