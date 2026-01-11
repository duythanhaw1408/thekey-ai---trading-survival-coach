
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Trade, UserProcessEvaluation, DojoInteractionData } from '../types';
import { BrainCircuitIcon, ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from './icons';

interface ProcessDojoModalProps {
    trade: Trade;
    onClose: () => void;
    onSave: (evaluation: UserProcessEvaluation, interactionData: DojoInteractionData) => void;
}

const steps = [
    { id: 1, title: 'Bối cảnh Giao dịch' },
    { id: 2, title: 'Sự rõ ràng của Setup' },
    { id: 3, title: 'Chất lượng Kế hoạch' },
    { id: 4, title: 'Quản lý Rủi ro' },
    { id: 5, title: 'Kỷ luật Thực thi' },
    { id: 6, title: 'Trạng thái Cảm xúc' },
    { id: 7, title: 'Bài học Chính' },
];

const sliderVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
};

const EvaluationSlider: React.FC<{ label: string; value: number; onChange: (value: number) => void; minLabel: string; maxLabel: string; }> = ({ label, value, onChange, minLabel, maxLabel }) => {
    const valueColor = value > 7 ? 'text-accent-green' : value > 4 ? 'text-accent-yellow' : 'text-accent-red';
    const accentColor = value > 7 ? 'accent-green' : value > 4 ? 'accent-yellow' : 'accent-red';
    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
            <div className="relative flex items-center">
                <input
                    type="range" min="1" max="10" value={value}
                    onChange={(e) => onChange(parseInt(e.target.value, 10))}
                    className={`w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer ${accentColor}`}
                />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{minLabel}</span>
                <span className={`font-bold text-lg ${valueColor}`}>{value}</span>
                <span>{maxLabel}</span>
            </div>
        </div>
    );
};

const EmotionSelector: React.FC<{ value: UserProcessEvaluation['dominantEmotion'], onChange: (value: UserProcessEvaluation['dominantEmotion']) => void }> = ({ value, onChange }) => {
    const emotions: UserProcessEvaluation['dominantEmotion'][] = ['PATIENCE', 'CONFIDENCE', 'NEUTRAL', 'FEAR', 'GREED', 'FOMO'];
    const emotionConfig = {
        PATIENCE: { emoji: '🧘', color: 'bg-blue-500/80 ring-blue-400' },
        CONFIDENCE: { emoji: '😎', color: 'bg-green-500/80 ring-green-400' },
        NEUTRAL: { emoji: '😐', color: 'bg-gray-500/80 ring-gray-400' },
        FEAR: { emoji: '😨', color: 'bg-purple-500/80 ring-purple-400' },
        GREED: { emoji: '🤑', color: 'bg-yellow-500/80 ring-yellow-400' },
        FOMO: { emoji: '🏃‍♂️', color: 'bg-red-500/80 ring-red-400' },
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cảm xúc chủ đạo trong giao dịch là gì?</label>
            <div className="grid grid-cols-3 gap-2">
                {emotions.map(emotion => (
                    <button
                        type="button"
                        key={emotion}
                        onClick={() => onChange(emotion)}
                        className={`p-2 rounded-lg text-center transition-all ${value === emotion ? `ring-2 ${emotionConfig[emotion].color}` : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        <span className="text-2xl">{emotionConfig[emotion].emoji}</span>
                        <span className="block text-xs font-semibold mt-1">{emotion}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export const ProcessDojoModal: React.FC<ProcessDojoModalProps> = ({ trade, onClose, onSave }) => {
    const startTimeRef = useRef<number>(Date.now());
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [evaluation, setEvaluation] = useState<UserProcessEvaluation>({
        setupClarity: 5,
        hadPredefinedEntry: false,
        hadPredefinedSL: false,
        hadPredefinedTP: false,
        followedPositionSizing: 5,
        planAdherence: 5,
        impulsiveActions: 10, // 10 = none
        emotionalInfluence: 1, // 1 = not at all
        dominantEmotion: 'NEUTRAL',
        reflection: '',
    });

    const handleNext = () => (step < steps.length - 1) && (setDirection(1), setStep(s => s + 1));
    const handlePrev = () => (step > 0) && (setDirection(-1), setStep(s => s - 1));

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const interactionData: DojoInteractionData = {
            startTime: startTimeRef.current,
            endTime: Date.now(),
        };
        onSave(evaluation, interactionData);
    };

    const handleChange = (field: keyof UserProcessEvaluation, value: any) => setEvaluation(prev => ({ ...prev, [field]: value }));

    const renderStepContent = () => {
        switch (step) {
            case 0: return (
                <div className="text-center">
                    <p className="text-gray-400">Bạn đang đánh giá giao dịch:</p>
                    <p className="text-2xl font-bold text-accent-yellow my-2">{trade.asset}</p>
                    <p className="text-sm text-gray-500">{new Date(trade.timestamp).toLocaleString()}</p>
                    <p className="mt-4 text-gray-300">Hãy bắt đầu quá trình phản ánh 7 bước để rút ra bài học.</p>
                </div>
            );
            case 1: return <EvaluationSlider label="Mức độ rõ ràng của Setup" value={evaluation.setupClarity} onChange={(v) => handleChange('setupClarity', v)} minLabel="Ngẫu hứng" maxLabel="Rất rõ ràng" />;
            case 2: return (
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">Kế hoạch của bạn đã được xác định TRƯỚC KHI vào lệnh chưa?</label>
                    {['hadPredefinedEntry', 'hadPredefinedSL', 'hadPredefinedTP'].map(key => (
                        <label key={key} className="flex items-center p-3 bg-gray-700 rounded-md cursor-pointer hover:bg-gray-600 transition-colors has-[:checked]:bg-blue-900/50 has-[:checked]:ring-1 has-[:checked]:ring-accent-blue">
                            <input type="checkbox" checked={evaluation[key as keyof UserProcessEvaluation] as boolean} onChange={(e) => handleChange(key as keyof UserProcessEvaluation, e.target.checked)} className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-accent-blue focus:ring-accent-blue" />
                            <span className="ml-3 text-gray-300 text-sm">
                                {key === 'hadPredefinedEntry' && 'Điểm vào lệnh (Entry)'}
                                {key === 'hadPredefinedSL' && 'Điểm dừng lỗ (Stop-Loss)'}
                                {key === 'hadPredefinedTP' && 'Điểm chốt lời (Take-Profit)'}
                            </span>
                        </label>
                    ))}
                </div>
            );
            case 3: return <EvaluationSlider label="Mức độ tuân thủ quy tắc về khối lượng lệnh" value={evaluation.followedPositionSizing} onChange={(v) => handleChange('followedPositionSizing', v)} minLabel="Hoàn toàn sai" maxLabel="Hoàn toàn đúng" />;
            case 4: return (
                <div className="space-y-6">
                    <EvaluationSlider label="Mức độ tuân thủ kế hoạch (Vào & Ra Lệnh)" value={evaluation.planAdherence} onChange={(v) => handleChange('planAdherence', v)} minLabel="Phá vỡ hoàn toàn" maxLabel="Tuân thủ 100%" />
                    <EvaluationSlider label="Mức độ kỷ luật (Không có hành động bốc đồng)" value={evaluation.impulsiveActions} onChange={(v) => handleChange('impulsiveActions', v)} minLabel="Rất bốc đồng" maxLabel="Hoàn toàn kỷ luật" />
                </div>
            );
            case 5: return (
                <div className="space-y-6">
                    <EmotionSelector value={evaluation.dominantEmotion} onChange={v => handleChange('dominantEmotion', v)} />
                    <EvaluationSlider label="Mức độ cảm xúc ảnh hưởng đến quyết định" value={evaluation.emotionalInfluence} onChange={(v) => handleChange('emotionalInfluence', v)} minLabel="Không hề" maxLabel="Hoàn toàn" />
                </div>
            );
            case 6: return (
                <div>
                    <label htmlFor="reflection" className="block text-sm font-medium text-gray-300 mb-2">Bài học quan trọng nhất từ quy trình này là gì?</label>
                    <textarea
                        id="reflection"
                        rows={5}
                        value={evaluation.reflection}
                        onChange={(e) => handleChange('reflection', e.target.value)}
                        onKeyDown={(e) => {
                            // Allow Enter in textarea for newlines - don't let it bubble to form
                            if (e.key === 'Enter') {
                                e.stopPropagation();
                            }
                        }}
                        placeholder="VD: Tôi đã tuân thủ stop-loss dù cảm thấy sợ hãi. Đó là một chiến thắng về kỷ luật."
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-yellow"
                    />
                    <p className="text-xs text-gray-500 mt-2">Nhấn "Save & Analyze" khi hoàn tất</p>
                </div>
            );
            default: return null;
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full">
                <form
                    onSubmit={handleSave}
                    onKeyDown={(e) => {
                        // Prevent Enter key from submitting form (except when clicking submit button)
                        if (e.key === 'Enter' && e.target instanceof HTMLTextAreaElement === false) {
                            e.preventDefault();
                        }
                    }}
                >
                    <div className="flex">
                        {/* Left Side: Step Navigator */}
                        <div className="w-1/3 p-6 border-r border-gray-700 bg-gray-800/50 rounded-l-lg">
                            <h2 className="text-xl font-bold text-accent-yellow mb-2 flex items-center"><BrainCircuitIcon className="w-6 h-6 mr-3" /> Process Dojo</h2>
                            <p className="text-xs text-gray-400 mb-6">Phản ánh để cải thiện quy trình của bạn.</p>
                            <ul className="space-y-1">
                                {steps.map((s, index) => {
                                    const isCompleted = index < step;
                                    const isCurrent = index === step;
                                    return (
                                        <li key={s.id} className={`flex items-center p-2 rounded-md transition-colors ${isCurrent ? 'bg-accent-blue/20' : ''}`}>
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0
                                                ${isCompleted ? 'bg-accent-green text-white' : ''}
                                                ${isCurrent ? 'bg-accent-blue text-white' : ''}
                                                ${!isCompleted && !isCurrent ? 'bg-gray-700 text-gray-400' : ''}
                                            `}>
                                                {isCompleted ? <CheckCircleIcon className="w-5 h-5" /> : s.id}
                                            </div>
                                            <span className={`text-sm font-semibold ${isCurrent ? 'text-accent-blue' : isCompleted ? 'text-gray-300' : 'text-gray-500'}`}>{s.title}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {/* Right Side: Content & Navigation */}
                        <div className="w-2/3 flex flex-col">
                            <div className="p-8 min-h-[350px] relative flex items-center justify-center flex-grow">
                                <AnimatePresence initial={false} custom={direction}>
                                    <motion.div key={step} custom={direction} variants={sliderVariants} initial="enter" animate="center" exit="exit" transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }} className="w-full absolute">
                                        {renderStepContent()}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                            <div className="p-4 bg-gray-900/50 flex justify-between items-center rounded-br-lg">
                                <button type="button" onClick={handlePrev} disabled={step === 0} className="px-4 py-2 rounded-md text-gray-200 bg-gray-600 hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"><ArrowLeftIcon className="w-4 h-4 mr-2" /> Back</button>
                                {step < steps.length - 1 ? (
                                    <button type="button" onClick={handleNext} className="px-4 py-2 rounded-md text-white font-semibold bg-accent-blue hover:bg-blue-600 transition-colors flex items-center">Next <ArrowRightIcon className="w-4 h-4 ml-2" /></button>
                                ) : (
                                    <button type="submit" className="px-4 py-2 rounded-md text-white font-semibold bg-accent-green hover:bg-green-600 transition-colors">Save & Analyze</button>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
