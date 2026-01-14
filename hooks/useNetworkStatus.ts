// hooks/useNetworkStatus.ts
/**
 * THEKEY AI - Network Status Hook
 * 
 * Provides real-time network status and offline UI handling.
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineService } from '../services/offlineService';

interface NetworkStatus {
    isOnline: boolean;
    wasOffline: boolean;
    pendingSync: number;
    lastOnlineAt: Date | null;
}

export function useNetworkStatus() {
    const [status, setStatus] = useState<NetworkStatus>({
        isOnline: navigator.onLine,
        wasOffline: false,
        pendingSync: 0,
        lastOnlineAt: navigator.onLine ? new Date() : null
    });

    useEffect(() => {
        const unsubscribe = offlineService.onNetworkChange(async (online) => {
            const pending = await offlineService.getPendingRequests();

            setStatus(prev => ({
                isOnline: online,
                wasOffline: !online || prev.wasOffline,
                pendingSync: pending.length,
                lastOnlineAt: online ? new Date() : prev.lastOnlineAt
            }));
        });

        // Initial pending count
        offlineService.getPendingRequests().then(pending => {
            setStatus(prev => ({ ...prev, pendingSync: pending.length }));
        });

        return unsubscribe;
    }, []);

    const syncNow = useCallback(async () => {
        if (status.isOnline) {
            await offlineService.syncPendingRequests();
            const pending = await offlineService.getPendingRequests();
            setStatus(prev => ({ ...prev, pendingSync: pending.length, wasOffline: false }));
        }
    }, [status.isOnline]);

    return { ...status, syncNow };
}
