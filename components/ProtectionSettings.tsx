
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
            desc: 'Nghiêm khắc nhất. Khóa 30 phút sau 2 lệnh lỗ. Phù hợp để bảo vệ vốn tuyệt đối.',
            icon: ShieldCheckIcon,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
            activeBorder: 'border-emerald-500',
            cooldown: 30,
            lossLimit: 2
        },
        {
            id: 'DISCIPLINE',
            label: 'Kỷ luật (Discipline)',
            desc: 'Cân bằng. Khóa 10 phút sau 2 lệnh lỗ. Phù hợp cho trader đã có hệ thống ổn định.',
            icon: ShieldExclamationIcon,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
            activeBorder: 'border-amber-500',
            cooldown: 10,
            lossLimit: 2
        },
        {
            id: 'FLEXIBLE',
            label: 'Linh hoạt (Flexible)',
            desc: 'Tùy chỉnh. Thích hợp cho Scalpers hoặc người có volume lớn cần nghỉ ngắn (2-5p).',
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
                        <div className="space-y-2">
                            <label className="text-sm text-text-secondary block">Thời gian khóa (phút)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="2"
                                    max="10"
                                    step="1"
                                    value={profile.cooldownMinutes}
                                    onChange={(e) => onUpdate({ cooldownMinutes: parseInt(e.target.value) })}
                                    className="flex-1 accent-purple-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-xl font-mono font-bold text-white w-8 text-center">{profile.cooldownMinutes}m</span>
                            </div>
                            <div className="text-[10px] text-text-secondary flex justify-between">
                                <span>Cực ngắn (2p)</span>
                                <span>Tập trung (10p)</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-text-secondary block">Giới hạn lệnh lỗ liên tiếp</label>
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
