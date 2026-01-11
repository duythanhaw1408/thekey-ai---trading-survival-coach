
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
  const highlightClass = isHighlighted ? 'ring-2 ring-accent-primary scale-105' : '';

  const content = (
    <div className={`glass-panel p-5 flex items-center space-x-4 hover-scale cursor-default ${highlightClass}`}>
      <div className="flex-shrink-0">{icon}</div>
      <div className="text-left flex-1">
        <p className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
          {label}
          {tooltip && (
            <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-white/10 text-[9px] text-gray-400 cursor-help hover:bg-white/20 transition-colors">
              ?
            </span>
          )}
        </p>
        <p className="text-2xl font-bold text-text-main">{value}</p>
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