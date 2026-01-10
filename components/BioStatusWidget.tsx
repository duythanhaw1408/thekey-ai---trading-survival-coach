
import React, { useState, useEffect } from 'react';
import { biofeedbackAnalyzer } from '../services/biofeedbackService';
import { BrainCircuitIcon } from './icons';

export const BioStatusWidget: React.FC = () => {
    const [status, setStatus] = useState<{
        stressLevel: 'CALM' | 'ELEVATED' | 'HIGH';
        heartRate: number;
        color: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            setIsLoading(true);
            try {
                const currentStatus = await biofeedbackAnalyzer.getCurrentBioStatus();
                const color = 'text-white';

                setStatus({ ...currentStatus, color });
            } catch (error) {
                console.error("Failed to fetch bio status:", error);
                setStatus(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center space-x-4 w-full">
            <div className="flex-shrink-0">
                <BrainCircuitIcon className={`w-8 h-8 ${status ? status.color : 'text-text-secondary'}`} />
            </div>
            <div className="text-left w-full">
                <p className="text-sm font-medium text-text-secondary">Bio-Status</p>
                {isLoading && <p className="text-sm text-text-secondary animate-pulse">Syncing...</p>}
                {!isLoading && status && (
                    <div className="flex items-baseline justify-between">
                        <p className={`text-xl font-bold ${status.color}`}>{status.stressLevel}</p>
                        <p className="text-sm text-text-secondary font-mono">{status.heartRate} bpm</p>
                    </div>
                )}
                {!isLoading && !status && <p className="text-sm text-text-secondary">Data unavailable</p>}
            </div>
        </div>
    );
};