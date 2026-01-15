import React, { useState, useEffect } from 'react';
import { biofeedbackAnalyzer } from '../services/biofeedbackService';
import { BrainCircuitIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

export const BioStatusWidget: React.FC = () => {
    const { t } = useLanguage();
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
        <div className="flex items-center space-x-6 w-full relative group">
            <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-accent-neon/20 blur-xl animate-pulse rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-3 bg-black border border-accent-neon/20 rounded-2xl group-hover:border-accent-neon/40 transition-all duration-500 shadow-inner relative z-10">
                    <BrainCircuitIcon className={`w-10 h-10 ${status ? 'text-accent-neon drop-shadow-[0_0_8px_rgba(0,255,157,0.6)]' : 'text-white/20'}`} />
                </div>
            </div>
            <div className="text-left flex-1 min-w-0">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">{t('dashboard.biometricStatus') || 'BIO_LINK'}</p>
                {isLoading && (
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-accent-neon animate-ping rounded-full" />
                        <p className="text-[10px] font-black text-accent-neon uppercase tracking-widest animate-pulse">Syncing_Neural_Feed...</p>
                    </div>
                )}
                {!isLoading && status && (
                    <div className="flex items-baseline justify-between gap-4">
                        <div className="flex flex-col">
                            <p className="text-2xl font-black text-white tracking-widest uppercase italic font-sans leading-none mb-1">
                                {status.stressLevel}
                            </p>
                            <span className="text-[8px] font-bold text-accent-neon/60 uppercase tracking-widest">STRESS_MITIGATED</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <p className="text-sm font-black text-white/40 tracking-widest font-mono group-hover:text-white/60 transition-colors">
                                {status.heartRate} <span className="text-[9px]">BPM</span>
                            </p>
                            <div className="flex gap-0.5 mt-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className={`w-3 h-1 rounded-full ${i <= (status.stressLevel === 'CALM' ? 1 : status.stressLevel === 'ELEVATED' ? 3 : 5) ? 'bg-accent-neon shadow-[0_0_5px_rgba(0,255,157,0.5)]' : 'bg-white/5'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {!isLoading && !status && <p className="text-[10px] font-black text-accent-red uppercase tracking-widest">Link_Failure: No_Data</p>}
            </div>
        </div>
    );
};