
import React from 'react';
import { Tooltip } from './Tooltip';

interface StatusCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isHighlighted?: boolean;
  tooltip?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({ icon, label, value, isHighlighted = false, tooltip }) => {
  const highlightClass = isHighlighted
    ? 'border-accent-neon/40 shadow-[0_0_25px_rgba(0,245,155,0.15)] ring-1 ring-accent-neon/20 scale-[1.02] bg-accent-neon/[0.02]'
    : 'border-white/[0.03] shadow-[0_8px_30px_rgba(0,0,0,0.2)]';

  const content = (
    <div className={`group relative bg-white/[0.01] backdrop-blur-3xl p-5 flex items-center space-x-4 transition-all duration-700 border rounded-[2rem] hover:bg-white/[0.03] hover:border-white/20 hover:shadow-[0_20px_45px_rgba(0,0,0,0.4)] ${highlightClass}`}>
      <div className="flex-shrink-0 relative">
        <div className="absolute inset-0 bg-accent-neon/10 blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
        <div className="relative bg-black border border-white/5 p-4 rounded-2xl group-hover:bg-accent-neon group-hover:border-accent-neon transition-all duration-500 shadow-2xl">
          <div className="group-hover:text-black group-hover:scale-110 transition-all duration-500">
            {icon}
          </div>
        </div>
      </div>
      <div className="text-left flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] truncate group-hover:text-white/60 transition-colors">
            {label}
          </p>
          {tooltip && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/5 text-[9px] font-black text-white/40 cursor-help hover:bg-accent-neon/20 hover:text-accent-neon transition-all border border-white/10">
              i
            </span>
          )}
        </div>
        <p className="text-2xl font-black text-premium-gradient tracking-tighter uppercase italic group-hover:scale-[1.02] origin-left transition-all duration-500 truncate">
          {value}
        </p>
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} position="bottom">
        {content}
      </Tooltip>
    );
  }

  return content;
};