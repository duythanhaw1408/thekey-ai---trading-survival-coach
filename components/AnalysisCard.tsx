
import React from 'react';
import type { CheckinAnalysisResult } from '../types';
import { LightbulbIcon, ClipboardCheckIcon } from './icons';

interface AnalysisCardProps {
  analysis: CheckinAnalysisResult;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis }) => {
  return (
    <div className="max-w-xs md:max-w-md lg:max-w-xs xl:max-w-md px-4 py-3 rounded-lg bg-gray-700 text-gray-200 rounded-bl-none">
      <p className="text-sm font-semibold mb-3">{analysis.encouragement}</p>
      
      <div className="border-t border-gray-600 pt-3">
        <div className="flex items-start">
          <LightbulbIcon className="w-5 h-5 text-accent-yellow mr-3 mt-1 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-accent-yellow">Key Insight</h4>
            <p className="text-sm text-gray-300">{analysis.insights}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-600 pt-3 mt-3">
        <div className="flex items-start">
          <ClipboardCheckIcon className="w-5 h-5 text-accent-green mr-3 mt-1 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-accent-green">Action Items</h4>
            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 mt-1">
              {analysis.action_items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {analysis.reflection_question && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <p className="text-sm text-gray-400 italic">
            <strong>A question to consider:</strong> {analysis.reflection_question}
          </p>
        </div>
      )}
    </div>
  );
};