
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheckIcon, KeyIcon, ChevronRightIcon, CheckCircleIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

interface RiskSettingsOnboardingProps {
    isOpen: boolean;
    initialAccountBalance?: number;
    onComplete: (settings: {
        accountBalance: number;
        maxPositionSizeUSD: number;
        riskPerTradePct: number;
        dailyTradeLimit: number;
    }) => void;
    onSkip?: () => void;
}

export const RiskSettingsOnboarding: React.FC<RiskSettingsOnboardingProps> = ({
    isOpen,
    initialAccountBalance = 1000,
    onComplete,
    onSkip
}) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(1);

    // Form state
    const [accountBalance, setAccountBalance] = useState(initialAccountBalance);
    const [maxPositionSizeUSD, setMaxPositionSizeUSD] = useState(Math.min(500, initialAccountBalance * 0.2));
    const [riskPerTradePct, setRiskPerTradePct] = useState(2);
    const [dailyTradeLimit, setDailyTradeLimit] = useState(5);

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            onComplete({
                accountBalance,
                maxPositionSizeUSD,
                riskPerTradePct,
                dailyTradeLimit
            });
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    // Auto-calculate max position when balance changes
    const handleBalanceChange = (val: number) => {
        setAccountBalance(val);
        setMaxPositionSizeUSD(Math.min(500, val * 0.2)); // Default 20% or $500 max
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-lg"
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-accent-primary/20 rounded-2xl flex items-center justify-center border border-accent-primary/30">
                            <ShieldCheckIcon className="w-8 h-8 text-accent-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Thiết lập Quản lý Rủi ro
                        </h1>
                        <p className="text-text-secondary text-sm">
                            Bước quan trọng nhất để bảo vệ vốn của bạn
                        </p>
                    </div>

                    {/* Progress */}
                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2, 3].map(i => (
                            <div
                                key={i}
                                className={`h-1.5 w-12 rounded-full transition-all ${i <= step ? 'bg-accent-primary' : 'bg-white/10'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Content */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/10">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-lg font-bold text-white mb-2">
                                            💰 Vốn đầu tư của bạn
                                        </h2>
                                        <p className="text-sm text-text-secondary mb-4">
                                            Nhập tổng số vốn bạn dành cho trading. Đây là số tiền mà THEKEY sẽ dùng để tính toán rủi ro.
                                        </p>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-accent-primary">$</span>
                                            <input
                                                type="number"
                                                value={accountBalance}
                                                onChange={(e) => handleBalanceChange(Number(e.target.value))}
                                                className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 pr-4 py-4 text-2xl font-mono text-white focus:border-accent-primary outline-none transition-all"
                                                placeholder="1000"
                                            />
                                        </div>
                                        <p className="text-xs text-text-secondary mt-2">
                                            💡 Pro tip: Chỉ trading với số tiền bạn có thể mất
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-lg font-bold text-white mb-2">
                                            🎯 Giới hạn Rủi ro
                                        </h2>
                                        <p className="text-sm text-text-secondary mb-4">
                                            Thiết lập giới hạn để bảo vệ vốn. THEKEY sẽ cảnh báo/block khi bạn vượt quá.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm text-text-secondary block mb-2">
                                                Max Position Size (USD)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                                                <input
                                                    type="number"
                                                    value={maxPositionSizeUSD}
                                                    onChange={(e) => setMaxPositionSizeUSD(Number(e.target.value))}
                                                    className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-xl font-mono text-accent-yellow focus:border-accent-yellow outline-none transition-all"
                                                />
                                            </div>
                                            <p className="text-xs text-text-secondary mt-1">
                                                Khối lượng tối đa cho mỗi lệnh ({((maxPositionSizeUSD / accountBalance) * 100).toFixed(1)}% vốn)
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-sm text-text-secondary block mb-2">
                                                Risk per Trade (%)
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="range"
                                                    min="0.5"
                                                    max="5"
                                                    step="0.5"
                                                    value={riskPerTradePct}
                                                    onChange={(e) => setRiskPerTradePct(Number(e.target.value))}
                                                    className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-red"
                                                />
                                                <span className="text-xl font-mono text-accent-red w-16 text-right">
                                                    {riskPerTradePct}%
                                                </span>
                                            </div>
                                            <p className="text-xs text-text-secondary mt-1">
                                                Rủi ro tối đa: ${(accountBalance * riskPerTradePct / 100).toFixed(0)}/lệnh
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-lg font-bold text-white mb-2">
                                            ✅ Xác nhận thiết lập
                                        </h2>
                                        <p className="text-sm text-text-secondary mb-4">
                                            Kiểm tra lại các giới hạn của bạn trước khi bắt đầu trading.
                                        </p>
                                    </div>

                                    <div className="space-y-3 bg-white/5 rounded-xl p-4">
                                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                                            <span className="text-text-secondary">Vốn đầu tư</span>
                                            <span className="font-mono text-accent-primary text-lg">${accountBalance.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                                            <span className="text-text-secondary">Max Position Size</span>
                                            <span className="font-mono text-accent-yellow">${maxPositionSizeUSD}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                                            <span className="text-text-secondary">Risk/Trade</span>
                                            <span className="font-mono text-accent-red">{riskPerTradePct}% (${(accountBalance * riskPerTradePct / 100).toFixed(0)})</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-text-secondary">Daily Trade Limit</span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setDailyTradeLimit(Math.max(1, dailyTradeLimit - 1))} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white">-</button>
                                                <span className="font-mono text-white w-8 text-center">{dailyTradeLimit}</span>
                                                <button onClick={() => setDailyTradeLimit(dailyTradeLimit + 1)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white">+</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-3 flex items-start gap-3">
                                        <CheckCircleIcon className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-accent-green">
                                            Guardian sẽ bảo vệ bạn bằng cách cảnh báo hoặc block khi vượt quá giới hạn!
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/10">
                            {step > 1 ? (
                                <button
                                    onClick={handleBack}
                                    className="px-4 py-2 text-text-secondary hover:text-white transition-colors"
                                >
                                    ← Quay lại
                                </button>
                            ) : (
                                <button
                                    onClick={onSkip}
                                    className="px-4 py-2 text-text-secondary hover:text-white transition-colors text-sm"
                                >
                                    Bỏ qua (dùng default)
                                </button>
                            )}

                            <button
                                onClick={handleNext}
                                className="px-6 py-3 bg-accent-primary text-black font-bold rounded-xl hover:brightness-110 transition-all flex items-center gap-2"
                            >
                                {step === 3 ? 'Hoàn tất' : 'Tiếp tục'}
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
