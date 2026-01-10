// tests/services/api.test.ts
/**
 * Tests for API service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
const mockApi = {
    request: async (endpoint: string, options: RequestInit = {}) => {
        const token = localStorage.getItem('thekey_access_token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers as Record<string, string>,
        };

        const response = await fetch(`http://localhost:8000${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail || `Request failed with status ${response.status}`);
        }

        return response.json();
    },
};

describe('API Service', () => {
    beforeEach(() => {
        mockFetch.mockClear();
        localStorage.getItem = vi.fn().mockReturnValue(null);
        localStorage.setItem = vi.fn();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('request helper', () => {
        it('makes request with correct URL', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ data: 'test' }),
            });

            await mockApi.request('/api/test');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/test',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                })
            );
        });

        it('includes auth token when available', async () => {
            localStorage.getItem = vi.fn().mockReturnValue('test-token');
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ data: 'test' }),
            });

            await mockApi.request('/api/protected');

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-token',
                    }),
                })
            );
        });

        it('throws error on failed request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ detail: 'Unauthorized' }),
            });

            await expect(mockApi.request('/api/protected')).rejects.toThrow('Unauthorized');
        });

        it('handles network errors gracefully', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(mockApi.request('/api/test')).rejects.toThrow('Network error');
        });

        it('sends POST request with body', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            });

            const body = { email: 'test@test.com', password: 'pass123' };
            await mockApi.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify(body),
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/auth/login',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(body),
                })
            );
        });
    });

    describe('API endpoints', () => {
        it('getMarketContext calls correct endpoint', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ danger_level: 'SAFE' }),
            });

            await mockApi.request('/api/protection/market-context');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/protection/market-context',
                expect.any(Object)
            );
        });

        it('getTradeHistory calls correct endpoint', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve([]),
            });

            await mockApi.request('/api/trades/');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/trades/',
                expect.any(Object)
            );
        });
    });
});
