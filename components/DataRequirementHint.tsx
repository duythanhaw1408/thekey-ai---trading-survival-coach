
import React from 'react';
import { LightbulbIcon, AlertTriangleIcon, ShieldCheckIcon, BrainCircuitIcon, TrendingUpIcon } from './icons';

interface DataRequirementHintProps {
    type?: 'info' | 'warning' | 'success' | 'tip';
    icon?: 'lightbulb' | 'shield' | 'brain' | 'trending' | 'alert';
    title: string;
    requirement: string;
    action?: string;
    currentProgress?: number;
    requiredProgress?: number;
    compact?: boolean;
}

const iconMap = {
    lightbulb: LightbulbIcon,
    shield: ShieldCheckIcon,
    brain: BrainCircuitIcon,
    trending: TrendingUpIcon,
    alert: AlertTriangleIcon,
};

const colorMap = {
    info: {
        bg: 'bg-accent-blue/10',
        border: 'border-accent-blue/30',
        text: 'text-accent-blue',
        icon: 'text-accent-blue',
    },
    warning: {
        bg: 'bg-accent-yellow/10',
        border: 'border-accent-yellow/30',
        text: 'text-accent-yellow',
        icon: 'text-accent-yellow',
    },
    success: {
        bg: 'bg-accent-green/10',
        border: 'border-accent-green/30',
        text: 'text-accent-green',
        icon: 'text-accent-green',
    },
    tip: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        icon: 'text-purple-400',
    },
};

export const DataRequirementHint: React.FC<DataRequirementHintProps> = ({
    type = 'info',
    icon = 'lightbulb',
    title,
    requirement,
    action,
    currentProgress,
    requiredProgress,
    compact = false,
}) => {
    const IconComponent = iconMap[icon];
    const colors = colorMap[type];
    const hasProgress = currentProgress !== undefined && requiredProgress !== undefined;
    const progressPercent = hasProgress ? Math.min((currentProgress / requiredProgress) * 100, 100) : 0;

    if (compact) {
        return (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors.bg} border ${colors.border}`}>
                <IconComponent className={`w-4 h-4 flex-shrink-0 ${colors.icon}`} />
                <p className="text-xs text-gray-300">
                    <span className={`font-semibold ${colors.text}`}>{title}</span>
                    {' — '}{requirement}
                </p>
            </div>
        );
    }

    return (
        <div className={`rounded-xl ${colors.bg} border ${colors.border} p-4`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-white/5`}>
                    <IconComponent className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold ${colors.text} mb-1`}>{title}</h4>
                    <p className="text-xs text-gray-400 mb-2">{requirement}</p>

                    {hasProgress && (
                        <div className="mb-2">
                            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                <span>Tiến độ</span>
                                <span>{currentProgress}/{requiredProgress}</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${progressPercent >= 100 ? 'bg-accent-green' : colors.bg.replace('/10', '')}`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {action && (
                        <p className="text-xs text-white/80 font-medium">
                            👉 {action}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Preset hints for common scenarios
export const EmptyTradeHistoryHint: React.FC = () => (
    <DataRequirementHint
        type="info"
        icon="trending"
        title="Chưa có lịch sử giao dịch"
        requirement="Ghi lại lệnh giao dịch đầu tiên để bắt đầu theo dõi hành vi trading của bạn."
        action="Vào tab EXECUTION → Nhập thông tin lệnh → Gửi"
    />
);

export const NoDojoHint: React.FC<{ tradeCount?: number }> = ({ tradeCount = 0 }) => (
    <DataRequirementHint
        type="warning"
        icon="brain"
        title="Cần hoàn thành Process Dojo"
        requirement="Dojo giúp đánh giá quy trình giao dịch của bạn. Mỗi lần đóng lệnh, hãy hoàn thành 7 bước Dojo."
        action="Đóng lệnh → Hoàn thành 7 bước đánh giá Dojo"
        currentProgress={tradeCount}
        requiredProgress={3}
    />
);

export const NotEnoughTradesHint: React.FC<{ current: number; required: number; feature: string }> = ({
    current, required, feature
}) => (
    <DataRequirementHint
        type="tip"
        icon="lightbulb"
        title={`Cần thêm dữ liệu cho ${feature}`}
        requirement={`Tính năng này cần ít nhất ${required} giao dịch có Dojo để phân tích chính xác.`}
        action="Tiếp tục giao dịch và hoàn thành Dojo sau mỗi lệnh"
        currentProgress={current}
        requiredProgress={required}
    />
);

export const DailyCheckinHint: React.FC = () => (
    <DataRequirementHint
        type="success"
        icon="shield"
        title="Check-in hàng ngày"
        requirement="Trả lời 3 câu hỏi mỗi ngày để AI hiểu tâm lý trading của bạn và đưa ra lời khuyên phù hợp."
        action="Đăng nhập mỗi ngày và hoàn thành Check-in"
    />
);

export const OnboardingChecklist: React.FC<{
    hasFirstTrade: boolean;
    hasFirstDojo: boolean;
    hasCheckin: boolean
}> = ({ hasFirstTrade, hasFirstDojo, hasCheckin }) => {
    const steps = [
        { done: hasFirstTrade, label: 'Ghi lại lệnh đầu tiên', icon: '📊' },
        { done: hasFirstDojo, label: 'Hoàn thành Dojo đầu tiên', icon: '🧠' },
        { done: hasCheckin, label: 'Làm Daily Check-in', icon: '✅' },
    ];
    const completedCount = steps.filter(s => s.done).length;

    if (completedCount === 3) return null;

    return (
        <div className="bg-gradient-to-br from-accent-primary/10 to-purple-500/5 rounded-xl border border-accent-primary/20 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    🚀 Bắt đầu với THEKEY
                </h3>
                <span className="text-xs text-accent-primary font-mono">{completedCount}/3</span>
            </div>
            <div className="space-y-2">
                {steps.map((step, i) => (
                    <div
                        key={i}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-all ${step.done ? 'bg-accent-green/10 border border-accent-green/20' : 'bg-white/5'
                            }`}
                    >
                        <span className="text-lg">{step.done ? '✅' : step.icon}</span>
                        <span className={`text-sm ${step.done ? 'text-accent-green line-through opacity-60' : 'text-white'}`}>
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-3 text-center">
                Hoàn thành 3 bước để mở khóa đầy đủ tính năng AI của THEKEY 🔓
            </p>
        </div>
    );
};
