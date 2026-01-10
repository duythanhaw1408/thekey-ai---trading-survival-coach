
import React, { useState, useEffect } from 'react';
import type { CheckinQuestion } from '../types';

interface DailyCheckinModalProps {
  questions: CheckinQuestion[];
  onSubmit: (answers: { [key: string]: string }) => void;
}

export const DailyCheckinModal: React.FC<DailyCheckinModalProps> = ({ questions, onSubmit }) => {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Pre-fill default answers
    const defaultAnswers: { [key: string]: string } = {};
    questions.forEach(q => {
      if (q.type === 'scale' && q.scale) {
        defaultAnswers[q.id] = String(Math.floor((q.scale.min + q.scale.max) / 2));
      } else {
        defaultAnswers[q.id] = '';
      }
    });
    setAnswers(defaultAnswers);
  }, [questions]);

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answers);
  };

  const isFormValid =
    Object.keys(answers).length === questions.length &&
    questions.every(q => {
      const answer = answers[q.id];
      const type = (q.type as string);
      if (type === 'multiple-choice' || type === 'choice' || type === 'text') {
        return answer && answer.trim() !== '';
      }
      return !!answer; // For 'scale' which is always a number string
    });

  const renderQuestionInput = (question: CheckinQuestion) => {
    const options = question.multiple_choice?.options || [];
    return (
      <div className="space-y-3">
        {options.map((option: string) => (
          <label
            key={option}
            className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer border transition-all duration-300 group
              ${answers[question.id] === option
                ? 'bg-accent-primary-neon/10 border-accent-primary-neon/40 ring-1 ring-accent-primary-neon/20 shadow-[0_0_20px_rgba(0,242,255,0.05)]'
                : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10'}`}
          >
            <div className={`relative w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all 
              ${answers[question.id] === option ? 'border-accent-primary-neon bg-accent-primary-neon' : 'border-white/10'}`}>
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={answers[question.id] === option}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="opacity-0 absolute inset-0 cursor-pointer"
              />
              {answers[question.id] === option && (
                <div className="w-2 h-2 bg-black rounded-full" />
              )}
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-entrance">
      <div className="glass-panel max-w-md w-full flex flex-col max-h-[85vh] overflow-hidden shadow-[0_0_80px_rgba(0,242,255,0.08)] border-white/10">
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0">
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex-shrink-0 bg-white/[0.02]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-[10px] font-black text-accent-primary-neon uppercase tracking-[0.4em] mb-1">Entry Protocol</h2>
                <h3 className="text-lg font-bold text-white tracking-tight">Mindset Sync</h3>
              </div>
              <div className="px-2 py-1 rounded bg-accent-primary-neon/10 border border-accent-primary-neon/20">
                <span className="text-[10px] font-mono text-accent-primary-neon font-bold">CALIBRATING</span>
              </div>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <div
                className="bg-accent-primary-neon h-full transition-all duration-500 ease-out"
                style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-grow overflow-y-auto px-6 py-4 min-h-0 custom-scrollbar bg-black/20">
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="animate-entrance border-b border-white/[0.03] pb-6 last:border-0"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-mono text-white/20">0{idx + 1}</span>
                    <label className="block text-[11px] font-bold text-white/70 uppercase tracking-widest">{q.text}</label>
                  </div>
                  <div className="px-1">
                    {renderQuestionInput(q)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/5 flex-shrink-0 bg-black/60">
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full bg-accent-primary-neon text-black font-black uppercase text-[11px] tracking-[0.2em] py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden relative group"
            >
              <span className="relative z-10">Authorize Session</span>
              <div className="w-1 h-1 bg-black rounded-full group-hover:animate-ping" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
            <p className="text-[9px] text-center text-white/20 mt-3 uppercase tracking-tighter">System Version 2.0.1 // Mental State Guardian</p>
          </div>
        </form>
      </div>
    </div>
  );
};