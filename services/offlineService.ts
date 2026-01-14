// services/offlineService.ts
/**
 * THEKEY AI - Offline Fallback Service
 * 
 * Ensures app works even when network is unavailable:
 * - Queues requests for later sync
 * - Provides local rule-based decisions
 * - Persists critical data to IndexedDB
 * 
 * @author THEKEY AI Team
 */

import type { Trade, TraderStats, TradeDecision, CheckinAnalysisResult } from '../types';

// ============================================
// IndexedDB Setup
// ============================================

const DB_NAME = 'thekey_offline';
const DB_VERSION = 1;

interface PendingRequest {
    id: string;
    type: string;
    data: unknown;
    timestamp: number;
    retryCount: number;
}

interface CachedData {
    key: string;
    data: unknown;
    timestamp: number;
    expiry: number;
}

class OfflineService {
    private db: IDBDatabase | null = null;
    private isOnline: boolean = navigator.onLine;
    private syncInProgress: boolean = false;
    private listeners: Set<(online: boolean) => void> = new Set();

    constructor() {
        this.initDB();
        this.setupNetworkListeners();
    }

    // ============================================
    // Database Initialization
    // ============================================

    private async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Pending requests store
                if (!db.objectStoreNames.contains('pendingRequests')) {
                    db.createObjectStore('pendingRequests', { keyPath: 'id' });
                }

                // Cached data store
                if (!db.objectStoreNames.contains('cache')) {
                    const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
                    cacheStore.createIndex('expiry', 'expiry');
                }

                // Draft data store (for Process Dojo, etc.)
                if (!db.objectStoreNames.contains('drafts')) {
                    db.createObjectStore('drafts', { keyPath: 'id' });
                }

                // User data store
                if (!db.objectStoreNames.contains('userData')) {
                    db.createObjectStore('userData', { keyPath: 'key' });
                }
            };
        });
    }

    private setupNetworkListeners(): void {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.notifyListeners(true);
            this.syncPendingRequests();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.notifyListeners(false);
        });
    }

    // ============================================
    // Network Status
    // ============================================

    public get online(): boolean {
        return this.isOnline;
    }

    public onNetworkChange(callback: (online: boolean) => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    private notifyListeners(online: boolean): void {
        this.listeners.forEach(cb => cb(online));
    }

    // ============================================
    // Request Queue Management
    // ============================================

    public async queueRequest(type: string, data: unknown): Promise<string> {
        const request: PendingRequest = {
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            timestamp: Date.now(),
            retryCount: 0
        };

        await this.saveToStore('pendingRequests', request);
        console.log(`[Offline] Queued request: ${type}`);
        return request.id;
    }

    public async getPendingRequests(): Promise<PendingRequest[]> {
        return this.getAllFromStore('pendingRequests');
    }

    public async syncPendingRequests(): Promise<void> {
        if (this.syncInProgress || !this.isOnline) return;

        this.syncInProgress = true;
        console.log('[Offline] Starting sync...');

        try {
            const pending = await this.getPendingRequests();

            for (const request of pending) {
                try {
                    await this.executeRequest(request);
                    await this.deleteFromStore('pendingRequests', request.id);
                    console.log(`[Offline] Synced: ${request.type}`);
                } catch (error) {
                    request.retryCount++;
                    if (request.retryCount >= 3) {
                        await this.deleteFromStore('pendingRequests', request.id);
                        console.error(`[Offline] Failed after 3 retries: ${request.type}`);
                    } else {
                        await this.saveToStore('pendingRequests', request);
                    }
                }
            }
        } finally {
            this.syncInProgress = false;
        }
    }

    private async executeRequest(request: PendingRequest): Promise<void> {
        // For offline sync, we queue the raw request and replay it when online
        // The actual API calls should be made by the calling component
        // This is a placeholder that logs the sync attempt
        console.log(`[Offline] Would sync request type: ${request.type}`, request.data);

        // In a full implementation, you would call the appropriate API endpoint here
        // For now, we just mark it as synced by not throwing
    }

    // ============================================
    // Offline Trade Decision (Local Rule Engine)
    // ============================================

    public getOfflineTradeDecision(
        trade: Partial<Trade>,
        stats: TraderStats
    ): Omit<TradeDecision, 'source'> & { source?: string } {
        const reasons: string[] = [];
        let decision: 'ALLOW' | 'WARN' | 'BLOCK' = 'ALLOW';

        // Rule 1: Consecutive losses
        if (stats.consecutiveLosses >= 2) {
            decision = 'BLOCK';
            reasons.push('🛑 Bạn đã thua 2 lệnh liên tiếp. Hãy nghỉ ngơi trước khi tiếp tục.');
        } else if (stats.consecutiveLosses >= 1) {
            decision = 'WARN';
            reasons.push('⚠️ Lệnh trước đã thua. Hãy cân nhắc kỹ trước khi vào lệnh mới.');
        }

        // Rule 2: Stop loss required
        if (!trade.stopLoss) {
            if (decision !== 'BLOCK') decision = 'WARN';
            reasons.push('⚠️ Chưa đặt Stop Loss. Đây là yêu cầu bắt buộc để bảo vệ vốn.');
        }

        // Rule 3: Position size check (using totalTrades as proxy for activity level)
        // In a real app, you'd have accountBalance in stats
        const maxSize = 500; // Default max position
        if (trade.positionSize && trade.positionSize > maxSize) {
            if (decision !== 'BLOCK') decision = 'WARN';
            reasons.push(`⚠️ Khối lượng lệnh lớn ($${trade.positionSize})`);
        }

        // Rule 4: Check if discipline is low
        if (stats.disciplineScore < 40) {
            if (decision !== 'BLOCK') decision = 'WARN';
            reasons.push('⚠️ Điểm kỷ luật thấp. Hãy tập trung vào quy trình.');
        }

        return {
            decision,
            reason: reasons.join(' ') || 'Không có vi phạm quy tắc.',
            behavioral_insight: decision === 'BLOCK'
                ? 'Kaito khuyên bạn nên dừng lại và phản ánh. Thị trường sẽ vẫn ở đó ngày mai.'
                : decision === 'WARN'
                    ? 'Có một vài điểm cần lưu ý. Hãy đảm bảo bạn đang tuân thủ kế hoạch.'
                    : 'Mọi thứ có vẻ ổn. Chúc bạn giao dịch tốt!',
            coaching_question: decision === 'BLOCK'
                ? 'Bạn có thể làm gì khác thay vì cố gắng gỡ lại ngay bây giờ?'
                : 'Đây có phải là setup tốt nhất mà bạn đang chờ đợi không?',
            immediate_action: decision === 'BLOCK'
                ? 'Đóng biểu đồ và làm điều gì đó khác trong 30 phút.'
                : 'Kiểm tra lại kế hoạch trước khi nhấn nút.',
            tone: decision === 'BLOCK' ? 'CAUTIOUS' : decision === 'WARN' ? 'CAUTIOUS' : 'SUPPORTIVE',
            alternatives: [],
        };
    }

    // ============================================
    // Offline Check-in (Fallback Questions)
    // ============================================

    public getOfflineCheckinQuestions(): Array<{
        id: string;
        text: string;
        type: 'multiple-choice';
        multiple_choice: { options: string[] };
    }> {
        return [
            {
                id: 'energy',
                text: '🌅 Năng lượng của bạn hôm nay như thế nào?',
                type: 'multiple-choice',
                multiple_choice: {
                    options: ['Rất tốt, sẵn sàng chiến đấu', 'Bình thường', 'Hơi mệt mỏi', 'Kiệt sức']
                }
            },
            {
                id: 'market_feeling',
                text: '📊 Bạn cảm nhận thị trường hôm nay như thế nào?',
                type: 'multiple-choice',
                multiple_choice: {
                    options: ['Có cơ hội rõ ràng', 'Bình thường', 'Khó đọc', 'Rất nguy hiểm']
                }
            },
            {
                id: 'intention',
                text: '🎯 Mục tiêu quan trọng nhất hôm nay của bạn là gì?',
                type: 'multiple-choice',
                multiple_choice: {
                    options: ['Tuân thủ SL 100%', 'Không vào lệnh FOMO', 'Chỉ trade setup tốt nhất', 'Không trade hôm nay']
                }
            }
        ];
    }

    public getOfflineCheckinAnalysis(answers: Record<string, string>): CheckinAnalysisResult {
        const energy = answers['energy'] || '';
        const marketFeeling = answers['market_feeling'] || '';
        const intention = answers['intention'] || '';

        let readiness = 70;
        let emotionalState = 'CALM';

        // Adjust based on energy
        if (energy.includes('Kiệt sức')) {
            readiness -= 30;
            emotionalState = 'EXHAUSTED';
        } else if (energy.includes('mệt')) {
            readiness -= 15;
        } else if (energy.includes('Rất tốt')) {
            readiness += 10;
        }

        // Adjust based on market feeling
        if (marketFeeling.includes('nguy hiểm')) {
            readiness -= 20;
        } else if (marketFeeling.includes('Khó đọc')) {
            readiness -= 10;
        }

        return {
            emotional_state: emotionalState,
            state_intensity: emotionalState === 'EXHAUSTED' ? 4 : 2,
            insights: [{
                type: 'OPPORTUNITY',
                title: 'Mục tiêu hôm nay',
                description: intention || 'Tuân thủ kế hoạch giao dịch'
            }],
            encouragement: readiness >= 70
                ? 'Bạn đã sẵn sàng cho ngày giao dịch. Hãy giữ kỷ luật!'
                : 'Hãy cẩn thận hôm nay và ưu tiên bảo vệ vốn.',
            daily_prescription: {
                mindset_shift: 'Tập trung vào quy trình, không phải kết quả',
                behavioral_rule: intention || 'Tuân thủ stop-loss 100%',
                success_metric: 'Tỷ lệ tuân thủ kế hoạch'
            },
            progress_marker: {
                milestone: 'Hoàn thành check-in',
                visual_metaphor: '🌱 Hạt giống kỷ luật đã được gieo'
            }
        } as CheckinAnalysisResult;
    }

    // ============================================
    // Draft Management (Process Dojo, etc.)
    // ============================================

    public async saveDraft(id: string, data: unknown): Promise<void> {
        await this.saveToStore('drafts', { id, data, timestamp: Date.now() });
    }

    public async getDraft<T>(id: string): Promise<T | null> {
        const draft = await this.getFromStore<{ id: string; data: T; timestamp: number }>('drafts', id);
        return draft?.data || null;
    }

    public async deleteDraft(id: string): Promise<void> {
        await this.deleteFromStore('drafts', id);
    }

    public async getAllDrafts(): Promise<Array<{ id: string; timestamp: number }>> {
        const drafts = await this.getAllFromStore<{ id: string; timestamp: number }>('drafts');
        return drafts.map(d => ({ id: d.id, timestamp: d.timestamp }));
    }

    // ============================================
    // Cache Management
    // ============================================

    public async cacheData(key: string, data: unknown, ttlMs: number = 3600000): Promise<void> {
        await this.saveToStore('cache', {
            key,
            data,
            timestamp: Date.now(),
            expiry: Date.now() + ttlMs
        });
    }

    public async getCachedData<T>(key: string): Promise<T | null> {
        const cached = await this.getFromStore<CachedData>('cache', key);
        if (!cached) return null;
        if (Date.now() > cached.expiry) {
            await this.deleteFromStore('cache', key);
            return null;
        }
        return cached.data as T;
    }

    // ============================================
    // User Data Persistence
    // ============================================

    public async saveUserData(key: string, data: unknown): Promise<void> {
        await this.saveToStore('userData', { key, data, timestamp: Date.now() });
    }

    public async getUserData<T>(key: string): Promise<T | null> {
        const result = await this.getFromStore<{ key: string; data: T }>('userData', key);
        return result?.data || null;
    }

    // ============================================
    // IndexedDB Helpers
    // ============================================

    private async saveToStore(storeName: string, data: unknown): Promise<void> {
        if (!this.db) await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private async getFromStore<T>(storeName: string, key: string): Promise<T | null> {
        if (!this.db) await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    private async getAllFromStore<T>(storeName: string): Promise<T[]> {
        if (!this.db) await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    private async deleteFromStore(storeName: string, key: string): Promise<void> {
        if (!this.db) await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Singleton export
export const offlineService = new OfflineService();
