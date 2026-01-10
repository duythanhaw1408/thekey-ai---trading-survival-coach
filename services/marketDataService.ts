/**
 * THEKEY AI - Market Data Service
 * Integrates external market data feeds for enhanced AI decisions
 * All sources are FREE tier APIs
 */

// Fear & Greed Index data
interface FearGreedData {
    value: number;
    valueClassification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
    timestamp: number;
    previousClose: number;
    previousClassification: string;
}

// Binance price data
interface PriceData {
    symbol: string;
    price: number;
    priceChange24h: number;
    volume24h: number;
    high24h: number;
    low24h: number;
    timestamp: number;
}

// Liquidation data (from Coinglass free tier)
interface LiquidationData {
    longLiquidations24h: number;
    shortLiquidations24h: number;
    ratio: number;
    dominantSide: 'LONG' | 'SHORT';
    timestamp: number;
}

// Aggregated market context
export interface MarketDataContext {
    fearGreed: FearGreedData | null;
    btcPrice: PriceData | null;
    liquidations: LiquidationData | null;
    overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'EXTREME_FEAR' | 'EXTREME_GREED';
    riskLevel: number; // 0-100
    lastUpdated: number;
}

class MarketDataService {
    private cache: MarketDataContext | null = null;
    private updateInterval: number | null = null;

    /**
     * Fetch Fear & Greed Index (Alternative.me - Free)
     */
    async fetchFearGreedIndex(): Promise<FearGreedData | null> {
        try {
            const response = await fetch('https://api.alternative.me/fng/?limit=2');
            const data = await response.json();

            if (data.data && data.data.length >= 2) {
                const current = data.data[0];
                const previous = data.data[1];

                return {
                    value: parseInt(current.value, 10),
                    valueClassification: current.value_classification,
                    timestamp: parseInt(current.timestamp, 10) * 1000,
                    previousClose: parseInt(previous.value, 10),
                    previousClassification: previous.value_classification
                };
            }
        } catch (error) {
            console.warn('[MarketData] Failed to fetch Fear & Greed Index:', error);
        }
        return null;
    }

    /**
     * Fetch BTC price from Binance (Free)
     */
    async fetchBTCPrice(): Promise<PriceData | null> {
        try {
            const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
            const data = await response.json();

            return {
                symbol: 'BTCUSDT',
                price: parseFloat(data.lastPrice),
                priceChange24h: parseFloat(data.priceChangePercent),
                volume24h: parseFloat(data.quoteVolume),
                high24h: parseFloat(data.highPrice),
                low24h: parseFloat(data.lowPrice),
                timestamp: Date.now()
            };
        } catch (error) {
            console.warn('[MarketData] Failed to fetch BTC price:', error);
        }
        return null;
    }

    /**
     * Estimate liquidation data (simplified - would need Coinglass API for real data)
     */
    estimateLiquidations(priceData: PriceData | null): LiquidationData | null {
        if (!priceData) return null;

        // Simplified estimation based on price volatility
        const volatility = Math.abs(priceData.priceChange24h);
        const baseValue = priceData.volume24h * 0.0001; // Rough estimation

        const longLiqs = priceData.priceChange24h < 0 ? baseValue * (1 + volatility / 10) : baseValue * 0.5;
        const shortLiqs = priceData.priceChange24h > 0 ? baseValue * (1 + volatility / 10) : baseValue * 0.5;

        return {
            longLiquidations24h: Math.round(longLiqs),
            shortLiquidations24h: Math.round(shortLiqs),
            ratio: longLiqs / (shortLiqs || 1),
            dominantSide: longLiqs > shortLiqs ? 'LONG' : 'SHORT',
            timestamp: Date.now()
        };
    }

    /**
     * Calculate overall market sentiment
     */
    calculateSentiment(fearGreed: FearGreedData | null, priceData: PriceData | null): {
        sentiment: MarketDataContext['overallSentiment'];
        riskLevel: number;
    } {
        let riskLevel = 50; // Base risk
        let sentiment: MarketDataContext['overallSentiment'] = 'NEUTRAL';

        if (fearGreed) {
            if (fearGreed.value <= 20) {
                sentiment = 'EXTREME_FEAR';
                riskLevel = 30; // Lower risk to trade in extreme fear (contrarian)
            } else if (fearGreed.value <= 40) {
                sentiment = 'BEARISH';
                riskLevel = 45;
            } else if (fearGreed.value >= 80) {
                sentiment = 'EXTREME_GREED';
                riskLevel = 85; // High risk in extreme greed
            } else if (fearGreed.value >= 60) {
                sentiment = 'BULLISH';
                riskLevel = 60;
            }
        }

        // Adjust based on volatility
        if (priceData) {
            const volatility = Math.abs(priceData.priceChange24h);
            if (volatility > 10) {
                riskLevel = Math.min(100, riskLevel + 20);
            } else if (volatility > 5) {
                riskLevel = Math.min(100, riskLevel + 10);
            }
        }

        return { sentiment, riskLevel };
    }

    /**
     * Get aggregated market context
     */
    async getMarketContext(): Promise<MarketDataContext> {
        // Return cache if fresh (less than 5 minutes old)
        if (this.cache && Date.now() - this.cache.lastUpdated < 5 * 60 * 1000) {
            return this.cache;
        }

        const [fearGreed, btcPrice] = await Promise.all([
            this.fetchFearGreedIndex(),
            this.fetchBTCPrice()
        ]);

        const liquidations = this.estimateLiquidations(btcPrice);
        const { sentiment, riskLevel } = this.calculateSentiment(fearGreed, btcPrice);

        this.cache = {
            fearGreed,
            btcPrice,
            liquidations,
            overallSentiment: sentiment,
            riskLevel,
            lastUpdated: Date.now()
        };

        console.log(`[MarketData] Updated: Sentiment=${sentiment}, Risk=${riskLevel}, F&G=${fearGreed?.value || 'N/A'}`);

        return this.cache;
    }

    /**
     * Get trading recommendation based on market context
     */
    async getTradingRecommendation(): Promise<{
        action: 'TRADE_NORMAL' | 'REDUCE_SIZE' | 'AVOID_TRADING' | 'CONTRARIAN_OPPORTUNITY';
        reason: string;
        adjustmentFactor: number;
    }> {
        const context = await this.getMarketContext();

        if (context.overallSentiment === 'EXTREME_FEAR') {
            return {
                action: 'CONTRARIAN_OPPORTUNITY',
                reason: 'Extreme Fear có thể là cơ hội mua tốt cho long-term',
                adjustmentFactor: 0.7 // Reduce size but allow trading
            };
        }

        if (context.overallSentiment === 'EXTREME_GREED') {
            return {
                action: 'REDUCE_SIZE',
                reason: 'Extreme Greed - thị trường có thể đảo chiều bất cứ lúc nào',
                adjustmentFactor: 0.5
            };
        }

        if (context.riskLevel >= 80) {
            return {
                action: 'AVOID_TRADING',
                reason: 'Rủi ro thị trường quá cao, nên chờ đợi',
                adjustmentFactor: 0.3
            };
        }

        if (context.riskLevel >= 60) {
            return {
                action: 'REDUCE_SIZE',
                reason: 'Rủi ro thị trường cao, nên giảm size',
                adjustmentFactor: 0.7
            };
        }

        return {
            action: 'TRADE_NORMAL',
            reason: 'Điều kiện thị trường bình thường',
            adjustmentFactor: 1.0
        };
    }

    /**
     * Start auto-refresh (every 5 minutes)
     */
    startAutoRefresh(): void {
        if (this.updateInterval) return;

        this.updateInterval = window.setInterval(() => {
            this.getMarketContext();
        }, 5 * 60 * 1000);

        // Initial fetch
        this.getMarketContext();
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Singleton instance
export const marketDataService = new MarketDataService();
