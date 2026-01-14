import React from 'react';
import { motion } from 'framer-motion';

interface TrustBatteryProps {
    score: number; // 0-100
    chargingFactors?: { factor: string; impact: string }[];
    drainingFactors?: { factor: string; impact: string }[];
}

const TrustBattery: React.FC<TrustBatteryProps> = ({ score, chargingFactors = [], drainingFactors = [] }) => {
    const getBatteryColor = () => {
        if (score > 75) return 'bg-emerald-500 shadow-emerald-500/50';
        if (score > 40) return 'bg-yellow-500 shadow-yellow-500/50';
        return 'bg-red-500 shadow-red-500/50';
    };

    return (
        <div className="trust-battery-widget group relative p-1">
            <div className="flex flex-col items-center">
                {/* Battery Wrapper */}
                <div className="w-12 h-20 border-2 border-slate-700 rounded-md p-1 relative flex flex-col justify-end">
                    {/* Battery Tip */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-2 bg-slate-700 rounded-t-sm" />

                    {/* Battery Level Fill */}
                    <motion.div
                        className={`w-full rounded-sm ${getBatteryColor()} shadow-lg`}
                        initial={{ height: 0 }}
                        animate={{ height: `${score}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />

                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white mix-blend-difference pointer-events-none">
                        {score}%
                    </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">Trust</span>
            </div>

            {/* Popover Details */}
            <div className="absolute z-20 top-0 left-full ml-4 w-48 bg-slate-800 rounded-xl p-3 border border-slate-700 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                <h4 className="text-xs font-bold text-white mb-2 underline">Pin Tin Cậy (Trust Battery)</h4>

                {chargingFactors.length > 0 && (
                    <div className="mb-2">
                        <p className="text-[10px] text-emerald-400 font-bold mb-1">⚡ Đang sạc:</p>
                        {chargingFactors.map((f, i) => (
                            <div key={i} className="flex justify-between text-[9px] text-slate-300">
                                <span>• {f.factor}</span>
                                <span className="text-emerald-500">{f.impact}</span>
                            </div>
                        ))}
                    </div>
                )}

                {drainingFactors.length > 0 && (
                    <div className="mb-2">
                        <p className="text-[10px] text-red-400 font-bold mb-1">🔥 Hao pin:</p>
                        {drainingFactors.map((f, i) => (
                            <div key={i} className="flex justify-between text-[9px] text-slate-300">
                                <span>• {f.factor}</span>
                                <span className="text-red-500">{f.impact}</span>
                            </div>
                        ))}
                    </div>
                )}

                <p className="text-[9px] text-slate-500 italic mt-2 border-t border-slate-700 pt-2">
                    "Pin đầy giúp AI Kaito tin tưởng và khuyến nghị lệnh nhanh hơn."
                </p>
            </div>
        </div>
    );
};

export default TrustBattery;
