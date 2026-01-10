import React from 'react';
import { motion } from 'framer-motion';
// FIX: Removed import of non-exported 'ActiveTab' from App.tsx.
// import type { ActiveTab } from '../App';
// FIX: Defined ActiveTab locally as this component is not integrated into the main App structure.
type ActiveTab = 'dashboard' | 'terminal' | 'coach';
import { TerminalIcon, ChartBarIcon, AcademicCapIcon } from './icons';

interface TabBarProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
}

const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <ChartBarIcon className="w-6 h-6" /> },
    { id: 'terminal', label: 'Terminal', icon: <TerminalIcon className="w-6 h-6" /> },
    { id: 'coach', label: 'Coach', icon: <AcademicCapIcon className="w-6 h-6" /> },
];

export const TabBar: React.FC<TabBarProps> = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-gray-800 border-t border-gray-700 flex items-center justify-around max-w-3xl mx-auto rounded-t-2xl shadow-2xl">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`relative flex flex-col items-center justify-center w-full h-full transition-colors text-xs font-medium focus:outline-none 
                        ${activeTab === tab.id ? 'text-accent-yellow' : 'text-gray-400 hover:text-white'}
                    `}
                    aria-label={tab.label}
                >
                    {tab.icon}
                    <span className="mt-1">{tab.label}</span>
                    {activeTab === tab.id && (
                        <motion.div
                            layoutId="underline"
                            className="absolute bottom-0 w-12 h-1 bg-accent-yellow rounded-full"
                        />
                    )}
                </button>
            ))}
        </nav>
    );
};