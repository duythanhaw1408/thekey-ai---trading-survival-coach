/**
 * THEKEY AI - Auth Layout
 * Shared layout for authentication pages
 */

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { KeyIcon } from '../icons';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl shadow-lg shadow-cyan-500/25 mb-4"
                    >
                        <KeyIcon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        THEKEY AI
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Trading Survival Coach</p>
                </div>

                {/* Card */}
                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-semibold text-white">{title}</h2>
                        {subtitle && <p className="text-gray-400 mt-2">{subtitle}</p>}
                    </div>

                    {children}
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-xs mt-6">
                    © 2026 THEKEY AI. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
};
