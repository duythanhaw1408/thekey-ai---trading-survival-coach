
import React, { useState, useEffect } from 'react';
import type { TradeDecision } from '../types';
import { AlertTriangleIcon, CheckCircleIcon, LockClosedIcon, LockOpenIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

interface TradeInputFormProps {
  onSubmit: (trade: {
    asset: string;
    positionSize: number;
    reasoning: string;
    direction: 'BUY' | 'SELL';
    entryPrice: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => void;
  isLoading: boolean;
  decision: TradeDecision | null;
  onProceed: () => void;
  simulationMode?: boolean;
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
  profileAccountSize = 1000,
  profileRiskPercent = 2,
  profileMaxPositionSize = 500
}) => {
  const { t } = useLanguage();
  const [asset, setAsset] = useState('BTC/USDT');
  const [reasoning, setReasoning] = useState('');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');

  // Use Profile settings (no longer editable in Terminal)
  const accountSize = profileAccountSize;
  const riskPercent = profileRiskPercent;
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
      onSubmit(tradeData);
      onProceed();
    } else {
      onSubmit(tradeData);
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
  const inputClasses = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-white/20 focus:outline-none focus:border-accent-primary/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20";

  return (
    <div className="p-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setDirection('BUY')} className={`w-full font-bold py-2 rounded-lg transition-all text-xs text-center border-2 ${direction === 'BUY' ? 'bg-accent-green/20 border-accent-green text-accent-green-neon neon-text-green' : 'bg-white/5 border-transparent hover:bg-white/10 text-white/50'}`}>
            {t('terminal.buy')}
          </button>
          <button type="button" onClick={() => setDirection('SELL')} className={`w-full font-bold py-2 rounded-lg transition-all text-xs text-center border-2 ${direction === 'SELL' ? 'bg-accent-red/20 border-accent-red text-accent-red-neon neon-text-red' : 'bg-white/5 border-transparent hover:bg-white/10 text-white/50'}`}>
            {t('terminal.sell')}
          </button>
        </div>

        {/* Profile Settings Info (read-only, configured in Settings) */}
        <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-text-secondary">
              Vốn: <span className="font-mono text-accent-primary">${accountSize.toLocaleString()}</span>
            </span>
            <span className="text-text-secondary">
              Risk: <span className="font-mono text-accent-red">{riskPercent}%</span>
            </span>
            <span className="text-text-secondary">
              Max: <span className="font-mono text-accent-yellow">${profileMaxPositionSize}</span>
            </span>
          </div>
          <span className="text-[10px] text-text-secondary opacity-50">từ Cài đặt</span>
        </div>

        <div className="space-y-2">
          <input type="text" value={asset} onChange={(e) => setAsset(e.target.value)} className={inputClasses} placeholder={t('terminal.assetPlaceholder')} required />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" step="any" value={entryPrice} onChange={handleNumberInputChange(setEntryPrice)} className={inputClasses} placeholder={t('terminal.entry')} required />
            <input type="number" step="any" value={takeProfit} onChange={handleNumberInputChange(setTakeProfit)} className={inputClasses} placeholder={t('terminal.tp')} />
          </div>
          <input type="number" step="any" value={stopLoss} onChange={handleNumberInputChange(setStopLoss)} className={inputClasses} placeholder={t('terminal.sl')} required />
        </div>

        <div>
          <div className="flex items-center justify-between px-1 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-secondary uppercase font-bold">{t('terminal.positionSize')}</span>
              {isAutoSize && calculatedRisk !== null && (
                <span className="text-[9px] text-text-secondary opacity-60">
                  (gợi ý: ${Math.min(Math.round(Number(positionSize) || 0), profileMaxPositionSize)})
                </span>
              )}
            </div>
            <button type="button" onClick={() => setIsAutoSize(!isAutoSize)} className="text-text-secondary hover:text-text-main flex items-center gap-1">
              {isAutoSize ? <LockClosedIcon className="w-3 h-3 text-accent-primary" /> : <LockOpenIcon className="w-3 h-3" />}
              <span className="text-[9px]">{isAutoSize ? 'Auto' : 'Thủ công'}</span>
            </button>
          </div>
          <input
            type="number"
            min="0"
            max={profileMaxPositionSize * 2}
            value={positionSize}
            onChange={(e) => { setIsAutoSize(false); setPositionSize(Number(e.target.value)); }}
            className={`${inputClasses} ${Number(positionSize) > profileMaxPositionSize ? 'border-accent-red/50 bg-accent-red/5' : ''}`}
            required
          />

          {/* Risk estimate or Max warning */}
          {Number(positionSize) > profileMaxPositionSize ? (
            <div className="flex items-center justify-between mt-1 px-1">
              <p className="text-[10px] text-accent-red flex items-center gap-1">
                <AlertTriangleIcon className="w-3 h-3" />
                Vượt giới hạn ${profileMaxPositionSize}!
              </p>
              <span className="text-[9px] text-accent-red opacity-70">
                Sẽ bị cảnh báo/block
              </span>
            </div>
          ) : calculatedRisk !== null && (
            <div className="flex items-center justify-between mt-1 px-1">
              <p className="text-[10px] text-text-secondary tracking-tight">
                {t('terminal.estRisk')} <span className="font-mono text-accent-red">${calculatedRisk.toFixed(2)}</span>
              </p>
              <span className="text-[9px] text-accent-green opacity-70">
                ✓ Trong giới hạn
              </span>
            </div>
          )}
        </div>


        <div>
          <textarea id="reasoning" rows={2} value={reasoning} onChange={(e) => setReasoning(e.target.value)}
            placeholder={t('terminal.reasoningPlaceholder')}
            className={inputClasses} required />
        </div>

        {simulationMode && (
          <div className="bg-accent-primary/5 border border-accent-primary/20 text-accent-primary-neon p-2 rounded-lg flex items-center mb-2">
            <AlertTriangleIcon className="h-3 w-3 mr-2 neon-text-blue" />
            <p className="text-[10px] font-bold uppercase tracking-wider">{t('terminal.simulationActive')}</p>
          </div>
        )}

        {isWarn && (
          <div className="bg-accent-yellow/10 border-l-4 border-accent-yellow text-yellow-200 p-2 rounded-r-md">
            <div className="flex">
              <div className="py-1"><AlertTriangleIcon className="h-4 w-4 text-accent-yellow mr-2" /></div>
              <div>
                <p className="text-[10px] font-bold">⚠️ {t('terminal.warningTitle')}</p>
                <p className="text-[11px] leading-tight">{decision.reason}</p>
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={isLoading}
          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg text-xs
            ${isLoading ? 'bg-white/10 cursor-not-allowed opacity-50' :
              isWarn ? 'bg-accent-yellow text-black hover:scale-[1.01]' : 'bg-accent-primary text-white hover:scale-[1.01] shadow-accent-primary/20'
            }`} >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isWarn ? <AlertTriangleIcon className="w-4 h-4 mr-2" /> : <CheckCircleIcon className="w-4 h-4 mr-2" />}
          {isLoading ? t('terminal.analyzing') : isWarn ? t('terminal.proceed') : t('terminal.evaluate')}
        </button>
      </form>
    </div>
  );
};