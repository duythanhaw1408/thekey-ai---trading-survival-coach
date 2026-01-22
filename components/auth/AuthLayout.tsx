/**
 * THEKEY AI - Auth Layout
 * HUD-styled layout for authentication pages
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
        <div className="min-h-screen bg-[#0a0b0e] flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Cyber Grid */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `linear-gradient(rgba(0,255,157,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,157,0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }} />
                {/* Neon Glow Orbs */}
                <div className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-accent-neon/5 rounded-full blur-[80px] sm:blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-accent-blue/5 rounded-full blur-[80px] sm:blur-[100px]" />
                {/* Scan Lines */}
                <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-px bg-accent-neon/20"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md z-10"
            >
                {/* Logo & Brand */}
                <div className="text-center mb-6 sm:mb-10">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 bg-black border-2 border-accent-neon/30 rounded-xl sm:rounded-2xl shadow-[0_0_30px_rgba(0,255,157,0.2)] mb-4 sm:mb-6 relative"
                    >
                        <KeyIcon className="w-6 h-6 sm:w-10 sm:h-10 text-accent-neon drop-shadow-[0_0_10px_rgba(0,255,157,0.8)]" />
                        {/* HUD corners */}
                        <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-accent-neon/50" />
                        <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-accent-neon/50" />
                        <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-accent-neon/50" />
                        <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-accent-neon/50" />
                    </motion.div>

                    <h1 className="text-2xl sm:text-4xl font-black text-white tracking-wider sm:tracking-widest uppercase italic mb-2 sm:mb-3">
                        THE<span className="text-accent-neon">KEY</span> AI
                    </h1>

                    {/* Slogan */}
                    <p className="text-[9px] sm:text-[11px] font-bold text-accent-neon/60 uppercase tracking-[0.2em] sm:tracking-[0.4em] mb-2 sm:mb-4">
                        Trading Survival Coach
                    </p>
                    <p className="text-xs sm:text-sm text-white/30 italic font-medium">
                        "Kỷ luật là chìa khóa sinh tồn"
                    </p>
                </div>

                {/* Card */}
                <div className="bg-black/60 backdrop-blur-2xl border border-accent-neon/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
                    {/* HUD Corners */}
                    <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-accent-neon/30 rounded-tl-3xl pointer-events-none" />
                    <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-accent-neon/30 rounded-tr-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-accent-neon/30 rounded-bl-3xl pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-accent-neon/30 rounded-br-3xl pointer-events-none" />

                    <div className="text-center mb-5 sm:mb-8">
                        <h2 className="text-[10px] font-black text-accent-neon/40 uppercase tracking-[0.5em] mb-2">
                            {title === 'Đăng nhập' ? 'AUTHENTICATE' : 'INITIALIZE'}
                        </h2>
                        <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide sm:tracking-widest">{title}</h3>
                        {subtitle && <p className="text-white/40 mt-2 text-sm">{subtitle}</p>}
                    </div>

                    {children}
                </div>

                {/* Footer */}
                <p className="text-center text-white/20 text-[10px] mt-8 uppercase tracking-widest">
                    © 2026 THEKEY AI • NEURAL_TRADING_PROTOCOL
                </p>
            </motion.div>
        </div>
    );
};
