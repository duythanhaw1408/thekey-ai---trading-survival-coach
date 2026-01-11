import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheckIcon, BrainCircuitIcon, TrendingUpIcon, TrophyIcon, XIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingBannerProps {
    tradeCount: number;
    dojoCount: number;
    hasCheckin: boolean;
    onDismiss?: () => void;
}

interface StepInfo {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    action: string;
    completed: boolean;
    link?: string;
}

export const OnboardingBanner: React.FC<OnboardingBannerProps> = ({
    tradeCount,
    dojoCount,
    hasCheckin,
    onDismiss
}) => {
    const { t } = useLanguage();

    const steps: StepInfo[] = [
        {
            id: 'checkin',
            icon: <ShieldCheckIcon className="w-5 h-5" />,
            title: t('onboarding.dailyCheckin'),
            description: t('onboarding.dailyCheckinDesc'),
            action: t('onboarding.dailyCheckinAction'),
            completed: hasCheckin,
        },
        {
            id: 'trade',
            icon: <TrendingUpIcon className="w-5 h-5" />,
            title: t('onboarding.firstTrade'),
            description: t('onboarding.firstTradeDesc'),
            action: t('onboarding.firstTradeAction'),
            completed: tradeCount >= 1,
        },
        {
            id: 'dojo',
            icon: <BrainCircuitIcon className="w-5 h-5" />,
            title: t('onboarding.firstDojo'),
            description: t('onboarding.firstDojoDesc'),
            action: t('onboarding.firstDojoAction'),
            completed: dojoCount >= 1,
        },
    ];

    const completedCount = steps.filter(s => s.completed).length;
    const progress = (completedCount / steps.length) * 100;
    const allCompleted = completedCount === steps.length;

    // Don't show if all completed
    if (allCompleted) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 relative"
        >
            <div className="bg-gradient-to-r from-accent-primary/10 via-purple-500/5 to-accent-primary/10 rounded-2xl border border-accent-primary/20 p-6 shadow-lg">
                {/* Dismiss Button */}
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <XIcon className="w-4 h-4 text-gray-500" />
                    </button>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-primary/20 rounded-xl">
                            <TrophyIcon className="w-6 h-6 text-accent-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">🚀 {t('onboarding.startWithKey')}</h3>
                            <p className="text-xs text-text-secondary">{t('onboarding.complete3Steps')}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-accent-primary">{completedCount}/{steps.length}</p>
                        <p className="text-[10px] text-gray-500">{t('onboarding.completed')}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-accent-primary to-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative p-4 rounded-xl border transition-all ${step.completed
                                ? 'bg-accent-green/10 border-accent-green/30'
                                : 'bg-white/5 border-white/10 hover:border-accent-primary/30'
                                }`}
                        >
                            {/* Step Number */}
                            <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.completed ? 'bg-accent-green text-black' : 'bg-accent-primary/20 text-accent-primary'
                                }`}>
                                {step.completed ? '✓' : index + 1}
                            </div>

                            {/* Content */}
                            <div className="flex items-start gap-3 mt-1">
                                <div className={`p-2 rounded-lg ${step.completed ? 'bg-accent-green/20 text-accent-green' : 'bg-white/10 text-gray-400'}`}>
                                    {step.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-bold ${step.completed ? 'text-accent-green' : 'text-white'}`}>
                                        {step.title}
                                    </h4>
                                    <p className="text-[11px] text-gray-500 mt-0.5">{step.description}</p>
                                    {!step.completed && (
                                        <p className="text-[10px] text-accent-primary mt-2 font-semibold">
                                            👉 {step.action}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Completed Badge */}
                            {step.completed && (
                                <div className="absolute top-2 right-2 text-[10px] font-bold text-accent-green uppercase tracking-wider">
                                    {t('onboarding.done')}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Motivation Text */}
                <p className="text-center text-xs text-gray-500 mt-4">
                    💡 {t('onboarding.unlockTip')}
                </p>
            </div>
        </motion.div>
    );
};
