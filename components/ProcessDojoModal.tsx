
import React, { useState, useRef, useEffect } from 'react';
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
    return (
        <div className="group/slider">
            <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{label}</label>
                <span className="text-xl font-black text-accent-neon font-mono drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]">{value}</span>
            </div>
            <div className="relative h-10 flex items-center">
                <div className="absolute inset-0 bg-accent-neon/5 rounded-full border border-accent-neon/10" />
                <input
                    type="range" min="1" max="10" value={value}
                    onChange={(e) => onChange(parseInt(e.target.value, 10))}
                    className="w-full h-1 bg-accent-neon/20 rounded-lg appearance-none cursor-pointer accent-accent-neon z-10"
                />
            </div>
            <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-widest mt-2">
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
            </div>
        </div>
    );
};

const EmotionSelector: React.FC<{ value: UserProcessEvaluation['dominantEmotion'], onChange: (value: UserProcessEvaluation['dominantEmotion']) => void }> = ({ value, onChange }) => {
    const emotions: UserProcessEvaluation['dominantEmotion'][] = ['PATIENCE', 'CONFIDENCE', 'NEUTRAL', 'FEAR', 'GREED', 'FOMO'];
    const emotionConfig = {
        PATIENCE: { emoji: '🧘', color: 'border-blue-500/30 bg-blue-500/5 text-blue-400' },
        CONFIDENCE: { emoji: '😎', color: 'border-accent-neon/30 bg-accent-neon/5 text-accent-neon' },
        NEUTRAL: { emoji: '😐', color: 'border-white/10 bg-white/5 text-white/40' },
        FEAR: { emoji: '😨', color: 'border-purple-500/30 bg-purple-500/5 text-purple-400' },
        GREED: { emoji: '🤑', color: 'border-accent-yellow/30 bg-accent-yellow/5 text-accent-yellow' },
        FOMO: { emoji: '🏃‍♂️', color: 'border-accent-red/30 bg-accent-red/5 text-accent-red' },
    };

    return (
        <div>
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">NEURAL_EMOTION_SELECT</label>
            <div className="grid grid-cols-3 gap-3">
                {emotions.map(emotion => (
                    <button
                        type="button"
                        key={emotion}
                        onClick={() => onChange(emotion)}
                        className={`p-4 rounded-xl border transition-all relative overflow-hidden group ${value === emotion ? `${emotionConfig[emotion].color} border-current shadow-[0_0_15px_rgba(0,0,0,0.2)]` : 'border-white/5 bg-black/40 text-white/20 hover:border-white/20'}`}
                    >
                        <span className={`text-2xl block mb-2 transition-transform ${value === emotion ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'grayscale group-hover:grayscale-0'}`}>{emotionConfig[emotion].emoji}</span>
                        <span className="block text-[8px] font-black uppercase tracking-widest">{emotion}</span>
                        {value === emotion && (
                            <motion.div layoutId="emotion-active" className="absolute inset-0 bg-white/5 pointer-events-none" />
                        )}
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
    const [showRestorePrompt, setShowRestorePrompt] = useState(false);
    const draftKey = `dojo_draft_${trade.id}`;

    const [evaluation, setEvaluation] = useState<UserProcessEvaluation>({
        setupClarity: 5,
        hadPredefinedEntry: false,
        hadPredefinedSL: false,
        hadPredefinedTP: false,
        followedPositionSizing: 5,
        planAdherence: 5,
        impulsiveActions: 10,
        emotionalInfluence: 1,
        dominantEmotion: 'NEUTRAL',
        reflection: '',
    });

    useEffect(() => {
        try {
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                const { timestamp } = JSON.parse(savedDraft);
                if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                    setShowRestorePrompt(true);
                }
            }
        } catch (e) {
            console.error('[ProcessDojo] Failed to check draft:', e);
        }
    }, [draftKey]);

    useEffect(() => {
        if (step > 0) {
            try {
                localStorage.setItem(draftKey, JSON.stringify({
                    evaluation,
                    step,
                    timestamp: Date.now()
                }));
            } catch (e) {
                console.error('[ProcessDojo] Failed to save draft:', e);
            }
        }
    }, [evaluation, step, draftKey]);

    const handleRestoreDraft = () => {
        try {
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                const { evaluation: savedEval, step: savedStep } = JSON.parse(savedDraft);
                setEvaluation(savedEval);
                setStep(savedStep);
            }
        } catch (e) {
            console.error('[ProcessDojo] Failed to restore draft:', e);
        }
        setShowRestorePrompt(false);
    };

    const handleDiscardDraft = () => {
        localStorage.removeItem(draftKey);
        setShowRestorePrompt(false);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.removeItem(draftKey);
        const interactionData: DojoInteractionData = {
            startTime: startTimeRef.current,
            endTime: Date.now(),
        };
        onSave(evaluation, interactionData);
    };

    const handleNext = () => (step < steps.length - 1) && (setDirection(1), setStep(s => s + 1));
    const handlePrev = () => (step > 0) && (setDirection(-1), setStep(s => s - 1));

    const handleChange = (field: keyof UserProcessEvaluation, value: any) => setEvaluation(prev => ({ ...prev, [field]: value }));

    const renderStepContent = () => {
        switch (step) {
            case 0: return (
                <div className="text-center py-10">
                    <div className="w-24 h-24 bg-accent-neon/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-accent-neon/20 shadow-[0_0_30px_rgba(0,255,157,0.1)] relative">
                        <BrainCircuitIcon className="w-12 h-12 text-accent-neon" />
                        <div className="absolute inset-0 border-2 border-accent-neon/30 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4">NEURAL_DEBRIEF_START</p>
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">
                        {trade.asset} <span className="text-accent-neon">_ANALYSIS</span>
                    </h3>
                    <p className="text-[10px] font-black text-accent-neon opacity-40 uppercase tracking-[0.3em] mb-10">{new Date(trade.timestamp).toLocaleString()}</p>
                    <div className="max-w-[300px] mx-auto p-6 bg-white/5 border border-white/5 rounded-2xl">
                        <p className="text-[11px] text-white/60 font-medium leading-relaxed">
                            Initialize the 7-step self-correction protocol to extract data from recent market engagement.
                        </p>
                    </div>
                </div>
            );
            case 1: return <EvaluationSlider label="SETUP_清晰度_CHECK" value={evaluation.setupClarity} onChange={(v) => handleChange('setupClarity', v)} minLabel="IMPULSIVE" maxLabel="PROTOCOL_ALIGNED" />;
            case 2: return (
                <div className="space-y-4 py-4">
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6">PRE_EXECUTION_PLAN_VERIFICATION</label>
                    {['hadPredefinedEntry', 'hadPredefinedSL', 'hadPredefinedTP'].map(key => (
                        <label key={key} className="flex items-center p-5 bg-black/40 border border-white/5 rounded-2xl cursor-pointer hover:border-accent-neon/30 transition-all group relative overflow-hidden">
                            <input type="checkbox" checked={evaluation[key as keyof UserProcessEvaluation] as boolean} onChange={(e) => handleChange(key as keyof UserProcessEvaluation, e.target.checked)} className="hidden" />
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${evaluation[key as keyof UserProcessEvaluation] ? 'bg-accent-neon border-accent-neon shadow-[0_0_10px_rgba(0,255,157,0.5)]' : 'border-white/10 bg-black'}`}>
                                {evaluation[key as keyof UserProcessEvaluation] && <CheckCircleIcon className="w-4 h-4 text-black" />}
                            </div>
                            <span className="ml-5 text-[11px] font-black text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">
                                {key === 'hadPredefinedEntry' && 'ENTRY_STRIKE_POINT'}
                                {key === 'hadPredefinedSL' && 'PROTECTION_STOP_LOSS'}
                                {key === 'hadPredefinedTP' && 'OBJECTIVE_TAKE_PROFIT'}
                            </span>
                            {evaluation[key as keyof UserProcessEvaluation] && (
                                <div className="absolute inset-0 bg-accent-neon/5 pointer-events-none" />
                            )}
                        </label>
                    ))}
                </div>
            );
            case 3: return <EvaluationSlider label="RISK_CONTAINMENT_DISCIPLINE" value={evaluation.followedPositionSizing} onChange={(v) => handleChange('followedPositionSizing', v)} minLabel="CRITICAL_FAILURE" maxLabel="OPTIMAL_EXECUTION" />;
            case 4: return (
                <div className="space-y-10 py-6">
                    <EvaluationSlider label="STRATEGIC_PLAN_ADHERENCE" value={evaluation.planAdherence} onChange={(v) => handleChange('planAdherence', v)} minLabel="TOTAL_DEVIATION" maxLabel="100%_COMPLIANCE" />
                    <EvaluationSlider label="DISCIPLINE_CORE_STABILITY" value={evaluation.impulsiveActions} onChange={(v) => handleChange('impulsiveActions', v)} minLabel="HIGHLY_IMPULSIVE" maxLabel="FULLY_CONTROLLED" />
                </div>
            );
            case 5: return (
                <div className="space-y-10 py-4">
                    <EmotionSelector value={evaluation.dominantEmotion} onChange={v => handleChange('dominantEmotion', v)} />
                    <EvaluationSlider label="EMOTIONAL_INTERFERENCE_LEVEL" value={evaluation.emotionalInfluence} onChange={(v) => handleChange('emotionalInfluence', v)} minLabel="ZERO" maxLabel="TOTAL_CONTROL" />
                </div>
            );
            case 6: return (
                <div className="py-2">
                    <label htmlFor="reflection" className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">NEURAL_DEBRIEF_REFLECTION</label>
                    <div className="relative">
                        <textarea
                            id="reflection"
                            rows={6}
                            value={evaluation.reflection}
                            onChange={(e) => handleChange('reflection', e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.stopPropagation(); }}
                            placeholder="Nhập bài học rút ra từ giao dịch này... Tập trung vào hành vi và kỷ luật, không phải kết quả PnL."
                            className="w-full bg-gray-900/80 border-2 border-accent-neon/40 rounded-2xl p-6 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent-neon focus:ring-2 focus:ring-accent-neon/30 transition-all font-medium leading-relaxed resize-none"
                            style={{ minHeight: '180px' }}
                            autoFocus
                        />
                        <div className="absolute bottom-4 right-6 text-[8px] font-black text-accent-neon/50 uppercase tracking-widest">
                            {evaluation.reflection.length}/10 ký tự
                        </div>
                    </div>
                </div>
            );
            default: return null;
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-black/90 border border-accent-neon/20 rounded-[40px] shadow-2xl max-w-4xl w-full overflow-hidden relative"
            >
                {/* Decorative scanning line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-accent-neon/50 animate-pulse shadow-[0_0_10px_rgba(0,255,157,1)] z-10" />

                <form onSubmit={handleSave} onKeyDown={(e) => { if (e.key === 'Enter' && e.target instanceof HTMLTextAreaElement === false) e.preventDefault(); }}>
                    <div className="flex flex-col md:flex-row">
                        {/* Left Side: Step Navigator - Cyberpunk Console Style */}
                        <div className="md:w-[320px] p-10 bg-black/40 border-r border-accent-neon/10 flex flex-col relative overflow-hidden">
                            <div className="absolute inset-0 cyber-grid opacity-10" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="p-2 bg-accent-neon/10 rounded-xl border border-accent-neon/30">
                                        <BrainCircuitIcon className="w-5 h-5 text-accent-neon" />
                                    </div>
                                    <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">PROCESS_DOJO</h2>
                                </div>
                                <p className="text-[9px] font-black text-accent-neon/40 mb-12 uppercase tracking-[0.2em]">NEURAL_CORRECTION_MODULE_v4.2</p>

                                <ul className="space-y-4">
                                    {steps.map((s, index) => {
                                        const isCompleted = index < step;
                                        const isCurrent = index === step;
                                        return (
                                            <li key={s.id} className="relative group">
                                                <div className={`flex items-center gap-5 transition-all duration-500 ${isCurrent ? 'translate-x-2' : ''}`}>
                                                    <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-mono text-xs font-black transition-all duration-500 relative
                                                        ${isCompleted ? 'bg-accent-neon border-accent-neon text-black shadow-[0_0_15px_rgba(0,255,157,0.5)]' : ''}
                                                        ${isCurrent ? 'bg-black border-accent-neon text-accent-neon shadow-[0_0_10px_rgba(0,255,157,0.3)]' : ''}
                                                        ${!isCompleted && !isCurrent ? 'bg-black border-white/5 text-white/10' : ''}
                                                    `}>
                                                        {isCompleted ? <CheckCircleIcon className="w-4 h-4" /> : s.id}
                                                        {isCurrent && <div className="absolute -inset-1 border border-accent-neon rounded-lg animate-pulse" />}
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${isCurrent ? 'text-accent-neon' : isCompleted ? 'text-white/60' : 'text-white/10'}`}>{s.title}</span>
                                                </div>
                                                {index < steps.length - 1 && (
                                                    <div className={`absolute left-4 top-8 w-px h-4 transition-colors duration-500 ${isCompleted ? 'bg-accent-neon' : 'bg-white/5'}`} />
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                            <div className="mt-auto relative z-10 pt-8 border-t border-accent-neon/10">
                                <div className="flex items-center gap-3 text-accent-red opacity-30">
                                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.5em]">RECORDING_NEURAL_PULSE</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Content & Navigation */}
                        <div className="flex-1 flex flex-col bg-black/60 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                                <BrainCircuitIcon className="w-64 h-64 text-accent-neon" />
                            </div>

                            <div className="p-12 min-h-[500px] relative flex flex-col justify-center">
                                <AnimatePresence initial={false} custom={direction} mode="wait">
                                    <motion.div
                                        key={step} custom={direction} variants={sliderVariants} initial="enter" animate="center" exit="exit"
                                        transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                                        className="w-full"
                                    >
                                        {renderStepContent()}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            <div className="p-10 bg-black/40 border-t border-accent-neon/10 flex justify-between items-center">
                                <button type="button" onClick={handlePrev} disabled={step === 0} className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all disabled:opacity-0 active:scale-95 flex items-center">
                                    <ArrowLeftIcon className="w-4 h-4 mr-3" /> CANCEL_PREV
                                </button>

                                {showRestorePrompt && step === 0 && (
                                    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-black border border-accent-yellow/30 p-6 rounded-3xl shadow-2xl backdrop-blur-xl z-20 flex flex-col items-center gap-4 min-w-[320px]">
                                        <p className="text-[10px] font-black text-accent-yellow uppercase tracking-widest">{">>"} PERSISTENT_DRAFT_DETECTED</p>
                                        <div className="flex gap-4">
                                            <button type="button" onClick={handleRestoreDraft} className="px-5 py-2.5 bg-accent-yellow text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all">RESTORE_CORE</button>
                                            <button type="button" onClick={handleDiscardDraft} className="px-5 py-2.5 bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent-red/20 hover:text-accent-red transition-all">DISCARD</button>
                                        </div>
                                    </div>
                                )}

                                {step < steps.length - 1 ? (
                                    <button
                                        type="button" onClick={handleNext}
                                        className="px-10 py-5 bg-accent-neon/10 border border-accent-neon/30 text-accent-neon text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-accent-neon hover:text-black transition-all active:scale-95 shadow-[0_0_20px_rgba(0,255,157,0.1)] flex items-center gap-3"
                                    >
                                        ADVANCE_CORE <ArrowRightIcon className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <div className="flex flex-col items-end gap-2">
                                        {evaluation.reflection.trim().length < 10 && (
                                            <p className="text-[9px] font-black text-accent-yellow uppercase tracking-widest animate-pulse">
                                                ⚠ Vui lòng nhập ít nhất 10 ký tự để hoàn thành
                                            </p>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={evaluation.reflection.trim().length < 10}
                                            className={`px-12 py-5 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all active:scale-95 ${evaluation.reflection.trim().length < 10
                                                ? 'bg-white/10 text-white/30 cursor-not-allowed'
                                                : 'bg-accent-neon text-black hover:scale-105 shadow-[0_0_30px_rgba(0,255,157,0.4)]'
                                                }`}
                                        >
                                            GENERATE_NEURAL_SCORE
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
