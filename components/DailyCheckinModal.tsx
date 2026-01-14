import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CheckinQuestion, CheckinAnalysisResult } from '../types';
import { BrainCircuitIcon, SparklesIcon, ShieldCheckIcon } from './icons';

interface DailyCheckinModalProps {
  questions: CheckinQuestion[];
  onSubmit: (answers: { [key: string]: string }) => void;
  insight?: CheckinAnalysisResult | null; // Passed back after submission
  onClose?: () => void;
}

export const DailyCheckinModal: React.FC<DailyCheckinModalProps> = ({ questions, onSubmit, insight, onClose }) => {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const defaultAnswers: { [key: string]: string } = {};
    questions.forEach(q => {
      defaultAnswers[q.id] = '';
    });
    setAnswers(defaultAnswers);
  }, [questions]);

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    onSubmit(answers);
  };

  const isFormValid =
    Object.keys(answers).length === questions.length &&
    questions.every(q => answers[q.id] && answers[q.id].trim() !== '');

  const renderQuestionInput = (question: CheckinQuestion) => {
    const options = question.multiple_choice?.options || [];
    return (
      <div className="space-y-4">
        {options.map((option: string) => (
          <label
            key={option}
            className={`flex items-center space-x-4 p-5 rounded-2xl cursor-pointer border transition-all duration-500 group relative overflow-hidden
              ${answers[question.id] === option
                ? 'bg-accent-neon/10 border-accent-neon/40 shadow-[0_0_20px_rgba(0,255,157,0.1)]'
                : 'bg-black/40 border-white/5 hover:bg-black/60 hover:border-accent-neon/20'}`}
          >
            {answers[question.id] === option && <div className="absolute inset-0 bg-accent-neon/[0.02] animate-pulse" />}
            <div className={`relative w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-500
              ${answers[question.id] === option ? 'border-accent-neon bg-accent-neon shadow-[0_0_10px_rgba(0,255,157,0.5)]' : 'border-white/10 group-hover:border-accent-neon/30'}`}>
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={answers[question.id] === option}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="opacity-0 absolute inset-0 cursor-pointer"
              />
              {answers[question.id] === option && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
            </div>
            <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${answers[question.id] === option ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>
              {option}
            </span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-6 overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-[0.05] pointer-events-none" />
      <AnimatePresence mode="wait">
        {!insight ? (
          <motion.div
            key="questions"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="bg-black border border-accent-neon/20 rounded-[2.5rem] max-w-lg w-full flex flex-col max-h-[90vh] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative"
          >
            {/* Corner HUD Markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent-neon/30 rounded-tl-[2.5rem] pointer-events-none" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent-neon/30 rounded-tr-[2.5rem] pointer-events-none" />

            <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0 relative z-10">
              <div className="p-10 border-b border-accent-neon/5 bg-black/60 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-neon/[0.03] to-transparent pointer-events-none" />
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-[10px] font-black text-accent-neon uppercase tracking-[0.5em] mb-2 drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]">NEURAL_CALIBRATION_001</h2>
                    <h3 className="text-3xl font-black text-white tracking-widest uppercase italic font-sans leading-none">MIND_SCAN</h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-accent-neon bg-accent-neon/10 border border-accent-neon/30 px-4 py-1.5 rounded-full shadow-inner animate-pulse">SYSTEM_ACTIVE</span>
                  </div>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <motion.div
                    className="bg-accent-neon h-full rounded-full shadow-[0_0_15px_rgba(0,255,157,0.6)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(Object.keys(answers).filter(k => answers[k]).length / questions.length) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="flex-grow overflow-y-auto px-10 py-8 min-h-0 custom-scrollbar space-y-10">
                {questions.map((q, idx) => (
                  <div key={q.id} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="text-[12px] font-black text-accent-neon/20 font-mono tracking-widest">0{idx + 1}_VECT</span>
                      <label className="block text-xs font-black text-white/80 uppercase tracking-widest">{q.text}</label>
                    </div>
                    {renderQuestionInput(q)}
                  </div>
                ))}
              </div>

              <div className="p-10 border-t border-accent-neon/5 bg-black/80">
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitted}
                  className="w-full bg-accent-neon text-black font-black uppercase text-xs tracking-[0.3em] py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 disabled:cursor-not-allowed group flex items-center justify-center gap-4 shadow-[0_0_30px_rgba(0,255,157,0.2)]"
                >
                  {isSubmitted ? 'INITIALIZING_NEURAL_UPLOAD...' : 'COMPLETE_CALIBRATION'}
                  {!isSubmitted && <SparklesIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="insight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black border border-accent-neon/20 rounded-[3rem] max-w-2xl w-full p-12 shadow-[0_0_100px_rgba(0,255,157,0.1)] relative overflow-hidden"
          >
            <div className="absolute inset-0 cyber-grid opacity-[0.03] pointer-events-none" />

            <div className="text-center mb-12 relative z-10">
              <div className="w-20 h-20 bg-black border border-accent-neon/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,255,157,0.1)] group hover:border-accent-neon transition-colors duration-500">
                <BrainCircuitIcon className="w-10 h-10 text-accent-neon drop-shadow-[0_0_8px_rgba(0,255,157,0.6)] animate-pulse" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] mb-4 italic font-sans italic">KAITO_AI_FEEDBACK</h2>
              <div className="p-6 bg-accent-neon/[0.03] border border-accent-neon/10 rounded-2xl">
                <p className="text-accent-neon text-xs italic font-medium tracking-wide leading-relaxed">"{insight.encouragement}"</p>
              </div>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="bg-black/60 border border-white/5 p-8 rounded-3xl group hover:border-accent-neon/20 transition-all duration-500">
                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-6 flex items-center">
                  <ShieldCheckIcon className="w-4 h-4 mr-4 text-accent-neon" />
                  DAILY_NEURAL_PRESCRIPTION
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-1 p-4 bg-black/40 border border-white/5 rounded-xl">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">MINDSET_SHIFT</span>
                    <span className="text-xs font-bold text-white uppercase tracking-tighter">{insight.daily_prescription?.mindset_shift}</span>
                  </div>
                  <div className="flex flex-col gap-1 p-4 bg-black/40 border border-white/5 rounded-xl">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">BEHAVIORAL_ANCHOR</span>
                    <span className="text-xs font-bold text-white uppercase tracking-tighter">{insight.daily_prescription?.behavioral_rule}</span>
                  </div>
                  <div className="flex flex-col gap-1 p-4 bg-accent-neon/5 border border-accent-neon/10 rounded-xl">
                    <span className="text-[8px] font-black text-accent-neon/40 uppercase tracking-widest">SUCCESS_VECTOR</span>
                    <span className="text-xs font-black text-accent-neon uppercase tracking-tighter italic">{insight.daily_prescription?.success_metric}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-accent-neon/5 p-6 rounded-3xl border border-accent-neon/10 group hover:border-accent-neon/30 transition-all duration-500">
                  <p className="text-[9px] text-accent-neon font-black uppercase tracking-[0.2em] mb-2">NEURAL_STATE</p>
                  <p className="text-xl font-black text-white uppercase tracking-tighter italic">{insight.emotional_state}</p>
                </div>
                <div className="bg-accent-yellow/5 p-6 rounded-3xl border border-accent-yellow/10 group hover:border-accent-yellow/30 transition-all duration-500">
                  <p className="text-[9px] text-accent-yellow font-black uppercase tracking-[0.2em] mb-2">PROGRESS_VECT</p>
                  <p className="text-xs font-black text-white uppercase tracking-tight italic leading-tight">{insight.progress_marker?.visual_metaphor}</p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-10 bg-black border border-accent-neon/40 hover:bg-accent-neon hover:text-black text-accent-neon font-black uppercase text-xs tracking-[0.4em] py-5 rounded-2xl transition-all duration-500 shadow-[0_0_30px_rgba(0,255,157,0.1)]"
            >
              INITIATE_SESSION_CORE
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};