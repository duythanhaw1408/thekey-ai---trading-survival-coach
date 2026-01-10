
import React from 'react';
import type { DetectedPattern } from '../types';
import { LightbulbIcon, ClipboardCheckIcon, ActivityIcon, TargetIcon, TrendingDownIcon } from './icons';

interface PatternCardProps {
  pattern: DetectedPattern;
}

export const PatternCard: React.FC<PatternCardProps> = ({ pattern }) => {
  return (
    <div className="w-full mt-4 p-4 bg-gray-700 rounded-lg text-sm text-gray-300">
        <h3 className="text-lg font-bold text-accent-yellow mb-2">{pattern.pattern_name}</h3>
        <p className="mb-4 italic">"{pattern.summary}"</p>

        <div className="space-y-4">
            <div>
                <h4 className="flex items-center text-sm font-semibold text-gray-200 mb-2">
                    <ActivityIcon className="w-4 h-4 mr-2 text-accent-red" />
                    Bằng chứng
                </h4>
                <ul className="list-disc list-inside text-xs text-gray-400 space-y-1 pl-2">
                    {pattern.evidence.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>
             <div>
                <h4 className="flex items-center text-sm font-semibold text-gray-200 mb-2">
                    <TrendingDownIcon className="w-4 h-4 mr-2 text-accent-blue" />
                    Tác động
                </h4>
                <p className="text-xs text-gray-400 pl-2">{pattern.impact}</p>
            </div>
             <div>
                <h4 className="flex items-center text-sm font-semibold text-gray-200 mb-2">
                    <LightbulbIcon className="w-4 h-4 mr-2 text-accent-yellow" />
                    Tại sao điều này xảy ra?
                </h4>
                <p className="text-xs text-gray-400 pl-2">{pattern.psychology}</p>
            </div>
             <div>
                <h4 className="flex items-center text-sm font-semibold text-gray-200 mb-2">
                    <ClipboardCheckIcon className="w-4 h-4 mr-2 text-accent-green" />
                    Chiến lược phá vỡ
                </h4>
                <ul className="list-disc list-inside text-xs text-gray-400 space-y-1 pl-2">
                    {pattern.breaking_strategy.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>
             <div>
                <h4 className="flex items-center text-sm font-semibold text-gray-200 mb-2">
                    <TargetIcon className="w-4 h-4 mr-2 text-gray-300" />
                    Thước đo thành công
                </h4>
                <p className="text-xs text-gray-400 pl-2">{pattern.success_metric}</p>
            </div>
        </div>
    </div>
  );
};
