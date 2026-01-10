
import React from 'react';
import type { WeeklyGoals, WeeklyGoal } from '../types';
import { TargetIcon, CalendarIcon, ClipboardCheckIcon, LightbulbIcon } from './icons';

const GoalDetail: React.FC<{ goal: WeeklyGoal }> = ({ goal }) => (
    <div className="bg-gray-700 p-4 rounded-lg">
        <h4 className="flex items-center text-md font-bold text-accent-yellow mb-2">
            <TargetIcon className="w-5 h-5 mr-2" />
            {goal.title}
        </h4>
        <p className="text-xs text-gray-300 mb-3">{goal.description}</p>
        <div className="text-xs space-y-2">
            <p><strong className="text-gray-400">Metric:</strong> {goal.metric}</p>
            <p><strong className="text-gray-400">Target:</strong> {goal.target}</p>
            <p><strong className="text-gray-400">Daily Checkpoint:</strong> "{goal.daily_checkpoint}"</p>
            <p className="italic text-gray-500 pt-2 border-t border-gray-600/50 mt-2">
                <strong>Connection to last week:</strong> {goal.connection_to_last_week}
            </p>
        </div>
    </div>
);


export const WeeklyGoalsCard: React.FC<{ goals: WeeklyGoals }> = ({ goals }) => {
    
    const getLevelChipColor = (level: string) => {
        switch(level) {
            case 'SURVIVAL': return 'bg-red-900/50 text-accent-red';
            case 'STABILIZING': return 'bg-yellow-900/50 text-accent-yellow';
            case 'GROWING': return 'bg-green-900/50 text-accent-green';
            default: return 'bg-gray-600 text-gray-200';
        }
    }

    return (
        <div className="w-full mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center text-lg font-bold text-gray-200">
                    <CalendarIcon className="w-5 h-5 mr-2 text-accent-blue" />
                    Mục tiêu tuần {goals.week_number}
                </h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getLevelChipColor(goals.user_level)}`}>
                    {goals.user_level}
                </span>
            </div>
            
            <div className="space-y-4 mb-4">
               <div>
                    <p className="text-xs text-gray-400 mb-1 font-semibold">MỤC TIÊU CHÍNH</p>
                    <GoalDetail goal={goals.primary_goal} />
               </div>
                <div>
                    <p className="text-xs text-gray-400 mb-1 font-semibold">MỤC TIÊU PHỤ</p>
                    <GoalDetail goal={goals.secondary_goal} />
               </div>
            </div>

            <div className="bg-gray-900/50 p-3 rounded-lg">
                 <h4 className="flex items-center text-sm font-semibold text-gray-200 mb-2">
                    <LightbulbIcon className="w-4 h-4 mr-2 text-accent-yellow" />
                    Lý do
                </h4>
                <p className="text-xs text-gray-400">{goals.rationale}</p>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-lg mt-2">
                 <h4 className="flex items-center text-sm font-semibold text-gray-200 mb-2">
                    <ClipboardCheckIcon className="w-4 h-4 mr-2 text-accent-green" />
                    Định nghĩa thành công
                </h4>
                <p className="text-xs text-gray-400">{goals.success_definition}</p>
            </div>
        </div>
    );
};
