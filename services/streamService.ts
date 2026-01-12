// services/streamService.ts
/**
 * THEKEY SSE Streaming Service
 * Subscribes to real-time progress updates from the backend.
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://thekey-backend.onrender.com';

export interface StreamProgress {
    progress: number;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
    message: string;
    result?: any;
    error?: string;
}

export interface StreamSubscription {
    unsubscribe: () => void;
}

/**
 * Subscribe to job progress via Server-Sent Events.
 * 
 * @param jobId - The job ID to subscribe to
 * @param onProgress - Callback for progress updates
 * @param onComplete - Callback when job completes successfully
 * @param onError - Callback when job fails or connection errors
 * @returns Subscription object with unsubscribe method
 * 
 * @example
 * ```typescript
 * const subscription = subscribeToJobProgress(
 *   jobId,
 *   (progress) => setProgress(progress.progress),
 *   (result) => handleResult(result),
 *   (error) => handleError(error)
 * );
 * 
 * // Later, to unsubscribe:
 * subscription.unsubscribe();
 * ```
 */
export function subscribeToJobProgress(
    jobId: string,
    onProgress: (progress: StreamProgress) => void,
    onComplete?: (result: any) => void,
    onError?: (error: string) => void
): StreamSubscription {
    const token = localStorage.getItem('auth_token');

    // Create EventSource with auth header workaround
    // Note: EventSource doesn't support custom headers, so we use URL param
    const url = `${API_URL}/api/stream/jobs/${jobId}?token=${token}`;

    let eventSource: EventSource | null = null;
    let isActive = true;

    const connect = () => {
        if (!isActive) return;

        eventSource = new EventSource(url);

        eventSource.onopen = () => {
            console.log(`[SSE] Connected to job ${jobId}`);
        };

        eventSource.onmessage = (event) => {
            try {
                const data: StreamProgress = JSON.parse(event.data);
                onProgress(data);

                // Auto-close on completion
                if (data.status === 'completed') {
                    console.log(`[SSE] Job ${jobId} completed`);
                    if (onComplete && data.result) {
                        onComplete(data.result);
                    }
                    eventSource?.close();
                } else if (data.status === 'failed') {
                    console.log(`[SSE] Job ${jobId} failed: ${data.error}`);
                    if (onError) {
                        onError(data.error || 'Unknown error');
                    }
                    eventSource?.close();
                }
            } catch (e) {
                console.error('[SSE] Parse error:', e);
            }
        };

        eventSource.onerror = (error) => {
            console.error('[SSE] Connection error:', error);
            eventSource?.close();

            // Retry after 2 seconds if still active
            if (isActive) {
                setTimeout(connect, 2000);
            }
        };

        // Handle custom events
        eventSource.addEventListener('progress', (event: MessageEvent) => {
            try {
                const data: StreamProgress = JSON.parse(event.data);
                onProgress(data);
            } catch (e) {
                console.error('[SSE] Progress parse error:', e);
            }
        });

        eventSource.addEventListener('complete', (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                onProgress({ progress: 100, status: 'completed', message: 'Hoàn thành!', result: data.result });
                if (onComplete && data.result) {
                    onComplete(data.result);
                }
                eventSource?.close();
            } catch (e) {
                console.error('[SSE] Complete parse error:', e);
            }
        });

        eventSource.addEventListener('error', (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (onError) {
                    onError(data.error || 'Unknown error');
                }
                eventSource?.close();
            } catch (e) {
                console.error('[SSE] Error parse error:', e);
            }
        });

        eventSource.addEventListener('timeout', () => {
            console.warn('[SSE] Connection timeout');
            eventSource?.close();
            if (onError) {
                onError('Connection timeout');
            }
        });
    };

    // Start connection
    connect();

    // Return subscription
    return {
        unsubscribe: () => {
            isActive = false;
            eventSource?.close();
            console.log(`[SSE] Unsubscribed from job ${jobId}`);
        }
    };
}

/**
 * Poll job status as fallback when SSE is not supported.
 */
export async function pollJobStatus(
    jobId: string,
    onProgress: (progress: StreamProgress) => void,
    onComplete?: (result: any) => void,
    onError?: (error: string) => void,
    intervalMs: number = 1000,
    maxAttempts: number = 60
): Promise<void> {
    const token = localStorage.getItem('auth_token');
    let attempts = 0;

    const poll = async () => {
        if (attempts >= maxAttempts) {
            if (onError) onError('Polling timeout');
            return;
        }

        attempts++;

        try {
            const response = await fetch(`${API_URL}/api/stream/jobs/${jobId}/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            onProgress({
                progress: data.progress,
                status: data.status,
                message: data.message,
                result: data.result,
                error: data.error
            });

            if (data.status === 'completed') {
                if (onComplete && data.result) {
                    onComplete(data.result);
                }
                return;
            } else if (data.status === 'failed') {
                if (onError) {
                    onError(data.error || 'Job failed');
                }
                return;
            }

            // Continue polling
            setTimeout(poll, intervalMs);

        } catch (error) {
            console.error('[Polling] Error:', error);
            if (onError) {
                onError(String(error));
            }
        }
    };

    poll();
}

/**
 * Check if EventSource (SSE) is supported in current browser.
 */
export function isSSESupported(): boolean {
    return typeof EventSource !== 'undefined';
}

/**
 * Smart subscribe - uses SSE if supported, falls back to polling.
 */
export function smartSubscribe(
    jobId: string,
    onProgress: (progress: StreamProgress) => void,
    onComplete?: (result: any) => void,
    onError?: (error: string) => void
): StreamSubscription {
    if (isSSESupported()) {
        return subscribeToJobProgress(jobId, onProgress, onComplete, onError);
    } else {
        // Fallback to polling
        let cancelled = false;

        pollJobStatus(
            jobId,
            onProgress,
            onComplete,
            (error) => {
                if (!cancelled && onError) {
                    onError(error);
                }
            }
        );

        return {
            unsubscribe: () => {
                cancelled = true;
            }
        };
    }
}
