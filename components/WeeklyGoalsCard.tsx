
import React from 'react';
import type { WeeklyGoals, WeeklyGoal } from '../types';
import { TargetIcon, CalendarIcon, ClipboardCheckIcon, LightbulbIcon } from './icons';

const GoalDetail: React.FC<{ goal: WeeklyGoal }> = ({ goal }) => (
    <div className="bg-black/60 border border-accent-neon/10 p-5 rounded-2xl group transition-all duration-500 hover:border-accent-neon/30">
        <h4 className="flex items-center text-sm font-black text-accent-neon mb-3 uppercase tracking-widest">
            <TargetIcon className="w-4 h-4 mr-2 drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]" />
            {goal.title}
        </h4>
        <p className="text-[11px] text-white/40 mb-5 font-medium uppercase tracking-wide leading-relaxed">{goal.description}</p>
        <div className="text-[10px] space-y-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="font-black text-white/20 uppercase tracking-widest">METRIC_TYPE</span>
                <span className="text-white font-bold">{goal.metric}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="font-black text-white/20 uppercase tracking-widest">TARGET_QUANTUM</span>
                <span className="text-accent-neon font-black italic">{goal.target}</span>
            </div>
            <div className="pt-2">
                <span className="font-black text-white/20 uppercase tracking-widest block mb-1">DAILY_CHECKPOINT</span>
                <p className="text-white font-medium italic">"{goal.daily_checkpoint}"</p>
            </div>
            <div className="pt-4 border-t border-accent-neon/10 mt-2 bg-accent-neon/[0.02] p-3 rounded-lg">
                <p className="text-[9px] text-white/20 uppercase font-black mb-1">Neural_Connection_Sync</p>
                <p className="text-[10px] text-accent-neon/60 italic leading-relaxed">
                    {goal.connection_to_last_week}
                </p>
            </div>
        </div>
    </div>
);


export const WeeklyGoalsCard: React.FC<{ goals: WeeklyGoals }> = ({ goals }) => {

    const getLevelChipColor = (level: string) => {
        switch (level) {
            case 'SURVIVAL': return 'bg-red-900/50 text-accent-red';
            case 'STABILIZING': return 'bg-yellow-900/50 text-accent-yellow';
            case 'GROWING': return 'bg-green-900/50 text-accent-green';
            default: return 'bg-gray-600 text-gray-200';
        }
    }

    return (
        <div className="w-full mt-6 p-8 bg-black/40 backdrop-blur-xl border border-accent-neon/10 rounded-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 cyber-grid opacity-[0.03] pointer-events-none" />

            <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="flex items-center text-[11px] font-black text-white/40 uppercase tracking-[0.4em]">
                    <CalendarIcon className="w-5 h-5 mr-4 text-accent-neon drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]" />
                    WEEK_DATA_LINK: {goals.week_number}
                </h3>
                <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-inner ${getLevelChipColor(goals.user_level)}`}>
                    RANK: {goals.user_level}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 relative z-10">
                <div className="space-y-3">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                        <div className="w-2 h-0.5 bg-accent-neon" />
                        PRIMARY_OBJECTIVE
                    </p>
                    <GoalDetail goal={goals.primary_goal} />
                </div>
                <div className="space-y-3">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                        <div className="w-2 h-0.5 bg-accent-neon/40" />
                        SECONDARY_ARRAY
                    </p>
                    <GoalDetail goal={goals.secondary_goal} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <div className="bg-black/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 group-hover:border-accent-neon/10 transition-colors">
                    <h4 className="flex items-center text-[10px] font-black text-accent-yellow uppercase tracking-widest mb-3">
                        <LightbulbIcon className="w-4 h-4 mr-3 drop-shadow-[0_0_5px_rgba(238,255,0,0.5)]" />
                        STRATEGIC_RATIONALE
                    </h4>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider leading-relaxed leading-loose">{goals.rationale}</p>
                </div>
                <div className="bg-black/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 group-hover:border-accent-neon/10 transition-colors">
                    <h4 className="flex items-center text-[10px] font-black text-accent-neon uppercase tracking-widest mb-3">
                        <ClipboardCheckIcon className="w-4 h-4 mr-3 drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]" />
                        SUCCESS_CRITERIA
                    </h4>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider leading-relaxed leading-loose">{goals.success_definition}</p>
                </div>
            </div>
        </div>
    );
};
