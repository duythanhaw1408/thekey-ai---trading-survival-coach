// components/OfflineBanner.tsx
/**
 * THEKEY AI - Offline Banner Component
 * 
 * Shows network status and pending sync items.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const OfflineBanner: React.FC = () => {
    const { isOnline, wasOffline, pendingSync, syncNow } = useNetworkStatus();

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-black px-4 py-2 flex items-center justify-center gap-2"
                >
                    <span className="text-lg">📡</span>
                    <span className="font-bold text-sm">Bạn đang offline - Dữ liệu sẽ được đồng bộ khi có mạng</span>
                    <span className="text-xs opacity-70">({pendingSync} pending)</span>
                </motion.div>
            )}

            {isOnline && wasOffline && pendingSync > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="fixed top-0 left-0 right-0 z-[200] bg-emerald-500 text-black px-4 py-2 flex items-center justify-center gap-2"
                >
                    <span className="text-lg">✅</span>
                    <span className="font-bold text-sm">Đã có mạng trở lại!</span>
                    <button
                        onClick={syncNow}
                        className="ml-2 px-3 py-1 bg-black/20 rounded-full text-xs font-bold hover:bg-black/30 transition-colors"
                    >
                        Đồng bộ ngay ({pendingSync})
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
