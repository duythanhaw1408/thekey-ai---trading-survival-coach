
import React from 'react';
import type { TradeAnalysis, PostTradeAnalysisLesson } from '../types';
import { LightbulbIcon, ClipboardCheckIcon, CheckCircleIcon, AlertTriangleIcon, TrendingUpIcon, TrendingDownIcon, ShieldCheckIcon } from './icons';

interface PostTradeAnalysisCardProps {
    analysis: TradeAnalysis;
}

const getClassificationInfo = (classification: TradeAnalysis['trade_classification']) => {
    switch (classification) {
        case 'GOOD_PROCESS': return { color: 'text-accent-green', icon: <CheckCircleIcon className="w-5 h-5 mr-2" />, label: 'Good Process' };
        case 'BAD_PROCESS': return { color: 'text-accent-red', icon: <AlertTriangleIcon className="w-5 h-5 mr-2" />, label: 'Bad Process' };
        case 'LUCKY': return { color: 'text-accent-yellow', icon: <TrendingUpIcon className="w-5 h-5 mr-2" />, label: 'Lucky' };
        case 'UNLUCKY': return { color: 'text-accent-blue', icon: <TrendingDownIcon className="w-5 h-5 mr-2" />, label: 'Unlucky' };
        default: return { color: 'text-gray-400', icon: <LightbulbIcon className="w-5 h-5 mr-2" />, label: 'Analyzed' };
    }
}

const Lesson: React.FC<{ lesson: PostTradeAnalysisLesson }> = ({ lesson }) => (
    <div className="bg-white/5 border border-white/5 p-4 rounded-xl hover:border-white/20 transition-all">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary uppercase tracking-widest">{lesson.category}</span>
            <p className="font-bold text-white text-sm">{lesson.lesson}</p>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed mb-3">{lesson.why_it_matters}</p>
        <div className="pt-3 border-t border-white/5">
            <p className="text-xs text-accent-green mb-1 flex items-center gap-2"><CheckCircleIcon className="w-3 h-3" /> <strong className="uppercase tracking-tighter text-[10px]">Next Action:</strong> {lesson.next_time_action}</p>
            {lesson.guardrail_suggestion && (
                <p className="text-xs text-accent-yellow flex items-center gap-2"><ShieldCheckIcon className="w-3 h-3" /> <strong className="uppercase tracking-tighter text-[10px]">Guardrail:</strong> {lesson.guardrail_suggestion}</p>
            )}
        </div>
    </div>
)

export const PostTradeAnalysisCard: React.FC<PostTradeAnalysisCardProps> = ({ analysis }) => {
    const classificationInfo = getClassificationInfo(analysis.trade_classification);

    return (
        <div className="w-full mt-4 p-6 glass-panel border-emerald-500/10 bg-white/[0.02] shadow-[0_0_40px_rgba(16,185,129,0.03)]">
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <h3 className={`flex items-center text-lg font-black uppercase tracking-wider ${classificationInfo.color}`}>
                    {classificationInfo.icon}
                    {classificationInfo.label}
                </h3>
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Kaito Analysis</span>
                </div>
            </div>

            <div className="mb-8 p-4 bg-emerald-500/5 border-l-4 border-emerald-500 rounded-r-xl">
                <p className="text-white text-sm font-medium leading-relaxed italic">
                    "{analysis.classification_reason}"
                </p>
            </div>

            <div className="space-y-6">
                {/* Behavioral Pattern Card */}
                {analysis.behavioral_pattern?.identified && (
                    <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl">
                        <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Behavioral Pattern Detected</h4>
                        <p className="text-sm font-bold text-white mb-1">{analysis.behavioral_pattern.pattern_name}</p>
                        <p className="text-xs text-slate-400 mb-2">{analysis.behavioral_pattern.description}</p>
                        <p className="text-[10px] text-amber-500/60 font-bold uppercase tracking-tighter">Frequency: {analysis.behavioral_pattern.frequency}</p>
                    </div>
                )}

                {/* Growth Observation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Growth & Progress</h4>
                        <p className="text-xs text-white/80 mb-2"><span className="text-emerald-500 mr-1">↑</span> {analysis.growth_observation?.improvement}</p>
                        <p className="text-xs text-white/80"><span className="text-amber-500 mr-1 text-[10px]">FIX</span> {analysis.growth_observation?.area_to_work}</p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Wisdom Nugget</p>
                        <p className="text-sm text-white font-black italic tracking-tight">"{analysis.wisdom_nugget}"</p>
                    </div>
                </div>

                {/* Lessons */}
                <div>
                    <h4 className="flex items-center text-xs font-black text-white/40 uppercase tracking-widest mb-3">
                        <LightbulbIcon className="w-3 h-3 mr-2 text-yellow-500" />
                        Trích xuất bài học
                    </h4>
                    <div className="space-y-3">
                        {(analysis?.lessons || []).map(l => <Lesson key={l.lesson_id} lesson={l} />)}
                    </div>
                </div>

                {/* Coaching Reflection */}
                <div className="bg-accent-primary/5 border border-accent-primary/20 p-5 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-accent-primary uppercase tracking-widest mb-2">Coaching Question</p>
                    <p className="text-lg font-bold text-white tracking-tight italic">"{analysis.coaching_question}"</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Suggestion</h4>
                        <p className="text-xs text-text-main leading-relaxed">"{analysis.growth_observation?.suggestion}"</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-accent-primary/80">
                        <h4 className="text-[10px] font-black text-accent-primary/40 uppercase tracking-widest mb-2">Journal Suggestion</h4>
                        <p className="text-xs text-text-main italic leading-relaxed">"{analysis.journal_entry_suggestion}"</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
