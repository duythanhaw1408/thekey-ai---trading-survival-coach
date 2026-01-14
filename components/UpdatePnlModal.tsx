

import React, { useState } from 'react';
import type { Trade } from '../types';

interface UpdatePnlModalProps {
  trade: Trade;
  onClose: () => void;
  onSave: (pnl: number) => void;
}

export const UpdatePnlModal: React.FC<UpdatePnlModalProps> = ({ trade, onClose, onSave }) => {
  const [pnl, setPnl] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const pnlValue = parseFloat(pnl);
    if (!isNaN(pnlValue)) {
      onSave(pnlValue);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[200] p-6">
      <div className="absolute inset-0 cyber-grid opacity-[0.05] pointer-events-none" />
      <form onSubmit={handleSave} className="bg-black border border-accent-yellow/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(255,170,0,0.1)] p-10 max-w-md w-full relative overflow-hidden">
        {/* Corner HUD Markers */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent-yellow/40 rounded-tl-[2.5rem] pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent-yellow/40 rounded-tr-[2.5rem] pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-[10px] font-black text-accent-yellow uppercase tracking-[0.5em] mb-4 drop-shadow-[0_0_5px_rgba(255,170,0,0.5)]">TERMINATION_PROTOCOL_ACTIVE</h2>
          <h3 className="text-2xl font-black text-white tracking-widest uppercase italic font-sans italic mb-8">FINALIZE_RESULT</h3>

          <div className="space-y-6 mb-10">
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">TARGET_ASSET</span>
                <span className="text-sm font-black text-white italic tracking-tighter">{trade.asset}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">POSITION_SIZE</span>
                <span className="text-sm font-black text-accent-neon italic tracking-tighter">${trade.positionSize}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="pnl" className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] block ml-1">NET_PROFIT_LOSS (USD)</label>
              <div className="relative group">
                <input
                  type="number"
                  id="pnl"
                  value={pnl}
                  onChange={(e) => setPnl(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl py-5 px-6 text-3xl font-black text-white font-sans italic tracking-widest focus:border-accent-yellow focus:ring-0 outline-none transition-all shadow-inner"
                  placeholder="0.00"
                  required
                  autoFocus
                />
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-accent-yellow shadow-[0_0_10px_rgba(255,170,0,0.8)] opacity-0 group-focus-within:opacity-100 transition-opacity" />
              </div>
              <p className="text-[8px] text-white/20 font-medium italic uppercase tracking-widest ml-1">SYSTEM_ACTION: COMMIT_TO_NEURAL_LOG</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              type="submit"
              className="w-full py-5 rounded-2xl text-[11px] font-black text-black bg-accent-yellow hover:scale-[1.02] active:scale-[0.98] uppercase tracking-[0.4em] transition-all shadow-[0_0_30px_rgba(255,170,0,0.2)]"
            >
              SAVE_&_EVALUATE_PROCESS
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 text-[10px] font-black text-white/20 hover:text-white uppercase tracking-[0.4em] transition-all"
            >
              [ ABORT_ENTRY ]
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
