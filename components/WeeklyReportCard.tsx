
import React from 'react';
import type { WeeklyReport } from '../types';
import { FileTextIcon, TrendingUpIcon, AlertTriangleIcon, LightbulbIcon, CheckCircleIcon, TargetIcon, ActivityIcon } from './icons';

interface WeeklyReportCardProps {
    report: WeeklyReport;
}

const getGradeColor = (grade: string) => {
    if (['A', 'B+'].includes(grade)) return 'bg-green-900/50 text-accent-green';
    if (['B', 'C+'].includes(grade)) return 'bg-yellow-900/50 text-accent-yellow';
    return 'bg-red-900/50 text-accent-red';
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-gray-900/50 p-3 rounded-lg">
        <h4 className="flex items-center text-sm font-semibold text-gray-200 mb-2">
            {icon}
            {title}
        </h4>
        <div className="text-xs text-gray-400 space-y-2">{children}</div>
    </div>
);

export const WeeklyReportCard: React.FC<WeeklyReportCardProps> = ({ report }) => {
    const { executive_summary, behavioral_performance, financial_performance, key_learning, recommendations_for_next_week, encouragement } = report;

    return (
        <div className="w-full mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="flex items-center text-lg font-bold text-gray-200">
                        <FileTextIcon className="w-5 h-5 mr-2 text-accent-blue" />
                        Weekly Performance Report
                    </h3>
                    <p className="text-xs text-gray-500">{report.report_period}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-400">Overall Grade</p>
                     <span className={`px-3 py-1 text-lg font-bold rounded-md ${getGradeColor(executive_summary.overall_grade)}`}>
                        {executive_summary.overall_grade}
                    </span>
                </div>
            </div>
            
            <div className="bg-gray-700 p-3 rounded-lg mb-4">
                <p className="font-semibold text-center text-gray-300">"{executive_summary.headline}"</p>
                <p className="text-xs text-center text-gray-400 mt-1">{executive_summary.main_takeaway}</p>
            </div>

            <div className="space-y-3">
                <Section title="Behavioral Performance" icon={<ActivityIcon className="w-4 h-4 mr-2 text-accent-yellow" />}>
                   <p><strong className="text-accent-green">Highlight:</strong> {behavioral_performance.highlight}</p>
                   <p><strong className="text-accent-red">Lowlight:</strong> {behavioral_performance.lowlight}</p>
                   <p className="italic">{behavioral_performance.detailed_analysis}</p>
                </Section>
                 <Section title="Financial Performance" icon={<TrendingUpIcon className="w-4 h-4 mr-2 text-accent-blue" />}>
                   <p>{financial_performance.pnl_context}</p>
                   <p className="pt-2 border-t border-gray-600/50"><strong className="text-gray-300">Hiệu suất:</strong> {financial_performance.efficiency_metrics}</p>
                </Section>
                 <Section title="Key Learning This Week" icon={<LightbulbIcon className="w-4 h-4 mr-2 text-accent-yellow" />}>
                   <p className="font-semibold text-gray-300">{key_learning.main_lesson}</p>
                   <p><strong>How to apply:</strong> {key_learning.how_to_apply}</p>
                </Section>
                 <Section title="Recommendations for Next Week" icon={<TargetIcon className="w-4 h-4 mr-2 text-accent-green" />}>
                   {recommendations_for_next_week.map(rec => (
                       <div key={rec.recommendation} className="pt-2 first:pt-0">
                           <p><strong className="text-gray-300">[{rec.priority}] {rec.recommendation}</strong></p>
                           <p className="italic">{rec.rationale}</p>
                       </div>
                   ))}
                </Section>
                 <Section title="Encouragement" icon={<CheckCircleIcon className="w-4 h-4 mr-2 text-accent-green" />}>
                   <p>{encouragement.progress_made}</p>
                   <p className="italic pt-2 border-t border-gray-600/50">{encouragement.perspective}</p>
                </Section>
            </div>
        </div>
    );
};
