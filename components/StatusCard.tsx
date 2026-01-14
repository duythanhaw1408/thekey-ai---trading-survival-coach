
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
  const highlightClass = isHighlighted ? 'border-accent-neon shadow-[0_0_15px_rgba(0,255,157,0.3)] ring-1 ring-accent-neon/50 scale-[1.02]' : 'border-white/5';

  const content = (
    <div className={`bg-black/40 backdrop-blur-xl p-6 flex items-center space-x-5 transition-all duration-500 border rounded-2xl group hover:border-accent-neon/40 hover:shadow-[0_0_20px_rgba(0,255,157,0.1)] ${highlightClass}`}>
      <div className="flex-shrink-0 bg-black border border-accent-neon/20 p-3 rounded-xl group-hover:bg-accent-neon/5 group-hover:border-accent-neon/40 transition-all duration-500 shadow-inner">
        <div className="group-hover:drop-shadow-[0_0_8px_rgba(0,255,157,0.6)] transition-all">
          {icon}
        </div>
      </div>
      <div className="text-left flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] truncate group-hover:text-white/60 transition-colors">
            {label}
          </p>
          {tooltip && (
            <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-white/5 text-[9px] font-black text-white/40 cursor-help hover:bg-accent-neon/20 hover:text-accent-neon transition-all border border-white/10">
              ?
            </span>
          )}
        </div>
        <p className="text-2xl font-black text-white tracking-widest uppercase italic font-sans group-hover:text-accent-neon transition-all duration-300 truncate">
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