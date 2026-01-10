
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
        <div className="w-full mt-4 p-5 glass-panel border-white/5 bg-white/[0.03]">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                <h3 className={`flex items-center text-lg font-black uppercase tracking-wider ${classificationInfo.color}`}>
                    {classificationInfo.icon}
                    {classificationInfo.label}
                </h3>
            </div>

            <div className="mb-6">
                <p className="text-text-main text-sm font-medium leading-relaxed italic border-l-2 border-accent-primary/30 pl-4 py-1">
                    "{analysis.classification_reason}"
                </p>
            </div>

            <div className="space-y-4 mt-4">
                <div>
                    <h4 className="flex items-center text-sm font-semibold text-gray-200 mb-2">
                        <LightbulbIcon className="w-4 h-4 mr-2 text-accent-yellow" />
                        Bài học rút ra
                    </h4>
                    <div className="space-y-2">
                        {(analysis?.lessons || []).map(l => <Lesson key={l.lesson_id} lesson={l} />)}
                    </div>
                </div>

                {analysis.positive_takeaways && analysis.positive_takeaways.length > 0 && (
                    <div className="bg-accent-green/5 border border-accent-green/10 p-4 rounded-xl">
                        <h4 className="flex items-center text-xs font-black text-accent-green uppercase tracking-widest mb-3">
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            Positive Traits Observed
                        </h4>
                        <ul className="space-y-2 pl-1">
                            {(analysis?.positive_takeaways || []).map((item, index) => (
                                <li key={index} className="flex items-start gap-2 text-xs text-text-secondary leading-tight">
                                    <span className="text-accent-green mt-1">✦</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <TrendingDownIcon className="w-3 h-3" /> Redo Strategy
                        </h4>
                        <p className="text-xs text-text-main italic leading-relaxed">"{analysis.if_you_could_redo}"</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-accent-primary/80">
                        <h4 className="text-[10px] font-black text-accent-primary/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <ClipboardCheckIcon className="w-3 h-3" /> Journal Prompt
                        </h4>
                        <p className="text-xs text-text-main italic leading-relaxed">"{analysis.journal_entry_suggestion}"</p>
                    </div>
                </div>

            </div>
        </div>
    );
};
