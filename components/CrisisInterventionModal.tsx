

import React, { useState, useEffect } from 'react';
import type { CrisisData } from '../types';
import { BookOpenIcon, BrainCircuitIcon } from './icons'; // Re-using an icon for journaling

interface CrisisInterventionModalProps {
  data: CrisisData;
  onClose: () => void;
  onActionComplete: (actionId: string) => void;
}

const CRISIS_CONFIG = {
  LEVEL_1: { title: 'Cần bình tĩnh', colorClass: 'border-gray-400 text-gray-200', icon: '🧠', severity: 'Mild' },
  LEVEL_2: { title: 'Cảm xúc cao', colorClass: 'border-gray-300 text-gray-100', icon: '⚠️', severity: 'Moderate' },
  LEVEL_3: { title: 'REVENGE TRADE DETECTED', colorClass: 'border-white text-white', icon: '🛡️', severity: 'High' },
  LEVEL_4: { title: '🚨 ACCOUNT AT RISK', colorClass: 'border-white text-white font-bold', icon: '📉', severity: 'Critical' }
};

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const MetricItem: React.FC<{ label: string; value: string | number; }> = ({ label, value }) => (
    <div className="bg-gray-900/70 p-3 rounded-lg text-center">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-200">{value}</p>
    </div>
);

const ActionCard: React.FC<{ action: CrisisData['recommendedActions'][0], onClick: (id: string) => void }> = ({ action, onClick }) => (
    <div
        onClick={() => onClick(action.id)}
        className="bg-gray-700 p-4 rounded-lg cursor-pointer flex items-center space-x-4 hover:bg-gray-600 transition-colors"
    >
        <div className="text-3xl">{action.icon}</div>
        <div>
            <p className="font-semibold text-gray-200">{action.title} <span className="text-xs text-gray-400">({action.duration})</span></p>
            <p className="text-xs text-gray-400">{action.description}</p>
        </div>
    </div>
);

export const CrisisInterventionModal: React.FC<CrisisInterventionModalProps> = ({ data, onClose, onActionComplete }) => {
    const [timer, setTimer] = useState(data.cooldownMinutes * 60);
    const config = CRISIS_CONFIG[data.level];

    useEffect(() => {
        setTimer(data.cooldownMinutes * 60);
    }, [data.cooldownMinutes]);

    useEffect(() => {
        if (timer <= 0) return;
        const interval = setInterval(() => {
            setTimer(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [timer]);
    
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div 
                className={`bg-panel rounded-lg shadow-2xl max-w-lg w-full border-t-4 ${config.colorClass.split(' ')[0]}`}
            >
                {/* Header */}
                <header className={`p-4 rounded-t-lg flex justify-between items-center bg-gray-900`}>
                    <div className="flex items-center">
                        <span className="text-2xl mr-3">{config.icon}</span>
                        <h2 className={`text-lg ${config.colorClass}`}>{config.title}</h2>
                    </div>
                    <button onClick={onClose} className="text-xl">&times;</button>
                </header>
                
                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-6">
                        {/* Reasons */}
                        <div>
                            <h3 className="font-semibold mb-2 text-text-main">Lý do can thiệp:</h3>
                            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
                                {data.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                            </ul>
                        </div>

                        {/* Bio Insight */}
                        {data.bioInsight && (
                            <div>
                                <h3 className="font-semibold mb-2 text-text-main flex items-center">
                                    <BrainCircuitIcon className="w-5 h-5 mr-2 text-white" />
                                    Phân tích Sinh trắc học
                                </h3>
                                <p className="text-sm text-gray-300 bg-gray-700 p-3 rounded-lg border border-divider">
                                    {data.bioInsight}
                                </p>
                            </div>
                        )}

                        {/* Timer */}
                        <div className="text-center bg-gray-900/50 p-4 rounded-lg">
                            <p className="text-sm text-text-secondary">Thời gian hồi phục bắt buộc</p>
                            <p 
                                className="text-5xl font-mono font-bold text-white tracking-widest"
                            >
                                {formatTime(timer)}
                            </p>
                        </div>

                        {/* Data Insights */}
                        <div>
                            <h3 className="font-semibold mb-3 text-text-main">Dữ liệu của bạn nói lên điều gì:</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <MetricItem label="Win rate sau thua lỗ" value={`${data.userMetrics.winRateAfterLoss}%`} />
                                <MetricItem label="Win rate bình thường" value={`${data.userMetrics.normalWinRate}%`} />
                                <MetricItem label="Thiệt hại do trả thù" value={`$${data.userMetrics.revengeTradeLoss}`} />
                                <MetricItem label="Mức độ cảm xúc" value={`${data.userMetrics.emotionalLevel}/10`} />
                            </div>
                        </div>
                        
                        {/* Action Cards */}
                        <div>
                            <h3 className="font-semibold mb-3 text-text-main">Hành động đề xuất:</h3>
                            <div className="space-y-3">
                                {data.recommendedActions.map(action => (
                                    <ActionCard key={action.id} action={action} onClick={onActionComplete} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="p-4 bg-gray-900/50 rounded-b-lg flex justify-between items-center">
                    <p className="text-xs text-text-secondary">Rủi ro ước tính: <span className="font-bold text-white">{data.estimatedRisk}%</span></p>
                    <div>
                         <button disabled={timer > 0} onClick={onClose} className="px-4 py-2 rounded-md font-semibold bg-white text-black hover:bg-gray-300 transition-colors disabled:bg-gray-600 disabled:text-text-secondary disabled:cursor-not-allowed">
                            {timer > 0 ? `Chờ... ${formatTime(timer)}` : "Tôi đã sẵn sàng"}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};