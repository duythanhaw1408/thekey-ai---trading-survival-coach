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
      <div className="space-y-3">
        {options.map((option: string) => (
          <label
            key={option}
            className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer border transition-all duration-300 group
              ${answers[question.id] === option
                ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10'}`}
          >
            <div className={`relative w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all 
              ${answers[question.id] === option ? 'border-emerald-500 bg-emerald-500' : 'border-white/10'}`}>
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={answers[question.id] === option}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="opacity-0 absolute inset-0 cursor-pointer"
              />
              {answers[question.id] === option && <div className="w-2 h-2 bg-black rounded-full" />}
            </div>
            <span className={`text-sm font-medium transition-colors ${answers[question.id] === option ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>
              {option}
            </span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-6 overflow-hidden">
      <AnimatePresence mode="wait">
        {!insight ? (
          <motion.div
            key="questions"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="glass-panel max-w-md w-full flex flex-col max-h-[85vh] overflow-hidden border-white/10 shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0">
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-1">Ritual Sáng Nay</h2>
                    <h3 className="text-xl font-bold text-white tracking-tight">Mind Scan</h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-1 rounded bg-emerald-400/10 border border-emerald-400/20">KAITO ACTIVE</span>
                  </div>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-emerald-500 h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(Object.keys(answers).filter(k => answers[k]).length / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex-grow overflow-y-auto px-6 py-4 min-h-0 custom-scrollbar">
                <div className="space-y-8">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-emerald-500/40">0{idx + 1}</span>
                        <label className="block text-sm font-bold text-white/90">{q.text}</label>
                      </div>
                      {renderQuestionInput(q)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-black/40">
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitted}
                  className="w-full bg-emerald-500 text-black font-black uppercase text-xs tracking-[0.2em] py-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
                >
                  {isSubmitted ? 'Đang phân tích...' : 'Hoàn Thành Mind Scan'}
                  {!isSubmitted && <SparklesIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="insight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel max-w-lg w-full p-8 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
                <BrainCircuitIcon className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Lời Khuyên Từ Kaito</h2>
              <p className="text-emerald-400 text-sm italic">"{insight.encouragement}"</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 flex items-center">
                  <ShieldCheckIcon className="w-3 h-3 mr-2 text-emerald-500" />
                  Đơn Thuốc Hành Vi (Daily Prescription)
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Mindset:</span>
                    <span className="text-white font-bold">{insight.daily_prescription?.mindset_shift}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Quy tắc:</span>
                    <span className="text-white font-bold">{insight.daily_prescription?.behavioral_rule}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Mục tiêu:</span>
                    <span className="text-white font-bold">{insight.daily_prescription?.success_metric}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                  <p className="text-[10px] text-emerald-400 uppercase font-black mb-1">Trạng Thái</p>
                  <p className="text-lg font-bold text-white">{insight.emotional_state}</p>
                </div>
                <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                  <p className="text-[10px] text-amber-400 uppercase font-black mb-1">Tiến Độ</p>
                  <p className="text-sm font-bold text-white">{insight.progress_marker?.visual_metaphor}</p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-8 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all border border-white/10"
            >
              Bắt Đầu Phiên Giao Dịch
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};