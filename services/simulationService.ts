
import type { TradeDecision, TraderStats, Trade, AppSettings, DetectedPattern, ProcessStats, MarketAnalysis } from '../types';
import { getTradeFeedback } from './geminiService';

class VirtualTradingEngine {
    // This engine simulates placing an order and getting feedback.
    // In a real, more complex app, this might involve a simulated order book and price feeds.
    // For now, it leverages the same AI feedback mechanism but marks the trade as a simulation.
    public async placeOrder(
        trade: { 
            asset: string; 
            positionSize: number; 
            reasoning: string;
            direction: 'BUY' | 'SELL';
            entryPrice: number;
            takeProfit?: number;
            stopLoss?: number;
        },
        stats: TraderStats,
        tradeHistory: Trade[],
        settings: AppSettings,
        activePattern: DetectedPattern | null,
        processStats: ProcessStats | null,
        marketAnalysis: MarketAnalysis | null
    ): Promise<TradeDecision> {
        console.log("SIMULATION: Placing virtual order", trade);
        // The core logic for getting feedback is the same, but it's sandboxed.
        const feedback = await getTradeFeedback(trade, stats, tradeHistory, settings, activePattern, processStats, marketAnalysis);
        
        // You could add simulation-specific logic here, e.g., simulating slippage
        // or returning a slightly modified reason.
        feedback.reason = `[SIMULATION] ${feedback.reason}`;
        
        return feedback;
    }
}

class PhaseTransitionManager {
    // This class will manage the user's journey from simulation to live trading.
    // It will contain the logic for checking if a user is eligible to unlock real trading
    // based on their performance and discipline in simulation mode.

    private transitionRequirements = {
        minSurvivalDays: 0,
        minDisciplineScore: 0,
        maxConsecutiveLosses: 3,
    };

    public checkTransitionEligibility(stats: TraderStats): { eligible: boolean; reasons: string[] } {
        const reasons: string[] = [];
        if (stats.survivalDays < this.transitionRequirements.minSurvivalDays) {
            reasons.push(`Cần ${this.transitionRequirements.minSurvivalDays - stats.survivalDays} ngày giao dịch mô phỏng nữa.`);
        }
        if (stats.disciplineScore < this.transitionRequirements.minDisciplineScore) {
            reasons.push(`Điểm kỷ luật cần trên ${this.transitionRequirements.minDisciplineScore}%.`);
        }
        
        return {
            eligible: reasons.length === 0,
            reasons,
        };
    }
}

export const virtualTradingEngine = new VirtualTradingEngine();
export const phaseTransitionManager = new PhaseTransitionManager();
