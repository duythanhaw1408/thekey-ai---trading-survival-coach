
import React from 'react';
import type { ProcessEvaluation } from '../types';
import { motion } from 'framer-motion';

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score > 75 ? '#00C853' : score > 50 ? '#FFD700' : '#D50000';

    return (
        <div className="relative flex items-center justify-center w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle className="text-gray-600" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
                <motion.circle
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    stroke={color}
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                    transform="rotate(-90 60 60)"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold" style={{ color }}>{score}</span>
                <span className="text-xs text-gray-400">Process Score</span>
            </div>
        </div>
    );
};

const ScoreBar: React.FC<{ label: string; score: number }> = ({ label, score }) => {
    const color = score > 7 ? '#00C853' : score > 4 ? '#FFD700' : '#D50000';
    return (
        <div>
            <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-400">{label}</span>
                <span className="font-semibold" style={{ color }}>{score}/10</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-1.5">
                <div className="h-1.5 rounded-full" style={{ width: `${score * 10}%`, backgroundColor: color }}></div>
            </div>
        </div>
    );
};

export const ProcessScoreDisplay: React.FC<{ evaluation: ProcessEvaluation }> = ({ evaluation }) => {
    return (
        <div className="w-full mt-4 p-4 bg-gray-900/50 rounded-lg">
            <h3 className="text-md font-semibold text-gray-200 mb-4 text-center">Process Evaluation</h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                    <ScoreRing score={evaluation.totalProcessScore} />
                </div>
                <div className="w-full space-y-3">
                    <ScoreBar label="Setup Quality" score={evaluation.scores.setup} />
                    <ScoreBar label="Risk Management" score={evaluation.scores.risk} />
                    <ScoreBar label="Emotional State" score={evaluation.scores.emotion} />
                    <ScoreBar label="Execution Discipline" score={evaluation.scores.execution} />
                </div>
            </div>
            <div className="mt-4 text-center bg-gray-800 p-2 rounded-md">
                <p className="text-xs text-gray-400">
                    <span className="font-semibold text-gray-300">Summary:</span> {evaluation.summary}
                </p>
            </div>
        </div>
    );
};
