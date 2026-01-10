
import React from 'react';

interface StatusCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isHighlighted?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({ icon, label, value, isHighlighted = false }) => {
  const highlightClass = isHighlighted ? 'ring-2 ring-accent-primary scale-105' : '';

  return (
    <div className={`glass-panel p-5 flex items-center space-x-4 hover-scale cursor-default ${highlightClass}`}>
      <div className="flex-shrink-0">{icon}</div>
      <div className="text-left">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <p className="text-2xl font-bold text-text-main">{value}</p>
      </div>
    </div>
  );
};