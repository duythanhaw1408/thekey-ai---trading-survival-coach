

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
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSave} className="bg-gray-800 rounded-lg shadow-2xl p-8 max-w-sm w-full">
        <h2 className="text-xl font-bold text-accent-yellow mb-4">Close Trade & Evaluate</h2>
        <p className="text-gray-400 mb-1">Asset: <span className="font-semibold text-gray-200">{trade.asset}</span></p>
        <p className="text-gray-400 mb-6">Position Size: <span className="font-semibold text-gray-200">${trade.positionSize}</span></p>
        
        <div>
            <label htmlFor="pnl" className="block text-sm font-medium text-gray-400 mb-1">Final PnL (USD)</label>
            <input
              type="number"
              id="pnl"
              value={pnl}
              onChange={(e) => setPnl(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-yellow"
              placeholder="e.g., 50.25 or -25.50"
              required
              autoFocus
            />
          </div>

        <div className="flex justify-end items-center mt-6 space-x-4">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md text-gray-200 bg-gray-600 hover:bg-gray-500 transition-colors"
            >
                Cancel
            </button>
            <button
                type="submit"
                className="px-4 py-2 rounded-md text-gray-900 font-semibold bg-accent-green hover:bg-green-500 transition-colors"
            >
                Save & Evaluate
            </button>
        </div>
      </form>
    </div>
  );
};
