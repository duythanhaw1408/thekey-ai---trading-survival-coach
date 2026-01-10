
import React from 'react';
import { motion } from 'framer-motion';

interface WelcomeBackBannerProps {
    userName?: string;
    daysAway: number;
    streakLost: number;
    onDismiss: () => void;
}

export const WelcomeBackBanner: React.FC<WelcomeBackBannerProps> = ({
    userName = 'Trader',
    daysAway,
    streakLost,
    onDismiss
}) => {
    const getMessage = () => {
        if (daysAway === 1) return "Chỉ vắng mặt 1 ngày thôi - streak của bạn vẫn an toàn! 🎉";
        if (daysAway <= 3) return "Bạn đã quay lại! Hãy tiếp tục hành trình kỷ luật của mình.";
        if (daysAway <= 7) return "Chào mừng bạn trở lại! Đã ${daysAway} ngày - hãy bắt đầu lại ngay hôm nay.";
        return "Bạn đã vắng mặt ${daysAway} ngày. Không sao, mọi trader kiệt sức đều cần nghỉ ngơi. Hãy bắt đầu lại!";
    };

    const getEmoji = () => {
        if (daysAway === 1) return "👋";
        if (daysAway <= 3) return "💪";
        if (daysAway <= 7) return "🔥";
        return "🌟";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative w-full p-4 rounded-xl bg-gradient-to-r from-accent-primary/20 via-purple-500/20 to-pink-500/20 border border-accent-primary/30 backdrop-blur-sm mb-4"
        >
            <button
                onClick={onDismiss}
                className="absolute top-2 right-2 text-white/40 hover:text-white/80 transition-colors"
            >
                ✕
            </button>

            <div className="flex items-start space-x-4">
                <motion.span
                    className="text-4xl"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                    {getEmoji()}
                </motion.span>

                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">
                        Chào mừng trở lại, {userName}!
                    </h3>
                    <p className="text-sm text-white/70 mt-1">
                        {getMessage().replace('${daysAway}', String(daysAway))}
                    </p>

                    {streakLost > 0 && (
                        <div className="mt-2 flex items-center space-x-2">
                            <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full">
                                🔥 Streak đã mất: {streakLost} ngày
                            </span>
                            <span className="text-xs text-green-400">
                                Hãy xây dựng lại!
                            </span>
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onDismiss}
                        className="mt-3 px-4 py-2 bg-accent-primary text-white text-sm font-bold rounded-lg hover:bg-accent-primary/80 transition-colors"
                    >
                        Bắt đầu phiên hôm nay →
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

// Online Traders Indicator
interface OnlineIndicatorProps {
    count?: number;
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({ count = 42 }) => {
    // Simulate fluctuating online count for realism
    const [displayCount, setDisplayCount] = React.useState(count);

    React.useEffect(() => {
        const interval = setInterval(() => {
            const fluctuation = Math.floor(Math.random() * 5) - 2; // -2 to +2
            setDisplayCount(prev => Math.max(10, prev + fluctuation));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <motion.div
                className="w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <span className="text-xs font-medium text-green-400">
                {displayCount} traders online
            </span>
        </motion.div>
    );
};

// Typing Indicator for Pod Chat
export const TypingIndicator: React.FC<{ name: string }> = ({ name }) => (
    <div className="flex items-center space-x-2 text-xs text-white/40">
        <span>{name} đang nhập</span>
        <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-white/40 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: i * 0.15,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    </div>
);
