
import type { DangerScore, DetectionResult, Trade, MarketAnalysis } from '../types';

const FACTOR_WEIGHTS = {
  volatility: 0.30,
  liquidity: 0.25,
  leverage: 0.20,
  sentiment: 0.15,
  events: 0.10,
};

export class MarketDangerScoringEngine {
  public calculateScore(): DangerScore {
    // In a real app, these would come from live data feeds
    const factors = {
      volatility: this.getVolatilityScore(),
      liquidity: this.getLiquidityScore(),
      leverage: this.getLeverageScore(),
      sentiment: Math.random() * 100,
      events: Math.random() > 0.8 ? 80 : 10,
    };

    const score = Math.round(
      factors.volatility * FACTOR_WEIGHTS.volatility +
      factors.liquidity * FACTOR_WEIGHTS.liquidity +
      factors.leverage * FACTOR_WEIGHTS.leverage +
      factors.sentiment * FACTOR_WEIGHTS.sentiment +
      factors.events * FACTOR_WEIGHTS.events
    );
    
    let level: DangerScore['level'] = 'SAFE';
    if (score >= 85) level = 'EXTREME';
    else if (score >= 60) level = 'DANGEROUS';
    else if (score >= 30) level = 'CAUTION';

    // This is a simplified logic, a real app would have more complex risk analysis
    const primaryRisks = Object.entries(factors)
        .sort(([,a],[,b]) => b - a)
        .slice(0, 2)
        .map(([factor, value]) => ({
            factor,
            severity: value > 75 ? 'CRITICAL' : 'HIGH',
            description: `Chỉ số ${factor} đang ở mức rất cao, có thể gây biến động mạnh.`
        })) as DangerScore['primaryRisks'];

    return {
      score,
      level,
      factors,
      primaryRisks,
      recommendations: [{
          action: 'REDUCE_SIZE',
          priority: 'HIGH',
          description: 'Giảm khối lượng giao dịch để hạn chế rủi ro trong điều kiện không chắc chắn.'
      }]
    };
  }

  private getVolatilityScore(): number {
    // Mock ATR, spike counts etc.
    return 60 + (Math.random() * 40); // Simulate high volatility
  }

  private getLiquidityScore(): number {
     // Mock order book depth, spread
    return 70 - (Math.random() * 30); // Simulate moderate to low liquidity
  }

  private getLeverageScore(): number {
    // Mock open interest, funding rates
    return 50 + (Math.random() * 50); // Simulate high leverage
  }
}


export class PatternDetectionEngine {
  public detect(tradeHistory: Trade[], marketAnalysis: MarketAnalysis | null): DetectionResult[] {
    const results: DetectionResult[] = [];
    if (tradeHistory.length < 3) return [];

    // 1. Revenge Trading Detection
    const revengeTrade = this.detectRevengeTrading(tradeHistory);
    if (revengeTrade) results.push(revengeTrade);

    // 2. FOMO Detection
    const fomo = this.detectFOMO(tradeHistory, marketAnalysis);
    if (fomo) results.push(fomo);

    return results;
  }

  private detectRevengeTrading(tradeHistory: Trade[]): DetectionResult | null {
    for (let i = 0; i < tradeHistory.length - 1; i++) {
        const currentTrade = tradeHistory[i];
        const prevTrade = tradeHistory[i+1];
        
        if (prevTrade.status === 'CLOSED' && (prevTrade.pnl ?? 0) < 0) {
            const timeDiff = new Date(currentTrade.timestamp).getTime() - new Date(prevTrade.timestamp).getTime();
            const isQuickFollowup = timeDiff < 10 * 60 * 1000; // within 10 minutes
            const isLargerSize = currentTrade.positionSize > (prevTrade.positionSize * 1.1);

            let confidence = 0;
            if(isQuickFollowup) confidence += 0.5;
            if(isLargerSize) confidence += 0.3;

            if (confidence >= 0.5) {
                return {
                    patternId: 'REVENGE_TRADING',
                    confidence,
                    severity: confidence > 0.7 ? 'HIGH' : 'MEDIUM',
                    evidence: {
                        indicators: {
                            quickFollowupAfterLoss: isQuickFollowup,
                            increasedSize: isLargerSize,
                            timeDiffMinutes: timeDiff / 60000
                        },
                        riskScore: 75
                    },
                    recommendations: ['Enforce a 30-minute cooldown after any loss.', 'Journal the emotions of the previous loss before entering a new trade.']
                }
            }
        }
    }
    return null;
  }
  
  private detectFOMO(tradeHistory: Trade[], marketAnalysis: MarketAnalysis | null): DetectionResult | null {
      const volatility = marketAnalysis?.factors?.volatility ?? 50; // Default to medium volatility
      
      // Adaptive threshold based on market regime (inferred from volatility)
      // High volatility (trending) = lower threshold for FOMO
      // Low volatility (choppy) = higher threshold to avoid false positives
      const sizeMultiplierThreshold = volatility > 75 ? 1.5 : 2.5;

      for (let i = 0; i < tradeHistory.length - 1; i++) {
        const currentTrade = tradeHistory[i];
        const prevTrade = tradeHistory[i+1];

        // Look for a large size increase after a winning trade in a high volatility environment
        if ((prevTrade.pnl ?? 0) > 0) {
            if (currentTrade.positionSize > prevTrade.positionSize * sizeMultiplierThreshold) {
                 return {
                    patternId: 'FOMO',
                    confidence: 0.65,
                    severity: 'MEDIUM',
                    evidence: {
                        indicators: {
                            sizeIncreaseFactor: (currentTrade.positionSize / prevTrade.positionSize).toFixed(2),
                            afterWinningTrade: true,
                            marketVolatility: volatility,
                        },
                        riskScore: 60
                    },
                    recommendations: ['Pre-define your entry and stick to it.', 'Use a consistent position sizing strategy regardless of recent wins.']
                }
            }
        }
    }
    return null;
  }
}
