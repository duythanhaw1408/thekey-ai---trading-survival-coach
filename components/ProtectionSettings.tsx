
import React from 'react';
import { ShieldCheckIcon, ShieldExclamationIcon, AdjustmentsHorizontalIcon, InfoCircleIcon } from './icons';
import type { UserProfile } from '../types';

interface ProtectionSettingsProps {
    profile: UserProfile;
    onUpdate: (updates: Partial<UserProfile>) => void;
    onSave: () => Promise<void>;
}

export const ProtectionSettings: React.FC<ProtectionSettingsProps> = ({ profile, onUpdate, onSave }) => {
    const levels = [
        {
            id: 'SURVIVAL',
            label: 'Sinh tồn (Survival)',
            desc: 'Bảo vệ vốn tuyệt đối. Rủi ro thấp, cooldown dài.',
            icon: ShieldCheckIcon,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
            activeBorder: 'border-emerald-500',
            cooldown: 30,
            lossLimit: 2,
            riskPct: 1,
            maxPositionPct: 5
        },
        {
            id: 'DISCIPLINE',
            label: 'Kỷ luật (Discipline)',
            desc: 'Cân bằng giữa bảo vệ và tăng trưởng.',
            icon: ShieldExclamationIcon,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
            activeBorder: 'border-amber-500',
            cooldown: 10,
            lossLimit: 2,
            riskPct: 2,
            maxPositionPct: 10
        },
        {
            id: 'FLEXIBLE',
            label: 'Tùy chỉnh',
            desc: 'Tự định nghĩa mức rủi ro và volume.',
            icon: AdjustmentsHorizontalIcon,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
            activeBorder: 'border-purple-500',
            isCustom: true
        }
    ];

    const handleLevelSelect = (level: any) => {
        const updates: any = { protectionLevel: level.id };
        if (!level.isCustom) {
            updates.cooldownMinutes = level.cooldown;
            updates.consecutiveLossLimit = level.lossLimit;
            updates.risk_per_trade_pct = level.riskPct;
            updates.max_position_size_pct = level.maxPositionPct;
        }
        onUpdate(updates);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <ShieldCheckIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-semibold text-white">Chế Độ Bảo Vệ (Safety Net)</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {levels.map((level) => {
                    const isActive = profile.protectionLevel === level.id;
                    const Icon = level.icon;

                    return (
                        <button
                            key={level.id}
                            onClick={() => handleLevelSelect(level)}
                            className={`flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-xl border transition-all text-left ${isActive
                                ? `${level.activeBorder} ${level.bgColor} shadow-lg shadow-indigo-500/5`
                                : 'border-divider bg-panel/50 hover:border-gray-600'
                                }`}
                        >
                            <div className={`p-3 rounded-full ${level.bgColor} ${level.color}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-white text-base">{level.label}</div>
                                <div className="text-sm text-text-secondary mt-1 line-clamp-2 md:line-clamp-1">{level.desc}</div>
                            </div>
                            {isActive && (
                                <div className="hidden md:flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400 uppercase tracking-tighter">
                                    Đang Kích Hoạt
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {profile.protectionLevel === 'FLEXIBLE' && (
                <div className="p-5 rounded-xl border border-purple-500/30 bg-purple-500/5 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-purple-400 font-bold mb-4 flex items-center gap-2">
                        <AdjustmentsHorizontalIcon className="w-4 h-4" />
                        Cấu Hình Linh Hoạt
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Risk per trade */}
                        <div className="space-y-2">
                            <label className="text-sm text-text-secondary block">Rủi ro / lệnh (%)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0.5"
                                    max="5"
                                    step="0.5"
                                    value={profile.risk_per_trade_pct || 2}
                                    onChange={(e) => onUpdate({ risk_per_trade_pct: parseFloat(e.target.value) })}
                                    className="flex-1 accent-purple-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-xl font-mono font-bold text-accent-neon w-12 text-center">{profile.risk_per_trade_pct || 2}%</span>
                            </div>
                        </div>

                        {/* Max position % */}
                        <div className="space-y-2">
                            <label className="text-sm text-text-secondary block">Volume tối đa (% vốn)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="5"
                                    max="30"
                                    step="5"
                                    value={profile.max_position_size_pct || 10}
                                    onChange={(e) => onUpdate({ max_position_size_pct: parseFloat(e.target.value) })}
                                    className="flex-1 accent-purple-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-xl font-mono font-bold text-accent-yellow w-12 text-center">{profile.max_position_size_pct || 10}%</span>
                            </div>
                        </div>

                        {/* Cooldown */}
                        <div className="space-y-2">
                            <label className="text-sm text-text-secondary block">Thời gian khóa (phút)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="2"
                                    max="30"
                                    step="1"
                                    value={profile.cooldownMinutes}
                                    onChange={(e) => onUpdate({ cooldownMinutes: parseInt(e.target.value) })}
                                    className="flex-1 accent-purple-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-xl font-mono font-bold text-white w-12 text-center">{profile.cooldownMinutes}p</span>
                            </div>
                        </div>

                        {/* Loss limit */}
                        <div className="space-y-2">
                            <label className="text-sm text-text-secondary block">Lệnh lỗ liên tiếp tối đa</label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => onUpdate({ consecutiveLossLimit: num })}
                                        className={`flex-1 py-2 rounded-lg font-bold border transition-all ${profile.consecutiveLossLimit === num
                                            ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                                            : 'bg-background/50 border-divider text-text-secondary hover:border-gray-500'
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-indigo-500/10 rounded-lg flex items-start gap-3 border border-indigo-500/20">
                        <InfoCircleIcon className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-text-secondary leading-relaxed italic">
                            "Người dùng Linh hoạt thường là Scalper. Hệ thống sẽ khóa giao dịch trong <span className="text-white font-bold">{profile.cooldownMinutes} phút</span> sau khi bạn đạt <span className="text-white font-bold">{profile.consecutiveLossLimit} lệnh lỗ</span> liên tiếp."
                        </p>
                    </div>
                </div>
            )}

            <div className="pt-4 border-t border-divider flex justify-end">
                <button
                    onClick={onSave}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
                >
                    Lưu Cài Đặt
                </button>
            </div>
        </div>
    );
};
