
import type { BiofeedbackDataPoint, BioCorrelationAnalysis, Trade } from '../types';

export class BioAwareEmotionalAnalyzer {
    
    // Simulates fetching data from a wearable device API for the last 72 hours
    public async fetchBiofeedbackData(tradeHistory: Trade[]): Promise<BiofeedbackDataPoint[]> {
        return this._generateMockBioData(tradeHistory);
    }

    public async analyzeCorrelation(tradeHistory: Trade[]): Promise<BioCorrelationAnalysis> {
        if (tradeHistory.length < 5) {
            return { correlationFound: false, insight: "Not enough trading data for bio-correlation.", evidence: "" };
        }

        const bioData = await this.fetchBiofeedbackData(tradeHistory);
        const losingTrades = tradeHistory.filter(t => (t.pnl ?? 0) < 0);
        
        if (losingTrades.length < 2) {
            return { correlationFound: false, insight: "Not enough losing trades to find a pattern.", evidence: "" };
        }

        let hrvCrashBeforeLossCount = 0;
        
        for (const trade of losingTrades) {
            const tradeTime = new Date(trade.timestamp).getTime();
            // Look at bio data in the 4 hours leading up to the trade
            const relevantBioData = bioData.filter(d => 
                d.timestamp < tradeTime && d.timestamp > (tradeTime - 4 * 60 * 60 * 1000)
            );

            if (relevantBioData.length > 0) {
                const avgHrv = relevantBioData.reduce((acc, d) => acc + d.hrv, 0) / relevantBioData.length;
                // A "crash" is defined as an HRV below a threshold, e.g., 30
                if (avgHrv < 30) {
                    hrvCrashBeforeLossCount++;
                }
            }
        }
        
        const correlationThreshold = 0.5; // 50% of losing trades must show the pattern
        if (hrvCrashBeforeLossCount / losingTrades.length >= correlationThreshold) {
            const insight = "Phân tích cho thấy có mối tương quan giữa chỉ số HRV (biến thiên nhịp tim) thấp và các giao dịch thua lỗ. Điều này cho thấy căng thẳng sinh lý có thể đang ảnh hưởng đến quyết định của bạn.";
            const evidence = `${Math.round((hrvCrashBeforeLossCount / losingTrades.length) * 100)}% of your recent losses occurred when your HRV was unusually low.`;
            return { correlationFound: true, insight, evidence };
        }
        
        return { correlationFound: false, insight: "No strong correlation found between bio-data and recent losses.", evidence: "" };
    }

     public async getCurrentBioStatus(): Promise<{ stressLevel: 'CALM' | 'ELEVATED' | 'HIGH'; heartRate: number }> {
        // Simulate a real-time reading with reduced latency to reflect performance optimizations.
        await new Promise(res => setTimeout(res, 100 + Math.random() * 150));
        
        const randomFactor = Math.random();
        let stressLevel: 'CALM' | 'ELEVATED' | 'HIGH';
        let heartRate: number;

        if (randomFactor > 0.85) {
            stressLevel = 'HIGH';
            heartRate = Math.round(80 + Math.random() * 15);
        } else if (randomFactor > 0.5) {
            stressLevel = 'ELEVATED';
            heartRate = Math.round(70 + Math.random() * 10);
        } else {
            stressLevel = 'CALM';
            heartRate = Math.round(55 + Math.random() * 15);
        }

        return { stressLevel, heartRate };
    }
    
    // Generates realistic mock data, including some deliberate patterns for detection.
    private _generateMockBioData(tradeHistory: Trade[]): BiofeedbackDataPoint[] {
        const data: BiofeedbackDataPoint[] = [];
        const now = Date.now();
        
        // Find timestamps of losing trades to plant correlated data
        const losingTimestamps = tradeHistory
            .filter(t => (t.pnl ?? 0) < 0)
            .map(t => new Date(t.timestamp).getTime());

        for (let i = 0; i < 72; i++) { // One data point per hour for the last 3 days
            const timestamp = now - (i * 60 * 60 * 1000);
            
            // Check if this point is within a few hours before a losing trade
            const isBeforeLoss = losingTimestamps.some(lossTime => 
                timestamp < lossTime && timestamp > (lossTime - 4 * 60 * 60 * 1000)
            );

            // Default values
            let hrv = 40 + Math.random() * 20; // Normal HRV: 40-60
            let heartRate = 55 + Math.random() * 10; // Normal RHR: 55-65
            let sleepScore = 75 + Math.random() * 15; // Good sleep: 75-90

            if (isBeforeLoss && Math.random() > 0.3) { // 70% chance to create correlation
                hrv = 15 + Math.random() * 10; // Low HRV: 15-25 (stress)
                heartRate = 70 + Math.random() * 10; // Elevated RHR: 70-80
            }

            data.push({
                timestamp,
                hrv: Math.round(hrv),
                heartRate: Math.round(heartRate),
                sleepScore: Math.round(sleepScore),
            });
        }
        return data.reverse(); // Return in chronological order
    }
}

export const biofeedbackAnalyzer = new BioAwareEmotionalAnalyzer();
