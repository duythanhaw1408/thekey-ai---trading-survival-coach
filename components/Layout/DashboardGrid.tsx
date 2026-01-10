import React from 'react';
import { motion } from 'framer-motion';

interface DashboardGridProps {
    children: React.ReactNode;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({ children }) => {
    return (
        <main className="flex-1 overflow-y-auto custom-scrollbar bento-grid pb-20">
            {children}
        </main>
    );
};
