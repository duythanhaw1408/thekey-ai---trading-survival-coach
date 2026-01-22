
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { TradeDecision, Trade } from '../types';
import { AlertTriangleIcon, CheckCircleIcon, LockClosedIcon, LockOpenIcon, ShieldCheckIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';
import { AssetAutocomplete } from './AssetAutocomplete';

interface TradeInputFormProps {
  onSubmit: (trade: {
    asset: string;
    positionSize: number;
    reasoning: string;
    direction: 'BUY' | 'SELL';
    entryPrice: number;
    takeProfit?: number;
    stopLoss?: number;
    settings?: {
      account_balance?: number;
      risk_per_trade_pct?: number;
    };
  }) => void;
  isLoading: boolean;
  decision: TradeDecision | null;
  onProceed: () => void;
  simulationMode?: boolean;
  tradeHistory: Trade[];
  // Profile settings - used instead of local inputs
  profileAccountSize: number;
  profileRiskPercent: number;
  profileMaxPositionSize: number;
}

export const TradeInputForm: React.FC<TradeInputFormProps> = ({
  onSubmit,
  isLoading,
  decision,
  onProceed,
  simulationMode = true,
  tradeHistory = [],
  profileAccountSize = 1000,
  profileRiskPercent = 2,
  profileMaxPositionSize = 500
}) => {
  const { t } = useLanguage();
  const [asset, setAsset] = useState('BTC/USDT');
  const [reasoning, setReasoning] = useState('');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');

  // Use Profile settings as defaults, but allow local overrides
  const [accountSize, setAccountSize] = useState<number>(profileAccountSize);
  const [riskPercent, setRiskPercent] = useState<number>(profileRiskPercent);

  const [entryPrice, setEntryPrice] = useState<number | ''>('');
  const [stopLoss, setStopLoss] = useState<number | ''>('');
  const [takeProfit, setTakeProfit] = useState<number | ''>('');
  const [positionSize, setPositionSize] = useState<number | ''>('');
  const [calculatedRisk, setCalculatedRisk] = useState<number | null>(null);

  const [isAutoSize, setIsAutoSize] = useState(true);

  useEffect(() => {
    if (isAutoSize) {
      const accSizeNum = Number(accountSize);
      const riskPercNum = Number(riskPercent);
      const entryNum = Number(entryPrice);
      const slNum = Number(stopLoss);

      if (accSizeNum > 0 && riskPercNum > 0 && entryNum > 0 && slNum > 0 && entryNum !== slNum) {
        const riskAmount = accSizeNum * (riskPercNum / 100);
        const priceDiff = Math.abs(entryNum - slNum);
        const positionSizeUSD = (riskAmount / priceDiff) * entryNum;

        setPositionSize(Math.round(positionSizeUSD));
        setCalculatedRisk(riskAmount);
      } else {
        setPositionSize('');
        setCalculatedRisk(null);
      }
    }
  }, [accountSize, riskPercent, entryPrice, stopLoss, isAutoSize]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (String(entryPrice).length === 0 || String(positionSize).length === 0 || String(stopLoss).length === 0) return;
    const tradeData = {
      asset,
      positionSize: Number(positionSize),
      reasoning,
      direction,
      entryPrice: Number(entryPrice),
      takeProfit: takeProfit !== '' ? Number(takeProfit) : undefined,
      stopLoss: stopLoss !== '' ? Number(stopLoss) : undefined,
    };
    if (decision?.decision === 'WARN') {
      onSubmit({
        ...tradeData,
        settings: {
          account_balance: accountSize,
          risk_per_trade_pct: riskPercent
        }
      });
      onProceed();
    } else {
      onSubmit({
        ...tradeData,
        settings: {
          account_balance: accountSize,
          risk_per_trade_pct: riskPercent
        }
      });
    }
    setReasoning('');
  };

  const handleNumberInputChange = (setter: React.Dispatch<React.SetStateAction<number | ''>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setter('');
    } else {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        setter(num);
      }
    }
  }

  const isWarn = decision?.decision === 'WARN';
  const inputClasses = "w-full bg-black border border-accent-neon/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-accent-neon/20 focus:outline-none focus:border-accent-neon focus:ring-1 focus:ring-accent-neon/50 transition-all tracking-wide font-medium";

  return (
    <div className="p-8 bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-accent-neon/20 relative overflow-hidden group shadow-2xl">
      {/* HUD Accent Elements */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent-neon/40 rounded-tl-[2.5rem] pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent-neon/40 rounded-tr-[2.5rem] pointer-events-none" />
      <div className="absolute inset-0 cyber-grid opacity-[0.03] pointer-events-none" />

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setDirection('BUY')} className={`w-full font-black py-3 rounded-xl transition-all text-[10px] tracking-[0.2em] uppercase border ${direction === 'BUY' ? 'bg-accent-neon text-black border-accent-neon neon-glow' : 'bg-black border-accent-neon/20 text-accent-neon/40 hover:bg-accent-neon/5'}`}>
            {t('terminal.buy')}
          </button>
          <button type="button" onClick={() => setDirection('SELL')} className={`w-full font-black py-3 rounded-xl transition-all text-[10px] tracking-[0.2em] uppercase border ${direction === 'SELL' ? 'bg-accent-red text-black border-accent-red shadow-[0_0_15px_rgba(255,0,85,0.4)]' : 'bg-black border-accent-red/20 text-accent-red/40 hover:bg-accent-red/5'}`}>
            {t('terminal.sell')}
          </button>
        </div>

        {/* Risk Settings HUD - Readonly */}
        <div className="bg-black/40 border border-accent-neon/10 rounded-xl px-4 py-3 flex items-center justify-between group">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[8px] text-accent-neon/30 font-black uppercase tracking-widest mb-1">ACC_SIZE</span>
              <span className="text-sm font-black text-white italic tracking-tighter font-mono">${profileAccountSize.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-accent-neon/30 font-black uppercase tracking-widest mb-1">RISK_%</span>
              <span className="text-sm font-black text-accent-neon italic tracking-tighter font-mono">{profileRiskPercent}%</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[8px] text-accent-neon/30 font-black uppercase tracking-widest mb-1 block">MAX_VOL</span>
              <span className="text-sm font-black text-accent-yellow italic tracking-tighter font-mono">${profileMaxPositionSize}</span>
            </div>
            <div className="relative group/tooltip">
              <div className="w-8 h-8 rounded-lg bg-accent-neon/5 border border-accent-neon/10 flex items-center justify-center text-accent-neon/40 hover:text-accent-neon hover:border-accent-neon/30 transition-all cursor-pointer">
                ⚙️
              </div>
              <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-black border border-accent-neon/20 rounded-lg text-[9px] text-white/70 whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                Cài đặt tại <span className="text-accent-neon font-bold">Tư Duy</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input type="text" value={asset} onChange={(e) => setAsset(e.target.value)} className={inputClasses} placeholder={t('terminal.assetPlaceholder')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="any" value={entryPrice} onChange={handleNumberInputChange(setEntryPrice)} className={inputClasses} placeholder={t('terminal.entry')} required />
            <input type="number" step="any" value={takeProfit} onChange={handleNumberInputChange(setTakeProfit)} className={inputClasses} placeholder={t('terminal.tp')} />
          </div>
          <input type="number" step="any" value={stopLoss} onChange={handleNumberInputChange(setStopLoss)} className={inputClasses} placeholder={t('terminal.sl')} required />
        </div>

        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[10px] text-white/50 font-medium">Volume (USD) {isAutoSize && calculatedRisk !== null && <span className="text-accent-neon/60 ml-1">• tự tính</span>}</span>
          </div>
          <input
            type="number"
            min="0"
            value={positionSize}
            onChange={(e) => { setIsAutoSize(false); setPositionSize(Number(e.target.value)); }}
            className={`${inputClasses} ${Number(positionSize) > accountSize * 0.2 ? 'border-accent-red/50 bg-accent-red/5 !text-accent-red' : ''}`}
            required
          />

          {/* Risk estimate */}
          {Number(positionSize) > accountSize * 0.2 ? (
            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-[10px] text-accent-red font-medium flex items-center gap-2">
                <AlertTriangleIcon className="w-3 h-3" />
                ⚠️ Volume quá lớn (vượt 20% vốn)
              </p>
            </div>
          ) : calculatedRisk !== null && (
            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-[10px] text-white/50 font-medium">
                Nếu thua: <span className="text-accent-red font-bold">-${calculatedRisk.toFixed(0)}</span>
              </p>
              <span className="text-[10px] text-accent-neon/70 font-medium">
                ✓ An toàn
              </span>
            </div>
          )}
        </div>

        <div>
          <textarea id="reasoning" rows={2} value={reasoning} onChange={(e) => setReasoning(e.target.value)}
            placeholder="Tại sao bạn vào lệnh này? (không bắt buộc)"
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-neon/50 transition-all" />
        </div>

        {isWarn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4 pt-4 border-t border-accent-neon/10"
          >
            {/* Behavioral Insight */}
            <div className="bg-accent-neon/5 border border-accent-neon/20 p-5 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <ShieldCheckIcon className="w-12 h-12 text-accent-neon" />
              </div>
              <h4 className="text-[9px] font-black text-accent-neon uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                <div className="w-1 h-3 bg-accent-neon" />
                KAITO_NEURAL_INSIGHT
              </h4>
              <p className="text-sm text-white font-medium italic leading-relaxed">"{decision.behavioral_insight}"</p>
            </div>

            {/* Alternatives */}
            {decision.alternatives && decision.alternatives.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
                  STRATEGIC_ALTERATIVES
                </h4>
                {decision.alternatives.map((alt, i) => (
                  <div key={i} className="bg-black border border-white/5 p-4 rounded-xl group hover:border-accent-neon/30 transition-all">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[8px] font-black text-black bg-accent-neon px-2 py-0.5 rounded uppercase tracking-widest">{alt.type}</span>
                    </div>
                    <p className="text-xs text-white/80 font-bold mb-2 uppercase tracking-wide">{alt.description}</p>
                    <p className="text-[9px] text-white/30 font-medium tracking-tight">RATIONALE: {alt.rationale}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Coaching Question */}
            <div className="bg-accent-yellow/5 border border-accent-yellow/20 p-5 rounded-2xl">
              <h4 className="text-[9px] font-black text-accent-yellow uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                <span className="text-base">🧠</span> REFLECTION_QUERY
              </h4>
              <p className="text-sm text-white font-black uppercase tracking-wide leading-relaxed">{decision.coaching_question}</p>
            </div>

            {/* Immediate Action */}
            <div className="flex items-center gap-4 p-4 bg-accent-neon border border-accent-neon text-black rounded-xl">
              <div className="w-2 h-2 rounded-full bg-black animate-ping" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">IMMEDIATE_PROTOCOL:</p>
                <p className="text-xs font-black uppercase tracking-widest leading-none mt-0.5">{decision.immediate_action}</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading || (decision?.decision === 'BLOCK' && !simulationMode)}
            className={`w-full font-black py-5 px-6 rounded-2xl transition-all duration-500 flex flex-col items-center justify-center relative overflow-hidden active:scale-95
            ${isLoading ? 'bg-white/5 cursor-not-allowed text-white/20' :
                isWarn ? 'bg-black border-2 border-accent-neon text-accent-neon hover:bg-accent-neon hover:text-black neon-glow' :
                  decision?.decision === 'BLOCK' ? 'bg-accent-red/10 border border-accent-red/20 text-accent-red/40 cursor-not-allowed' :
                    'bg-accent-neon text-black border border-accent-neon hover:scale-[1.02] neon-glow'
              }`}
          >
            <div className="flex items-center gap-3 relative z-10">
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isWarn ? <AlertTriangleIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
              <span className="text-sm font-bold">
                {isLoading ? 'Đang xử lý...' : isWarn ? 'XÁC NHẬN VÀO LỆNH' : 'GHI LỆNH'}
              </span>
            </div>
            {decision?.decision === 'BLOCK' && !isLoading && <p className="text-[8px] mt-1.5 opacity-60 font-black uppercase tracking-[0.2em]">PROTOCOL_BLOCKED: SAFETY_LOCK_ENGAGED</p>}

            {/* Ambient inner glow for active buttons */}
            {!isLoading && !isWarn && decision?.decision !== 'BLOCK' && (
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};