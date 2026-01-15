/**
 * THEKEY AI - Protected Route
 * HUD-styled loading screen with secure connection animation
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { AuthPage } from './index';
import { KeyIcon } from '../icons';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading, refreshUser } = useAuth();

    // Optionally refresh user data when accessing a protected route
    useEffect(() => {
        if (isAuthenticated) {
            refreshUser().catch(console.error);
        }
    }, [isAuthenticated, refreshUser]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0b0e] flex items-center justify-center relative overflow-hidden">
                {/* Cyber Grid Background */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `linear-gradient(rgba(0,255,157,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,157,0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }} />

                {/* Neon Glow Orbs */}
                <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-accent-neon/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-accent-blue/5 rounded-full blur-[120px]" />

                {/* Scan Line */}
                <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-px bg-accent-neon/30"
                />

                {/* Content */}
                <div className="flex flex-col items-center gap-8 relative z-10">
                    {/* Animated Logo */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="relative"
                    >
                        <div className="w-24 h-24 rounded-2xl bg-black border-2 border-accent-neon/30 flex items-center justify-center shadow-[0_0_40px_rgba(0,255,157,0.2)]">
                            <KeyIcon className="w-12 h-12 text-accent-neon drop-shadow-[0_0_15px_rgba(0,255,157,0.8)]" />
                        </div>
                        {/* HUD corners */}
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-accent-neon/60" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-accent-neon/60" />
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-accent-neon/60" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-accent-neon/60" />
                    </motion.div>

                    {/* Brand */}
                    <div className="text-center">
                        <h1 className="text-3xl font-black text-white tracking-widest uppercase italic mb-2">
                            THE<span className="text-accent-neon">KEY</span> AI
                        </h1>
                        <p className="text-[10px] font-bold text-accent-neon/50 uppercase tracking-[0.4em]">
                            Trading Survival Coach
                        </p>
                    </div>

                    {/* Loading Indicator */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-2 h-2 rounded-full bg-accent-neon shadow-[0_0_10px_rgba(0,255,157,0.8)]"
                            />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                className="w-2 h-2 rounded-full bg-accent-neon shadow-[0_0_10px_rgba(0,255,157,0.8)]"
                            />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                className="w-2 h-2 rounded-full bg-accent-neon shadow-[0_0_10px_rgba(0,255,157,0.8)]"
                            />
                        </div>
                        <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">
                            ESTABLISHING_SECURE_CONNECTION
                        </p>
                    </div>

                    {/* Slogan */}
                    <p className="text-sm text-white/20 italic font-medium mt-4">
                        "Kỷ luật là chìa khóa sinh tồn"
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthPage />;
    }

    return <>{children}</>;
};
